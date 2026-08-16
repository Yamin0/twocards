-- Expérience client après scan d'un QR code hôtel.
-- 1. Un visiteur anonyme (le client de l'hôtel) doit pouvoir signaler un scan
--    et déposer une demande de réservation, sans jamais lire la table des QR.
-- 2. L'hôtel doit suivre, QR par QR, les réservations et commissions générées.

-- ─── Réservations issues des scans ─────────────────────────────────────────────

create table if not exists public.qr_reservations (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.hotel_qr_codes(id) on delete cascade,
  category text not null,
  venue_name text not null,
  guest_name text not null,
  guest_phone text not null,
  reservation_date date not null,
  reservation_time text,
  party_size int not null default 2 check (party_size between 1 and 50),
  notes text,
  status text not null default 'en attente'
    check (status in ('en attente', 'confirmée', 'annulée')),
  commission numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists qr_reservations_qr_code_id_idx
  on public.qr_reservations (qr_code_id, created_at desc);

alter table public.qr_reservations enable row level security;

-- L'hôtel ne voit que les réservations de ses propres QR : la sous-requête sur
-- hotel_qr_codes est elle-même soumise aux policies existantes de cette table,
-- qui la restreignent déjà au propriétaire. Aucune hypothèse sur le nom de la
-- colonne propriétaire n'est donc nécessaire ici.
create policy "hotel lit les réservations de ses QR"
  on public.qr_reservations for select to authenticated
  using (
    exists (
      select 1 from public.hotel_qr_codes q
      where q.id = qr_reservations.qr_code_id
    )
  );

create policy "hotel met à jour les réservations de ses QR"
  on public.qr_reservations for update to authenticated
  using (
    exists (
      select 1 from public.hotel_qr_codes q
      where q.id = qr_reservations.qr_code_id
    )
  );

-- ─── Comptage des scans (appelable par un visiteur anonyme) ────────────────────

-- Incrémente le compteur et renvoie le libellé si le QR est actif.
-- SECURITY DEFINER : le visiteur n'a aucun droit direct sur hotel_qr_codes.
create or replace function public.qr_track_scan(p_code text)
returns table (label text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code is null or char_length(p_code) > 32 then
    return;
  end if;
  return query
  update hotel_qr_codes q
     set scans = q.scans + 1
   where q.code = p_code
     and q.active
  returning q.label;
end;
$$;

revoke all on function public.qr_track_scan(text) from public;
grant execute on function public.qr_track_scan(text) to anon, authenticated;

-- ─── Dépôt d'une demande de réservation (visiteur anonyme) ─────────────────────

create or replace function public.qr_create_reservation(
  p_code text,
  p_category text,
  p_venue text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size int,
  p_notes text
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
  -- Garde-fous : ce point d'entrée est public.
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if coalesce(trim(p_guest_phone), '') = '' or char_length(p_guest_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if char_length(coalesce(p_category, '')) > 40
     or char_length(coalesce(p_venue, '')) > 120
     or char_length(coalesce(p_time, '')) > 20
     or char_length(coalesce(p_notes, '')) > 500 then
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
    reservation_date, reservation_time, party_size, notes
  )
  values (
    v_qr, p_category, p_venue, trim(p_guest_name), trim(p_guest_phone),
    p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), 50),
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text
) from public;
grant execute on function public.qr_create_reservation(
  text, text, text, text, text, date, text, int, text
) to anon, authenticated;
