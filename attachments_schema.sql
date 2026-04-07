-- Tabela para armazenar os metadados dos anexos clínicos
CREATE TABLE IF NOT EXISTS public.anexos_consulta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id uuid REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  tipo TEXT CHECK (tipo IN ('imagem', 'exame')) NOT NULL,
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.anexos_consulta ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Usuários podem ver apenas seus próprios anexos." ON public.anexos_consulta
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios anexos." ON public.anexos_consulta
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios anexos." ON public.anexos_consulta
  FOR DELETE USING (auth.uid() = user_id);

-- Notas para o Storage (Buckets)
-- Criar manualmente o bucket 'medical-attachments' no painel do Supabase como PRIVADO.
-- Definir políticas para o bucket:
-- SELECT: auth.uid()::text = (storage.foldername(name))[1]
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- DELETE: auth.uid()::text = (storage.foldername(name))[1]
