import { getRawEnvVar } from '@/lib/env-raw'

// Utilitário para limpar máscaras (remover tudo que não é número)
function cleanNumbers(str: string) {
  return str.replace(/\D/g, '')
}

const PLANO_CONFIG = {
  essential: { nome: 'ProntuVet Essential', descricao: '80 consultas/mês + Timeline clínica',                    valor: 34.90 },
  platinum:  { nome: 'ProntuVet Platinum',  descricao: '200 consultas/mês + ProntuLink',                         valor: 69.90 },
  clinica:   { nome: 'ProntuVet Clínica',   descricao: '600 consultas/mês compartilhadas + múltiplos vets',      valor: 149.90 },
} as const

export type PlanoCheckout = keyof typeof PLANO_CONFIG

export interface CheckoutTarget {
  /** 'user' = fluxo individual (essential/platinum). 'organization' = Clínica. */
  kind: 'user' | 'organization'
  id: string
}

export async function criarCheckoutAssinatura(
  target: string | CheckoutTarget,
  cliente: {
    nome: string
    email: string
    cpf: string
    phone: string
    postalCode: string
    address: string
    addressNumber: string
    province: string
    complement?: string
  },
  plano: PlanoCheckout = 'platinum'
) {
  const normalizedTarget: CheckoutTarget =
    typeof target === 'string' ? { kind: 'user', id: target } : target
  const userId = normalizedTarget.id
  // Usa getRawEnvVar para evitar o dotenv-expand do Next.js, que quebra
  // chaves que começam com `$` (como as chaves do Asaas sandbox).
  const apiKey = (getRawEnvVar('ASAAS_API_KEY') || '').trim()
  const baseUrl = (getRawEnvVar('ASAAS_BASE_URL') || '').trim()

  if (!apiKey) {
    throw new Error('Configuração ASAAS_API_KEY não encontrada no servidor.')
  }

  if (!baseUrl) {
    throw new Error('Configuração ASAAS_BASE_URL não encontrada no servidor. Verifique o painel da Vercel.')
  }

  // Validação de segurança: se a chave contém espaços ou '=' provavelmente houve um 
  // erro de colagem ou de quebra de linha no arquivo .env / painel da Vercel.
  if (apiKey.includes(' ') || apiKey.includes('=')) {
    console.error('ASAAS_API_KEY detectada com formato inválido (contém espaços ou "=").')
    throw new Error(
      'A chave de API do Asaas parece estar malformada. Verifique se você não colou várias variáveis no mesmo campo no painel da Vercel ou se o arquivo .env tem quebras de linha corretas.'
    )
  }

  const requestHeaders = {
    'Content-Type': 'application/json',
    'access_token': apiKey,
  }

  console.log('--- ASaaS Checkout Debug ---')
  console.log('Target URL:', `${baseUrl}/checkouts`)
  console.log('Token Length:', apiKey.length)
  console.log('Cliente:', cliente.email)

  // Asaas exige CPF/CNPJ, CEP e Telefone apenas com números para evitar erros de validação
  const cleanedCpf = cleanNumbers(cliente.cpf)
  const cleanedCep = cleanNumbers(cliente.postalCode)
  const cleanedPhone = cleanNumbers(cliente.phone)

  // ASAAS_CALLBACK_URL deve ser uma URL HTTPS pública.
  // Em dev local aponte para o deploy da Vercel; em produção é igual a NEXT_PUBLIC_APP_URL.
  const callbackBaseUrl = 'https://prontuvet.vercel.app'

  if (!callbackBaseUrl || !callbackBaseUrl.startsWith('http')) {
    console.error('ASAAS_CALLBACK_URL inválida ou ausente:', callbackBaseUrl)
    throw new Error(
      'A URL de callback (ASAAS_CALLBACK_URL) não foi configurada ou é inválida. Ela deve ser uma URL completa (ex: https://dominio.com).'
    )
  }

  const planoInfo = PLANO_CONFIG[plano]
  // externalReference é consumido pelo webhook. Prefixo "org:" identifica organização.
  const externalRef =
    normalizedTarget.kind === 'organization' ? `org:${normalizedTarget.id}` : normalizedTarget.id

  const body = {
    billingTypes: ['CREDIT_CARD'],
    chargeTypes: ['RECURRENT'],
    minutesToExpire: 1440,
    callback: {
      successUrl: `${callbackBaseUrl}/assinatura/sucesso`,
      cancelUrl: `${callbackBaseUrl}/assinatura/cancelado`,
      expiredUrl: `${callbackBaseUrl}/assinatura/expirado`,
    },
    externalReference: externalRef,
    items: [
      {
        name: planoInfo.nome,
        description: planoInfo.descricao,
        quantity: 1,
        value: planoInfo.valor,
      },
    ],
    customerData: {
      name: cliente.nome,
      email: cliente.email,
      cpfCnpj: cleanedCpf,
      phone: cleanedPhone,
      postalCode: cleanedCep,
      address: cliente.address,
      addressNumber: cliente.addressNumber,
      province: cliente.province,
      complement: cliente.complement,
    },
    subscription: {
      cycle: 'MONTHLY',
      nextDueDate: new Date().toISOString().split('T')[0],
      externalReference: externalRef,
    },
  }

  const res = await fetch(`${baseUrl}/checkouts`, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error(`Erro Asaas (${res.status}):`, JSON.stringify(data, null, 2))
    
    // Extrair mensagem de erro amigável se disponível
    const errorMessage = data.errors?.[0]?.description || 'Erro na API do Asaas'
    throw new Error(errorMessage)
  }

  // Loga a resposta completa
  console.log('Resposta Asaas:', JSON.stringify(data, null, 2))

  // O Asaas retorna o link no campo `link`
  const checkoutUrl = data.link ?? data.url ?? data.paymentUrl ?? data.checkoutUrl ?? data.paymentLink

  if (!checkoutUrl) {
    console.error('Campo de URL não encontrado. Campos disponíveis:', Object.keys(data))
    throw new Error('Link de pagamento não retornado pelo Asaas. Verifique os logs do servidor.')
  }

  // Salva o mapeamento checkoutSessionId → alvo (user ou organization).
  // O Asaas nem sempre propaga o externalReference no payment, mas sempre inclui o checkoutSession no webhook.
  if (data.id) {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const row =
      normalizedTarget.kind === 'organization'
        ? { checkout_session_id: data.id, organization_id: normalizedTarget.id, user_id: null, plano }
        : { checkout_session_id: data.id, user_id: normalizedTarget.id, organization_id: null, plano }

    const { error: dbError } = await sb
      .from('asaas_checkout_sessions')
      .upsert(row, { onConflict: 'checkout_session_id' })

    if (dbError) console.error('Erro ao salvar checkout session:', dbError)
    else console.log('Checkout session salvo:', data.id, '→', normalizedTarget)
  }

  console.log('URL do checkout:', checkoutUrl)
  return checkoutUrl as string
}

export async function cancelarAssinatura(subscriptionId: string) {
  const apiKey = (getRawEnvVar('ASAAS_API_KEY') || '').trim()
  const baseUrl = (getRawEnvVar('ASAAS_BASE_URL') || '').trim()

  if (!apiKey || !baseUrl) {
    throw new Error('Configurações do Asaas ausentes no servidor.')
  }

  console.log(`[asaas] 🗑️ Iniciando cancelamento da assinatura: ${subscriptionId}`)

  const res = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'accept': 'application/json',
      'access_token': apiKey,
    },
  })

  // Se retornar 404, consideramos que já foi removido (sucesso para o nosso contexto)
  if (res.status === 404) {
    console.warn(`[asaas] Assinatura ${subscriptionId} não encontrada no Asaas (já removida?).`)
    return { success: true, alreadyRemoved: true }
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error(`[asaas] Erro ao cancelar (${res.status}):`, JSON.stringify(data, null, 2))
    const errorMessage = data.errors?.[0]?.description || 'Erro ao cancelar assinatura no Asaas'
    throw new Error(errorMessage)
  }

  console.log(`[asaas] ✅ Assinatura ${subscriptionId} cancelada com sucesso.`)
  return { success: true, data }
}
