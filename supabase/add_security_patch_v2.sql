-- ==========================================
-- SECURITY PATCH V2 - ProntuVet
-- Instruções: Execute este script no SQL Editor do Supabase.
-- ==========================================

-- 1. Políticas faltantes para a tabela anexos_consulta
CREATE POLICY "Usuários podem atualizar seus próprios anexos." ON public.anexos_consulta
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Políticas faltantes para a tabela profiles
CREATE POLICY "Usuários podem deletar seu próprio perfil." ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 3. Melhoria nas políticas do bucket medical-attachments
-- Adicionando UPDATE (correção do reupload/upsert)
CREATE POLICY "Users can update medical files in their folder" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'medical-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Ajuste no bucket avatars (agora que está privado)
-- Garante que apenas o dono veja seu próprio avatar se o bucket não for público
CREATE POLICY "Users can view their own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Garante que o usuário só suba avatar para sua própria pasta
-- (Isso previne que um usuário logado delete ou sobrescreva fotos de outros)
DROP POLICY IF EXISTS "Usuários autenticados podem subir avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
