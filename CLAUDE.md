# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**ProntuVet** — SaaS veterinary records platform. Vets record consultations by audio; AI transcribes and structures the clinical record. Deployed on Vercel; backend on Supabase (PostgreSQL + Auth + Edge Functions).

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # ESLint
```

No test suite. Lint is the only automated check.

To deploy Supabase Edge Functions:
```bash
supabase functions deploy process-consultation
supabase functions deploy asaas-webhook
```

To apply a new migration:
```bash
supabase db push
# or paste the .sql file in the Supabase SQL Editor (project: wfiolpylleatfxiznxmc, São Paulo)
```

## Architecture

### Request flow for a consultation

1. **`/consultation/new`** — vet selects a template, records audio via `MediaRecorder` (WebM, chunks every 1s).
2. On "Encerrar" the audio blob is posted to the **Supabase Edge Function `process-consultation`**.
3. Edge Function pipeline:
   - Authenticates via direct fetch to `auth/v1/user` (workaround for ES256 JWT bug in Edge runtime).
   - Checks plan limits from `uso_consultas` table (monthly / daily / hourly counters, Brasília UTC-3).
   - Sends audio inline (base64) to **Gemini 2.5 Flash Lite** with a strict JSON schema — returns structured record, summaries, tags, and an anti-hallucination validity flag.
   - Upserts animal in `animals`, inserts consultation in `consultations`, logs usage in `uso_consultas`.
4. Frontend receives `consultationId` and redirects to **`/consultation/[id]`**.

### Subscription / billing flow

- Plans: `free`, `essential`, `platinum`, `clinica` — stored in `profiles.plano`.
- `/assinatura` page handles checkout for `essential` and `platinum` (Asaas payment gateway). The `clinica` plan currently goes to WhatsApp.
- **`POST /api/assinatura/checkout`** (Next.js API Route) calls `src/lib/asaas.ts` → creates a recurring Asaas checkout session and saves `checkoutSession → userId + plano` to `asaas_checkout_sessions`.
- **`supabase/functions/asaas-webhook`** receives Asaas events, resolves the user (via checkout session, then externalReference fallback), and updates `profiles.plano / status / data_vencimento`.
- Idempotency: processed payment IDs are stored in `asaas_processed_events`.

### ProntuLink

- Each consultation has a UUID `tutor_token` (30-day TTL).
- **`/acompanhe/[token]`** is a public page (no auth) that fetches the consultation via a Supabase RLS policy allowing `anon` reads when the token is valid and not expired.
- ProntuLink is a Platinum+ feature.

### Key database tables

| Table | Purpose |
|---|---|
| `profiles` | Vet profile + `plano`, `status`, billing fields, `asaas_subscription_id` |
| `consultations` | Every record; `structured_content` (jsonb), `tutor_token`, `resumo_trilha` |
| `animals` | Patients, linked to `user_id` |
| `consultation_templates` | Custom or system-default templates (`is_system_default = true` is global) |
| `uso_consultas` | Per-consultation usage log — used for rate limiting and cost tracking |
| `asaas_checkout_sessions` | Maps `checkout_session_id → user_id + plano` |
| `asaas_processed_events` | Idempotency log for webhook events |

All tables have RLS active. Every user query is scoped to `user_id = auth.uid()`.

### Supabase clients

- **`src/lib/supabase/server.ts`** — server-side (RSC, API Routes), uses `@supabase/ssr` with cookies.
- **`src/lib/supabase/client.ts`** — client-side (browser).
- **`src/lib/supabase/public-client.ts`** — anon-only client for ProntuLink (no auth cookie).
- **`src/lib/env-raw.ts`** — reads `.env.local` directly without Next.js dotenv-expand, because the Asaas API key starts with `$` which dotenv-expand breaks. Always use `getRawEnvVar()` for `ASAAS_API_KEY` and `ASAAS_BASE_URL`.

### Page / component pattern

Pages in `src/app/` follow Next.js App Router conventions:
- Server Components (`page.tsx`) fetch data and pass it as props or streamed promises.
- Client Components (`*Client.tsx`) handle interactivity and receive data via props.
- Example: `dashboard/page.tsx` streams `templatesPromise` as an unresolved Promise to `DashboardClient.tsx`, which resolves it with `use()` inside a Suspense boundary.

### Plan limits enforcement

Limits are enforced in the Edge Function (`process-consultation`), not on the client:

| Plan | Monthly | Daily | Hourly |
|---|---|---|---|
| free | 20 | 15 | 5 |
| essential | 80 | 20 | 15 |
| platinum | 200 | 20 | 25 |
| clinica | 600 | 60 | 40 |

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
ASAAS_API_KEY          # use getRawEnvVar(), never process.env directly
ASAAS_BASE_URL         # sandbox: https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN    # header token Asaas sends on webhooks
```

Edge Functions read these from Supabase secrets (not `.env.local`).

## Important decisions

- **Gemini 2.5 Flash Lite** replaced OpenAI Whisper + GPT-4o-mini for the consultation pipeline — audio is sent inline (base64), not via a separate transcription step.
- **`getRawEnvVar`** exists because Next.js dotenv-expand interprets `$` in values as variable references, corrupting the Asaas API key.
- Middleware lives in `src/lib/supabase/middleware.ts` (not the root `middleware.ts`) for Next.js 14 compatibility.
- The Edge Function authenticates via a direct HTTP fetch to `auth/v1/user` instead of `supabase.auth.getUser()` due to an ES256 JWT verification bug in the Deno Edge runtime.
- Migrations in `supabase/migrations/` use date-prefixed filenames (e.g., `20260420_...sql`). The legacy `supabase/*.sql` files at the root are historical setup scripts, not migrations.
- **No free trial** — the product positioning is "Free forever, 20 consultas/mês". The `trial_ate` column mentioned in `docs/assinaturas/asaas-integracao-prontuvet.md` was never implemented and is intentionally not present. If a trial is added later, marketing copy must be updated in tandem.
- **Multi-tenant Clínica** — the Clínica plan uses `organizations` + `organization_members`. Each vet still owns their consultations (`consultations.user_id`), but members of the same org can READ each other's prontuários (RLS policy `org members read colleagues consultations`). Edit/delete remain per-vet. Limits are aggregated across all members of the org. Subscription is billed to the organization (externalReference prefixed with `org:` in Asaas).
