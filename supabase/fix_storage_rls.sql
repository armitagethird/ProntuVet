-- ========================================================
-- FIX STORAGE RLS - ProntuVet SP v4
-- Remove conflitos de metadados e reforça pastas de usuário
-- ========================================================

-- LIMPEZA GERAL (Avatars)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar view" ON storage.objects;

-- POLÍTICAS PARA 'avatars'
-- 1. INSERT: Permite criar o arquivo se estiver na pasta certa
CREATE POLICY "Avatar Insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. SELECT: Permite que o usuário veja a própria foto e outros usuários autenticados também (padrão de rede social)
CREATE POLICY "Avatar Select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

-- 3. UPDATE/DELETE: Permite que o usuário gerencie seus próprios arquivos
CREATE POLICY "Avatar Manage" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);


-- LIMPEZA GERAL (Medical Attachments)
DROP POLICY IF EXISTS "Users can upload medical files to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Medical Select" ON storage.objects;

-- POLÍTICAS PARA 'medical-attachments'
-- 1. INSERT/ALL: Acesso total apenas à sua própria pasta
CREATE POLICY "Medical Manage All" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'medical-attachments' AND 
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'medical-attachments' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
