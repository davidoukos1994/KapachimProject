-- Kapachim Project v8
-- Εκτέλεση ΜΙΑ φορά στο Supabase SQL Editor.
-- Δεν διαγράφει υπάρχοντες τομείς/έγγραφα/φωτογραφίες.

create or replace function public.kapachim_delete_photo(p_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  delete from public.manual_photos
  where id::text = p_id
  returning storage_path into v_path;

  if v_path is null then
    raise exception 'PHOTO_NOT_FOUND_OR_NOT_DELETED';
  end if;
  return v_path;
end;
$$;

grant execute on function public.kapachim_delete_photo(text) to anon, authenticated;

-- Οι λειτουργίες Storage γίνονται από το Storage API της εφαρμογής.
-- Επιβεβαίωση πολιτικών για το bucket manual-media.
alter table public.manual_photos enable row level security;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='manual_photos' loop
    execute format('drop policy if exists %I on public.manual_photos',p.policyname);
  end loop;
end $$;

create policy "Kapachim photos read" on public.manual_photos for select to anon, authenticated using (true);
create policy "Kapachim photos add" on public.manual_photos for insert to anon, authenticated with check (true);
create policy "Kapachim photos update" on public.manual_photos for update to anon, authenticated using (true) with check (true);
create policy "Kapachim photos delete" on public.manual_photos for delete to anon, authenticated using (true);

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'Kapachim media %' loop
    execute format('drop policy if exists %I on storage.objects',p.policyname);
  end loop;
end $$;

create policy "Kapachim media read" on storage.objects for select to anon, authenticated using (bucket_id='manual-media');
create policy "Kapachim media add" on storage.objects for insert to anon, authenticated with check (bucket_id='manual-media');
create policy "Kapachim media delete" on storage.objects for delete to anon, authenticated using (bucket_id='manual-media');

select 'Kapachim Project v8: διαγραφή μέσω RPC + Storage API ενεργοποιήθηκε.' as result;
