-- Socle « vrai logiciel de salle » du Venue Manager. Quatre manques
-- structurels relevés à l'audit :
--   1. le téléphone sonne et le manager ne peut PAS créer de réservation ;
--   2. aucun moyen de marquer un no-show — les statistiques de salle mentent ;
--   3. le check-in est un état React perdu au rechargement ;
--   4. le plan de salle n'apprend jamais ce que font les autres postes.

-- 1. Un no-show est un statut de réservation, pas une annulation :
--    l'établissement veut le compter (et le facturer un jour).
alter table public.qr_reservations
  drop constraint if exists qr_reservations_status_check;
alter table public.qr_reservations
  add constraint qr_reservations_status_check
    check (status in ('en attente', 'confirmée', 'annulée', 'no-show'));

-- 2. Troisième canal : la réservation prise par l'établissement lui-même
--    (téléphone, walk-in). Sans apporteur, commission nulle.
alter table public.qr_reservations
  drop constraint if exists qr_reservations_source_check;
alter table public.qr_reservations
  add constraint qr_reservations_source_check
    check (source in ('qr', 'portal', 'venue'));

-- 3. Check-in persisté : l'heure d'arrivée appartient à la réservation,
--    pas à la table — deux services le même soir ne se partagent plus
--    un « Arrivé » fantôme.
alter table public.qr_reservations
  add column if not exists arrived_at timestamptz;

grant update (amount_spent, status, table_id, arrived_at)
  on public.qr_reservations to authenticated;

-- 4. Création d'une réservation par l'établissement connecté. RPC plutôt
--    que policy d'insert : les colonnes sensibles (source, commission_rate,
--    venue_owner_id) restent hors de portée du client.
create or replace function public.venue_create_reservation(
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size int,
  p_notes text default null,
  p_table_id bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_slug text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if char_length(coalesce(p_guest_phone, '')) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if p_date is null then
    raise exception 'Date invalide';
  end if;
  if char_length(coalesce(p_time, '')) > 20 or char_length(coalesce(p_notes, '')) > 500 then
    raise exception 'Champ trop long';
  end if;
  if p_table_id is not null and not exists (
    select 1 from venue_tables vt
    where vt.id = p_table_id and vt.owner_id = auth.uid()
  ) then
    raise exception 'Table invalide';
  end if;

  select v.name, v.slug into v_name, v_slug
  from venues v where v.owner_id = auth.uid() limit 1;
  if v_name is null then
    select vp.display_name into v_name
    from venue_portals vp where vp.owner_id = auth.uid();
  end if;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes,
    venue_slug, venue_owner_id, source, commission_rate, status, table_id
  )
  values (
    null, 'Direct', coalesce(v_name, 'Établissement'), trim(p_guest_name),
    coalesce(nullif(trim(coalesce(p_guest_phone, '')), ''), '—'),
    p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), 50),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_slug, auth.uid(), 'venue', 0, 'confirmée', p_table_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.venue_create_reservation(text, text, date, text, int, text, bigint) from public;
grant execute on function public.venue_create_reservation(text, text, date, text, int, text, bigint)
  to authenticated;

-- 5. Un no-show libère son créneau sur le portail, comme une annulation.
create or replace function public.portal_full_slots(p_slug text, p_date date)
returns table (slot text)
language sql
security definer
set search_path = public
stable
as $$
  with portal as (
    select owner_id
    from venue_portals
    where slug = p_slug and active
      and char_length(p_slug) <= 40
  ),
  capacity as (
    select count(*) as total
    from venue_tables vt
    join portal p on vt.owner_id = p.owner_id
    where vt.status <> 'blocked'
  )
  select left(trim(r.reservation_time), 5)
  from qr_reservations r
  join portal p
    on r.venue_owner_id = p.owner_id
    or exists (
      select 1 from venues v
      where v.slug = r.venue_slug and v.owner_id = p.owner_id
    )
  cross join capacity c
  where r.reservation_date = p_date
    and r.table_id is not null
    and r.status not in ('annulée', 'no-show')
    and coalesce(trim(r.reservation_time), '') <> ''
    and c.total > 0
  group by left(trim(r.reservation_time), 5), c.total
  having count(distinct r.table_id) >= c.total;
$$;

-- 6. Le plan de salle écoute enfin ses tables : publication temps réel.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'venue_tables'
  ) then
    alter publication supabase_realtime add table public.venue_tables;
  end if;
end $$;
