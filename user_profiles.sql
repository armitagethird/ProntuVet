-- 1. Criar a tabela de perfis (profiles)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  specialization TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 2. Ativar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Políticas para o usuário ver/editar apenas o próprio perfil)
CREATE POLICY "Usuários podem ver seu próprio perfil." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Função para criar o perfil automaticamente ao cadastrar um novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, birth_date, specialization)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (NEW.raw_user_meta_data->>'birth_date')::DATE,
    NEW.raw_user_meta_data->>'specialization'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger que dispara a função após a inserção na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
