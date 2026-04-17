# Integração Asaas — ProntuVet

Stack: Next.js 14, TypeScript, Supabase (PostgreSQL + Auth + Edge Functions)  
Objetivo: Implementar cobrança recorrente de R$59,90/mês via Asaas Checkout

---

## Pré-requisitos

- Conta criada em sandbox.asaas.com
- API key de sandbox em mãos
- Supabase CLI instalado (`npm install -g supabase`)
- Supabase CLI autenticado (`supabase login`)

---

## Passo 1 — Variáveis de ambiente

Adicionar no `.env.local`:

```env
ASAAS_API_KEY=sua_api_key_do_sandbox
ASAAS_WEBHOOK_TOKEN=um_token_secreto_qualquer_que_voce_cria
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
```

> Em produção, trocar `ASAAS_BASE_URL` para `https://api.asaas.com/v3`

---

## Passo 2 — Schema do banco de dados

Rodar no SQL Editor do Supabase:

```sql
alter table profiles 
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_subscription_id text,
  add column if not exists plano text default 'free',
  add column if not exists status_assinatura text default 'ativo',
  add column if not exists data_vencimento timestamptz,
  add column if not exists trial_ate timestamptz;

-- Index para busca por customer_id do Asaas
create index if not exists idx_profiles_asaas_customer 
  on profiles(asaas_customer_id);
```

---

## Passo 3 — Biblioteca de integração com o Asaas

Criar arquivo `src/lib/asaas.ts`:

```typescript
const ASAAS_URL = process.env.ASAAS_BASE_URL!
const ASAAS_KEY = process.env.ASAAS_API_KEY!

const headers = {
  'Content-Type': 'application/json',
  'access_token': ASAAS_KEY
}

// Criar cliente no Asaas
export async function criarClienteAsaas(dados: {
  nome: string
  email: string
  cpfCnpj: string
}) {
  const res = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: dados.nome,
      email: dados.email,
      cpfCnpj: dados.cpfCnpj,
      externalReference: dados.email // usa email como referência
    })
  })
  return res.json()
}

// Gerar link de checkout com assinatura recorrente
export async function criarCheckoutAssinatura(cliente: {
  nome: string
  email: string
  cpfCnpj: string
}) {
  const res = await fetch(`${ASAAS_URL}/checkouts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      billingTypes: ['CREDIT_CARD', 'PIX'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 1440,
      callback: {
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/sucesso`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/cancelado`,
        expiredUrl: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/expirado`
      },
      items: [{
        name: 'ProntuVet Platinum',
        description: 'Copiloto clínico com IA — 200 consultas/mês',
        quantity: 1,
        value: 59.90
      }],
      customerData: {
        name: cliente.nome,
        email: cliente.email,
        cpfCnpj: cliente.cpfCnpj
      },
      subscription: {
        cycle: 'MONTHLY',
        nextDueDate: new Date().toISOString().split('T')[0]
      }
    })
  })
  const data = await res.json()
  return data.paymentLink // URL para redirecionar o vet
}
```

---

## Passo 4 — Edge Function do webhook

### 4.1 Criar a função

```bash
supabase functions new asaas-webhook
```

### 4.2 Conteúdo de `supabase/functions/asaas-webhook/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function ativarPlano(email: string, subscriptionId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      plano: 'platinum',
      status_assinatura: 'ativo',
      asaas_subscription_id: subscriptionId,
      data_vencimento: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString()
    })
    .eq('email', email)

  if (error) console.error('Erro ao ativar plano:', error)
}

async function rebaixarParaFree(email: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      plano: 'free',
      status_assinatura: 'cancelado',
      asaas_subscription_id: null
    })
    .eq('email', email)

  if (error) console.error('Erro ao rebaixar plano:', error)
}

