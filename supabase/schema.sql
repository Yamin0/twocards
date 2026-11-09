-- Schéma de la base twocards (Supabase), reconstruit depuis le catalogue
-- Postgres de production le 9 novembre 2026.
--
-- Instantané de référence, pas une migration : ne l'exécutez pas sur la
-- production. Il comble les 12 premières migrations du dépôt, enregistrées
-- vides (*_remote_placeholder.sql), et décrit l'état complet du schéma public
-- après toutes les migrations, durcissement de sécurité compris.
--
-- Contenu : tables, contraintes, index, fonctions, déclencheurs (y compris
-- ceux de auth.users), Row Level Security et règles d'accès, droits accordés
-- à anon et authenticated, bucket de stockage, publication temps réel.
-- Reconstruit à la main depuis le catalogue (pas de pg_dump) : la structure
-- est fidèle, mais l'ordre et la mise en forme diffèrent d'un export officiel.

set check_function_bodies = false;

-- ─── Extensions (plpgsql, pg_graphql et supabase_vault sont gérées par Supabase) ───

create extension if not exists pg_net with schema extensions;

create extension if not exists pg_stat_statements with schema extensions;

create extension if not exists pgcrypto with schema extensions;

create extension if not exists "uuid-ossp" with schema extensions;

-- ─── Tables ────────────────────────────────────────────────────────────────

create table public.admin_audit (
  id bigint generated always as identity not null,
  admin_id uuid,
  target_id uuid,
  action text not null,
  created_at timestamp with time zone default now() not null
);

create table public.app_errors (
  id bigint generated always as identity not null,
  created_at timestamp with time zone default now() not null,
  user_id uuid default auth.uid(),
  kind text not null,
  message text not null,
  context text,
  stack text,
  platform text,
  os_version text,
  device text,
  app_version text
);

create table public.catalog_offers (
  slug text not null,
  category text not null,
  name text not null,
  city text,
  tag text default ''::text not null,
  description text default ''::text not null,
  price text,
  image_url text,
  active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  images text[] default '{}'::text[] not null
);

create table public.commission_settlements (
  id uuid default gen_random_uuid() not null,
  period text not null,
  venue_owner_id uuid not null,
  hotel_id uuid not null,
  amount numeric default 0 not null,
  note text default ''::text not null,
  settled_at timestamp with time zone default now() not null,
  settled_by uuid default auth.uid()
);

