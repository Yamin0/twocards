-- Registre des désinscriptions de la prospection e-mail.
--
-- La campagne restaurants sortante doit porter un lien de désinscription
-- fonctionnel (obligation légale, et signal de délivrabilité déterminant).
-- La page /desinscription écrit ici, sans authentification : c'est une adresse
-- que son propre titulaire retire de la liste.
--
-- La table n'est pas la liste de prospection, c'est sa liste d'exclusion :
-- avant chaque envoi, on retire de son fichier toute adresse présente ici.

create table if not exists public.email_optouts (
  email text primary key
    check (email = lower(email))
    check (position('@' in email) > 1)
    check (char_length(email) between 5 and 320),
  reason text not null default '' check (char_length(reason) <= 500),
  source text not null default 'web' check (char_length(source) <= 40),
  created_at timestamptz not null default now()
);

alter table public.email_optouts enable row level security;

-- Écriture : ouverte à tous, y compris anonyme. Un visiteur qui arrive depuis
-- le lien d'un e-mail n'a pas de compte, et ne doit pas en créer un pour
-- exercer son opposition. Le pire abus possible est d'inscrire une adresse
-- tierce sur une liste d'exclusion, ce qui ne fait que la protéger d'envois.
drop policy if exists "desinscription ouverte" on public.email_optouts;
create policy "desinscription ouverte"
  on public.email_optouts for insert to anon, authenticated
  with check (true);

-- Lecture réservée à l'administrateur : la liste des adresses désinscrites
-- reste un fichier de données personnelles, elle n'est pas publique.
drop policy if exists "desinscriptions lisibles par l'admin" on public.email_optouts;
create policy "desinscriptions lisibles par l'admin"
  on public.email_optouts for select to authenticated
  using (coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false));

comment on table public.email_optouts is
  'Adresses ayant demandé à ne plus recevoir de messages de prospection. À soustraire de tout fichier d''envoi.';
