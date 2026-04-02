# Fluxo do Sistema

## Fluxo completo de uma consulta

```
Veterinário
    │
    ▼
[Dashboard] → Seleciona template → [/consultation/new]
    │
    ▼
[AudioRecorder] — MediaRecorder API
    - Captura áudio em chunks de 1s
    - Formato: WebM
    - Pausa/retomada disponível
    │
    ▼ (ao clicar em "Encerrar")
[POST /api/process-consultation]
    │
    ├── 1. Recebe: audio (File), templateContent (string), userId
    │
    ├── 2. OpenAI Whisper-1
    │       - Transcreve o áudio
    │       - Forçado em português ("pt")
    │       → resultado: transcription (string)
    │
    ├── 3. GPT-4o-mini
    │       - Input: transcrição + template + system prompt
    │       - Output: JSON estruturado com:
    │           • animalName, animalSpecies
    │           • tutorName
    │           • tutorSummary (linguagem simples)
    │           • vetSummary (técnico)
    │           • tags (até 5)
    │           • structuredRecord (segue template)
    │
    ├── 4. Supabase
    │       - Busca ou cria animal em `animals`
    │       - Salva consulta em `consultations`
    │
    └── 5. Retorna: { consultationId }
    │
    ▼
[Redirect → /consultation/:id]
    - Exibe prontuário estruturado
    - Mostra resumo tutor / resumo vet
    - Mostra tags
```

## Fluxo de autenticação

```
Usuário acessa qualquer página
    │
    ▼
[Middleware /src/lib/supabase/middleware.ts]
    - Verifica sessão Supabase
    - Redireciona para /login se não autenticado
    │
[/login] — Login ou Cadastro
    - Login: email + senha via Supabase Auth
    - Cadastro: nome, email, senha, data de nascimento, especialização
    │
    ▼
Supabase Auth cria usuário em auth.users
    + Trigger automático cria registro em public.profiles
    │
    ▼
[/api/auth/callback] — callback OAuth (se usar OAuth)
    │
    ▼
Redirect para /dashboard
```

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/process-consultation` | Pipeline principal: áudio → prontuário |
| GET | `/api/consultations/[id]` | Busca uma consulta por ID |
| PUT | `/api/consultations/[id]` | Atualiza uma consulta |
| GET | `/api/auth/callback` | Callback de autenticação OAuth |