create table public.conversations (
  id uuid default gen_random_uuid() not null,
  venue_id uuid not null,
  concierge_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.email_optouts (
  email text not null,
  reason text default ''::text not null,
  source text default 'web'::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.hotel_offers (
  id uuid default gen_random_uuid() not null,
  user_id uuid default auth.uid() not null,
  slug text default ('h-'::text || substr(md5((gen_random_uuid())::text), 1, 12)) not null,
  category text not null,
  name text not null,
  tag text default ''::text not null,
  description text default ''::text not null,
  price text,
  image_url text,
  active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  images text[] default '{}'::text[] not null
);

create table public.hotel_profiles (
  user_id uuid default auth.uid() not null,
  hotel_name text,
  city text,
  accent_color text default '#13305c'::text not null,
  welcome_message text,
  reception_phone text,
  show_prices boolean default true not null,
  updated_at timestamp with time zone default now() not null,
  cover_url text,
  background_color text default '#f4f3ef'::text not null,
  hidden_offers text[] default '{}'::text[] not null,
  category_images jsonb default '{}'::jsonb not null
);

create table public.hotel_qr_codes (
  id uuid default gen_random_uuid() not null,
  user_id uuid default auth.uid() not null,
  label text not null,
  code text not null,
  active boolean default true not null,
  scans integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  hidden_offers text[] default '{}'::text[] not null,
  hidden_categories text[] default '{}'::text[] not null,
  hidden_until date
);

create table public.messages (
  id bigint generated always as identity not null,
  conversation_id uuid not null,
  sender_id uuid not null,
  body text not null,
  created_at timestamp with time zone default now() not null,
  read_at timestamp with time zone
);

create table public.pos_events (
  id bigint generated always as identity not null,
  owner_id uuid not null,
  provider text,
  ticket_id text,
  table_label text,
  amount numeric,
  status text not null,
  reason text,
  reservation_id uuid,
  created_at timestamp with time zone default now() not null
);

create table public.profiles (
  id uuid not null,
  full_name text,
  role text default 'etablissement'::text not null,
  venue_name text,
  city text,
  created_at timestamp with time zone default now() not null
);

create table public.push_tokens (
  token text not null,
  user_id uuid not null,
  platform text default 'ios'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.qr_reservations (
  id uuid default gen_random_uuid() not null,
  qr_code_id uuid,
  category text not null,
  venue_name text not null,
  guest_name text not null,
  guest_phone text not null,
  reservation_date date not null,
  reservation_time text,
  party_size integer default 2 not null,
  notes text,
  status text default 'en attente'::text not null,
  commission numeric default 0 not null,
  created_at timestamp with time zone default now() not null,
  amount_spent numeric,
  commission_rate numeric default 0.10 not null,
  venue_slug text,
  rating integer,
  rating_comment text,
  rated_at timestamp with time zone,
  table_id bigint,
  amount_source text default 'manuel'::text not null,
  pos_ticket_id text,
  source text default 'qr'::text not null,
  venue_owner_id uuid,
  arrived_at timestamp with time zone,
  service_name text,
  referrer_id uuid,
  referrer_name text
);

create table public.venue_events (
  id bigint generated always as identity not null,
  owner_id uuid default auth.uid() not null,
  title text not null,
  venue text default ''::text not null,
  event_day integer,
  event_month integer,
  event_year integer,
  time_range text default ''::text not null,
  status text default 'Brouillon'::text not null,
  genres text[] default '{}'::text[] not null,
  gradient text default ''::text not null,
  icon_idx integer default 0 not null,
  cover_image text,
  total_spots integer default 0 not null,
  spots integer default 0 not null,
  reservations integer default 0 not null,
  revenue text default '0 MAD'::text not null,
  rp_count integer default 0 not null,
  closed boolean default false not null,
  description text default ''::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.venue_integrations (
  owner_id uuid not null,
  provider text default 'generic'::text not null,
  api_key_hash text,
  status text default 'inactive'::text not null,
  last_event_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table public.venue_notifications (
  id bigint generated always as identity not null,
  owner_id uuid not null,
  kind text not null,
  title text not null,
  body text default ''::text not null,
  href text default ''::text not null,
  read boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.venue_portals (
  owner_id uuid default auth.uid() not null,
  slug text not null,
  display_name text not null,
  tagline text default ''::text not null,
  accent_color text default '#13305c'::text not null,
  party_max integer default 8 not null,
  start_time text default '19:00'::text not null,
  end_time text default '01:00'::text not null,
  interval_minutes integer default 30 not null,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  background_color text default '#f5f5f4'::text not null,
  cover_url text
);

create table public.venue_services (
  id uuid default gen_random_uuid() not null,
  owner_id uuid default auth.uid() not null,
  venue_slug text,
  name text not null,
  description text default ''::text not null,
  duration text default ''::text not null,
  price text default ''::text not null,
  image_url text,
  active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.venue_tables (
  id bigint generated always as identity not null,
  owner_id uuid default auth.uid() not null,
  label text not null,
  x numeric default 100 not null,
  y numeric default 100 not null,
  shape text default 'round'::text not null,
  status text default 'available'::text not null,
  vip boolean default false not null,
  capacity integer default 4 not null,
  created_at timestamp with time zone default now() not null
);

create table public.venues (
  slug text not null,
  name text not null,
  type text not null,
  city text not null,
  owner_id uuid,
  created_at timestamp with time zone default now() not null
);

-- ─── Fonctions ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_account_overview()
 RETURNS TABLE(id uuid, email text, role text, full_name text, venue_name text, city text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, conversation_count bigint, message_count bigint, unread_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false) then
    raise exception 'Réservé à l''administrateur';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.role,
    p.full_name,
    p.venue_name,
    p.city,
    p.created_at,
    u.last_sign_in_at,
    (select count(*) from public.conversations c
      where c.venue_id = p.id or c.concierge_id = p.id),
    (select count(*) from public.messages m where m.sender_id = p.id),
    (select count(*) from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where (c.venue_id = p.id or c.concierge_id = p.id)
        and m.sender_id <> p.id and m.read_at is null)
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_commission_ledger()
 RETURNS TABLE(id uuid, reservation_date date, created_at timestamp with time zone, period text, guest_name text, category text, venue_slug text, venue_name text, venue_owner_id uuid, venue_account text, hotel_id uuid, hotel_name text, source text, status text, amount_spent numeric, commission_rate numeric, commission numeric, service_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) then
    raise exception 'Réservé à l''administrateur';
  end if;

  return query
  select r.id,
         r.reservation_date,
         r.created_at,
         to_char(r.reservation_date, 'YYYY-MM'),
         r.guest_name,
         r.category,
         r.venue_slug,
         r.venue_name,
         coalesce(r.venue_owner_id, v.owner_id),
         coalesce(pv.venue_name, pv.full_name, uv.email::text),
         r.referrer_id,
         r.referrer_name,
         r.source,
         r.status,
         r.amount_spent,
         r.commission_rate,
         r.commission,
         r.service_name
    from public.qr_reservations r
    left join public.venues v on v.slug = r.venue_slug
    left join public.profiles pv on pv.id = coalesce(r.venue_owner_id, v.owner_id)
    left join auth.users uv on uv.id = coalesce(r.venue_owner_id, v.owner_id)
   order by r.reservation_date desc, r.created_at desc;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_set_role(target_id uuid, new_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false) then
    raise exception 'Réservé à l''administrateur';
  end if;
  if new_role not in ('etablissement', 'hotel', 'concierge') then
    raise exception 'Rôle invalide : %', new_role;
  end if;

  update public.profiles set role = new_role where id = target_id;

  update auth.users
  set
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', new_role),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', new_role)
  where id = target_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.catalog_sync_venue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into venues (slug, name, type, city)
  values (
    new.slug,
    new.name,
    case new.category
      when 'restaurants' then 'restaurant'
      when 'clubs' then 'club'
      when 'activites' then 'activite'
      else 'service'
    end,
    coalesce(new.city, '')
  )
  on conflict (slug) do update
    set name = excluded.name,
        city = excluded.city;
  new.updated_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.flag_internal_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.email like '%@admin.twocardspro.com' then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || '{"is_admin": true, "role": "admin"}'::jsonb;
    new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb)
      || '{"role": "admin", "full_name": "Administrateur"}'::jsonb;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, role, venue_name, city)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_app_meta_data->>'role', 'etablissement'),
    new.raw_user_meta_data->>'venue_name',
    new.raw_user_meta_data->>'city'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_new_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid;
begin
  if old.rating is not null or new.rating is null then
    return new;
  end if;
  v_owner := qr_reservation_owner(new);
  if v_owner is null then
    return new;
  end if;
  insert into venue_notifications (owner_id, kind, title, body, href)
  values (
    v_owner,
    'rating',
    'Nouvel avis client',
    new.guest_name || ' — ' || new.rating || '/5'
      || coalesce(' · « ' || left(new.rating_comment, 80) || ' »', ''),
    '/dashboard/reservations'
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_new_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid;
begin
  if new.source = 'venue' then
    return new;
  end if;
  v_owner := qr_reservation_owner(new);
  if v_owner is null then
    return new;
  end if;
  insert into venue_notifications (owner_id, kind, title, body, href)
  values (
    v_owner,
    'reservation',
    'Nouvelle réservation',
    new.guest_name
      || coalesce(' · ' || new.service_name, '')
      || ' · ' || to_char(new.reservation_date, 'DD/MM')
      || coalesce(' · ' || new.reservation_time, '')
      || ' · ' || new.party_size || ' pers.'
      || case when new.source = 'portal' then ' · portail' else ' · QR hôtel' end,
    '/dashboard/reservations'
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_pos_unmatched()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status <> 'unmatched' then
    return new;
  end if;
  insert into venue_notifications (owner_id, kind, title, body, href)
  values (
    new.owner_id,
    'pos',
    'Ticket caisse non rapproché',
    'Table ' || coalesce(new.table_label, '?')
      || ' · ' || coalesce(new.amount::text, '?') || ' MAD'
      || coalesce(' · ' || new.reason, ''),
    '/dashboard/integrations'
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.portal_create_reservation(p_slug text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_portal record;
  v_slug text;
  v_phone text := trim(coalesce(p_guest_phone, ''));
  v_id uuid;
begin
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if v_phone = '' or char_length(v_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if p_date is null or p_date < current_date or p_date > current_date + 366 then
    raise exception 'Date invalide';
  end if;
  if char_length(coalesce(p_time, '')) > 20 or char_length(coalesce(p_notes, '')) > 500 then
    raise exception 'Champ trop long';
  end if;

  select owner_id, display_name, party_max into v_portal
  from venue_portals
  where slug = p_slug and active;

  if v_portal is null then
    raise exception 'Portail introuvable ou désactivé';
  end if;

  -- Débit : 3 demandes par numéro en 10 min, 60 par portail en une heure.
  if (select count(*) from qr_reservations
      where guest_phone = v_phone and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from qr_reservations
         where venue_owner_id = v_portal.owner_id and source = 'portal'
           and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'Trop de demandes, réessayez dans quelques minutes';
  end if;

  select slug into v_slug from venues where owner_id = v_portal.owner_id limit 1;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes,
    venue_slug, venue_owner_id, source, commission_rate
  )
  values (
    null, 'Direct', v_portal.display_name, trim(p_guest_name),
    v_phone, p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), v_portal.party_max),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_slug, v_portal.owner_id, 'portal', 0
  )
  returning id into v_id;

  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.portal_full_slots(p_slug text, p_date date)
 RETURNS TABLE(slot text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.portal_get(p_slug text)
 RETURNS TABLE(display_name text, tagline text, accent_color text, background_color text, cover_url text, party_max integer, start_time text, end_time text, interval_minutes integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select vp.display_name, vp.tagline, vp.accent_color, vp.background_color,
         vp.cover_url, vp.party_max, vp.start_time, vp.end_time,
         vp.interval_minutes
  from venue_portals vp
  where vp.slug = p_slug and vp.active
    and char_length(p_slug) <= 40;
$function$
;

CREATE OR REPLACE FUNCTION public.pos_rotate_key(p_provider text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_key text;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  if coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'etablissement' then
    raise exception 'Réservé aux établissements';
  end if;
  if p_provider is not null and char_length(p_provider) > 40 then
    raise exception 'Fournisseur invalide';
  end if;

  v_key := 'tc_live_' || encode(gen_random_bytes(24), 'hex');

  insert into venue_integrations (owner_id, provider, api_key_hash, status)
  values (
    auth.uid(),
    coalesce(p_provider, 'generic'),
    encode(digest(v_key, 'sha256'), 'hex'),
    'active'
  )
  on conflict (owner_id) do update
    set api_key_hash = excluded.api_key_hash,
        provider = coalesce(p_provider, venue_integrations.provider),
        status = 'active';

  return v_key;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.push_hotel_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hotel uuid;
begin
  if new.qr_code_id is null then
    return new;
  end if;

  select q.user_id into v_hotel
    from hotel_qr_codes q
   where q.id = new.qr_code_id;

  perform push_to_user(
    v_hotel,
    'Nouvelle demande client',
    new.guest_name || ' · ' || new.venue_name
      || coalesce(' · ' || new.service_name, '')
      || ' · ' || to_char(new.reservation_date, 'DD/MM')
      || coalesce(' · ' || new.reservation_time, '')
      || ' · ' || new.party_size || ' pers.',
    '/hotel/reservations'
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.push_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_recipient uuid;
  v_sender text;
  v_role text;
begin
  select case when c.venue_id = new.sender_id then c.concierge_id else c.venue_id end
    into v_recipient
    from conversations c
   where c.id = new.conversation_id;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  select coalesce(p.venue_name, p.full_name, 'Nouveau message')
    into v_sender
    from profiles p
   where p.id = new.sender_id;

  select p.role into v_role from profiles p where p.id = v_recipient;

  perform push_to_user(
    v_recipient,
    coalesce(v_sender, 'Nouveau message'),
    left(new.body, 140),
    case when v_role = 'concierge' then '/concierge/messages'
         else '/dashboard/messages' end
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.push_to_user(p_user uuid, p_title text, p_body text, p_url text DEFAULT ''::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_messages jsonb;
begin
  if p_user is null then
    return;
  end if;

  select jsonb_agg(jsonb_build_object(
           'to', t.token,
           'title', p_title,
           'body', p_body,
           'sound', 'default',
           'priority', 'high',
           'data', jsonb_build_object('url', p_url)
         ))
    into v_messages
    from push_tokens t
   where t.user_id = p_user;

  if v_messages is null then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := v_messages,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json'
    )
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.push_venue_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform push_to_user(new.owner_id, new.title, new.body, new.href);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.qr_apply_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Toujours recalculée : aucune dérive possible entre montant et commission.
  new.commission := coalesce(round(new.amount_spent * new.commission_rate, 2), 0);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.qr_create_reservation(p_code text, p_category text, p_venue text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text, p_venue_slug text DEFAULT NULL::text, p_service text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_qr record;
  v_slug text := nullif(trim(coalesce(p_venue_slug, '')), '');
  v_phone text := trim(coalesce(p_guest_phone, ''));
  v_id uuid;
begin
  if coalesce(trim(p_guest_name), '') = '' or char_length(p_guest_name) > 120 then
    raise exception 'Nom invalide';
  end if;
  if v_phone = '' or char_length(v_phone) > 40 then
    raise exception 'Téléphone invalide';
  end if;
  if char_length(coalesce(p_category, '')) > 40
     or char_length(coalesce(p_venue, '')) > 120
     or char_length(coalesce(p_time, '')) > 20
     or char_length(coalesce(p_notes, '')) > 500
     or char_length(coalesce(v_slug, '')) > 40
     or char_length(coalesce(p_service, '')) > 80 then
    raise exception 'Champ trop long';
  end if;
  -- Veille tolérée : le convive peut réserver après minuit pour la soirée.
  if p_date is null or p_date < current_date - 1 or p_date > current_date + 366 then
    raise exception 'Date invalide';
  end if;

  select id, user_id, coalesce(hidden_offers, '{}') as hidden into v_qr
  from hotel_qr_codes
  where code = p_code and active;

  if v_qr.id is null then
    raise exception 'QR code introuvable ou inactif';
  end if;

  -- L'adresse doit être au menu de cet hôtel : catalogue réseau actif ou
  -- adresse maison de l'hôtel, et non masquée sur ce QR.
  if v_slug is not null then
    if v_slug = any (v_qr.hidden)
       or not (
         exists (select 1 from catalog_offers c where c.slug = v_slug and c.active)
         or exists (
           select 1 from hotel_offers o
           where o.slug = v_slug and o.user_id = v_qr.user_id and o.active
         )
       ) then
      raise exception 'Adresse indisponible';
    end if;
  end if;

  -- Débit : 3 demandes par numéro en 10 min, 30 par QR en une heure.
  if (select count(*) from qr_reservations
      where guest_phone = v_phone and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from qr_reservations
         where qr_code_id = v_qr.id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Trop de demandes, réessayez dans quelques minutes';
  end if;

  insert into qr_reservations (
    qr_code_id, category, venue_name, guest_name, guest_phone,
    reservation_date, reservation_time, party_size, notes, venue_slug,
    service_name
  )
  values (
    v_qr.id, p_category, p_venue, trim(p_guest_name), v_phone,
    p_date, nullif(trim(coalesce(p_time, '')), ''),
    least(greatest(coalesce(p_party_size, 2), 1), 50),
    nullif(trim(coalesce(p_notes, '')), ''),
    v_slug,
    nullif(trim(coalesce(p_service, '')), '')
  )
  returning id into v_id;

  return v_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.qr_get_menu(p_code text)
 RETURNS TABLE(label text, hidden_offers text[], hidden_categories text[], hidden_until date, hotel_name text, city text, accent_color text, background_color text, cover_url text, welcome_message text, reception_phone text, show_prices boolean, category_images jsonb, catalog jsonb, hotel_offers jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    q.label,
    (select coalesce(array_agg(distinct x), '{}')
       from unnest(q.hidden_offers || coalesce(p.hidden_offers, '{}')) as x),
    case when q.hidden_until is null or q.hidden_until >= current_date
         then q.hidden_categories else '{}'::text[] end,
    q.hidden_until,
    p.hotel_name,
    p.city,
    coalesce(p.accent_color, '#13305c'),
    coalesce(p.background_color, '#f4f3ef'),
    p.cover_url,
    p.welcome_message,
    p.reception_phone,
    coalesce(p.show_prices, true),
    coalesce(p.category_images, '{}'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'category', c.category, 'name', c.name, 'city', c.city,
        'tag', c.tag, 'description', c.description, 'price', c.price,
        'image_url', c.image_url, 'images', c.images, 'sort_order', c.sort_order,
        'services', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', s.id, 'name', s.name, 'description', s.description,
            'duration', s.duration, 'price', s.price, 'image_url', s.image_url
          ) order by s.sort_order, s.name)
          from venue_services s
          where s.venue_slug = c.slug and s.active
        ), '[]'::jsonb)
      ) order by c.sort_order, c.name)
      from catalog_offers c where c.active
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', h.slug, 'category', h.category, 'name', h.name,
        'tag', h.tag, 'description', h.description, 'price', h.price,
        'image_url', h.image_url, 'images', h.images, 'sort_order', h.sort_order
      ) order by h.sort_order, h.name)
      from hotel_offers h where h.user_id = q.user_id and h.active
    ), '[]'::jsonb)
  from hotel_qr_codes q
  left join hotel_profiles p on p.user_id = q.user_id
  where q.code = p_code
    and q.active
    and char_length(p_code) <= 32;
$function$
;

CREATE OR REPLACE FUNCTION public.qr_lock_pos_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if old.amount_source = 'pos'
     and new.amount_spent is distinct from old.amount_spent
     and coalesce(auth.jwt()->>'role', '') = 'authenticated'
     and not coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false) then
    raise exception 'Montant transmis par la caisse : contactez twocards pour le corriger';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Note invalide';
  end if;
  if char_length(coalesce(p_comment, '')) > 500 then
    raise exception 'Commentaire trop long';
  end if;

  update qr_reservations
     set rating = p_rating,
         rating_comment = nullif(trim(coalesce(p_comment, '')), ''),
         rated_at = now()
   where id = p_id
     and rated_at is null
     and status <> 'annulée';

  if not found then
    raise exception 'Réservation introuvable ou déjà notée';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.qr_rating_context(p_id uuid)
 RETURNS TABLE(venue_name text, reservation_date date, already_rated boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select r.venue_name, r.reservation_date, r.rated_at is not null
  from qr_reservations r
  where r.id = p_id and r.status <> 'annulée';
$function$
;

CREATE OR REPLACE FUNCTION public.qr_reservation_owner(r qr_reservations)
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select coalesce(
    r.venue_owner_id,
    (select v.owner_id from venues v where v.slug = r.venue_slug limit 1)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.qr_reservation_referrer()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.qr_code_id is null then
    new.referrer_id := null;
    new.referrer_name := null;
    return new;
  end if;
  select q.user_id,
         coalesce(nullif(hp.hotel_name, ''), nullif(p.venue_name, ''),
                  nullif(p.full_name, ''), 'Hôtel partenaire')
    into new.referrer_id, new.referrer_name
    from hotel_qr_codes q
    left join hotel_profiles hp on hp.user_id = q.user_id
    left join profiles p on p.id = q.user_id
   where q.id = new.qr_code_id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.qr_track_scan(p_code text)
 RETURNS TABLE(label text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_role_to_app_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_role text := new.raw_user_meta_data->>'role';
begin
  if coalesce((new.raw_app_meta_data->>'is_admin')::boolean, false) then
    v_role := 'admin';
  elsif v_role is null or v_role not in ('etablissement', 'hotel', 'concierge') then
    v_role := 'etablissement';
  end if;

  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', v_role);
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', v_role);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.venue_create_reservation(p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text DEFAULT NULL::text, p_table_id bigint DEFAULT NULL::bigint)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.venue_referrers()
 RETURNS TABLE(referrer_id uuid, referrer_name text, reservations bigint, covers bigint, revenue numeric, commissions numeric, last_reservation date, avg_rating numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    q.user_id,
    coalesce(p.venue_name, p.full_name, 'Hôtel partenaire'),
    count(*),
    coalesce(sum(r.party_size), 0),
    coalesce(sum(r.amount_spent), 0),
    coalesce(sum(r.commission), 0),
    max(r.reservation_date),
    avg(r.rating)
  from qr_reservations r
  join hotel_qr_codes q on q.id = r.qr_code_id
  left join profiles p on p.id = q.user_id
  where r.source = 'qr'
    and r.status not in ('annulée', 'no-show')
    and (
      r.venue_owner_id = auth.uid()
      or exists (
        select 1 from venues v
        where v.slug = r.venue_slug and v.owner_id = auth.uid()
      )
    )
  group by q.user_id, coalesce(p.venue_name, p.full_name, 'Hôtel partenaire')
  order by count(*) desc;
$function$
;

CREATE OR REPLACE FUNCTION public.venue_services_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  if new.venue_slug is null then
    select v.slug into new.venue_slug
      from venues v
     where v.owner_id = new.owner_id
     order by v.created_at
     limit 1;
  end if;
  return new;
end;
$function$
;

-- ─── Clés primaires, contraintes d'unicité et de vérification ──────────────

alter table only public.admin_audit add constraint admin_audit_pkey PRIMARY KEY (id);

alter table only public.app_errors add constraint app_errors_app_version_check CHECK ((char_length(app_version) <= 40));

alter table only public.app_errors add constraint app_errors_context_check CHECK ((char_length(context) <= 200));

alter table only public.app_errors add constraint app_errors_device_check CHECK ((char_length(device) <= 80));

alter table only public.app_errors add constraint app_errors_kind_check CHECK ((kind = ANY (ARRAY['crash'::text, 'message'::text, 'unhandled'::text])));

alter table only public.app_errors add constraint app_errors_message_check CHECK ((char_length(message) <= 2000));

alter table only public.app_errors add constraint app_errors_os_version_check CHECK ((char_length(os_version) <= 40));

alter table only public.app_errors add constraint app_errors_pkey PRIMARY KEY (id);

alter table only public.app_errors add constraint app_errors_platform_check CHECK ((char_length(platform) <= 20));

alter table only public.app_errors add constraint app_errors_stack_check CHECK ((char_length(stack) <= 8000));

alter table only public.catalog_offers add constraint catalog_offers_category_check CHECK ((category = ANY (ARRAY['restaurants'::text, 'activites'::text, 'clubs'::text, 'services'::text])));

alter table only public.catalog_offers add constraint catalog_offers_city_check CHECK (((city IS NULL) OR (char_length(city) <= 80)));

alter table only public.catalog_offers add constraint catalog_offers_description_check CHECK ((char_length(description) <= 300));

alter table only public.catalog_offers add constraint catalog_offers_image_url_check CHECK (((image_url IS NULL) OR (char_length(image_url) <= 500)));

alter table only public.catalog_offers add constraint catalog_offers_images_check CHECK ((COALESCE(array_length(images, 1), 0) <= 8));

alter table only public.catalog_offers add constraint catalog_offers_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 120)));

alter table only public.catalog_offers add constraint catalog_offers_pkey PRIMARY KEY (slug);

alter table only public.catalog_offers add constraint catalog_offers_price_check CHECK (((price IS NULL) OR (char_length(price) <= 40)));

alter table only public.catalog_offers add constraint catalog_offers_slug_check CHECK ((slug ~ '^[a-z0-9][a-z0-9-]{1,39}$'::text));

alter table only public.catalog_offers add constraint catalog_offers_tag_check CHECK ((char_length(tag) <= 40));

alter table only public.commission_settlements add constraint commission_settlements_note_check CHECK ((char_length(note) <= 300));

alter table only public.commission_settlements add constraint commission_settlements_period_check CHECK ((period ~ '^\d{4}-\d{2}$'::text));

alter table only public.commission_settlements add constraint commission_settlements_period_venue_owner_id_hotel_id_key UNIQUE (period, venue_owner_id, hotel_id);

alter table only public.commission_settlements add constraint commission_settlements_pkey PRIMARY KEY (id);

alter table only public.conversations add constraint conversations_check CHECK ((venue_id <> concierge_id));

alter table only public.conversations add constraint conversations_pkey PRIMARY KEY (id);

alter table only public.conversations add constraint conversations_venue_id_concierge_id_key UNIQUE (venue_id, concierge_id);

alter table only public.email_optouts add constraint email_optouts_email_check CHECK ((email = lower(email)));

alter table only public.email_optouts add constraint email_optouts_email_check1 CHECK ((POSITION(('@'::text) IN (email)) > 1));

alter table only public.email_optouts add constraint email_optouts_email_check2 CHECK (((char_length(email) >= 5) AND (char_length(email) <= 320)));

alter table only public.email_optouts add constraint email_optouts_pkey PRIMARY KEY (email);

alter table only public.email_optouts add constraint email_optouts_reason_check CHECK ((char_length(reason) <= 500));

alter table only public.email_optouts add constraint email_optouts_source_check CHECK ((char_length(source) <= 40));

alter table only public.hotel_offers add constraint hotel_offers_category_check CHECK ((category = ANY (ARRAY['restaurants'::text, 'activites'::text, 'clubs'::text, 'services'::text])));

alter table only public.hotel_offers add constraint hotel_offers_description_check CHECK ((char_length(description) <= 300));

alter table only public.hotel_offers add constraint hotel_offers_image_url_check CHECK (((image_url IS NULL) OR (char_length(image_url) <= 500)));

alter table only public.hotel_offers add constraint hotel_offers_images_check CHECK ((COALESCE(array_length(images, 1), 0) <= 8));

alter table only public.hotel_offers add constraint hotel_offers_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 120)));

alter table only public.hotel_offers add constraint hotel_offers_pkey PRIMARY KEY (id);

alter table only public.hotel_offers add constraint hotel_offers_price_check CHECK (((price IS NULL) OR (char_length(price) <= 40)));

alter table only public.hotel_offers add constraint hotel_offers_slug_key UNIQUE (slug);

alter table only public.hotel_offers add constraint hotel_offers_tag_check CHECK ((char_length(tag) <= 40));

alter table only public.hotel_profiles add constraint hotel_profiles_accent_color_check CHECK ((accent_color ~ '^#[0-9a-fA-F]{6}$'::text));

alter table only public.hotel_profiles add constraint hotel_profiles_background_color_check CHECK ((background_color ~ '^#[0-9a-fA-F]{6}$'::text));

alter table only public.hotel_profiles add constraint hotel_profiles_city_check CHECK ((char_length(city) <= 80));

alter table only public.hotel_profiles add constraint hotel_profiles_cover_url_check CHECK (((cover_url IS NULL) OR (char_length(cover_url) <= 500)));

alter table only public.hotel_profiles add constraint hotel_profiles_hotel_name_check CHECK ((char_length(hotel_name) <= 120));

alter table only public.hotel_profiles add constraint hotel_profiles_pkey PRIMARY KEY (user_id);

alter table only public.hotel_profiles add constraint hotel_profiles_reception_phone_check CHECK ((char_length(reception_phone) <= 40));

alter table only public.hotel_profiles add constraint hotel_profiles_welcome_message_check CHECK ((char_length(welcome_message) <= 240));

alter table only public.hotel_qr_codes add constraint hotel_qr_codes_code_key UNIQUE (code);

alter table only public.hotel_qr_codes add constraint hotel_qr_codes_pkey PRIMARY KEY (id);

alter table only public.messages add constraint messages_body_check CHECK (((char_length(body) >= 1) AND (char_length(body) <= 4000)));

alter table only public.messages add constraint messages_pkey PRIMARY KEY (id);

alter table only public.pos_events add constraint pos_events_pkey PRIMARY KEY (id);

alter table only public.pos_events add constraint pos_events_status_check CHECK ((status = ANY (ARRAY['matched'::text, 'unmatched'::text, 'duplicate'::text])));

alter table only public.profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table only public.push_tokens add constraint push_tokens_pkey PRIMARY KEY (token);

alter table only public.push_tokens add constraint push_tokens_platform_check CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text])));

