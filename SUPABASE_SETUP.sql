-- ================================================================
-- KapaChim Project v1 — ΕΝΙΑΙΟ SUPABASE SETUP
-- Εκτέλεσέ το ΜΙΑ ΦΟΡΑ στο Supabase SQL Editor.
-- Το script είναι idempotent: μπορεί να εκτελεστεί ξανά χωρίς να
-- διαγράψει υπάρχοντες τομείς, έγγραφα, σημειώσεις ή φωτογραφίες.
-- ================================================================

create extension if not exists pgcrypto;

-- 1) Κοινή κατάσταση εφαρμογής: τομείς + έγγραφα
create table if not exists public.manual_app_state (
  id text primary key,
  sections jsonb not null default '[]'::jsonb,
  docs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.manual_app_state
  add column if not exists sections jsonb not null default '[]'::jsonb,
  add column if not exists docs jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- 2) Πρόσθετα κείμενα / σημειώσεις
create table if not exists public.manual_notes (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.manual_notes
  add column if not exists section text,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists created_at timestamptz not null default now();

-- 3) Μεταδεδομένα φωτογραφιών Supabase Storage
create table if not exists public.manual_photos (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  category text not null default 'external',
  storage_path text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.manual_photos
  add column if not exists section text,
  add column if not exists category text not null default 'external',
  add column if not exists storage_path text,
  add column if not exists name text,
  add column if not exists created_at timestamptz not null default now();

-- Κατάργηση παλιών πεδίων σύνδεσης που δημιουργούσαν το σφάλμα created_by.
alter table public.manual_notes drop column if exists created_by;
alter table public.manual_photos drop column if exists created_by;

-- Συμπλήρωση ασφαλών τιμών σε παλιές εγγραφές, αν υπάρχουν.
update public.manual_notes set section = coalesce(section, 'general') where section is null;
update public.manual_notes set title = coalesce(title, 'Σημείωση') where title is null;
update public.manual_notes set body = coalesce(body, '') where body is null;
update public.manual_photos set section = coalesce(section, 'general') where section is null;
update public.manual_photos set category = coalesce(category, 'external') where category is null;

alter table public.manual_notes
  alter column section set not null,
  alter column title set not null,
  alter column body set not null;

alter table public.manual_photos
  alter column section set not null,
  alter column category set not null;

create index if not exists manual_notes_section_idx on public.manual_notes(section);
create index if not exists manual_photos_section_idx on public.manual_photos(section);
create unique index if not exists manual_photos_storage_path_uidx
  on public.manual_photos(storage_path)
  where storage_path is not null;

-- 4) RLS και δικαιώματα. Η εφαρμογή είναι κοινόχρηστη χωρίς login/PIN.
alter table public.manual_app_state enable row level security;
alter table public.manual_notes enable row level security;
alter table public.manual_photos enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('manual_app_state','manual_notes','manual_photos')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "KapaChim state select" on public.manual_app_state
  for select to anon, authenticated using (true);
create policy "KapaChim state insert" on public.manual_app_state
  for insert to anon, authenticated with check (true);
create policy "KapaChim state update" on public.manual_app_state
  for update to anon, authenticated using (true) with check (true);
create policy "KapaChim state delete" on public.manual_app_state
  for delete to anon, authenticated using (true);

create policy "KapaChim notes select" on public.manual_notes
  for select to anon, authenticated using (true);
create policy "KapaChim notes insert" on public.manual_notes
  for insert to anon, authenticated with check (true);
create policy "KapaChim notes update" on public.manual_notes
  for update to anon, authenticated using (true) with check (true);
create policy "KapaChim notes delete" on public.manual_notes
  for delete to anon, authenticated using (true);

create policy "KapaChim photos select" on public.manual_photos
  for select to anon, authenticated using (true);
create policy "KapaChim photos insert" on public.manual_photos
  for insert to anon, authenticated with check (true);
create policy "KapaChim photos update" on public.manual_photos
  for update to anon, authenticated using (true) with check (true);
create policy "KapaChim photos delete" on public.manual_photos
  for delete to anon, authenticated using (true);

grant select, insert, update, delete on public.manual_app_state to anon, authenticated;
grant select, insert, update, delete on public.manual_notes to anon, authenticated;
grant select, insert, update, delete on public.manual_photos to anon, authenticated;

-- 5) Storage bucket για όλες τις φωτογραφίες.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manual-media',
  'manual-media',
  true,
  15728640,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'KapaChim manual media%'
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end $$;

create policy "KapaChim manual media select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'manual-media');

create policy "KapaChim manual media insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'manual-media');

create policy "KapaChim manual media update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'manual-media')
  with check (bucket_id = 'manual-media');

create policy "KapaChim manual media delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'manual-media');

-- 6) Realtime. Αγνοεί το duplicate_object αν οι πίνακες υπάρχουν ήδη.
do $$
begin
  alter publication supabase_realtime add table public.manual_app_state;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.manual_notes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.manual_photos;
exception when duplicate_object then null;
end $$;

-- 7) Αρχική κοινή εγγραφή. Δεν αντικαθιστά ήδη αποθηκευμένο περιεχόμενο.
insert into public.manual_app_state (id, sections, docs)
values ('main', '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

select 'KapaChim Project v1 Supabase setup ολοκληρώθηκε επιτυχώς.' as result;