Deno.serve(async (req) => {
  // Validar token do Asaas
  const token = req.headers.get('asaas-access-token')
  if (token !== Deno.env.get('ASAAS_WEBHOOK_TOKEN')) {
    return new Response('Não autorizado', { status: 401 })
  }

  const body = await req.json()
  const evento = body.event
  const email = body.payment?.customer?.email
    ?? body.subscription?.customer?.email

  console.log(`Evento recebido: ${evento} | Email: ${email}`)

  switch (evento) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      if (email) {
        await ativarPlano(
          email,
          body.payment?.subscription ?? body.subscription?.id ?? ''
        )
      }
      break

    case 'SUBSCRIPTION_DELETED':
    case 'PAYMENT_DELETED':
      if (email) await rebaixarParaFree(email)
      break

    case 'PAYMENT_OVERDUE':
      // Log apenas — não bloqueia imediatamente
      console.log(`Pagamento em atraso: ${email}`)
      break

    default:
      console.log(`Evento ignorado: ${evento}`)
  }

  return new Response('ok', { status: 200 })
})
```

### 4.3 Deploy da função

```bash
supabase functions deploy asaas-webhook
```

### 4.4 Pegar a URL da função

No painel do Supabase: **Edge Functions → asaas-webhook → URL**

Formato:
```
https://xxxxxxxxxxxx.supabase.co/functions/v1/asaas-webhook
```

Essa URL é o que você cola no Asaas para configurar o webhook.

---

## Passo 5 — Configurar webhook no painel do Asaas

1. No Asaas, vai em **Integrações → Webhooks → Criar novo webhook**
2. Cola a URL da Edge Function
3. No campo **Token de autenticação**, coloca o valor de `ASAAS_WEBHOOK_TOKEN`
4. Seleciona os eventos:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `SUBSCRIPTION_DELETED`
   - `PAYMENT_DELETED`
5. Salva e copia a chave gerada

---

## Passo 6 — Rota de API para gerar o checkout

Criar `src/app/api/assinatura/checkout/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { criarCheckoutAssinatura } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar autenticação
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ erro: 'Token inválido' }, { status: 401 })
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, email, cpf_cnpj, plano')
    .eq('id', user.id)
    .single()

  if (profile?.plano === 'platinum') {
    return NextResponse.json(
      { erro: 'Usuário já possui plano Platinum' },
      { status: 400 }
    )
  }

  if (!profile?.cpf_cnpj) {
    return NextResponse.json(
      { erro: 'CPF não cadastrado. Atualize seu perfil antes de assinar.' },
      { status: 400 }
    )
  }

  // Gerar link de checkout
  const paymentLink = await criarCheckoutAssinatura({
    nome: profile.nome ?? user.email!,
    email: profile.email ?? user.email!,
    cpfCnpj: profile.cpf_cnpj
  })

  return NextResponse.json({ paymentLink })
}
```

---

## Passo 7 — Tela de onboarding após cadastro

Criar `src/app/assinatura/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssinarPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function assinar() {
    setLoading(true)
    const res = await fetch('/api/assinatura/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${/* token do supabase */''}`
      }
    })
    const { paymentLink } = await res.json()
    window.location.href = paymentLink
  }

  return (
    <div className="flex gap-8 p-8">
      {/* Card Free */}
      <div className="border rounded-lg p-6 flex-1">
        <h2 className="text-xl font-medium mb-4">Gratuito</h2>
        <p className="text-3xl font-bold mb-6">R$0</p>
        <ul className="space-y-2 text-sm text-muted-foreground mb-6">
          <li>10 consultas/mês</li>
          <li>1 template padrão</li>
          <li>Histórico de 30 dias</li>
        </ul>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full border rounded px-4 py-2"
        >
          Continuar grátis
        </button>
      </div>

      {/* Card Platinum */}
      <div className="border-2 border-green-500 rounded-lg p-6 flex-1">
        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block mb-2">
          Recomendado
        </div>
        <h2 className="text-xl font-medium mb-4">Platinum</h2>
        <p className="text-3xl font-bold mb-1">R$89,90</p>
        <p className="text-sm text-muted-foreground mb-6">/mês · 30 dias grátis</p>
        <ul className="space-y-2 text-sm mb-6">
          <li>200 consultas/mês</li>
          <li>Templates ilimitados</li>
          <li>Histórico completo</li>
          <li>Exportação PDF</li>
          <li>Trilha do animal</li>
          <li>Busca com IA</li>
          <li>Anexos (fotos e exames)</li>
          <li>Suporte prioritário</li>
        </ul>
        <button
          onClick={assinar}
          disabled={loading}
          className="w-full bg-green-600 text-white rounded px-4 py-2"
        >
          {loading ? 'Aguarde...' : 'Assinar agora'}
        </button>
      </div>
    </div>
  )
}
```

---

## Passo 8 — Páginas de retorno do Asaas

Criar `src/app/assinatura/sucesso/page.tsx`:
```tsx
export default function Sucesso() {
  return (
    <div className="text-center p-8">
      <h1>Bem-vindo ao ProntuVet Platinum!</h1>
      <p>Seu plano foi ativado. Redirecionando...</p>
    </div>
  )
}
```

Criar `src/app/assinatura/cancelado/page.tsx` e `expirado/page.tsx` com mensagens adequadas.

---

## Passo 9 — Proteger features por plano (Edge Function)

Na Edge Function `supabase/functions/process-consultation/index.ts`, a verificação de limites é feita de forma tripla (Hora, Dia, Mês) consultando a tabela `uso_consultas`:

```typescript
// Exemplo de lógica implementada
const { count } = await supabase
  .from('uso_consultas')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('sucesso', true)
  .gte('data_consulta', inicioMes)