alter table only public.qr_reservations add constraint qr_reservations_amount_source_check CHECK ((amount_source = ANY (ARRAY['manuel'::text, 'pos'::text])));

alter table only public.qr_reservations add constraint qr_reservations_amount_spent_check CHECK (((amount_spent IS NULL) OR (amount_spent >= (0)::numeric)));

alter table only public.qr_reservations add constraint qr_reservations_commission_rate_check CHECK (((commission_rate >= (0)::numeric) AND (commission_rate <= (1)::numeric)));

alter table only public.qr_reservations add constraint qr_reservations_party_size_check CHECK (((party_size >= 1) AND (party_size <= 50)));

alter table only public.qr_reservations add constraint qr_reservations_pkey PRIMARY KEY (id);

alter table only public.qr_reservations add constraint qr_reservations_rating_check CHECK (((rating IS NULL) OR ((rating >= 1) AND (rating <= 5))));

alter table only public.qr_reservations add constraint qr_reservations_service_name_check CHECK (((service_name IS NULL) OR (char_length(service_name) <= 80)));

alter table only public.qr_reservations add constraint qr_reservations_source_check CHECK ((source = ANY (ARRAY['qr'::text, 'portal'::text, 'venue'::text])));

alter table only public.qr_reservations add constraint qr_reservations_status_check CHECK ((status = ANY (ARRAY['en attente'::text, 'confirmée'::text, 'annulée'::text, 'no-show'::text])));

