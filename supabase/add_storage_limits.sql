-- ==========================================
-- REFORÇO DE LIMITES DE STORAGE - ProntuVet
-- Instruções: Execute este script no SQL Editor do Supabase.
-- ==========================================

-- 1. Limite para o bucket de AVATARES (Máximo 5MB)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  (metadata->>'size')::int <= 5242880 -- 5MB
);

-- 2. Limite para o bucket MEDICAL-ATTACHMENTS (Máximo 20MB)
DROP POLICY IF EXISTS "Users can upload medical files to their folder" ON storage.objects;
CREATE POLICY "Users can upload medical files to their folder" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'medical-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  (metadata->>'size')::int <= 20971520 -- 20MB
);
