-- Script SQL para criar tabela de modelos de prontuário
-- Execute isso no Supabase SQL Editor

CREATE TABLE public.consultation_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), -- se for nulo, é um template de sistema/padrão
  is_system_default boolean default false,
  name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS
ALTER TABLE public.consultation_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Todos podem ler templates padões do sistema E os seus próprios
CREATE POLICY "Users can view their own and system templates"
  ON public.consultation_templates FOR SELECT
  USING ( is_system_default = true OR auth.uid() = user_id );

-- Usuários só podem inserir modelos para si mesmos (não podem criar de sistema livremente)
CREATE POLICY "Users can insert their own templates"
  ON public.consultation_templates FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own templates"
  ON public.consultation_templates FOR UPDATE
  USING ( auth.uid() = user_id AND is_system_default = false );

CREATE POLICY "Users can delete their own templates"
  ON public.consultation_templates FOR DELETE
  USING ( auth.uid() = user_id AND is_system_default = false );

-- Trigger de atualização de tempo (se a extension já existe no banco originário)
CREATE TRIGGER handle_updated_at_templates BEFORE UPDATE ON public.consultation_templates
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