alter table only public.venue_events add constraint venue_events_pkey PRIMARY KEY (id);

alter table only public.venue_events add constraint venue_events_status_check CHECK ((status = ANY (ARRAY['Ouvert'::text, 'Bientôt complet'::text, 'Fermé'::text, 'Brouillon'::text])));

alter table only public.venue_integrations add constraint venue_integrations_pkey PRIMARY KEY (owner_id);

alter table only public.venue_integrations add constraint venue_integrations_status_check CHECK ((status = ANY (ARRAY['inactive'::text, 'active'::text])));

alter table only public.venue_notifications add constraint venue_notifications_kind_check CHECK ((kind = ANY (ARRAY['reservation'::text, 'rating'::text, 'pos'::text])));

alter table only public.venue_notifications add constraint venue_notifications_pkey PRIMARY KEY (id);

alter table only public.venue_portals add constraint venue_portals_accent_color_check CHECK ((accent_color ~ '^#[0-9a-fA-F]{6}$'::text));

alter table only public.venue_portals add constraint venue_portals_background_color_check CHECK ((background_color ~ '^#[0-9a-fA-F]{6}$'::text));

alter table only public.venue_portals add constraint venue_portals_cover_url_check CHECK (((cover_url IS NULL) OR (char_length(cover_url) <= 500)));

