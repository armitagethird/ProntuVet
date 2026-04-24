# Checklist pós-registro de `prontuvet.com` — pendências

Domínio `prontuvet.com` comprado no Cloudflare em **2026-04-23** (1 ano, renovação
automática). DNS já gerenciado pelo Cloudflare. Email Routing configurado com
`contato@`, `suporte@`, `privacidade@` encaminhando para `romerosaraiva4@gmail.com`.
`app.prontuvet.com` apontado pra Vercel via CNAME `cname.vercel-dns.com` (nuvem
cinza — proxy desligado).

**Supabase Auth já atualizado** (Site URL + Redirect URLs apontando pra
`app.prontuvet.com`).

As pendências abaixo não são urgentes (produção não quebra sem elas hoje), mas
precisam sair antes de: (a) divulgar o domínio pra clientes reais, (b) começar a
mandar e-mail transacional, (c) oficializar o DPO LGPD.

---

## 1. Vercel — atualizar `NEXT_PUBLIC_APP_URL`

**Por quê:** vários lugares do app geram links absolutos (callback Asaas,
ProntuLink tutor, e-mails transacionais) a partir dessa env. Hoje provavelmente
aponta pro `.vercel.app`.

**Como:**
1. Vercel → Project **ProntuVet** → Settings → Environment Variables
2. Achar `NEXT_PUBLIC_APP_URL` → editar → valor novo: `https://app.prontuvet.com`
3. Marcar **Production** + **Preview** (não marcar Development)
4. Clicar em **Save** → ir em Deployments → "Redeploy" no último deploy de `main`
   (pra pegar a nova env — Vercel não re-builda sozinho ao salvar env)

**Verificação:** após redeploy, abrir `/assinatura` → clicar em assinar um plano
→ ver se o link do Asaas que abre contém `app.prontuvet.com` no `callback`/`return_url`.

---

## 2. Atualizar `/privacidade` — swap do e-mail DPO

**Por quê:** a página de Política de Privacidade atualmente mostra
`prontuvet.social@gmail.com` como contato do Encarregado de Proteção de Dados
(DPO). Por LGPD, o contato do DPO deve ser um e-mail institucional.

**Como:**
1. Abrir `src/app/privacidade/page.tsx`
2. Buscar `prontuvet.social@gmail.com` (pode ter também em `src/lib/legal.ts` e
   `src/app/termos/page.tsx` — grep no projeto todo)
3. Substituir por `privacidade@prontuvet.com`
4. Commit: `docs: atualiza contato DPO para privacidade@prontuvet.com`

**Atenção:** o e-mail já está recebendo (via Cloudflare Email Routing). Antes do
deploy, mandar um teste de `gmail.com → privacidade@prontuvet.com` pra confirmar
que chega no `romerosaraiva4@gmail.com`.

---

## 3. Asaas — atualizar URL do webhook (se estiver apontando pra `.vercel.app`)

**Por quê:** o webhook do Asaas é o que ativa/cancela assinaturas no banco. Se
estiver apontando pro domínio `.vercel.app`, continua funcionando enquanto a
Vercel mantiver o alias — mas é frágil. Apontar pro domínio próprio é o correto.

**Como:**
1. https://www.asaas.com → login → menu **Integrações** → **Webhooks**
2. Achar o webhook que aponta pra `*.vercel.app/api/asaas/webhook` (ou path
   similar — conferir o path real em `src/app/api/assinatura/` ou no código
   da Edge Function `supabase/functions/asaas-webhook/index.ts`)
3. Editar URL → `https://app.prontuvet.com/api/...` (usar o path exato atual)
4. Salvar. Asaas manda um ping de teste — confirma 200 OK.

**Atenção:** o `ASAAS_WEBHOOK_TOKEN` (header de autenticação) **não muda** —
só a URL.

**Dependência:** fazer APÓS o item #1 (redeploy da Vercel). Se trocar a URL no
Asaas antes do redeploy, os próximos webhooks podem falhar rota.

