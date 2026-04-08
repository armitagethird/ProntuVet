-- Supabase SQL Schema para ClinicScribe AI MVP

-- Tabela de consultas
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  mode text not null check (mode in ('human', 'vet')),
  title text,
  audio_url text, -- opcional caso queiramos salvar o audio no futuro
  transcription text,
  structured_content jsonb, -- o resultado gerado pela IA estruturado
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS (Row Level Security)
alter table public.consultations enable row level security;

-- Criar políticas de segurança para que o usuário só veja/edite suas próprias consultas
create policy "Users can view their own consultations."
  on public.consultations for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own consultations."
  on public.consultations for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own consultations."
  on public.consultations for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own consultations."
  on public.consultations for delete
  using ( auth.uid() = user_id );

-- Função para atualizar updated_at automaticamente
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on public.consultations
  for each row execute procedure moddatetime (updated_at);
