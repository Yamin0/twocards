-- « Voir en tant que » : l'administrateur ouvre l'espace d'un compte, en
-- LECTURE SEULE garantie par la base.
--
-- Principe :
--   - chaque session ouverte par l'admin sous l'identité d'un compte est
--     inscrite dans public.admin_impersonations (clé = auth.sessions.id, que
--     Supabase place dans le JWT sous `session_id`) ;
--   - un déclencheur « par instruction » sur chaque table publique refuse
--     toute écriture (insert, update, delete, truncate) venant d'une de ces
--     sessions. Il s'applique aussi à travers les fonctions SECURITY DEFINER,
--     contrairement aux règles RLS ;
--   - une session de visite reste en lecture seule pour toujours, même après
--     la fin de la visite (elle est de toute façon révoquée au retour).
--
-- Limites connues : le service d'auth (mot de passe, e-mail via
-- auth.updateUser) et le stockage de fichiers ne passent pas par ces tables,
-- donc ne sont pas bloqués. Une table créée plus tard doit recevoir le
-- déclencheur : relancer le bloc 4.

-- ─── 1. Journal des visites ────────────────────────────────────────────────

create table if not exists public.admin_impersonations (
  session_id uuid primary key,
  admin_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.admin_impersonations enable row level security;
revoke all on table public.admin_impersonations from anon, authenticated;
grant select on table public.admin_impersonations to authenticated;

drop policy if exists "admin lit les visites" on public.admin_impersonations;
create policy "admin lit les visites" on public.admin_impersonations
  for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

-- ─── 2. La requête vient-elle d'une session de visite ? ────────────────────

create or replace function public.is_impersonated()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_impersonations i
    where i.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  );
$$;

revoke all on function public.is_impersonated() from public, anon, authenticated;

-- ─── 3. Garde d'écriture ───────────────────────────────────────────────────

create or replace function public.guard_impersonated_writes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_impersonated() then
    raise exception 'Vue administrateur en lecture seule : aucune modification possible.'
      using errcode = '42501', hint = 'impersonation_read_only';
  end if;
  return null;
end;
$$;

revoke all on function public.guard_impersonated_writes() from public, anon, authenticated;

-- ─── 4. Déclencheur sur chaque table publique ──────────────────────────────

do $$
declare
  r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname not in ('admin_audit', 'admin_impersonations', 'app_errors')
  loop
    execute format('drop trigger if exists zz_lecture_seule_vue_admin on public.%I', r.relname);
    execute format(
      'create trigger zz_lecture_seule_vue_admin
         before insert or update or delete or truncate on public.%I
         for each statement execute function public.guard_impersonated_writes()',
      r.relname
    );
  end loop;
end;
$$;

-- ─── 5. Début, fin, état d'une visite ──────────────────────────────────────

-- Appelée par la route serveur, avec le JWT de l'admin, juste après
-- l'ouverture de la session du compte visité.
create or replace function public.admin_start_impersonation(p_target uuid, p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) then
    raise exception 'Réservé à l''administrateur';
  end if;
  if not exists (
    select 1 from auth.sessions s
    where s.id = p_session
      and s.user_id = p_target
      and s.created_at > now() - interval '5 minutes'
  ) then
    raise exception 'Session de visite introuvable';
  end if;

  insert into public.admin_impersonations (session_id, admin_id, target_id)
  values (p_session, auth.uid(), p_target)
  on conflict (session_id) do nothing;

  insert into public.admin_audit (admin_id, target_id, action)
  values (auth.uid(), p_target, 'voir_en_tant_que:debut');
end;
$$;

-- Appelée au retour, une fois la session admin restaurée.
create or replace function public.admin_end_impersonation()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t uuid;
begin
  if not coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) then
    raise exception 'Réservé à l''administrateur';
  end if;
  for t in
    update public.admin_impersonations
       set ended_at = now()
     where admin_id = auth.uid() and ended_at is null
    returning target_id
  loop
    insert into public.admin_audit (admin_id, target_id, action)
    values (auth.uid(), t, 'voir_en_tant_que:fin');
  end loop;
end;
$$;

-- Lue par le bandeau : renvoie une ligne seulement si la session courante
-- est une visite.
create or replace function public.impersonation_status()
returns table (admin_email text, target_id uuid, started_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text, i.target_id, i.started_at
  from public.admin_impersonations i
  left join auth.users u on u.id = i.admin_id
  where i.session_id = nullif(auth.jwt() ->> 'session_id', '')::uuid;
$$;

revoke all on function public.admin_start_impersonation(uuid, uuid) from public, anon;
revoke all on function public.admin_end_impersonation() from public, anon;
revoke all on function public.impersonation_status() from public, anon;
grant execute on function public.admin_start_impersonation(uuid, uuid) to authenticated;
grant execute on function public.admin_end_impersonation() to authenticated;
grant execute on function public.impersonation_status() to authenticated;
