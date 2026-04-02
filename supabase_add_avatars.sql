-- SQL para criar o Storage Bucket "avatars" para guardar as fotos de perfil
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict(id) do nothing;

create policy "Permitir leitura pública de avatares" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Usuários autenticados podem subir avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' AND auth.role() = 'authenticated');

create policy "Usuários podem atualizar seus próprios avatares" on storage.objects
  for update using (bucket_id = 'avatars' AND auth.uid() = owner);
