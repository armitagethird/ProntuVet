import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? ''
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://sandbox.asaas.com/api/v3'

const EVENTOS_RELEVANTES = new Set([
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'SUBSCRIPTION_DELETED',
  'PAYMENT_REFUNDED',
])

async function fetchSubscriptionDetails(subId: string) {
  try {
    const res = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subId}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error(`[webhook] Erro ao buscar sub ${subId}:`, err)
    return null
  }
}

interface Resolucao {
  /** Alvo da mudança — usuário individual OU organização. */
  target: 'user' | 'organization'
  targetId: string
  plano: string
}

/** Resolve target (user ou organization) e plano a partir dos dados do evento. */
async function resolverAlvo(eventData: any): Promise<Resolucao | null> {
  const payment = eventData?.payment ?? {}
  const subscription = eventData?.subscription ?? {}
  const subId = payment.subscription || subscription.id

  const csId = payment.checkoutSession
  if (csId) {
    const { data } = await supabase
      .from('asaas_checkout_sessions')
      .select('user_id, organization_id, plano')
      .eq('checkout_session_id', csId)
      .single()
    if (data) {
      if (data.organization_id) {
        console.log('[webhook] via Checkout Session (org):', data.organization_id, '| plano:', data.plano)
        return { target: 'organization', targetId: data.organization_id, plano: data.plano || 'clinica' }
      }
      if (data.user_id) {
        console.log('[webhook] via Checkout Session (user):', data.user_id, '| plano:', data.plano)
        return { target: 'user', targetId: data.user_id, plano: data.plano || 'platinum' }
      }
    }
  }

  const extRef = payment.externalReference || subscription.externalReference || eventData.externalReference
  if (extRef) {
    // externalReference com prefixo "org:" identifica uma organização.
    if (typeof extRef === 'string' && extRef.startsWith('org:')) {
      const orgId = extRef.slice(4)
      console.log('[webhook] via externalReference (org):', orgId)
      return { target: 'organization', targetId: orgId, plano: 'clinica' }
    }
    console.log('[webhook] via externalReference (user):', extRef)
    return { target: 'user', targetId: extRef, plano: 'platinum' }
  }

  if (subId) {
    const subDetails = await fetchSubscriptionDetails(subId)
    if (subDetails?.externalReference) {
      const ref = subDetails.externalReference
      if (typeof ref === 'string' && ref.startsWith('org:')) {
        return { target: 'organization', targetId: ref.slice(4), plano: 'clinica' }
      }
      return { target: 'user', targetId: ref, plano: 'platinum' }
    }

    // Fallback: procura vínculo local (primeiro em organizations, depois em profiles)
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('asaas_subscription_id', subId)
      .maybeSingle()
    if (org?.id) {
      console.log('[webhook] via vínculo local (org):', org.id)
      return { target: 'organization', targetId: org.id, plano: 'clinica' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('asaas_subscription_id', subId)
      .maybeSingle()
    if (profile?.id) {
      console.log('[webhook] via vínculo local (user):', profile.id)
      return { target: 'user', targetId: profile.id, plano: 'platinum' }
    }
  }

  console.warn('[webhook] Alvo não identificado')
  return null
}

async function ativarPlano(target: 'user' | 'organization', id: string, subscriptionId: string, plano: string) {
  const trimmed = id.trim()
  const dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const tabela = target === 'organization' ? 'organizations' : 'profiles'
  const col = target === 'organization' ? 'id' : 'id'
  const { error, count } = await supabase
    .from(tabela)
    .update(
      { plano, asaas_subscription_id: subscriptionId, data_vencimento: dataVencimento, status: 'ativo' },
      { count: 'exact' },
    )
    .eq(col, trimmed)
  if (error) console.error(`[webhook] Erro ao ativar (${tabela}):`, error)
  else console.log(`[webhook] Plano ${plano} ATIVADO em ${tabela}/${trimmed} (linhas: ${count})`)
}

async function suspenderAcesso(target: 'user' | 'organization', id: string, motivo: string) {
  const trimmed = id.trim()
  const tabela = target === 'organization' ? 'organizations' : 'profiles'
  const { count } = await supabase
    .from(tabela)
    .update({ status: 'bloqueado' }, { count: 'exact' })
    .eq('id', trimmed)
  console.log(`[webhook] Acesso SUSPENSO em ${tabela}/${trimmed}. Motivo: ${motivo} (linhas: ${count})`)
}

async function rebaixarParaFree(target: 'user' | 'organization', id: string, motivo: string) {
  const trimmed = id.trim()
  if (target === 'organization') {
    // Organização cancelada → marca como cancelada (preserva histórico/membros).
    // Membros voltam ao plano individual 'free' até upgrade.
    const { count } = await supabase
      .from('organizations')
      .update(
        { plano: 'clinica', asaas_subscription_id: null, data_vencimento: null, status: 'cancelado' },
        { count: 'exact' },
      )
      .eq('id', trimmed)
    console.log(`[webhook] Org CANCELADA/${trimmed}. Motivo: ${motivo} (linhas: ${count})`)
    return
  }
  const { count } = await supabase
    .from('profiles')
    .update(
      { plano: 'free', asaas_subscription_id: null, data_vencimento: null, status: 'cancelado' },
      { count: 'exact' },
    )
    .eq('id', trimmed)
  console.log(`[webhook] Profile FREE/${trimmed}. Motivo: ${motivo} (linhas: ${count})`)
}

async function jaProcessado(paymentId: string): Promise<boolean> {
  if (!paymentId) return false
  const { data } = await supabase
    .from('asaas_processed_events')
    .select('id')
    .eq('payment_id', paymentId)
    .maybeSingle()
  return !!data
}

async function marcarProcessado(paymentId: string, evento: string) {
  if (!paymentId) return
  await supabase
    .from('asaas_processed_events')
    .insert({ payment_id: paymentId, evento })
    .catch((e: unknown) => console.warn('[webhook] Idempotência não gravada:', e))
}

async function processarEvento(eventData: any) {
  const evento: string = eventData?.event ?? ''
  const payment = eventData?.payment ?? {}
  const subId = payment.subscription ?? eventData?.subscription?.id
  const paymentId: string = payment.id ?? eventData?.id ?? ''

  console.log(`[webhook] Evento: ${evento} | PaymentId: ${paymentId} | SubId: ${subId}`)

  if (!EVENTOS_RELEVANTES.has(evento)) {
    console.log(`[webhook] Ignorado: ${evento}`)
    return
  }

  if (paymentId && (await jaProcessado(paymentId))) {
    console.log(`[webhook] Já processado: ${paymentId}`)
    return
  }

  switch (evento) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      const result = await resolverAlvo(eventData)
      if (result) {
        await ativarPlano(result.target, result.targetId, subId || '', result.plano)
        await marcarProcessado(paymentId, evento)
      }
      break
    }
    case 'PAYMENT_OVERDUE': {
      const result = await resolverAlvo(eventData)
      if (result) {
        await suspenderAcesso(result.target, result.targetId, evento)
        await marcarProcessado(paymentId, evento)
      }
      break
    }
    case 'SUBSCRIPTION_DELETED':
    case 'PAYMENT_REFUNDED': {
      const result = await resolverAlvo(eventData)
      if (result) {
        await rebaixarParaFree(result.target, result.targetId, evento)
        await marcarProcessado(paymentId, evento)
      }
      break
    }
  }
}

Deno.serve(async (req) => {
  // Fail-closed: exige ASAAS_WEBHOOK_TOKEN configurado E correto.
  const tokenEsperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  if (!tokenEsperado) {
    console.error('[webhook] ASAAS_WEBHOOK_TOKEN não configurado — recusando.')
    return new Response('Server misconfigured', { status: 500 })
  }

  const tokenRecebido = req.headers.get('asaas-access-token')
  if (tokenRecebido !== tokenEsperado) {
    console.warn('[webhook] Token inválido')
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const rawText = await req.text()
    if (!rawText) return new Response('ok', { status: 200 })

    let eventData: any
    try {
      eventData = JSON.parse(rawText)
    } catch {
      console.warn('[webhook] Body não é JSON válido')
      return new Response('Bad Request', { status: 400 })
    }

    // Responde 200 imediatamente; processamento assíncrono evita timeout do Asaas.
    EdgeRuntime.waitUntil(
      processarEvento(eventData).catch((err) => {
        console.error('[webhook] Erro no processamento:', err)
      }),
    )

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[webhook] Erro crítico:', err)
    return new Response('Internal error', { status: 500 })
  }
})
