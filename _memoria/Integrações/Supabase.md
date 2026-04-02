# Integração Supabase

## O que o Supabase gerencia

- **Autenticação**: Email/senha + OAuth (configurado via Supabase Auth)
- **Banco de dados**: PostgreSQL com Row Level Security
- **Sessões**: Gerenciadas automaticamente via `@supabase/ssr`

## Clientes

### Browser (`src/lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

### Servidor (`src/lib/supabase/server.ts`)

Usa `createServerClient` com cookies do Next.js para manter sessão server-side.

## Middleware de autenticação (`src/lib/supabase/middleware.ts`)

- Intercepta todas as requisições
- Atualiza a sessão do usuário em cada request
- Aplicado via `src/proxy.ts` (matcher de rotas)

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## Row Level Security (RLS)

Todas as tabelas têm RLS ativo. Queries sem autenticação retornam zero resultados. Isso garante que cada veterinário vê apenas seus próprios dados.

## Trigger de criação de perfil

Quando um usuário se cadastra em `auth.users`, um trigger PostgreSQL cria automaticamente um registro em `public.profiles` com os dados básicos.

## Deploy

O Supabase fica em nuvem (Supabase Cloud). O projeto Next.js no Vercel se conecta ao Supabase via variáveis de ambiente.
