# 🔧 Resolução de Problemas (Troubleshooting)

Este guia ajuda a diagnosticar falhas comuns no sistema de assinaturas.

## 1. O usuário pagou, mas continua como "Free"
- **Verificar Logs**: Vá ao painel do Supabase > Edge Functions > asaas-webhook > Invocations.
- **`❌ Não foi possível identificar o usuário`**: O ID não foi encontrado no evento, na sessão nem na API do Asaas. Provavelmente uma assinatura manual feita pelo painel do Asaas sem o `externalReference`.
- **`⚠️ AVISO: Nenhuma linha atualizada (Linhas: 0)`**: O sistema achou o ID do usuário (ex: `f4f6...`), tentou atualizar a tabela `profiles`, mas o banco respondeu que não encontrou ninguém com esse ID. Verifique se o ID do usuário é realmente do projeto Supabase atual.
- **Falta de Refresh**: O frontend pode estar com cache. Peça ao usuário para dar um F5 na página de perfil.

## 2. Erro "O campo successUrl é inválido" no Checkout
- **Causa**: O Asaas Sandbox exige URLs HTTPS públicas. 
- **Solução**: Certifique-se de que a `ASAAS_CALLBACK_URL` no `.env.local` é uma URL HTTPS válida (ex: `https://prontuvet.vercel.app`). O uso de `http://localhost` gera este erro.

## 3. Webhook não gera logs (Silêncio Total)
- **URL no Asaas**: Verifique se a URL no painel do Asaas Sandbox é: `https://[PROJECT_REF].supabase.co/functions/v1/asaas-webhook`.
- **Token**: Verifique se o `ASAAS_WEBHOOK_TOKEN` no Asaas é idêntico ao configurado nos Secrets da Edge Function.
- **Teste de Conexão**: No painel do Asaas em Configurações > Webhook, clique em "Testar conexão". Se falhar com 404, a função não foi deletada ou não existe. Se falhar com 401, o token está errado.

## 4. Assinaturas "Zumbis" (Reativam sozinhas)
- **Causa**: Webhooks antigos de testes passados que ficaram na fila do Asaas.
- **Solução**: Vá ao painel do Asaas Sandbox e delete manualmente todas as assinaturas antigas. O sistema atual ignorará a maioria, mas deletá-las no Asaas limpa a fila de webhooks pendentes.
