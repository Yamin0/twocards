-- Les établissements saisissent le montant dépensé (décision produit).
-- Prérequis : lier chaque réservation à un COMPTE établissement de façon
-- sûre. Le venue_name des métadonnées utilisateur est modifiable côté
-- client — un matching par nom permettrait d'usurper les réservations d'un
-- autre. On introduit donc la table venues, source de vérité du catalogue,
-- dont le rattachement owner_id n'est modifiable que par le rôle service.

create table if not exists public.venues (
  slug text primary key,          -- identifiant stable, aligné sur le catalogue
  name text not null,
  type text not null,
  city text not null,
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.venues enable row level security;

-- Un établissement ne voit que sa propre fiche. Écriture : rôle service.
create policy "owner lit sa fiche venue"
  on public.venues for select to authenticated
  using (owner_id = auth.uid());

revoke insert, update, delete on public.venues from anon, authenticated;

-- Catalogue actuel (src/lib/constants.ts). Idempotent.
insert into public.venues (slug, name, type, city) values
  ('venue-1', 'L''Arc Casablanca',        'club',       'Casablanca'),
  ('venue-2', 'Jimmy''z Marrakech',       'club',       'Marrakech'),
  ('venue-3', 'Baoli Tanger',             'lounge',     'Tanger'),
  ('venue-4', 'Le Comptoir de la Sqala',  'restaurant', 'Casablanca'),
  ('venue-5', 'Twiga Marrakech',          'lounge',     'Marrakech'),
  ('venue-6', 'Le Bar Long',              'bar',        'Casablanca')
on conflict (slug) do nothing;

-- Rattachement des réservations : le slug de l'offre du catalogue.
alter table public.qr_reservations
  add column if not exists venue_slug text;

create index if not exists qr_reservations_venue_slug_idx
  on public.qr_reservations (venue_slug);

-- L'établissement voit les réservations qui le concernent…
create policy "venue lit ses réservations"
  on public.qr_reservations for select to authenticated
  using (
    exists (
      select 1 from public.venues v
      where v.slug = qr_reservations.venue_slug
        and v.owner_id = auth.uid()
    )
  );

-- …et peut y écrire, mais uniquement le montant dépensé et le statut :
-- la policy limite les lignes, le GRANT par colonne limite les champs.
-- La commission reste dérivée par trigger, le taux reste côté service.
create policy "venue saisit le montant de ses réservations"
  on public.qr_reservations for update to authenticated
  using (
    exists (
      select 1 from public.venues v
      where v.slug = qr_reservations.venue_slug
        and v.owner_id = auth.uid()
    )
  );

grant update (amount_spent, status) on public.qr_reservations to authenticated;

-- La RPC du parcours client transmet désormais le slug de l'offre.
-- DROP puis CREATE : une surcharge (même nom, arités différentes) rendrait
-- l'appel PostgREST ambigu. Le nouveau paramètre a un défaut : les clients
-- déployés avec l'ancienne signature continuent de fonctionner.
drop function if exists public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text
);

create or replace function public.qr_create_reservation(
  p_code text,
  p_category text,
  p_venue text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size int,
  p_notes text,
  p_venue_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr uuid;
  v_id uuid;
begin
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if coalesce(trim(p_guest_phone), '') = '' or char_length(p_guest_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if char_length(coalesce(p_category, '')) > 40
     or char_length(coalesce(p_venue, '')) > 120
     or char_length(coalesce(p_time, '')) > 20
     or char_length(coalesce(p_notes, '')) > 500
     or char_length(coalesce(p_venue_slug, '')) > 40 then
    raise exception 'Champ trop long';
  end if;

  select id into v_qr
  from hotel_qr_codes
  where code = p_code and active;

  if v_qr is null then
    raise exception 'QR code introuvable ou inactif';
  end if;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes, venue_slug
  )
  values (
    v_qr, p_category, p_venue, trim(p_guest_name), trim(p_guest_phone),
    p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), 50),
    nullif(trim(coalesce(p_notes, '')), ''),
    nullif(trim(coalesce(p_venue_slug, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text, text
) from public;
grant execute on function public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text, text
) to anon, authenticated;
