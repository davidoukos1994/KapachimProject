-- Kapachim v18: optional database repair if photo deletion is denied.
-- Existing photos and notes are preserved.
-- Remove the conflicting text overload; retain the UUID function.
drop function if exists public.kapachim_delete_photo(text);
grant select, delete on public.manual_photos to anon, authenticated;
alter table public.manual_photos enable row level security;
drop policy if exists "Kapachim photos delete" on public.manual_photos;
create policy "Kapachim photos delete" on public.manual_photos
  for delete to anon, authenticated using (true);
drop policy if exists "Kapachim media delete" on storage.objects;
create policy "Kapachim media delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'manual-media');
