-- ================================================================
-- Kapachim Project v6 — ΟΡΙΣΤΙΚΟ SUPABASE SCHEMA / MIGRATION
-- Εκτέλεσέ το μία φορά σε νέο Query. Δεν διαγράφει υπάρχον περιεχόμενο.
-- ================================================================
create extension if not exists pgcrypto;

create table if not exists public.manual_app_state(
 id text primary key,
 sections jsonb not null default '[]'::jsonb,
 docs jsonb not null default '[]'::jsonb,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.manual_app_state add column if not exists revision bigint not null default 0;
alter table public.manual_app_state add column if not exists updated_at timestamptz not null default now();

create table if not exists public.manual_notes(
 id uuid primary key default gen_random_uuid(), section text not null,
 title text not null, body text not null, created_at timestamptz not null default now()
);
create table if not exists public.manual_photos(
 id uuid primary key default gen_random_uuid(), section text not null,
 category text not null default 'external', storage_path text not null,
 name text, created_at timestamptz not null default now()
);
alter table public.manual_notes drop column if exists created_by;
alter table public.manual_photos drop column if exists created_by;
update public.manual_notes set section=coalesce(section,'general'),title=coalesce(title,'Σημείωση'),body=coalesce(body,'') where section is null or title is null or body is null;
update public.manual_photos set section=coalesce(section,'general'),category=coalesce(category,'external') where section is null or category is null;
alter table public.manual_notes alter column section set not null,alter column title set not null,alter column body set not null;
alter table public.manual_photos alter column section set not null,alter column category set not null;
create index if not exists manual_notes_section_idx on public.manual_notes(section);
create index if not exists manual_photos_section_idx on public.manual_photos(section);
create unique index if not exists manual_photos_storage_path_uidx on public.manual_photos(storage_path) where storage_path is not null;

insert into public.manual_app_state(id,sections,docs) values('main','[]'::jsonb,'[]'::jsonb) on conflict(id) do nothing;

-- RPC: αξιόπιστος έλεγχος, ανάγνωση, αποθήκευση και διαγραφή.
create or replace function public.kapachim_ping() returns jsonb
language sql stable security definer set search_path=public
as $$ select jsonb_build_object('ok',true,'server_time',now()); $$;

create or replace function public.kapachim_get_state() returns jsonb
language sql stable security definer set search_path=public
as $$ select jsonb_build_object('sections',sections,'docs',docs,'revision',revision,'updated_at',updated_at) from public.manual_app_state where id='main'; $$;

create or replace function public.kapachim_save_state(p_sections jsonb,p_docs jsonb) returns bigint
language plpgsql security definer set search_path=public
as $$ declare r bigint; begin
 insert into public.manual_app_state(id,sections,docs,revision,updated_at)
 values('main',coalesce(p_sections,'[]'::jsonb),coalesce(p_docs,'[]'::jsonb),1,now())
 on conflict(id) do update set sections=excluded.sections,docs=excluded.docs,revision=public.manual_app_state.revision+1,updated_at=now()
 returning revision into r; return r; end $$;

create or replace function public.kapachim_delete_photo(p_id uuid) returns text
language plpgsql security definer set search_path=public
as $$ declare p text; begin delete from public.manual_photos where id=p_id returning storage_path into p; return p; end $$;

create or replace function public.kapachim_delete_note(p_id uuid) returns boolean
language plpgsql security definer set search_path=public
as $$ begin delete from public.manual_notes where id=p_id; return not exists(select 1 from public.manual_notes where id=p_id); end $$;

revoke all on function public.kapachim_ping() from public;
revoke all on function public.kapachim_get_state() from public;
revoke all on function public.kapachim_save_state(jsonb,jsonb) from public;
revoke all on function public.kapachim_delete_photo(uuid) from public;
revoke all on function public.kapachim_delete_note(uuid) from public;
grant execute on function public.kapachim_ping() to anon,authenticated;
grant execute on function public.kapachim_get_state() to anon,authenticated;
grant execute on function public.kapachim_save_state(jsonb,jsonb) to anon,authenticated;
grant execute on function public.kapachim_delete_photo(uuid) to anon,authenticated;
grant execute on function public.kapachim_delete_note(uuid) to anon,authenticated;

alter table public.manual_app_state enable row level security;
alter table public.manual_notes enable row level security;
alter table public.manual_photos enable row level security;
do $$ declare p record; begin for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in('manual_app_state','manual_notes','manual_photos') loop execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename); end loop; end $$;
create policy "Kapachim state read" on public.manual_app_state for select to anon,authenticated using(true);
create policy "Kapachim notes read" on public.manual_notes for select to anon,authenticated using(true);
create policy "Kapachim notes add" on public.manual_notes for insert to anon,authenticated with check(true);
create policy "Kapachim notes delete" on public.manual_notes for delete to anon,authenticated using(true);
create policy "Kapachim photos read" on public.manual_photos for select to anon,authenticated using(true);
create policy "Kapachim photos add" on public.manual_photos for insert to anon,authenticated with check(true);
create policy "Kapachim photos delete" on public.manual_photos for delete to anon,authenticated using(true);
grant select on public.manual_app_state to anon,authenticated;
grant select,insert,delete on public.manual_notes to anon,authenticated;
grant select,insert,delete on public.manual_photos to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('manual-media','manual-media',true,15728640,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
do $$ declare p record; begin for p in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'Kapachim media %' loop execute format('drop policy if exists %I on storage.objects',p.policyname); end loop; end $$;
create policy "Kapachim media read" on storage.objects for select to anon,authenticated using(bucket_id='manual-media');
create policy "Kapachim media add" on storage.objects for insert to anon,authenticated with check(bucket_id='manual-media');
create policy "Kapachim media delete" on storage.objects for delete to anon,authenticated using(bucket_id='manual-media');

do $$ begin alter publication supabase_realtime add table public.manual_app_state; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.manual_notes; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.manual_photos; exception when duplicate_object then null; end $$;
alter table public.manual_app_state replica identity full;
alter table public.manual_notes replica identity full;
alter table public.manual_photos replica identity full;

select 'Kapachim Project v6: βάση, συγχρονισμός και διαγραφή φωτογραφιών ρυθμίστηκαν επιτυχώς.' as result;
