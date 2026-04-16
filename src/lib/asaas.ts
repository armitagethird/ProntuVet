import { getRawEnvVar } from '@/lib/env-raw'

// Utilitário para limpar máscaras (remover tudo que não é número)
function cleanNumbers(str: string) {
  return str.replace(/\D/g, '')
}

export async function criarCheckoutAssinatura(cliente: {
  nome: string
  email: string
  cpf: string
  phone: string
  postalCode: string
  address: string
  addressNumber: string
  province: string
  complement?: string
}) {
  // Usa getRawEnvVar para evitar o dotenv-expand do Next.js, que quebra
  // chaves que começam com `$` (como as chaves do Asaas sandbox).
  const apiKey = (getRawEnvVar('ASAAS_API_KEY') || '').trim()
  const baseUrl = getRawEnvVar('ASAAS_BASE_URL') || process.env.ASAAS_BASE_URL

  if (!apiKey) {
    throw new Error('Configuração ASAAS_API_KEY não encontrada no servidor.')
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
  const callbackBaseUrl = process.env.ASAAS_CALLBACK_URL || process.env.NEXT_PUBLIC_APP_URL || ''

  const body = {
    billingTypes: ['CREDIT_CARD'],
    chargeTypes: ['RECURRENT'],
    minutesToExpire: 1440,
    callback: {
      successUrl: `${callbackBaseUrl}/assinatura/sucesso`,
      cancelUrl: `${callbackBaseUrl}/assinatura/cancelado`,
      expiredUrl: `${callbackBaseUrl}/assinatura/expirado`,
    },
    items: [
      {
        name: 'ProntuVet Platinum',
        description: 'Copiloto clínico com IA — 200 consultas/mês',
        quantity: 1,
        value: 59.90,
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

  console.log('Link gerado:', data.paymentLink)
  return data.paymentLink as string
}
