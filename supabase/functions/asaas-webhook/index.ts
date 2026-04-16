import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function ativarPlano(userId: string, subscriptionId: string) {
  const dataVencimento = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('profiles')
    .update({
      plano: 'platinum',
      asaas_subscription_id: subscriptionId,
      data_vencimento: dataVencimento,
      status: 'ativo',
    })
    .eq('id', userId)

  if (error) console.error('Erro ao ativar plano:', error)
  else console.log(`Plano Platinum ativado para user ${userId}`)
}

async function rebaixarParaFree(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      plano: 'free',
      asaas_subscription_id: null,
      data_vencimento: null,
      status: 'cancelado',
    })
    .eq('id', userId)

  if (error) console.error('Erro ao rebaixar plano:', error)
  else console.log(`Plano rebaixado para free — user ${userId}`)
}

async function getUserIdByEmail(email: string): Promise<string | null> {
  // Usa o admin API com service_role para buscar o usuário pelo e-mail
  const { data, error } = await supabase.auth.admin.getUserByEmail(email)
  if (error || !data?.user) {
    console.error(`Usuário não encontrado para o e-mail ${email}:`, error)
    return null
  }
  return data.user.id
}

Deno.serve(async (req) => {
  // Validar token do Asaas
  const token = req.headers.get('asaas-access-token')
  if (token !== Deno.env.get('ASAAS_WEBHOOK_TOKEN')) {
    console.warn('Token inválido recebido no webhook')
    return new Response('Não autorizado', { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Payload inválido', { status: 400 })
  }

  const evento = body.event as string
  const email: string | undefined =
    body.payment?.customer?.email ??
    body.subscription?.customer?.email

  const externalReference: string | undefined = 
    body.payment?.externalReference ?? 
    body.subscription?.externalReference

  console.log(`Evento recebido: ${evento} | UserId (Ref): ${externalReference ?? 'n/a'} | Email: ${email ?? 'n/a'}`)

  // Prioridade 1: externalReference (ID do banco)
  // Prioridade 2: email (fallback)
  let userId: string | null = null
  if (externalReference) {
    userId = externalReference
  } else if (email) {
    userId = await getUserIdByEmail(email)
  }

  if (!userId) {
    console.warn(`Evento ${evento} não pôde ser vinculado a um usuário (Ref: ${externalReference}, Email: ${email}) — ignorado`)
    return new Response('ok', { status: 200 })
  }

  const identity = email || userId

  switch (evento) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      // Idempotência: checar se já está ativo
      const { data: profile } = await supabase
        .from('profiles')
        .select('plano, asaas_subscription_id')
        .eq('id', userId)
        .single()

      const subscriptionId =
        body.payment?.subscription ??
        body.subscription?.id ??
        profile?.asaas_subscription_id ??
        ''

      if (profile?.plano === 'platinum' && profile?.asaas_subscription_id === subscriptionId) {
        console.log(`Plano já ativo para ${identity} — evento ignorado (idempotência)`)
        break
      }

      await ativarPlano(userId, subscriptionId)
      break
    }

    case 'SUBSCRIPTION_DELETED':
    case 'PAYMENT_DELETED': {
      await rebaixarParaFree(userId)
      break
    }

    case 'PAYMENT_OVERDUE':
      // Log apenas — não bloqueia imediatamente
      console.log(`Pagamento em atraso: ${identity}`)
      break

    default:
      console.log(`Evento ignorado: ${evento}`)
  }

  return new Response('ok', { status: 200 })
})