const limite = profile?.plano === 'platinum' ? 200 : 10

if (count >= limite) {
  return new Response(JSON.stringify({ error: 'LIMIT_EXCEEDED' }), { status: 429 })
}
```

### 9.1 UX de Feedback no Frontend
No arquivo `src/components/audio-recorder.tsx`, tratamos o erro 429 para exibir um modal de upgrade bloqueante:

- **1ª Consulta**: Toast de boas-vindas ao plano free.
- **8ª Consulta**: Toast de aviso (80% da cota).
- **Status 429**: Bloqueio total da interface com botão para `/assinatura`.

---

## Passo 10 — Testar no sandbox

O Asaas sandbox tem cartões de teste:

| Cenário | Número do cartão |
|---|---|
| Pagamento aprovado | 5162306219378829 |
| Pagamento recusado | 5162306219378829 (data expirada) |

Para testar PIX no sandbox, o Asaas gera um QR Code que você "paga" direto pelo painel do sandbox.

---

## Passo 11 — Ir para produção

1. Trocar `ASAAS_BASE_URL` para `https://api.asaas.com/v3`
2. Trocar `ASAAS_API_KEY` pela chave de produção
3. Reconfigurar o webhook no painel de produção do Asaas com a mesma URL da Edge Function
4. Testar com um pagamento real de R$1,00 antes de abrir para clientes

---

## Checklist final

- [ ] `.env.local` com as três variáveis do Asaas
- [ ] Coluna `cpf_cnpj` na tabela `profiles`
- [ ] `src/lib/asaas.ts` criado
- [ ] Edge Function `asaas-webhook` deployada
- [ ] Webhook configurado no painel do Asaas com token
- [ ] Rota `/api/assinatura/checkout` criada
- [ ] Tela de onboarding `/assinatura` criada
- [ ] Páginas de retorno criadas (sucesso, cancelado, expirado)
- [ ] Limites de plano aplicados server-side
- [ ] Testado no sandbox com cartão e PIX
- [ ] Pronto para produção

---

## Observações importantes

**CPF é obrigatório** — o Asaas exige CPF para criar o checkout. Certifique-se de que o campo `cpf_cnpj` existe no cadastro do veterinário antes de gerar o link.

**Webhook é a fonte da verdade** — nunca confie no redirecionamento da `successUrl` para ativar o plano. Sempre use o webhook, pois o redirecionamento pode falhar se o vet fechar a aba.

**Idempotência** — o Asaas pode enviar o mesmo evento mais de uma vez. Ao processar o webhook, verifique se o plano já está ativo antes de atualizar para evitar processamento duplicado.

**Sandbox vs produção** — as API keys são diferentes. Nunca use a key de produção em ambiente de desenvolvimento.

**SDK do Google em Edge Functions** — Para evitar erros `503 Service Unavailable` no Deno (Supabase Edge), utilize sempre a versão estável do SDK `@google/generative-ai@0.21.0` ou superior.
