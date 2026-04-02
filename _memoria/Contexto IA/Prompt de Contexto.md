# Prompt de Contexto para IA

Cole este texto no início de uma nova conversa com IA para restaurar o contexto completo do projeto.

---

```
Projeto: ProntuVet

Um SaaS de copiloto clínico com IA para veterinários. Grava a consulta em áudio, 
transcreve com OpenAI Whisper e estrutura um prontuário completo com GPT-4o-mini.

## Stack
- Next.js 16.1.6 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui + Framer Motion
- Supabase (PostgreSQL + Auth + RLS)
- OpenAI: Whisper-1 (transcrição) + GPT-4o-mini (estruturação)
- Deploy: Vercel

## Banco de dados (Supabase/PostgreSQL)
- consultations: prontuários (id, user_id, animal_id, transcription, structured_content jsonb, 
  tutor_summary, vet_summary, tags[], manual_notes, title, mode, created_at)
- animals: pacientes (id, user_id, name, species, breed)
- consultation_templates: templates customizáveis (id, user_id, is_system_default, name, content)
- profiles: perfil do vet (id, first_name, last_name, birth_date, specialization)

## Estrutura principal de arquivos
src/
├── app/
│   ├── api/process-consultation/route.ts  ← pipeline: áudio → Whisper → GPT → Supabase
│   ├── api/consultations/[id]/route.ts    ← GET/PUT de consulta
│   ├── api/auth/callback/route.ts         ← OAuth callback
│   ├── consultation/new/page.tsx           ← tela de gravação
│   ├── consultation/[id]/page.tsx          ← resultado
│   ├── dashboard/page.tsx                  ← dashboard principal
│   ├── history/page.tsx                    ← histórico
│   ├── login/page.tsx                      ← auth
│   └── templates/                          ← CRUD de templates
├── components/
│   ├── audio-recorder.tsx                  ← MediaRecorder API, chunks de 1s, formato WebM
│   ├── consultation-result.tsx
│   └── history-list.tsx
└── lib/supabase/                           ← client.ts, server.ts, middleware.ts

## Fluxo principal
1. Veterinário grava consulta em /consultation/new
2. POST /api/process-consultation com: áudio (WebM), templateContent, userId
3. Whisper transcreve → GPT estrutura como JSON (animalName, tutorSummary, vetSummary, tags, structuredRecord)
4. Supabase salva animal + consulta
5. Redirect para /consultation/:id

## Detalhes técnicos
- Timeout da API: 300s (5 minutos)
- Transcrição forçada em PT-BR
- Alias TypeScript: @/* → ./src/*
- Middleware de auth em src/lib/supabase/middleware.ts aplicado via proxy.ts
- RLS ativo em todas as tabelas
- Perfil criado via trigger PostgreSQL no cadastro

## Estado atual
Funcionalidades principais implementadas. Próximos passos: monetização, planos, 
multi-clínica, app mobile.
```

---

## Como usar

1. Copie o bloco acima
2. Cole no início de uma nova conversa com a IA
3. A IA terá contexto suficiente para continuar o trabalho sem precisar explorar o projeto do zero

## Quando atualizar este prompt

- Ao adicionar novas tabelas ao banco
- Ao criar novos endpoints ou páginas importantes
- Ao mudar o tech stack
- Ao tomar decisões técnicas relevantes
