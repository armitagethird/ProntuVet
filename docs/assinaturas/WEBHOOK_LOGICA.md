# 🤖 Lógica do Webhook (asaas-webhook)

A Edge Function `asaas-webhook` é responsável por sincronizar o status financeiro do Asaas com o perfil do veterinário no Supabase.

## 🕵️ Estratégias de Recuperação de Usuário
Como o Asaas nem sempre envia o `externalReference` em todos os tipos de eventos, a função utiliza as seguintes estratégias em ordem de prioridade:

1.  **Checkout Session**: Verifica a tabela `asaas_checkout_sessions`. Esta é a forma mais rápida de identificar o usuário no primeiro pagamento de um checkout.
2.  **External Reference**: Procura por um UUID no topo do objeto ou dentro do objeto `subscription`.
3.  **Active API Fetch**: se não encontrar nas opções acima, a função faz um `fetch` na API do Asaas (`GET /subscriptions/{id}`) para ler o campo `externalReference` que foi gravado lá na criação.
4.  **Local History**: Procura na tabela `profiles` quem já possui aquele `asaas_subscription_id` vinculado.

## 🛡️ Proteção "Anti-Zumbi"
Para evitar que assinaturas antigas ou re-enviadas pelo Asaas ativem o plano de forma indevida:
- O Webhook consulta o status da assinatura no Asaas.
- Se a assinatura estiver `INACTIVE` ou `DELETED`, a ativação é abortada (ou o plano é rebaixado).
- Durante o `PAYMENT_CONFIRMED`, fomos permissivos com o status `INACTIVE` especificamente no Sandbox para evitar bloqueios por delay da API de testes.

## 📊 Auditoria de Banco de Dados
A função agora utiliza o parâmetro `{ count: 'exact' }` no Supabase.
- **`Linhas: 1`**: Sucesso real. O banco foi alterado.
- **`Linhas: 0`**: Alerta crítico. O ID do usuário foi identificado, mas ele **não existe** na tabela `profiles` deste projeto. Verifique se você não está misturando IDs de projetos diferentes (ex: Local vs Cloud).
