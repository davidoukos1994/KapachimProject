-- KapaChim Custom Manual V15 — Online Supabase sync
-- Εκτέλεσέ το μία φορά στο Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.manual_app_state (
  id text primary key,
  sections jsonb not null default '[]'::jsonb,
  docs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.manual_notes (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_photos (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  category text not null default 'external',
  storage_path text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create index if not exists manual_notes_section_idx on public.manual_notes(section);
create index if not exists manual_photos_section_idx on public.manual_photos(section);

alter table public.manual_app_state enable row level security;
alter table public.manual_notes enable row level security;
alter table public.manual_photos enable row level security;

do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
    where schemaname='public' and tablename in ('manual_app_state','manual_notes','manual_photos')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Δημόσια ανάγνωση ώστε όλοι να βλέπουν το ίδιο manual.
create policy "Public read app state" on public.manual_app_state for select to anon, authenticated using (true);
create policy "Public read notes" on public.manual_notes for select to anon, authenticated using (true);
create policy "Public read photos" on public.manual_photos for select to anon, authenticated using (true);

-- Η εφαρμογή V19 λειτουργεί χωρίς PIN. Οι εγγραφές γίνονται με το publishable key και συγχρονίζονται σε όλες τις συσκευές.
create policy "App write state" on public.manual_app_state for insert to anon, authenticated with check (true);
create policy "App update state" on public.manual_app_state for update to anon, authenticated using (true) with check (true);
create policy "App insert notes" on public.manual_notes for insert to anon, authenticated with check (true);
create policy "App delete notes" on public.manual_notes for delete to anon, authenticated using (true);
create policy "App insert photos" on public.manual_photos for insert to anon, authenticated with check (true);
create policy "App delete photos" on public.manual_photos for delete to anon, authenticated using (true);

grant select, insert, update, delete on public.manual_app_state to anon, authenticated;
grant select, insert, update, delete on public.manual_notes to anon, authenticated;
grant select, insert, update, delete on public.manual_photos to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('manual-media', 'manual-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='storage' and tablename='objects'
  loop
    if p.policyname like 'KapaChim manual media%' or p.policyname = 'Public manage manual media' then
      execute format('drop policy if exists %I on storage.objects', p.policyname);
    end if;
  end loop;
end $$;

create policy "KapaChim manual media read"
on storage.objects for select to anon, authenticated
using (bucket_id = 'manual-media');

create policy "KapaChim manual media insert"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'manual-media');

create policy "KapaChim manual media delete"
on storage.objects for delete to anon, authenticated
using (bucket_id = 'manual-media');

-- Realtime για άμεση ενημέρωση ανοιχτών συσκευών.
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
