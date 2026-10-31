-- =====================================================================
-- CVCommit database schema (Supabase / PostgreSQL)
--
-- Run this whole file once in the Supabase SQL editor of a new project.
-- It only creates what is missing, so running it again is safe.
--
-- Written from the live database. Anything added later (new columns,
-- tables or functions) should be added to this file too.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. profiles: one row per user, created automatically at sign-up.
--    plan = 'pro' gives account-wide access (older arrangement).
--    Everyone else is 'free' and pays per CV through cv_unlocks.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Users cannot change their own plan. Only the server (service role) writes.


-- ---------------------------------------------------------------------
-- 2. cv_unlocks: one row per paid CV.
--    cv_hash is the SHA-256 of the CV text, not the CV itself.
--    Rows are written only by the server, after Paystack confirms payment.
--    fix_count and download_count track use of the unlock (see section 4).
-- ---------------------------------------------------------------------
create table if not exists public.cv_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cv_hash text not null,
  payment_reference text unique,
  amount integer not null,
  currency text not null default 'NGN',
  status text not null default 'paid'
    check (status in ('paid', 'refunded', 'revoked')),
  fix_count integer not null default 0,
  download_count integer not null default 0,
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, cv_hash)
);

alter table public.cv_unlocks enable row level security;

drop policy if exists "Users can read own CV unlocks" on public.cv_unlocks;
create policy "Users can read own CV unlocks"
  on public.cv_unlocks
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert, update or delete policy: only the server (service role) writes.
-- Access counts only rows with status = 'paid'. Set a row to 'refunded' or
-- 'revoked' to take access away.


-- ---------------------------------------------------------------------
-- 3. Create a profile automatically when someone signs up.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.profiles (
    id,
    full_name,
    plan
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    'free'
  );

  return new;
end;
$function$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 4. Usage limits for one unlock.
--    The server calls this before each Fix request (kind = 'fix') and
--    each PDF/DOCX download (kind = 'download'). The limit number is
--    passed in by the app (see lib/access/cv-quota.ts).
--    Returns 'ok', 'limit', 'no_unlock' or 'bad_kind'.
-- ---------------------------------------------------------------------
create or replace function public.consume_cv_quota(
  p_user uuid,
  p_cv_hash text,
  p_kind text,
  p_limit integer
)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_rows integer;
begin
  if p_kind = 'fix' then
    update cv_unlocks set fix_count = fix_count + 1
     where user_id = p_user and cv_hash = p_cv_hash
       and status = 'paid' and fix_count < p_limit;
  elsif p_kind = 'download' then
    update cv_unlocks set download_count = download_count + 1
     where user_id = p_user and cv_hash = p_cv_hash
       and status = 'paid' and download_count < p_limit;
  else
    return 'bad_kind';
  end if;

  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    return 'ok';
  end if;

  if exists (
    select 1 from cv_unlocks
     where user_id = p_user and cv_hash = p_cv_hash and status = 'paid'
  ) then
    return 'limit';
  end if;

  return 'no_unlock';
end $function$;

-- Only the server (service role) may call it, never a signed-in user.
revoke all on function public.consume_cv_quota(uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.consume_cv_quota(uuid, text, text, integer)
  to service_role;

notify pgrst, 'reload schema';