---

## 4. Resend — verificar domínio `prontuvet.com`

**Por quê:** Cloudflare Email Routing só **recebe** e-mails. Pra **enviar**
transacionais (convite de Clínica, reset de senha custom, confirmações LGPD,
aviso de cobrança), precisa do Resend. O Resend exige verificação de domínio
(SPF + DKIM + DMARC) antes de aceitar `from: @prontuvet.com`.

**Como:**
1. https://resend.com → Dashboard → **Domains** → **Add Domain** → `prontuvet.com`
2. Resend mostra 3 registros DNS pra adicionar (geralmente: 1 MX, 1 TXT SPF, 1
   TXT DKIM, 1 TXT DMARC)
3. No Cloudflare DNS (`prontuvet.com` → DNS → Records) → adicionar cada um
   exatamente como o Resend mostrou. **Proxy status: cinza (DNS only)** em todos
   os records de e-mail.
4. Voltar no Resend → clicar em **Verify** → aguardar 1-5 min → status verde.
5. Criar API key: Resend → **API Keys** → **Create** → nome "ProntuVet Production"
   → copiar a key (`re_...`).
6. Vercel → Environment Variables:
   - `RESEND_API_KEY` = `re_...` (a key)
   - `RESEND_FROM_EMAIL` = `ProntuVet <noreply@prontuvet.com>`
7. Redeploy.

**Atenção com o MX do Resend vs Email Routing:** o Resend pode pedir um MX pra
**recebimento** — **pula esse**, porque o MX já está sendo usado pelo Cloudflare
Email Routing. Só adiciona os TXT (SPF/DKIM/DMARC).

**Verificação:** criar um endpoint temporário de teste ou um botão admin que
dispara um e-mail pro `romerosaraiva4@gmail.com` via Resend. Confirmar que
chega com remetente correto e sem cair em spam.

---

## 5. (Opcional) Redirect `prontuvet.com` → `app.prontuvet.com`

**Por quê:** hoje se alguém digitar `prontuvet.com` na barra, vai dar erro (raiz
sem nada). Até a landing de marketing existir, redirect é a solução rápida.

**Como (via Cloudflare Page Rules):**
1. Cloudflare → **prontuvet.com** → **Rules** → **Redirect Rules** → **Create rule**
2. **When incoming requests match:** `Hostname equals prontuvet.com`
3. **Then:** `Static redirect` → `https://app.prontuvet.com` → `301 Permanent`
4. Salvar.

Alternativa: adicionar `prontuvet.com` na Vercel e configurar como redirect pra
`app.prontuvet.com` (botão "Redirect to" na UI da Vercel).

---

## 6. (Opcional, BR) Registrar `useprontuvet.com.br` no Registro.br

**Por quê:** capturar buscas orgânicas que terminam em `.com.br` (público BR
muitas vezes procura assim). Aponta via redirect pra `app.prontuvet.com`.

**Como:**
1. https://registro.br → login com CPF/CNPJ → pesquisar `useprontuvet.com.br`
2. Registrar — R$ 40/ano.
3. Após registro, delegar nameservers pro Cloudflare (2 NS que o Cloudflare dá)
   **OU** configurar redirect no painel do Registro.br direto.
4. Se delegar pro Cloudflare: criar Redirect Rule (`hostname equals useprontuvet.com.br`
   → `https://app.prontuvet.com`).

Gasto opcional (R$ 40/ano). Pula se o orçamento tá apertado.

---

## Ordem recomendada de execução

1. `NEXT_PUBLIC_APP_URL` na Vercel + redeploy (5 min) ← prioridade
2. Atualizar `/privacidade` no código + commit (5 min)
3. Webhook Asaas (2 min)
4. Resend: verificar domínio + API key + env vars + redeploy (15 min)
5. Redirect raiz (opcional, 3 min)
6. `.com.br` backup (opcional, 10 min + R$ 40)

Total: ~30 min pra tudo o essencial (itens 1-4).
