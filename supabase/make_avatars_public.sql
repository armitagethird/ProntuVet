-- ========================================================
-- MAKE AVATARS PUBLIC - ProntuVet SP v5
-- Torna o bucket de avatares público para leitura (necessário para exibição)
-- Mantém segurança total para inserção e deleção
-- ========================================================

-- 1. Torna o bucket público nas configurações do Supabase Storage
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- 2. Garante que qualquer pessoa possa ver os avatares (SELECT Público)
DROP POLICY IF EXISTS "Avatar Select" ON storage.objects;
CREATE POLICY "Avatar Select" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Mantém a proteção de quem pode subir ou apagar fotos (Apenas o Dono)
-- Esta regra já existe no fix_storage_rls.sql, mas estamos reforçando aqui
DROP POLICY IF EXISTS "Avatar Manage" ON storage.objects;
CREATE POLICY "Avatar Manage" ON storage.objects 
FOR ALL TO authenticated 
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
