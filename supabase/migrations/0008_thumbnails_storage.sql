-- 0008 — Capas geradas pela ferramenta Thumbnail (lib/ai/run-thumbnail.ts).
-- Bucket privado: as imagens só são vistas por URL assinada (1 h) gerada no servidor.
-- O upload é feito pelo servidor com a service role; o usuário só pode ler a própria pasta ({user_id}/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', false, 5242880, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "thumbnails: ler a própria pasta" on storage.objects for select to authenticated
using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = (select auth.uid())::text);
