# Tech Stack

## Frontend

| Tech | Versão | Uso |
|------|--------|-----|
| Next.js | 16.1.6 | Framework full-stack (App Router) |
| React | 19.2.3 | UI |
| TypeScript | 5 | Tipagem |
| Tailwind CSS | 4 | Estilização |
| shadcn/ui | latest | Componentes base |
| Lucide React | latest | Ícones |
| Framer Motion | 12.35.1 | Animações |
| next-themes | latest | Dark/light mode |
| Sonner | latest | Toast notifications |

## Backend / Serviços

| Tech | Uso |
|------|-----|
| Supabase | Banco PostgreSQL + Auth + Row Level Security |
| OpenAI Whisper-1 | Transcrição de áudio → texto (PT-BR) |
| GPT-4o-mini | Estruturação do prontuário (texto → JSON) |
| Vercel | Deploy e hospedagem |
| Vercel Speed Insights | Monitoramento de performance |

## Variáveis de ambiente necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

## Comandos principais

```bash
npm run dev      # desenvolvimento local
npm run build    # build de produção
npm run start    # rodar build
npm run lint     # lint
```

## Configurações especiais

- `tsconfig.json`: alias `@/*` → `./src/*`
- Timeout da API: 5 minutos (arquivos de áudio grandes)
- Áudio gravado em formato **WebM**
- Chunks capturados a cada **1 segundo**
- Transcrição forçada em **português** (`language: "pt"`)
