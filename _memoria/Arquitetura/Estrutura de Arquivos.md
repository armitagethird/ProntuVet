# Estrutura de Arquivos

## Raiz do projeto

```
vet ia/
├── _memoria/              ← Este vault Obsidian
├── src/                   ← Todo o código fonte
├── public/                ← Assets estáticos (logo, imagens, animações)
├── Assets/                ← Assets de marca (ícone do app)
├── .next/                 ← Build do Next.js (ignorado no git)
├── node_modules/          ← Dependências (ignorado no git)
├── package.json
├── tsconfig.json
├── next.config.ts
├── components.json        ← Config shadcn/ui
└── .env.local             ← Variáveis de ambiente (ignorado no git)
```

## src/app/ — Páginas e API

```
src/app/
├── api/
│   ├── consultations/[id]/route.ts     ← GET e PUT de uma consulta específica
│   ├── process-consultation/route.ts   ← ⭐ Pipeline principal: áudio → prontuário
│   └── auth/callback/route.ts          ← Callback do OAuth do Supabase
├── consultation/
│   ├── new/page.tsx                    ← Tela de nova consulta (gravação)
│   └── [id]/page.tsx                   ← Tela de resultado da consulta
├── dashboard/page.tsx                  ← Dashboard principal
├── history/page.tsx                    ← Histórico de consultas
├── login/page.tsx                      ← Login e cadastro
├── templates/
│   ├── new/page.tsx                    ← Criar template customizado
│   └── [id]/edit/page.tsx              ← Editar template
├── layout.tsx                          ← Layout raiz
├── page.tsx                            ← Redireciona para /dashboard
└── globals.css                         ← Estilos globais + Tailwind
```

## src/components/ — Componentes

```
src/components/
├── audio-recorder.tsx          ← ⭐ Gravação de áudio (MediaRecorder API)
├── consultation-result.tsx     ← Exibe prontuário estruturado
├── history-list.tsx            ← Lista de consultas passadas
├── pets-loader.tsx             ← Loader de animais
├── auth/
│   └── signup-form.tsx         ← Formulário de cadastro
└── ui/                         ← Componentes shadcn/ui (button, card, dialog...)
```

## src/lib/ — Utilitários e configuração

```
src/lib/
├── supabase/
│   ├── client.ts       ← Cliente Supabase para o browser
│   ├── server.ts       ← Cliente Supabase para o servidor
│   └── middleware.ts   ← Middleware de autenticação
└── utils.ts            ← Funções utilitárias
```

## Arquivos SQL de setup do banco

```
database_schema.sql         ← Tabela principal consultations
supabase_add_features.sql   ← Tabela animals + colunas extras em consultations
setup_templates.sql         ← Tabela consultation_templates
user_profiles.sql           ← Tabela profiles + trigger de criação automática
```
