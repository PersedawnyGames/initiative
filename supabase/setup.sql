-- ==========================================================================
--  Initiative — Sprout Night sign-ups
--  Run this once in Supabase: SQL Editor → New query → paste → Run.
--  Safe to run again: it only creates what isn't there yet.
-- ==========================================================================

-- --- Sign-ups: one row per person per night -------------------------------
create table if not exists public.sprout_signups (
  id             bigint generated always as identity primary key,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  night          date not null,

  -- Filled in by the database from the person's Discord login (see the
  -- trigger below), so nobody can sign up under someone else's name.
  discord_name   text,
  discord_avatar text,

  character      text not null check (char_length(character) between 2 and 40),
  world          text not null default 'Alpha' check (char_length(world) between 1 and 20),
  status         text not null check (status in ('going', 'maybe', 'out')),
  pref_role      text not null check (pref_role in ('tank', 'healer', 'dps', 'flex')),
  jobs           text[] not null default '{}' check (cardinality(jobs) <= 25),
  experience     text not null check (experience in ('new', 'some', 'veteran')),
  notes          text check (char_length(notes) <= 300),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (user_id, night)
);

-- Mounts the person still needs from that night's content (added later —
-- this line also upgrades a database that was set up before mounts existed).
alter table public.sprout_signups
  add column if not exists mounts text[] not null default '{}'
  check (cardinality(mounts) <= 60);

create index if not exists sprout_signups_night_idx on public.sprout_signups (night);

-- --- Hosts: people who may remove anyone's sign-up ------------------------
-- Add someone with:  insert into public.sprout_hosts (user_id) values ('<their User UID>');
create table if not exists public.sprout_hosts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note    text
);

create or replace function public.is_sprout_host()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.sprout_hosts where user_id = auth.uid());
$$;

-- --- Keep names honest + timestamps fresh ---------------------------------
create or replace function public.sprout_signups_stamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb;
begin
  -- Nobody can move a sign-up onto another account.
  if tg_op = 'UPDATE' then
    new.user_id    := old.user_id;
    new.created_at := old.created_at;
  end if;

  select raw_user_meta_data into meta from auth.users where id = new.user_id;

  new.discord_name := coalesce(
    meta -> 'custom_claims' ->> 'global_name',
    meta ->> 'full_name',
    meta ->> 'name',
    'Unknown'
  );
  new.discord_avatar := meta ->> 'avatar_url';
  new.updated_at     := now();
  return new;
end;
$$;

drop trigger if exists sprout_signups_stamp on public.sprout_signups;
create trigger sprout_signups_stamp
  before insert or update on public.sprout_signups
  for each row execute function public.sprout_signups_stamp();

-- --- Who may do what (row-level security) ---------------------------------
alter table public.sprout_signups enable row level security;
alter table public.sprout_hosts   enable row level security;   -- no policies: invisible to the website

drop policy if exists "Anyone can see the roster"       on public.sprout_signups;
drop policy if exists "Sign yourself up"                on public.sprout_signups;
drop policy if exists "Edit only your own sign-up"      on public.sprout_signups;
drop policy if exists "Remove your own, hosts any"      on public.sprout_signups;

create policy "Anyone can see the roster"
  on public.sprout_signups for select
  to anon, authenticated
  using (true);

create policy "Sign yourself up"
  on public.sprout_signups for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Edit only your own sign-up"
  on public.sprout_signups for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Remove your own, hosts any"
  on public.sprout_signups for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_sprout_host());

revoke all on public.sprout_signups from anon, authenticated;
revoke all on public.sprout_hosts    from anon, authenticated;
grant select                 on public.sprout_signups to anon, authenticated;
grant insert, update, delete on public.sprout_signups to authenticated;

revoke execute on function public.is_sprout_host()     from public, anon;
revoke execute on function public.sprout_signups_stamp() from public, anon, authenticated;
grant  execute on function public.is_sprout_host()     to authenticated;

-- --- Live updates: the roster refreshes by itself when someone signs up ---
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sprout_signups'
  ) then
    alter publication supabase_realtime add table public.sprout_signups;
  end if;
end;
$$;
