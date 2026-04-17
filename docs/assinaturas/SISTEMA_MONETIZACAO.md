# 💳 Sistema de Monetização ProntuVet

Este documento descreve o funcionamento técnico da integração com o Asaas para assinaturas recorrentes.

## 🏗️ Arquitetura
O sistema utiliza **Asaas Checkouts** para simplificar o fluxo de pagamento, acoplado a uma **Edge Function no Supabase** para processar eventos em tempo real via Webhooks.

### Componentes Principais:
1.  **Frontend (`/profile`)**: Interface de gerenciamento onde o veterinário assina ou cancela o plano.
2.  **API de Checkout (`/api/assinatura/checkout`)**: Gera o link de pagamento e salva o mapeamento de sessão.
3.  **Webhook (`supabase/functions/asaas-webhook`)**: O "cérebro" que processa confirmações de pagamento e atualiza o banco de dados.
4.  **Lib Asaas (`src/lib/asaas.ts`)**: Utilitários para chamadas diretas à API do Asaas.

## 🔑 Segurança e Identificação
Implementamos uma lógica de **"Identificação de Três Camadas"** no Webhook para garantir que o plano NUNCA seja ativado na conta errada:

1.  **Checkout Session**: Mapeamento entre o ID do checkout do Asaas e o UUID do usuário no Supabase.
2.  **External Reference**: Injeção do UUID do usuário em múltiplos níveis do objeto de assinatura no Asaas.
3.  **API Call Fallback**: Se o Webhook vier incompleto, a função faz uma chamada ativa na API do Asaas para buscar os metadados da assinatura.

> [!IMPORTANT]
> O fallback por **Email foi desativado** deliberadamente para evitar confusão entre contas em ambientes de teste (Sandbox).

## 🚀 Fluxo de Trabalho
- O usuário clica em "Assinar Platinum".
- Uma `asaas_checkout_session` é gravada no banco.
- O usuário paga no Asaas.
- O Asaas envia um `PAYMENT_CONFIRMED`.
- O Webhook identifica o usuário, limpa o ID (`trim()`) e atualiza a tabela `profiles`.
- O log registra `✨ Platinum ATIVADO | (Linhas: 1)` confirmando a alteração real no banco de dados.
