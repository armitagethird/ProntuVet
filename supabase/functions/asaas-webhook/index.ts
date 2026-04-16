import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? ''
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://sandbox.asaas.com/api/v3'

// Busca userId por email via REST Admin API
async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}&per_page=1`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.users?.[0]?.id ?? null
  } catch { return null }
}

// Busca externalReference da subscription na API do Asaas
async function fetchSubscriptionExternalRef(subId: string): Promise<string | null> {
  try {
    const res = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subId}`, {
      headers: { 'access_token': ASAAS_API_KEY }
    })
    if (!res.ok) return null
    const data = await res.json()
    console.log('[webhook] Subscription externalReference via API:', data.externalReference)
    return data.externalReference ?? null
  } catch { return null }
}

// Busca email do customer na API do Asaas
async function fetchCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const res = await fetch(`${ASAAS_BASE_URL}/customers/${customerId}`, {
      headers: { 'access_token': ASAAS_API_KEY }
    })
    if (!res.ok) return null
    const data = await res.json()
    console.log('[webhook] Customer email via API:', data.email)
    return data.email ?? null
  } catch { return null }
}

async function resolverUserId(eventData: any): Promise<string | null> {
  const payment = eventData?.payment ?? {}

  // ✅ Estratégia 1: checkoutSession → tabela asaas_checkout_sessions (MAIS CONFIÁVEL)
  // Registramos esse mapeamento no momento da criação do checkout — 1 userId por session
  const csId = payment.checkoutSession
  if (csId) {
    const { data } = await supabase
      .from('asaas_checkout_sessions')
      .select('user_id')
      .eq('checkout_session_id', csId)
      .single()
    if (data?.user_id) {
      console.log('[webhook] ✅ userId via checkoutSession:', csId, '→', data.user_id)
      return data.user_id
    }
    console.log('[webhook] checkoutSession não registrado:', csId)
  }

  // Estratégia 2: externalReference no payment
  if (payment.externalReference) {
    console.log('[webhook] userId via payment.externalReference')
    return payment.externalReference
  }

  // Estratégia 3: busca externalReference na subscription via API Asaas
  const subId = payment.subscription ?? eventData?.subscription?.id
  if (subId) {
    const ref = await fetchSubscriptionExternalRef(subId)
    if (ref) return ref

    // Estratégia 4: lookup local pelo asaas_subscription_id
    const { data } = await supabase.from('profiles').select('id').eq('asaas_subscription_id', subId).single()
    if (data?.id) {
      console.log('[webhook] userId via subscription_id local')
      return data.id
    }
  }

  // Estratégia 5: email do customer via API Asaas + lookup no auth
  const customerId = typeof payment.customer === 'string' ? payment.customer : payment.customer?.id
  if (customerId) {
    const email = await fetchCustomerEmail(customerId)
    if (email) {
      const userId = await getUserIdByEmail(email)
      if (userId) {
        console.log('[webhook] userId via email do customer:', email)
        return userId
      }
    }
  }

  console.error('[webhook] ❌ userId não encontrado. payment:', JSON.stringify(payment))
  return null
}

async function ativarPlano(userId: string, subscriptionId: string) {
  const dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('profiles')
    .update({ plano: 'platinum', asaas_subscription_id: subscriptionId, data_vencimento: dataVencimento, status: 'ativo' })
    .eq('id', userId)
  if (error) console.error('[webhook] Erro ao ativar plano:', JSON.stringify(error))
  else console.log(`[webhook] ✅ Plano Platinum ativado — user ${userId}`)
}

async function rebaixarParaFree(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ plano: 'free', asaas_subscription_id: null, data_vencimento: null, status: 'cancelado' })
    .eq('id', userId)
  if (error) console.error('[webhook] Erro ao rebaixar:', JSON.stringify(error))
  else console.log(`[webhook] ⬇️ Rebaixado para free — user ${userId}`)
}

Deno.serve(async (req) => {
  const rawText = await req.text()
  const params = new URLSearchParams(rawText)

  // Token vem no campo accessToken do form (Asaas Sandbox não usa header)
  const tokenRecebido = params.get('accessToken') ?? req.headers.get('asaas-access-token')
  const tokenEsperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  if (tokenEsperado && tokenRecebido && tokenRecebido !== tokenEsperado) {
    console.warn('[webhook] Token inválido:', tokenRecebido)
    return new Response('Não autorizado', { status: 401 })
  }

  // O evento JSON está no campo "data" do form
  const dataField = params.get('data')
  if (!dataField) {
    console.error('[webhook] Campo "data" ausente. Raw:', rawText.slice(0, 300))
    return new Response('ok', { status: 200 })
  }

  let eventData: any
  try { eventData = JSON.parse(dataField) }
  catch (e) { console.error('[webhook] Erro ao parsear data:', e); return new Response('ok', { status: 200 }) }

  const evento: string = eventData?.event ?? ''
  console.log(`[webhook] 🔔 Evento: ${evento}`)

  switch (evento) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      const userId = await resolverUserId(eventData)
      if (!userId) break

      const subId = eventData?.payment?.subscription ?? eventData?.subscription?.id ?? ''
      const { data: profile } = await supabase.from('profiles').select('plano, asaas_subscription_id').eq('id', userId).single()

      if (profile?.plano === 'platinum' && profile?.asaas_subscription_id === subId) {
        console.log('[webhook] Já ativo — idempotência')
        break
      }
      await ativarPlano(userId, subId)
      break
    }
    case 'SUBSCRIPTION_DELETED':
    case 'PAYMENT_DELETED': {
      const userId = await resolverUserId(eventData)
      if (userId) await rebaixarParaFree(userId)
      break
    }
    default:
      console.log(`[webhook] Evento ignorado: ${evento}`)
  }

  return new Response('ok', { status: 200 })
})
