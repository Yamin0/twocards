-- Disponibilité réelle du portail : un créneau où CHAQUE table du plan de
-- salle porte déjà une réservation n'a plus rien à vendre — il disparaît de
-- la grille du portail (/r/[slug]). Exposé via RPC security definer, comme
-- portal_get : les anonymes n'apprennent que « complet / pas complet »,
-- jamais le contenu des réservations ni le nombre de tables.

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
    -- Les tables bloquées ne peuvent pas recevoir : elles ne comptent pas.
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
    and r.status <> 'annulée'
    and coalesce(trim(r.reservation_time), '') <> ''
    and c.total > 0
  group by left(trim(r.reservation_time), 5), c.total
  having count(distinct r.table_id) >= c.total;
$$;

revoke all on function public.portal_full_slots(text, date) from public;
grant execute on function public.portal_full_slots(text, date) to anon, authenticated;