alter table only public.venue_portals add constraint venue_portals_display_name_check CHECK (((char_length(display_name) >= 1) AND (char_length(display_name) <= 80)));

alter table only public.venue_portals add constraint venue_portals_end_time_check CHECK ((end_time ~ '^\d{2}:\d{2}$'::text));

alter table only public.venue_portals add constraint venue_portals_interval_minutes_check CHECK ((interval_minutes = ANY (ARRAY[15, 30, 60])));

alter table only public.venue_portals add constraint venue_portals_party_max_check CHECK (((party_max >= 1) AND (party_max <= 20)));

alter table only public.venue_portals add constraint venue_portals_pkey PRIMARY KEY (owner_id);

alter table only public.venue_portals add constraint venue_portals_slug_check CHECK ((slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'::text));

alter table only public.venue_portals add constraint venue_portals_slug_key UNIQUE (slug);

alter table only public.venue_portals add constraint venue_portals_start_time_check CHECK ((start_time ~ '^\d{2}:\d{2}$'::text));

alter table only public.venue_portals add constraint venue_portals_tagline_check CHECK ((char_length(tagline) <= 160));

alter table only public.venue_services add constraint venue_services_description_check CHECK ((char_length(description) <= 300));

alter table only public.venue_services add constraint venue_services_duration_check CHECK ((char_length(duration) <= 40));

alter table only public.venue_services add constraint venue_services_image_url_check CHECK (((image_url IS NULL) OR (char_length(image_url) <= 500)));

alter table only public.venue_services add constraint venue_services_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 80)));

alter table only public.venue_services add constraint venue_services_pkey PRIMARY KEY (id);

alter table only public.venue_services add constraint venue_services_price_check CHECK ((char_length(price) <= 40));

alter table only public.venue_tables add constraint venue_tables_capacity_check CHECK (((capacity >= 1) AND (capacity <= 50)));

alter table only public.venue_tables add constraint venue_tables_pkey PRIMARY KEY (id);

alter table only public.venue_tables add constraint venue_tables_shape_check CHECK ((shape = ANY (ARRAY['round'::text, 'rect'::text])));

alter table only public.venue_tables add constraint venue_tables_status_check CHECK ((status = ANY (ARRAY['available'::text, 'occupied'::text, 'blocked'::text])));

alter table only public.venues add constraint venues_pkey PRIMARY KEY (slug);

-- ─── Clés étrangères ───────────────────────────────────────────────────────

