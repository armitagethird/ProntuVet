# Domínios — ProntuVet

Documento de decisão sobre o domínio a registrar para o produto. A marca é
**ProntuVet** (decisão final). Este arquivo documenta opções de TLD, estratégia
de subdomínios e plano de e-mail transacional.

---

## Situação atual

- `prontuvet.com.br` → **indisponível** (Registro.br, consultado em 2026-04-23).
- `prontuvet.com` → a verificar (ver seção "Como decidir" abaixo).

O resto do documento assume que mantemos a marca **ProntuVet** e só variamos TLD
ou adicionamos prefixo.

---

## Estratégia: 1 domínio raiz, subdomínios para tudo

Nunca compre múltiplos domínios separados pro mesmo produto (ex: `prontuvet.com`
pra site + `prontuvet.app` pro app). DNS múltiplo é inferno operacional.

Padrão da indústria (Linear, Notion, Figma):

| Subdomínio | Uso | Técnico |
|---|---|---|
| `prontuvet.XX` (raiz) | Landing / site de apresentação | Vercel (Next.js marketing) |
| `app.prontuvet.XX` | O aplicativo (este repo) | Vercel (app Next.js) |
| `docs.prontuvet.XX` | Documentação pública (futuro) | Notion/Mintlify |
| `status.prontuvet.XX` | Status page (futuro) | BetterStack/Instatus |
| `@prontuvet.XX` | E-mails (domínio, não subdomínio) | Resend + alias → gmail |

Subdomínios são **grátis** (só DNS). Tudo sob a mesma raiz = SEO consolidado,
um único certificado SSL, uma única política de cookies.

---

## Opções de TLD (ordem de preferência)

### 1. `prontuvet.app` ★ recomendado

- **Preço:** ~US$ 18/ano (Google Domains → Squarespace, Porkbun, Cloudflare).
- **Pros:** curto, moderno, TLD gerenciado pelo Google com HTTPS **obrigatório**
  (HSTS preload por padrão — ganho de segurança real), associação imediata com
  "aplicativo" (o que o produto é).
- **Contras:** menos familiar ao público brasileiro leigo que `.com.br`.
  Requer educação do usuário em material de marketing.
- **Combinação ideal:** `prontuvet.app` como principal + `useprontuvet.com.br`
  como redirect secundário (opcional, pra capturar busca por ".com.br").

### 2. `useprontuvet.com.br`

- **Preço:** R$ 40/ano (Registro.br — exige CPF ou CNPJ).
- **Pros:** mantém `.com.br` (público BR prefere), padrão SaaS moderno (ex:
  usemotion.com, useautumn.com, usecheckt.com). Sinaliza "produto brasileiro".
- **Contras:** "use" antes do nome estraga o impacto da marca; fica mais longo
  pra digitar e pra ditar por telefone ("uso, prontu, vet").

### 3. `prontuvet.co`

- **Preço:** ~US$ 30/ano.
- **Pros:** curto, aceito internacionalmente, sem "use" na frente.
- **Contras:** ainda confunde usuário leigo ("é .co ou .com?"). Menos valor
  pra SEO local BR que `.com.br`.

### 4. `prontuvet.vet`

