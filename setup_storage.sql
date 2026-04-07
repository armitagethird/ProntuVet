-- Step 1: Create the bucket 'medical-attachments' manually in the Supabase Dashboard
-- (Go to Storage -> New Bucket -> name it 'medical-attachments')

-- Step 2: Run this SQL to set up security (RLS)
-- This allows each user to only manage their own files

-- 1. Policy for SELECT (View files)
-- Authenticated users can see files if they are in their own {user_id} folder
CREATE POLICY "Users can view their own medical files" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id = 'medical-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Policy for INSERT (Upload files)
-- Authenticated users can upload if the destination is their own {user_id} folder
CREATE POLICY "Users can upload medical files to their folder" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'medical-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy for DELETE (Remove files)
-- Authenticated users can delete files in their own {user_id} folder
CREATE POLICY "Users can delete their own medical files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'medical-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
