# Banco de Dados

Banco: **PostgreSQL via Supabase** com Row Level Security (RLS) ativo em todas as tabelas.

---

## Tabelas

### `consultations` — Prontuários

Tabela principal. Cada linha é uma consulta veterinária.

```sql
CREATE TABLE public.consultations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id         uuid REFERENCES animals(id),   -- adicionado depois
  mode              text,                           -- 'human' ou 'vet'
  title             text,
  audio_url         text,
  transcription     text,
  structured_content jsonb,                         -- prontuário estruturado pela IA
  tutor_name        text,
  tutor_summary     text,                           -- resumo em linguagem simples
  vet_summary       text,                           -- resumo técnico
  manual_notes      text,
  tags              text[],                         -- array de tags
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
```

### `animals` — Animais/Pacientes

```sql
CREATE TABLE public.animals (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name      text,
  species   text,
  breed     text
);
```

### `consultation_templates` — Templates de Prontuário

```sql
CREATE TABLE public.consultation_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_system_default boolean DEFAULT false,
  name              text,
  content           text,   -- estrutura do template em texto
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
```

Templates com `is_system_default = true` são disponíveis para todos os usuários.

### `profiles` — Perfil do Veterinário

```sql
CREATE TABLE public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      text,
  last_name       text,
  birth_date      date,
  specialization  text,
  updated_at      timestamptz DEFAULT now()
);
```

Perfil criado automaticamente via **trigger** quando um usuário se cadastra.

---

## Row Level Security

Todas as tabelas têm RLS ativo. Política padrão:
- Usuário só pode ver/editar seus próprios registros (`user_id = auth.uid()`)

---

## Scripts SQL

Rodar nesta ordem no Supabase SQL Editor:

1. `database_schema.sql` — cria `consultations`
2. `supabase_add_features.sql` — cria `animals`, adiciona colunas em `consultations`
3. `setup_templates.sql` — cria `consultation_templates`
4. `user_profiles.sql` — cria `profiles` + trigger
