-- Run ONCE in Supabase SQL Editor. Keeps existing data and photos.
create table if not exists public.kapachim_backups (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 reason text not null,
 state jsonb not null,
 notes jsonb not null,
 photos jsonb not null
);
alter table public.kapachim_backups enable row level security;
revoke all on public.kapachim_backups from public, anon, authenticated;
grant select (id, created_at, reason) on public.kapachim_backups to anon, authenticated;
drop policy if exists "Kapachim backups list" on public.kapachim_backups;
create policy "Kapachim backups list" on public.kapachim_backups for select to anon, authenticated using(true);

create or replace function public.kapachim_create_backup(p_reason text default 'Χειροκίνητο αντίγραφο')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
 insert into public.kapachim_backups(reason,state,notes,photos)
 select left(coalesce(p_reason,'Αντίγραφο'),140),
   coalesce((select to_jsonb(s) from public.manual_app_state s where id='main'),'{}'::jsonb),
   coalesce((select jsonb_agg(to_jsonb(n)) from public.manual_notes n),'[]'::jsonb),
   coalesce((select jsonb_agg(to_jsonb(p)) from public.manual_photos p),'[]'::jsonb)
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.kapachim_backup_before_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
 if current_setting('kapachim.restoring',true)='yes' then return null; end if;
 if TG_TABLE_NAME='manual_app_state' then
   perform public.kapachim_create_backup('Αυτόματο πριν από αλλαγή');
 else
   perform public.kapachim_create_backup('Αυτόματο πριν από διαγραφή');
 end if;
 return null;
end $$;

drop trigger if exists kapachim_backup_state on public.manual_app_state;
create trigger kapachim_backup_state before update on public.manual_app_state
 for each statement execute function public.kapachim_backup_before_change();
drop trigger if exists kapachim_backup_notes on public.manual_notes;
create trigger kapachim_backup_notes before delete on public.manual_notes
 for each statement execute function public.kapachim_backup_before_change();
drop trigger if exists kapachim_backup_photos on public.manual_photos;
create trigger kapachim_backup_photos before delete on public.manual_photos
 for each statement execute function public.kapachim_backup_before_change();

create or replace function public.kapachim_restore_backup(p_backup_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare b public.kapachim_backups%rowtype;
begin
 select * into b from public.kapachim_backups where id=p_backup_id;
 if not found then raise exception 'Το αντίγραφο δεν βρέθηκε'; end if;
 perform public.kapachim_create_backup('Αυτόματο πριν από επαναφορά');
 perform set_config('kapachim.restoring','yes',true);
 delete from public.manual_photos;
 delete from public.manual_notes;
 insert into public.manual_notes(id,section,title,body,created_at)
 select id,section,title,body,created_at from jsonb_to_recordset(b.notes)
 as x(id uuid,section text,title text,body text,created_at timestamptz);
 insert into public.manual_photos(id,section,category,storage_path,name,created_at)
 select id,section,category,storage_path,name,created_at from jsonb_to_recordset(b.photos)
 as x(id uuid,section text,category text,storage_path text,name text,created_at timestamptz);
 insert into public.manual_app_state(id,sections,docs,revision,updated_at)
 values('main',b.state->'sections',b.state->'docs',coalesce((b.state->>'revision')::bigint,0)+1,now())
 on conflict(id) do update set sections=excluded.sections,docs=excluded.docs,
 revision=public.manual_app_state.revision+1,updated_at=now();
 perform set_config('kapachim.restoring','no',true);
 return true;
end $$;
revoke all on function public.kapachim_create_backup(text) from public;
revoke all on function public.kapachim_restore_backup(uuid) from public;
grant execute on function public.kapachim_create_backup(text),public.kapachim_restore_backup(uuid) to anon,authenticated;
-- First snapshot of the current state; rerunning this SQL does not delete prior backups.
select public.kapachim_create_backup('Αρχικό αντίγραφο v19');
