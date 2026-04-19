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

## 5. Falha ao Validar Token e erro 401 (Unsupported JWT algorithm ES256)
- **Causa**: Usar uma versão do `@supabase/supabase-js` >= 2.46 (ou superior) no Backend/Edge Runtime tentará validar tokens de autenticação localmente utilizando um pacote que colide no ambiente Deno/Vercel (ES256 missing/Not Supported).
- **Solução Definitiva**: Realize o **downgrade restrito** de toda a plataforma: no `.env`, no `package.json`, e nas importações `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6'` diretamente dentro das Edge Functions. Utilize a versão `2.45.6` e mantenha `@supabase/ssr` como `0.4.0`. O erro será instantaneamente mitigado, pois as versões anteriores validavam JWT pela nuvem (via RPC) com segurança.

## 6. O Ambiente de Desenvolvimento (Dev) está Inacreditavelmente Lento
- **Causa**: Você ou alguém da equipe atualizou o pacote para **Next.js 15, React 19** ou utilizou a CLI turbopack (`next dev --turbo`) nativa do Next 15 com incompatibilidade na compilação do Tailwind e bibliotecas UI client-side (como Shadcn / Framer Motion).
- **Solução Definitiva**: Faça **rolback** para a Stack LTS Premium: **Next.js 14.2.16** e **React 18.3.1**. Limpe severamente o seu ambiente removendo `node_modules` e o cache `.next`, altere sua configuração `next.config.mjs` de volta para Next 14 e execute `npm install`. Seu build voltará a ser ultra rápido com 0 travamentos.
