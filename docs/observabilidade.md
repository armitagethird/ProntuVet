# Observabilidade — ProntuVet

Este documento explica o que é observabilidade, por que o sistema antigo de logs em
arquivo (`/api/logs` + `runtime-logs.json`) foi removido, e quais ferramentas de
mercado você pode adotar agora para monitorar erros, performance e comportamento do
produto em produção.

---

## Por que removemos o sistema antigo

O código anterior gravava logs em `runtime-logs.json` via `fs.writeFileSync` e
expunha `/api/logs` (GET/POST) sem autenticação. Três problemas graves:

1. **Não funciona no Vercel.** O filesystem é efêmero em serverless — cada request
   pode rodar em uma instância diferente, e arquivos não persistem entre invocações.
   Em produção você veria sempre um array vazio.
2. **Vazamento.** O endpoint aberto permitia a qualquer pessoa ler stack traces
   (que incluíam detalhes do Supabase, IDs de usuário, e erros de auth) e injetar
   logs arbitrários.
3. **Não escala.** Mesmo se migrássemos pra banco, o padrão "middleware grava log a
   cada erro" bate no banco em toda navegação — custa dinheiro, polui a tabela, e
   você não ganha ferramentas de busca/agregação.

A decisão foi: **remover o sistema caseiro e adotar um provedor externo especializado.**

---

## O que é observabilidade (3 pilares)

| Pilar | O que é | Exemplo no ProntuVet |
|---|---|---|
| **Logs** | Eventos estruturados: "usuário X fez Y" | Request chegou em `/api/lgpd/export`, retornou 200 em 450ms |
| **Métricas** | Contadores/gauges ao longo do tempo | P95 de latência do `/api/process-consultation`; nº de consultas/hora |
| **Erros** | Exceções capturadas com stack trace + contexto | `TypeError: Cannot read property 'id' of null` em `DashboardClient.tsx:42`, afetando 12 usuários |

Na prática, numa aplicação Next.js + Supabase hospedada na Vercel, você quase nunca
precisa dos 3 do zero. O stack recomendado abaixo cobre tudo.

---

## Stack recomendado (pragmático)

### 1. Vercel Logs — já vem de graça

Todo `console.log` / `console.error` do seu código (inclusive Edge Functions do
Supabase) é capturado pela plataforma. Acesso em:

- **Vercel:** `Project → Logs` (tem filtros por rota, status code, tempo).
- **Supabase:** `Project → Functions → asaas-webhook → Logs`.

**Serve para:** debugging ad-hoc, inspecionar um request específico, ver erros recentes.

**Não serve para:** agregar métricas ao longo de dias, alertar quando algo quebra,
buscar logs antigos (Vercel Hobby retém só 1h de logs; Pro retém 1 dia; Enterprise
30 dias).

### 2. Sentry — erros e performance (essencial)

