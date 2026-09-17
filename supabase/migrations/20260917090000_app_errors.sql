-- Journal des erreurs de l'app mobile.
--
-- Chaque message d'erreur montré à l'utilisateur, et chaque plantage d'écran,
-- est enregistré ici avec l'appareil, la version du système et le build.
-- Objectif : savoir exactement ce qu'un testeur (App Review compris) a vu,
-- sans dépendre d'une capture d'écran. Écriture seule depuis l'app ; la
-- lecture est réservée à l'administrateur.

create table if not exists public.app_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  kind text not null check (kind in ('crash', 'message', 'unhandled')),
  message text not null check (char_length(message) <= 2000),
  context text check (char_length(context) <= 200),
  stack text check (char_length(stack) <= 8000),
  platform text check (char_length(platform) <= 20),
  os_version text check (char_length(os_version) <= 40),
  device text check (char_length(device) <= 80),
  app_version text check (char_length(app_version) <= 40)
);

create index if not exists app_errors_created_at_idx on public.app_errors (created_at desc);

alter table public.app_errors enable row level security;

-- L'app écrit, connectée ou non (une erreur peut survenir avant la connexion).
-- Un utilisateur connecté ne peut pas écrire au nom d'un autre.
drop policy if exists "app écrit ses erreurs" on public.app_errors;
create policy "app écrit ses erreurs" on public.app_errors
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "admin lit les erreurs" on public.app_errors;
create policy "admin lit les erreurs" on public.app_errors
  for select to authenticated
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false));

grant insert on public.app_errors to anon, authenticated;
grant select on public.app_errors to authenticated;
revoke select, update, delete on public.app_errors from anon;
revoke update, delete on public.app_errors from authenticated;
