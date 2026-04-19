import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') ?? ''
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://sandbox.asaas.com/api/v3'

/**
 * Busca detalhes da assinatura DIRETAMENTE na API do Asaas.
 * Isso é necessário porque o Webhook de pagamento às vezes não envia o externalReference.
 */
async function fetchSubscriptionDetails(subId: string) {
  try {
    const res = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subId}`, {
      headers: { 'access_token': ASAAS_API_KEY }
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error(`[webhook] Erro ao buscar sub ${subId}:`, err)
    return null
  }
}

/**
 * Tenta descobrir de quem é a assinatura de forma ultra-segura.
 */
async function resolverUserId(eventData: any): Promise<string | null> {
  const payment = eventData?.payment ?? {}
  const subscription = eventData?.subscription ?? {}
  const subId = payment.subscription || subscription.id

  // 1. Tentar ler do corpo do evento (preferencial)
  const extRef = payment.externalReference || subscription.externalReference || eventData.externalReference
  if (extRef) {
    console.log('[webhook] ✅ ID encontrado no evento:', extRef)
    return extRef
  }

  // 2. Tentar via Checkout Session (tabela de de-para)
  const csId = payment.checkoutSession
  if (csId) {
    const { data } = await supabase.from('asaas_checkout_sessions').select('user_id').eq('checkout_session_id', csId).single()
    if (data?.user_id) {
       console.log('[webhook] ✅ ID encontrado via Checkout Session:', data.user_id)
       return data.user_id
    }
  }

  // 3. SE NÃO ACHOU NADA E TEM SUB_ID, BUSCAR NA API DO ASAAS (O pulo do gato 🐱)
  if (subId) {
    console.log(`[webhook] 🔍 Buscando externalReference na API do Asaas para ${subId}...`)
    const subDetails = await fetchSubscriptionDetails(subId)
    if (subDetails?.externalReference) {
      console.log('[webhook] ✅ ID encontrado na API do Asaas:', subDetails.externalReference)
      return subDetails.externalReference
    }
    
    console.warn(`[webhook] ⚠️ Signature status from Asaas API:`, JSON.stringify(subDetails))
    
    // 4. Última tentativa: buscar no banco de dados local por quem já teve essa sub_id vinculada
    const { data: profile } = await supabase.from('profiles').select('id').eq('asaas_subscription_id', subId).single()
    if (profile?.id) {
       console.log('[webhook] ✅ ID encontrado via vínculo local prévio:', profile.id)
       return profile.id
    }
  }

  // ⚠️ IMPORTANTE: Removemos o fallback por email por ser inseguro em ambientes de teste/multi-conta.
  console.warn('[webhook] ❌ Não foi possível identificar o usuário de forma segura.')
  return null
}

async function ativarPlano(userId: string, subscriptionId: string) {
  const sanitizedId = userId.trim()
  const dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const { error, count } = await supabase
    .from('profiles')
    .update({ 
      plano: 'platinum', 
      asaas_subscription_id: subscriptionId, 
      data_vencimento: dataVencimento, 
      status: 'ativo' 
    }, { count: 'exact' })
    .eq('id', sanitizedId)
  
  if (error) {
    console.error('[webhook] ❌ Erro DB ao ativar plano:', error)
  } else if (count === 0) {
    console.error(`[webhook] ⚠️ AVISO: Nenhuma linha atualizada para o ID ${sanitizedId}. O usuário existe na tabela profiles?`)
  } else {
    console.log(`[webhook] ✨ Platinum ATIVADO para ${sanitizedId} (Linhas: ${count})`)
  }
}

async function rebaixarParaFree(userId: string, motivo: string) {
  const sanitizedId = userId.trim()
  const { count } = await supabase
    .from('profiles')
    .update({ plano: 'free', asaas_subscription_id: null, data_vencimento: null, status: 'cancelado' }, { count: 'exact' })
    .eq('id', sanitizedId)
  
  console.log(`[webhook] ⬇️ Rebaixado para FREE (${sanitizedId}). Motivo: ${motivo} (Linhas: ${count})`)
}

Deno.serve(async (req) => {
  const rawText = await req.text()
  const params = new URLSearchParams(rawText)
  
  const tokenRecebido = params.get('accessToken') ?? req.headers.get('asaas-access-token')
  const tokenEsperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  if (tokenEsperado && tokenRecebido !== tokenEsperado) return new Response('Unauthorized', { status: 401 })

  const dataField = params.get('data')
  if (!dataField) return new Response('ok', { status: 200 })

  let eventData: any
  try { eventData = JSON.parse(dataField) }
  catch (e) { return new Response('ok', { status: 200 }) }

  const evento: string = eventData?.event ?? ''
  const subId = eventData?.payment?.subscription ?? eventData?.subscription?.id
  
  console.log(`[webhook] 🔔 Evento: ${evento} | SubId: ${subId}`)

  switch (evento) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      const userId = await resolverUserId(eventData)
      if (userId) {
        await ativarPlano(userId, subId || '')
      }
      break
    }

    case 'SUBSCRIPTION_DELETED':
    case 'PAYMENT_REFUNDED': {
      const userId = await resolverUserId(eventData)
      if (userId) await rebaixarParaFree(userId, evento)
      break
    }

    default:
      console.log(`[webhook] Ignorado: ${evento}`)
  }

  return new Response('ok', { status: 200 })
})