**[sentry.io](https://sentry.io)** é o padrão de mercado para capturar erros em
aplicações JS/TS. Free tier: 5.000 erros/mês, 10k transações, 1 usuário — suficiente
para ProntuVet até ~1.000 usuários ativos.

**O que entrega:**
- Stack trace de toda exceção não tratada (server, client, edge).
- Source maps: o erro aponta pra sua linha em `.tsx`, não pro bundle minificado.
- Agrupa erros repetidos (*"esse erro aconteceu 47× nas últimas 24h"*).
- Breadcrumbs: mostra as últimas 50 ações do usuário antes do crash (navegação,
  fetches, clicks).
- Performance: P50/P75/P95 de cada rota automático.
- Integração com Slack/Discord para alertar em tempo real.
- Release tracking: conecta cada erro ao commit que o introduziu.

**Setup em 5 minutos:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

O wizard cria `sentry.client.config.ts`, `sentry.server.config.ts`,
`sentry.edge.config.ts`, ajusta `next.config.ts` e pede a DSN. Depois disso, todo
erro em qualquer lugar do Next.js (server, client, middleware, API route, Edge
Function) aparece no dashboard do Sentry automaticamente.

**Variáveis de ambiente:**
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@oxxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx     # (só para upload de source maps no build)
SENTRY_ORG=prontuvet
SENTRY_PROJECT=prontuvet-web
```

**Recomendação:** configure alertas para:
- Qualquer erro na rota `/api/assinatura/*` ou `/api/lgpd/*` (ações críticas).
- Taxa de erro >5% em qualquer rota em 5 minutos.
- Novo tipo de erro (first seen) em produção.

### 3. Axiom ou BetterStack — logs estruturados (opcional)

Se você precisar guardar logs por mais de 1 dia e fazer buscas tipo "todos os
requests de `user:xxx` na última semana", adote um *log aggregator*. Duas boas
escolhas:

| | Axiom | BetterStack (Logtail) |
|---|---|---|
| Free tier | 500 GB/mês ingestão | 1 GB/mês, 3 dias retenção |
| Preço pago | $25/mês para 1 TB | $25/mês para 30 GB |
| Query language | APL (similar SQL) | Live tail + filtros UI |
| Integração Vercel | Native (1 clique) | Via Vercel Log Drain |
| Ideal para | Análise histórica em volume | Uptime + logs simples |

**Recomendação:** para ProntuVet no estágio atual (<10k requests/dia), Vercel Logs +
Sentry é suficiente. Adote Axiom quando:
- Você quiser dashboards de uso (ex: "quantos vets processaram consulta por dia").
- Precisar investigar incidentes de >1 dia atrás.
- O volume de logs do Vercel começar a estourar.

### 4. Supabase Advisor + Logs

Dentro do Supabase Console você já tem:
- **Database → Logs** — consultas SQL lentas, deadlocks, erros de RLS.
- **Advisor → Security/Performance** — flags automáticas (ex: "tabela X sem RLS",
  "índice faltando em FK").
- **Storage → Logs** — uploads/downloads com tamanho e latência.

**Ação recomendada:** semanalmente passe pelo **Advisor** e resolva os warnings.

---

## O que NÃO fazer

- **Não grave logs em `runtime-logs.json` ou em qualquer arquivo local.** O Vercel
  apaga. Se precisa persistir, use Sentry/Axiom ou uma tabela Supabase (`audit_log`)
  escrita pelo service role.
- **Não exponha endpoints públicos de leitura de logs.** Foi o erro do sistema
  antigo. Logs contêm dados sensíveis (IDs, emails, stack traces com payload).
- **Não log de PII desnecessariamente.** CPFs, nomes de tutores, conteúdo de
  consultas — nunca devem aparecer em logs estruturados. Capture só IDs opacos e o
  necessário pra debugar.
- **Não use `console.log` em loops quentes.** Numa Edge Function que roda 1.000×/dia,
  cada log custa armazenamento. Log nível INFO só em pontos de decisão; DEBUG só em
  dev.

---

## Padrão de logging recomendado para o ProntuVet

Tendo o Sentry configurado, o padrão fica simples:

```ts
// Em qualquer arquivo server-side:
try {
    await algumaOperacaoCritica()
} catch (err) {
    // Sentry captura automaticamente via `captureException` (integração Next.js).
    // Em paralelo, console.error vai para o Vercel Logs.
    console.error('[contexto] operação falhou:', err)
    throw err // deixa o Next.js devolver 500 com o error boundary correto
}
```

Para eventos importantes de negócio que não são erros:

```ts
import * as Sentry from '@sentry/nextjs'

Sentry.captureMessage('Nova assinatura Clínica criada', {
    level: 'info',
    tags: { plano: 'clinica' },
    extra: { organizationId: org.id, userId: user.id },
})
```

---

## Checklist rápido para ativar

- [ ] Criar conta em sentry.io (gratuita, 5 min).
- [ ] Rodar `npx @sentry/wizard@latest -i nextjs` e seguir wizard.
- [ ] Adicionar `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` nos env vars da Vercel.
- [ ] Commitar os 3 `sentry.*.config.ts` gerados.
- [ ] Forçar um erro em prod (ex: visitar `/api/debug-force-error`) e confirmar que aparece no Sentry.
- [ ] Configurar alerta no Sentry para erros em `/api/assinatura/*` e `/api/lgpd/*`.
- [ ] (Opcional) Adicionar Axiom Log Drain na Vercel quando o produto tiver >100 usuários ativos.

---

## Referências

- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Axiom Vercel integration: https://axiom.co/docs/send-data/vercel
- Supabase Logs: https://supabase.com/docs/guides/platform/logs
- Vercel Log Drains: https://vercel.com/docs/observability/log-drains
