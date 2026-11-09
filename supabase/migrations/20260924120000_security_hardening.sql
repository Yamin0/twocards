-- Durcissement sécurité (audit du 24/09/2026).
--
-- 1. Droits d'exécution : Supabase accorde EXECUTE à anon et authenticated
--    directement, pas via PUBLIC. Les « revoke … from public » des migrations
--    précédentes ne retiraient donc rien : push_to_user, pos_rotate_key, les
--    fonctions trigger, etc. étaient appelables par n'importe qui. On retire
--    tout, puis on rend fonction par fonction ce que l'app appelle vraiment.
-- 2. Rôles : le rôle venait des métadonnées fournies par le client à
--    l'inscription, et la colonne profiles.role était modifiable par son
--    propriétaire. Le rôle ne se change plus que par admin_set_role.
-- 3. Réservations publiques : l'établissement ciblé par un QR doit figurer
--    au menu de l'hôtel, la date doit être plausible, et le débit est limité.
-- 4. Montant poussé par la caisse : l'établissement ne peut plus le modifier
--    (la commission en dépend).
-- 5. pos_rotate_key réservé aux établissements ; search_path figé partout.

-- ─── 1. Droits d'exécution ──────────────────────────────────────────────────

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end;
$$;

-- Parcours publics (convive non connecté) : portail direct, menu QR, avis.
grant execute on function public.portal_get(text) to anon, authenticated;
grant execute on function public.portal_full_slots(text, date) to anon, authenticated;
grant execute on function public.portal_create_reservation(text, text, text, date, text, integer, text) to anon, authenticated;
grant execute on function public.qr_get_menu(text) to anon, authenticated;
grant execute on function public.qr_track_scan(text) to anon, authenticated;
grant execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) to anon, authenticated;
grant execute on function public.qr_rating_context(uuid) to anon, authenticated;
grant execute on function public.qr_rate_reservation(uuid, integer, text) to anon, authenticated;

-- Back-office (connecté) : chaque fonction vérifie elle-même le compte.
grant execute on function public.admin_account_overview() to authenticated;
grant execute on function public.admin_commission_ledger() to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.pos_rotate_key(text) to authenticated;
grant execute on function public.venue_create_reservation(text, text, date, text, integer, text, bigint) to authenticated;
grant execute on function public.venue_referrers() to authenticated;

-- push_to_user et les fonctions trigger ne sont plus appelables par l'API :
-- les triggers n'ont pas besoin du droit EXECUTE pour se déclencher.

-- Les prochaines fonctions naîtront fermées : toute fonction appelée par
-- l'app devra recevoir un grant explicite (les migrations le font déjà).
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- ─── 2. Rôles ───────────────────────────────────────────────────────────────

-- Le propriétaire ne modifie plus que ses champs descriptifs ; la ligne est
-- créée par handle_new_user, jamais par le client.
revoke insert, update on public.profiles from anon, authenticated;
grant update (full_name, venue_name, city) on public.profiles to authenticated;

-- Rôle à l'inscription : liste blanche. « admin » ne s'obtient que par
-- flag_internal_admin (trigger BEFORE INSERT qui passe avant celui-ci, ordre
-- alphabétique : …_flag_admin < …_sync_role).
create or replace function public.sync_role_to_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

-- Le profil prend le rôle validé (app_metadata), plus celui du client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

-- ─── 3. Réservations publiques ──────────────────────────────────────────────

create index if not exists qr_reservations_phone_idx
  on public.qr_reservations (guest_phone, created_at desc);
create index if not exists qr_reservations_owner_created_idx
  on public.qr_reservations (venue_owner_id, created_at desc);

create or replace function public.qr_create_reservation(
  p_code text,
  p_category text,
  p_venue text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size integer,
  p_notes text,
  p_venue_slug text default null,
  p_service text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.portal_create_reservation(
  p_slug text,
  p_guest_name text,
  p_guest_phone text,
  p_date date,
  p_time text,
  p_party_size integer,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- create or replace conserve les droits, mais on les réaffirme.
revoke execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) from public;
revoke execute on function public.portal_create_reservation(text, text, text, date, text, integer, text) from public;
grant execute on function public.qr_create_reservation(text, text, text, text, text, date, text, integer, text, text, text) to anon, authenticated;
grant execute on function public.portal_create_reservation(text, text, text, date, text, integer, text) to anon, authenticated;

-- ─── 4. Montant poussé par la caisse ────────────────────────────────────────

-- Un montant venu de la caisse fait foi : seuls la caisse (service_role) et
-- l'administrateur peuvent le changer. Une saisie manuelle reste modifiable.
create or replace function public.qr_lock_pos_amount()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.amount_source = 'pos'
     and new.amount_spent is distinct from old.amount_spent
     and coalesce(auth.jwt()->>'role', '') = 'authenticated'
     and not coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false) then
    raise exception 'Montant transmis par la caisse : contactez twocards pour le corriger';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_qr_lock_pos_amount on public.qr_reservations;
create trigger trg_qr_lock_pos_amount
  before update of amount_spent on public.qr_reservations
  for each row execute function public.qr_lock_pos_amount();

-- ─── 5. Clé POS et search_path ──────────────────────────────────────────────

create or replace function public.pos_rotate_key(p_provider text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
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
$$;

revoke execute on function public.pos_rotate_key(text) from public, anon;
grant execute on function public.pos_rotate_key(text) to authenticated;

alter function public.qr_apply_commission() set search_path = '';
alter function public.qr_reservation_owner(public.qr_reservations) set search_path = public;