alter table only public.admin_audit add constraint admin_audit_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table only public.admin_audit add constraint admin_audit_target_id_fkey FOREIGN KEY (target_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table only public.app_errors add constraint app_errors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table only public.commission_settlements add constraint commission_settlements_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.commission_settlements add constraint commission_settlements_settled_by_fkey FOREIGN KEY (settled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table only public.commission_settlements add constraint commission_settlements_venue_owner_id_fkey FOREIGN KEY (venue_owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.conversations add constraint conversations_concierge_id_fkey FOREIGN KEY (concierge_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table only public.conversations add constraint conversations_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table only public.hotel_offers add constraint hotel_offers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.hotel_profiles add constraint hotel_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.hotel_qr_codes add constraint hotel_qr_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.messages add constraint messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

alter table only public.messages add constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table only public.pos_events add constraint pos_events_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.pos_events add constraint pos_events_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES qr_reservations(id) ON DELETE SET NULL;

alter table only public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.push_tokens add constraint push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.qr_reservations add constraint qr_reservations_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES hotel_qr_codes(id) ON DELETE CASCADE;

alter table only public.qr_reservations add constraint qr_reservations_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table only public.qr_reservations add constraint qr_reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES venue_tables(id) ON DELETE SET NULL;

alter table only public.qr_reservations add constraint qr_reservations_venue_owner_id_fkey FOREIGN KEY (venue_owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table only public.venue_events add constraint venue_events_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.venue_integrations add constraint venue_integrations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.venue_notifications add constraint venue_notifications_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.venue_portals add constraint venue_portals_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.venue_services add constraint venue_services_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.venue_services add constraint venue_services_venue_slug_fkey FOREIGN KEY (venue_slug) REFERENCES venues(slug) ON DELETE CASCADE;

alter table only public.venue_tables add constraint venue_tables_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table only public.venues add constraint venues_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── Index ─────────────────────────────────────────────────────────────────

CREATE INDEX app_errors_created_at_idx ON public.app_errors USING btree (created_at DESC);

CREATE INDEX conversations_concierge_idx ON public.conversations USING btree (concierge_id);

CREATE INDEX conversations_venue_idx ON public.conversations USING btree (venue_id);

CREATE INDEX hotel_offers_user_id_idx ON public.hotel_offers USING btree (user_id);

CREATE INDEX hotel_qr_codes_user_id_idx ON public.hotel_qr_codes USING btree (user_id);

CREATE INDEX messages_conversation_created_idx ON public.messages USING btree (conversation_id, created_at);

CREATE INDEX pos_events_owner_idx ON public.pos_events USING btree (owner_id, created_at DESC);

CREATE UNIQUE INDEX pos_events_ticket_uniq ON public.pos_events USING btree (owner_id, ticket_id) WHERE ((ticket_id IS NOT NULL) AND (status = 'matched'::text));

CREATE INDEX push_tokens_user_idx ON public.push_tokens USING btree (user_id);

CREATE INDEX qr_reservations_owner_created_idx ON public.qr_reservations USING btree (venue_owner_id, created_at DESC);

CREATE INDEX qr_reservations_phone_idx ON public.qr_reservations USING btree (guest_phone, created_at DESC);

CREATE INDEX qr_reservations_qr_code_id_idx ON public.qr_reservations USING btree (qr_code_id, created_at DESC);

CREATE INDEX qr_reservations_table_idx ON public.qr_reservations USING btree (table_id);

CREATE INDEX qr_reservations_venue_slug_idx ON public.qr_reservations USING btree (venue_slug);

CREATE INDEX venue_events_owner_idx ON public.venue_events USING btree (owner_id);

CREATE INDEX venue_notifications_owner_idx ON public.venue_notifications USING btree (owner_id, created_at DESC);

CREATE INDEX venue_services_owner_idx ON public.venue_services USING btree (owner_id, sort_order);

CREATE INDEX venue_services_slug_idx ON public.venue_services USING btree (venue_slug, sort_order) WHERE active;

CREATE INDEX venue_tables_owner_idx ON public.venue_tables USING btree (owner_id);

-- ─── Déclencheurs (public et auth.users) ───────────────────────────────────

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_flag_admin BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION flag_internal_admin();

CREATE TRIGGER on_auth_user_created_sync_role BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION sync_role_to_app_metadata();

CREATE TRIGGER trg_catalog_sync_venue BEFORE INSERT OR UPDATE ON public.catalog_offers FOR EACH ROW EXECUTE FUNCTION catalog_sync_venue();

CREATE TRIGGER trg_push_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION push_new_message();

CREATE TRIGGER trg_notify_pos_unmatched AFTER INSERT ON public.pos_events FOR EACH ROW EXECUTE FUNCTION notify_pos_unmatched();

CREATE TRIGGER trg_notify_new_rating AFTER UPDATE ON public.qr_reservations FOR EACH ROW EXECUTE FUNCTION notify_new_rating();

CREATE TRIGGER trg_notify_new_reservation AFTER INSERT ON public.qr_reservations FOR EACH ROW EXECUTE FUNCTION notify_new_reservation();

CREATE TRIGGER trg_push_hotel_reservation AFTER INSERT ON public.qr_reservations FOR EACH ROW EXECUTE FUNCTION push_hotel_reservation();

CREATE TRIGGER trg_qr_apply_commission BEFORE INSERT OR UPDATE ON public.qr_reservations FOR EACH ROW EXECUTE FUNCTION qr_apply_commission();

CREATE TRIGGER trg_qr_lock_pos_amount BEFORE UPDATE OF amount_spent ON public.qr_reservations FOR EACH ROW EXECUTE FUNCTION qr_lock_pos_amount();

CREATE TRIGGER trg_qr_reservation_referrer BEFORE INSERT OR UPDATE OF qr_code_id ON public.qr_reservations FOR EACH ROW EXECUTE FUNCTION qr_reservation_referrer();

CREATE TRIGGER trg_push_venue_notification AFTER INSERT ON public.venue_notifications FOR EACH ROW EXECUTE FUNCTION push_venue_notification();

CREATE TRIGGER trg_venue_services_defaults BEFORE INSERT OR UPDATE ON public.venue_services FOR EACH ROW EXECUTE FUNCTION venue_services_defaults();

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table public.admin_audit enable row level security;

alter table public.app_errors enable row level security;

alter table public.catalog_offers enable row level security;

alter table public.commission_settlements enable row level security;

alter table public.conversations enable row level security;

alter table public.email_optouts enable row level security;

alter table public.hotel_offers enable row level security;

alter table public.hotel_profiles enable row level security;

alter table public.hotel_qr_codes enable row level security;

alter table public.messages enable row level security;

alter table public.pos_events enable row level security;

alter table public.profiles enable row level security;

alter table public.push_tokens enable row level security;

alter table public.qr_reservations enable row level security;

alter table public.venue_events enable row level security;

alter table public.venue_integrations enable row level security;

alter table public.venue_notifications enable row level security;

alter table public.venue_portals enable row level security;

alter table public.venue_services enable row level security;

alter table public.venue_tables enable row level security;

alter table public.venues enable row level security;

-- ─── Règles d'accès (public et storage) ────────────────────────────────────

create policy admin_audit_select_admin on public.admin_audit as permissive for select to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy "admin lit les erreurs" on public.app_errors as permissive for select to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy "app écrit ses erreurs" on public.app_errors as permissive for insert to anon, authenticated
  with check (((user_id IS NULL) OR (user_id = auth.uid())));

create policy "admin gère le catalogue" on public.catalog_offers as permissive for all to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false))
  with check (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy "catalogue lisible" on public.catalog_offers as permissive for select to anon, authenticated
  using ((active OR COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false)));

create policy "admin gère les règlements" on public.commission_settlements as permissive for all to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false))
  with check (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy "hôtel lit ses règlements" on public.commission_settlements as permissive for select to authenticated
  using ((hotel_id = auth.uid()));

create policy "établissement lit ses règlements" on public.commission_settlements as permissive for select to authenticated
  using ((venue_owner_id = auth.uid()));

create policy conversations_insert_participant on public.conversations as permissive for insert to authenticated
  with check (((auth.uid() = venue_id) OR (auth.uid() = concierge_id)));

create policy conversations_select_admin on public.conversations as permissive for select to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy conversations_select_participant on public.conversations as permissive for select to authenticated
  using (((auth.uid() = venue_id) OR (auth.uid() = concierge_id)));

create policy "desinscription ouverte" on public.email_optouts as permissive for insert to anon, authenticated
  with check (true);

create policy "desinscriptions lisibles par l'admin" on public.email_optouts as permissive for select to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy "hotel gère ses adresses" on public.hotel_offers as permissive for all to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "hotel crée son profil" on public.hotel_profiles as permissive for insert to authenticated
  with check ((auth.uid() = user_id));

create policy "hotel lit son profil" on public.hotel_profiles as permissive for select to authenticated
  using ((auth.uid() = user_id));

create policy "hotel met à jour son profil" on public.hotel_profiles as permissive for update to authenticated
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Hotels can create own QR codes" on public.hotel_qr_codes as permissive for insert to public
  with check ((auth.uid() = user_id));

create policy "Hotels can delete own QR codes" on public.hotel_qr_codes as permissive for delete to public
  using ((auth.uid() = user_id));

create policy "Hotels can update own QR codes" on public.hotel_qr_codes as permissive for update to public
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

create policy "Hotels can view own QR codes" on public.hotel_qr_codes as permissive for select to public
  using ((auth.uid() = user_id));

create policy messages_insert_sender on public.messages as permissive for insert to authenticated
  with check (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((auth.uid() = c.venue_id) OR (auth.uid() = c.concierge_id)))))));