- **Preço:** ~US$ 40/ano.
- **Pros:** TLD de nicho veterinário — forte reforço de contexto ("ah, é de
  vet"). Um dos poucos TLDs temáticos realmente bem posicionados.
- **Contras:** mais caro, menos conhecido. Excelente como domínio secundário
  (redirect pro principal), não tão bom como primário.

### 5. `meuprontuvet.com.br` / `oprontuvet.com.br`

- **Preço:** R$ 40/ano.
- **Pros:** tom brasileiro pessoal, disponível (provavelmente).
- **Contras:** soa infantilizado. Difícil de comunicar como marca séria.

### 6. `prontuvetapp.com.br`

- **Preço:** R$ 40/ano.
- **Pros:** mantém `.com.br`, explicita que é aplicativo.
- **Contras:** redundante ("app" no domínio + "app.prontuvet.XX" é repetitivo).

### Evitar

- `prontu-vet.com.br` — hífen é ruim pra SEO e pra ditar.
- `prontuvet.net` — `.net` ficou datado desde ~2010.
- `prontuvet.com.br.xxx` — TLDs esotéricos (`.vip`, `.online`, `.store`) soam amadores.
- `prontuvetbr.com` — `br` no nome não agrega (`.com.br` já sinaliza).

---

## Recomendação final

**Registrar `prontuvet.app` como principal.**

Opcionalmente, registrar **`useprontuvet.com.br`** (R$ 40/ano) como redirect
automático pro `.app`. Gasto anual total: ~R$ 140 (US$ 18 + R$ 40).

Se o `prontuvet.com` estiver disponível (checar!), é um bom *terceiro* domínio
pra reservar e redirecionar — mas só se valer o custo adicional (~US$ 10/ano).

---

## Como decidir

1. Abrir em abas:
   - https://registro.br/dominio/pesquisa/ → conferir `useprontuvet.com.br`
   - https://porkbun.com/ ou https://www.namecheap.com → conferir `prontuvet.app`,
     `prontuvet.vet`, `prontuvet.co`, `prontuvet.com`
2. Verificar marca no INPI: https://busca.inpi.gov.br/pePI/
   - Buscar "prontuvet" nas classes de software (NCL 09) e saúde/veterinária (NCL 44).
   - Se alguém já registrou a marca nas classes relevantes, existe risco
     jurídico — nesse caso, considerar adicionar sufixo ("ProntuVet Pro",
     "ProntuVet+") ou variar a marca.
3. Conferir no Google: `"prontuvet"` — existe site ativo usando esse nome? Rede
     social com a marca registrada?

---

## Plano de e-mail (`@prontuvet.XX`)

Uma vez que o domínio esteja registrado, configurar quatro endereços
institucionais via **Resend** (transacional) + **Cloudflare Email Routing**
(forwarding gratuito para a caixa pessoal):

| Endereço | Finalidade |
|---|---|
| `contato@prontuvet.XX` | Inbox público (você lê e responde) |
| `suporte@prontuvet.XX` | Atendimento; pode ser o mesmo destino de `contato` no começo |
| `privacidade@prontuvet.XX` | **Obrigatório pela LGPD** — encarregado de proteção de dados (DPO). Já referenciado na `/privacidade` |
| `noreply@prontuvet.XX` | Remetente de transacionais (convites da Clínica, reset de senha custom, confirmações de LGPD) |

**Destino prático no começo:** todos os três primeiros encaminham pro
`prontuvet.social@gmail.com` via **Cloudflare Email Routing** (grátis). Só o
`noreply` precisa de mailbox real, fornecido pelo Resend.

**Quando migrar pra Google Workspace:** quando tiver >50 e-mails/dia entrando
ou quiser compartilhar caixa (`contato@` visível pra 2+ pessoas). Custo: US$ 6
/usuário/mês.

---

## Configuração na Vercel (sem comprar lá)

O produto é deployed na Vercel mas **o domínio pode ser comprado em qualquer
registrador**. Fluxo padrão:

1. Comprar o domínio no registrador escolhido (Registro.br, Porkbun, Cloudflare).
2. **Na Vercel:** Project → Settings → Domains → Add Domain → `prontuvet.app` e
   `app.prontuvet.app`.
3. Vercel mostra os registros DNS a criar (tipicamente um `A` e um `CNAME`).
4. **No registrador ou no Cloudflare (se delegar nameservers):** criar os
   registros DNS conforme instruído.
5. Aguardar propagação (5-60 min). Vercel emite certificado Let's Encrypt
   automaticamente.

### Fluxo recomendado com Cloudflare no meio

- Registrar domínio no **Registro.br** (.com.br) ou **Porkbun** (.app)
- Delegar os nameservers pro **Cloudflare** (grátis; painel superior)
- No Cloudflare DNS, apontar:
  - `@` (raiz) → IP da Vercel (proxy desligado)
  - `app` → `cname.vercel-dns.com` (CNAME, proxy desligado)
  - MX records do Resend/Cloudflare Email Routing
- Vantagens: DNS muito mais rápido que Registro.br, Email Routing grátis,
  relatório analytics grátis, proteção DDoS básica.

---

## Checklist de registro

Quando decidir o domínio final:

- [ ] Comprar no registrador escolhido
- [ ] Delegar nameservers pro Cloudflare (opcional mas recomendado)
- [ ] Adicionar domínio raiz + `app.` na Vercel
- [ ] Verificar DNS propagou (`dig prontuvet.app` ou https://dnschecker.org)
- [ ] Verificar domínio no Resend (3 registros: SPF, DKIM, MX opcional)
- [ ] Configurar `contato@`, `suporte@`, `privacidade@` no Cloudflare Email Routing
- [ ] Atualizar `/privacidade` (trocar `prontuvet.social@gmail.com` por `privacidade@prontuvet.XX`)
- [ ] Atualizar `/termos` se citar domínio
- [ ] Atualizar variável `NEXT_PUBLIC_APP_URL` na Vercel
- [ ] Configurar redirect `prontuvet.XX` → `app.prontuvet.XX` (ou landing) na Vercel
- [ ] Adicionar `RESEND_API_KEY` e `RESEND_FROM_EMAIL` nas env vars da Vercel

---

## Observação sobre `prontuvet.com.br` bloqueado

O domínio está registrado mas pode não estar em uso. Duas ações opcionais:

1. Consultar o whois: https://registro.br/tecnologia/ferramentas/whois/?search=prontuvet.com.br
2. Se o site for inativo e o dono tiver e-mail público, negociar compra direta.
   Valor de mercado pra domínios "squattados" inativos: R$ 500-5.000.

Se o dono é uma empresa ativa usando a marca, **não insistir** — risco de
conflito de marca registrada (mesmo comprando o domínio). Neste caso, a
recomendação é firmar em `prontuvet.app`.
