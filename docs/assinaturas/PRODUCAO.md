# 🚀 Guia de Implantação em Produção

Este documento detalha os passos necessários para migrar a integração do Asaas de Sandbox (Testes) para Produção (Live).

## 1. Variáveis de Ambiente (Secrets)
Você precisará atualizar as chaves no painel da **Vercel** e nos **Secrets do Supabase** (via CLI: `supabase secrets set`).

| Variável | Sandbox (Atual) | Produção (Novo) |
| :--- | :--- | :--- |
| `ASAAS_API_KEY` | `$aact_hmlg...` | `$aact_live...` |
| `ASAAS_BASE_URL` | `https://sandbox.asaas.com/api/v3` | `https://api.asaas.com/v3` |
| `ASAAS_CALLBACK_URL` | `https://prontuvet.vercel.app` | URL oficial (ex: `https://seu-dominio.com`) |
| `ASAAS_WEBHOOK_TOKEN` | Seu token de teste | Novo token gerado no painel Produção |

## 2. Configuração do Webhook
- **URL**: No painel de Produção do Asaas, configure a URL do Webhook:
  `https://wfiolpylleatfxiznxmc.supabase.co/functions/v1/asaas-webhook`
- **Eventos**: Ative os eventos de **Pagamento Confirmado**, **Pagamento Recebido**, **Assinatura Removida** e **Pagamento Estornado**.

## 3. Melhoria Recomendada: Tabela de Auditoria (Idempotência)
Para garantir 100% de rastreabilidade e evitar que o mesmo evento seja processado duas vezes em caso de retentativas do Asaas, execute o SQL abaixo no seu painel do Supabase:

```sql
-- Tabela para registrar eventos processados do Asaas
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL, -- ID do evento do Asaas (evt_...)
    user_id UUID REFERENCES public.profiles(id),
    subscription_id TEXT,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

-- Política para permitir que apenas a service_role (Webhook) insira dados
CREATE POLICY "Apenas admin pode inserir eventos" ON public.asaas_webhook_events
    FOR INSERT WITH CHECK (true);
```

### Por que usar essa tabela?
Com ela, podemos adicionar um check na Edge Function:
```typescript
const { data: existing } = await supabase
  .from('asaas_webhook_events')
  .select('id')
  .eq('event_id', eventData.id)
  .single();

if (existing) return new Response('Already processed', { status: 200 });
```

## 4. Checklist de Limpeza
- [ ] Verifique se o `console.warn` de detalhes da assinatura foi removido do Webhook para maior privacidade.
- [ ] Teste uma transação real de valor baixo (ex: R$ 5,00) antes de abrir para todos os usuários.
- [ ] Monitore os logs do Supabase nas primeiras 24h.