create policy messages_select_admin on public.messages as permissive for select to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy messages_select_participant on public.messages as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((auth.uid() = c.venue_id) OR (auth.uid() = c.concierge_id))))));

create policy messages_update_recipient on public.messages as permissive for update to authenticated
  using (((sender_id <> auth.uid()) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((auth.uid() = c.venue_id) OR (auth.uid() = c.concierge_id)))))))
  with check ((sender_id <> auth.uid()));

create policy "owner lit ses événements POS" on public.pos_events as permissive for select to authenticated
  using ((owner_id = auth.uid()));

create policy profiles_select_authenticated on public.profiles as permissive for select to authenticated
  using (true);

create policy profiles_update_admin on public.profiles as permissive for update to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false))
  with check (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy profiles_update_own on public.profiles as permissive for update to authenticated
  using ((auth.uid() = id))
  with check ((auth.uid() = id));

create policy "chacun enregistre son jeton" on public.push_tokens as permissive for insert to authenticated
  with check ((user_id = auth.uid()));

create policy "chacun lit ses jetons" on public.push_tokens as permissive for select to authenticated
  using ((user_id = auth.uid()));

create policy "chacun met à jour son jeton" on public.push_tokens as permissive for update to authenticated
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));

create policy "chacun retire son jeton" on public.push_tokens as permissive for delete to authenticated
  using ((user_id = auth.uid()));

create policy "admin lit les réservations" on public.qr_reservations as permissive for select to authenticated
  using (COALESCE((((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text))::boolean, false));

create policy "hotel lit les réservations de ses QR" on public.qr_reservations as permissive for select to authenticated
  using ((EXISTS ( SELECT 1
   FROM hotel_qr_codes q
  WHERE (q.id = qr_reservations.qr_code_id))));

create policy "venue lit ses réservations" on public.qr_reservations as permissive for select to authenticated
  using (((venue_owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM venues v
  WHERE ((v.slug = qr_reservations.venue_slug) AND (v.owner_id = auth.uid()))))));

create policy "venue saisit le montant de ses réservations" on public.qr_reservations as permissive for update to authenticated
  using (((venue_owner_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM venues v
  WHERE ((v.slug = qr_reservations.venue_slug) AND (v.owner_id = auth.uid()))))));

create policy "owner gère ses événements" on public.venue_events as permissive for all to authenticated
  using ((owner_id = auth.uid()))
  with check ((owner_id = auth.uid()));

create policy "owner lit son intégration" on public.venue_integrations as permissive for select to authenticated
  using ((owner_id = auth.uid()));

create policy "owner lit ses notifications" on public.venue_notifications as permissive for select to authenticated
  using ((owner_id = auth.uid()));

create policy "owner marque lu ou purge" on public.venue_notifications as permissive for update to authenticated
  using ((owner_id = auth.uid()))
  with check ((owner_id = auth.uid()));

create policy "owner supprime ses notifications" on public.venue_notifications as permissive for delete to authenticated
  using ((owner_id = auth.uid()));

create policy "owner gère son portail" on public.venue_portals as permissive for all to authenticated
  using ((owner_id = auth.uid()))
  with check ((owner_id = auth.uid()));

create policy "owner crée ses prestations" on public.venue_services as permissive for insert to authenticated
  with check ((owner_id = auth.uid()));

create policy "owner lit ses prestations" on public.venue_services as permissive for select to authenticated
  using ((owner_id = auth.uid()));

create policy "owner modifie ses prestations" on public.venue_services as permissive for update to authenticated
  using ((owner_id = auth.uid()))
  with check ((owner_id = auth.uid()));

create policy "owner supprime ses prestations" on public.venue_services as permissive for delete to authenticated
  using ((owner_id = auth.uid()));

create policy "owner gère ses tables" on public.venue_tables as permissive for all to authenticated
  using ((owner_id = auth.uid()))
  with check ((owner_id = auth.uid()));

create policy "owner lit sa fiche venue" on public.venues as permissive for select to authenticated
  using ((owner_id = auth.uid()));

create policy "Avatar images are publicly readable" on storage.objects as permissive for select to public
  using ((bucket_id = 'avatars'::text));

create policy "Users can delete their own avatar" on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Users can update their own avatar" on storage.objects as permissive for update to authenticated
  using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
  with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

create policy "Users can upload their own avatar" on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

-- ─── Droits sur les tables ─────────────────────────────────────────────────

revoke all on table public.admin_audit from anon, authenticated;
grant select on table public.admin_audit to authenticated;

revoke all on table public.app_errors from anon, authenticated;
grant insert, maintain, references, trigger, truncate on table public.app_errors to anon;
grant insert, maintain, references, select, trigger, truncate on table public.app_errors to authenticated;

revoke all on table public.catalog_offers from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.catalog_offers to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.catalog_offers to authenticated;

revoke all on table public.commission_settlements from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.commission_settlements to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.commission_settlements to authenticated;

revoke all on table public.conversations from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.conversations to authenticated;

revoke all on table public.email_optouts from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.email_optouts to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.email_optouts to authenticated;

revoke all on table public.hotel_offers from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.hotel_offers to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.hotel_offers to authenticated;

revoke all on table public.hotel_profiles from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.hotel_profiles to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.hotel_profiles to authenticated;

revoke all on table public.hotel_qr_codes from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.hotel_qr_codes to authenticated;

revoke all on table public.messages from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate on table public.messages to authenticated;

revoke all on table public.pos_events from anon, authenticated;
grant maintain, references, select, trigger, truncate on table public.pos_events to anon;
grant maintain, references, select, trigger, truncate on table public.pos_events to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant delete, maintain, references, select, trigger, truncate on table public.profiles to authenticated;

revoke all on table public.push_tokens from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.push_tokens to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.push_tokens to authenticated;

revoke all on table public.qr_reservations from anon, authenticated;
grant maintain, references, select, trigger, truncate on table public.qr_reservations to anon;
grant maintain, references, select, trigger, truncate on table public.qr_reservations to authenticated;

revoke all on table public.venue_events from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_events to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_events to authenticated;

revoke all on table public.venue_integrations from anon, authenticated;
grant maintain, references, select, trigger, truncate on table public.venue_integrations to anon;
grant maintain, references, select, trigger, truncate on table public.venue_integrations to authenticated;

revoke all on table public.venue_notifications from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_notifications to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_notifications to authenticated;

revoke all on table public.venue_portals from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_portals to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_portals to authenticated;

revoke all on table public.venue_services from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_services to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_services to authenticated;

revoke all on table public.venue_tables from anon, authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_tables to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.venue_tables to authenticated;

revoke all on table public.venues from anon, authenticated;
grant maintain, references, select, trigger, truncate on table public.venues to anon;
grant maintain, references, select, trigger, truncate on table public.venues to authenticated;

-- ─── Droits par colonne ────────────────────────────────────────────────────

grant update (read_at) on table public.messages to authenticated;

grant update (city) on table public.profiles to authenticated;

grant update (full_name) on table public.profiles to authenticated;

grant update (venue_name) on table public.profiles to authenticated;

grant update (amount_spent) on table public.qr_reservations to authenticated;

grant update (arrived_at) on table public.qr_reservations to authenticated;

grant update (status) on table public.qr_reservations to authenticated;

grant update (table_id) on table public.qr_reservations to authenticated;

grant update (read) on table public.venue_notifications to authenticated;

-- ─── Droits sur les fonctions ──────────────────────────────────────────────

revoke all on function public.admin_account_overview() from public, anon, authenticated;
grant execute on function public.admin_account_overview() to authenticated;

revoke all on function public.admin_commission_ledger() from public, anon, authenticated;
grant execute on function public.admin_commission_ledger() to authenticated;

revoke all on function public.admin_set_role(target_id uuid, new_role text) from public, anon, authenticated;
grant execute on function public.admin_set_role(target_id uuid, new_role text) to authenticated;

revoke all on function public.catalog_sync_venue() from public, anon, authenticated;

revoke all on function public.flag_internal_admin() from public, anon, authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.notify_new_rating() from public, anon, authenticated;

revoke all on function public.notify_new_reservation() from public, anon, authenticated;

revoke all on function public.notify_pos_unmatched() from public, anon, authenticated;

revoke all on function public.portal_create_reservation(p_slug text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text) from public, anon, authenticated;
grant execute on function public.portal_create_reservation(p_slug text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text) to anon;
grant execute on function public.portal_create_reservation(p_slug text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text) to authenticated;

revoke all on function public.portal_full_slots(p_slug text, p_date date) from public, anon, authenticated;
grant execute on function public.portal_full_slots(p_slug text, p_date date) to anon;
grant execute on function public.portal_full_slots(p_slug text, p_date date) to authenticated;

revoke all on function public.portal_get(p_slug text) from public, anon, authenticated;
grant execute on function public.portal_get(p_slug text) to anon;
grant execute on function public.portal_get(p_slug text) to authenticated;

revoke all on function public.pos_rotate_key(p_provider text) from public, anon, authenticated;
grant execute on function public.pos_rotate_key(p_provider text) to authenticated;

revoke all on function public.push_hotel_reservation() from public, anon, authenticated;

revoke all on function public.push_new_message() from public, anon, authenticated;

revoke all on function public.push_to_user(p_user uuid, p_title text, p_body text, p_url text) from public, anon, authenticated;

revoke all on function public.push_venue_notification() from public, anon, authenticated;

revoke all on function public.qr_apply_commission() from public, anon, authenticated;
grant execute on function public.qr_apply_commission() to public;
grant execute on function public.qr_apply_commission() to anon;
grant execute on function public.qr_apply_commission() to authenticated;

revoke all on function public.qr_create_reservation(p_code text, p_category text, p_venue text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text, p_venue_slug text, p_service text) from public, anon, authenticated;
grant execute on function public.qr_create_reservation(p_code text, p_category text, p_venue text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text, p_venue_slug text, p_service text) to anon;
grant execute on function public.qr_create_reservation(p_code text, p_category text, p_venue text, p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text, p_venue_slug text, p_service text) to authenticated;

revoke all on function public.qr_get_menu(p_code text) from public, anon, authenticated;
grant execute on function public.qr_get_menu(p_code text) to anon;
grant execute on function public.qr_get_menu(p_code text) to authenticated;

revoke all on function public.qr_lock_pos_amount() from public, anon, authenticated;
grant execute on function public.qr_lock_pos_amount() to public;

revoke all on function public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text) from public, anon, authenticated;
grant execute on function public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text) to anon;
grant execute on function public.qr_rate_reservation(p_id uuid, p_rating integer, p_comment text) to authenticated;

revoke all on function public.qr_rating_context(p_id uuid) from public, anon, authenticated;
grant execute on function public.qr_rating_context(p_id uuid) to anon;
grant execute on function public.qr_rating_context(p_id uuid) to authenticated;

revoke all on function public.qr_reservation_owner(r qr_reservations) from public, anon, authenticated;
grant execute on function public.qr_reservation_owner(r qr_reservations) to public;
grant execute on function public.qr_reservation_owner(r qr_reservations) to anon;
grant execute on function public.qr_reservation_owner(r qr_reservations) to authenticated;

revoke all on function public.qr_reservation_referrer() from public, anon, authenticated;

revoke all on function public.qr_track_scan(p_code text) from public, anon, authenticated;
grant execute on function public.qr_track_scan(p_code text) to anon;
grant execute on function public.qr_track_scan(p_code text) to authenticated;

revoke all on function public.sync_role_to_app_metadata() from public, anon, authenticated;

revoke all on function public.venue_create_reservation(p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text, p_table_id bigint) from public, anon, authenticated;
grant execute on function public.venue_create_reservation(p_guest_name text, p_guest_phone text, p_date date, p_time text, p_party_size integer, p_notes text, p_table_id bigint) to authenticated;

revoke all on function public.venue_referrers() from public, anon, authenticated;
grant execute on function public.venue_referrers() to authenticated;

revoke all on function public.venue_services_defaults() from public, anon, authenticated;

-- ─── Droits sur les séquences ──────────────────────────────────────────────

grant select on sequence public.admin_audit_id_seq to anon;
grant update on sequence public.admin_audit_id_seq to anon;
grant usage on sequence public.admin_audit_id_seq to anon;
grant select on sequence public.admin_audit_id_seq to authenticated;
grant update on sequence public.admin_audit_id_seq to authenticated;
grant usage on sequence public.admin_audit_id_seq to authenticated;

grant select on sequence public.app_errors_id_seq to anon;
grant update on sequence public.app_errors_id_seq to anon;
grant usage on sequence public.app_errors_id_seq to anon;
grant select on sequence public.app_errors_id_seq to authenticated;
grant update on sequence public.app_errors_id_seq to authenticated;
grant usage on sequence public.app_errors_id_seq to authenticated;

grant select on sequence public.messages_id_seq to anon;
grant update on sequence public.messages_id_seq to anon;
grant usage on sequence public.messages_id_seq to anon;
grant select on sequence public.messages_id_seq to authenticated;
grant update on sequence public.messages_id_seq to authenticated;
grant usage on sequence public.messages_id_seq to authenticated;

grant select on sequence public.pos_events_id_seq to anon;
grant update on sequence public.pos_events_id_seq to anon;
grant usage on sequence public.pos_events_id_seq to anon;
grant select on sequence public.pos_events_id_seq to authenticated;
grant update on sequence public.pos_events_id_seq to authenticated;
grant usage on sequence public.pos_events_id_seq to authenticated;

grant select on sequence public.venue_events_id_seq to anon;
grant update on sequence public.venue_events_id_seq to anon;
grant usage on sequence public.venue_events_id_seq to anon;
grant select on sequence public.venue_events_id_seq to authenticated;
grant update on sequence public.venue_events_id_seq to authenticated;
grant usage on sequence public.venue_events_id_seq to authenticated;

grant select on sequence public.venue_notifications_id_seq to anon;
grant update on sequence public.venue_notifications_id_seq to anon;
grant usage on sequence public.venue_notifications_id_seq to anon;
grant select on sequence public.venue_notifications_id_seq to authenticated;
grant update on sequence public.venue_notifications_id_seq to authenticated;
grant usage on sequence public.venue_notifications_id_seq to authenticated;

grant select on sequence public.venue_tables_id_seq to anon;
grant update on sequence public.venue_tables_id_seq to anon;
grant usage on sequence public.venue_tables_id_seq to anon;
grant select on sequence public.venue_tables_id_seq to authenticated;
grant update on sequence public.venue_tables_id_seq to authenticated;
grant usage on sequence public.venue_tables_id_seq to authenticated;

-- ─── Droits par défaut du schéma public ────────────────────────────────────

-- droits par défaut de postgres sur les objets de type S : {postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres}

-- droits par défaut de postgres sur les objets de type f : {postgres=X/postgres,service_role=X/postgres}

-- droits par défaut de postgres sur les objets de type r : {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}

-- droits par défaut de supabase_admin sur les objets de type S : {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}

-- droits par défaut de supabase_admin sur les objets de type f : {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}

-- droits par défaut de supabase_admin sur les objets de type r : {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}

-- ─── Stockage ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('avatars', 'avatars', true, 2097152, '{image/jpeg,image/png,image/webp,image/gif}') on conflict (id) do nothing;

-- ─── Publication temps réel ────────────────────────────────────────────────

alter publication supabase_realtime add table public.commission_settlements;

alter publication supabase_realtime add table public.hotel_qr_codes;

alter publication supabase_realtime add table public.messages;

alter publication supabase_realtime add table public.profiles;

alter publication supabase_realtime add table public.qr_reservations;

alter publication supabase_realtime add table public.venue_notifications;

alter publication supabase_realtime add table public.venue_tables;

-- ─── Commentaires ──────────────────────────────────────────────────────────

comment on table public.email_optouts is 'Adresses ayant demandé à ne plus recevoir de messages de prospection. À soustraire de tout fichier d''envoi.';

