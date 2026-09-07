-- Notifications push vers l'application mobile.
--
-- Le site prévient déjà l'établissement par sa cloche (venue_notifications).
-- Une cloche ne sert à rien quand le téléphone est dans la poche : ici, les
-- mêmes événements partent en notification système, plus les messages et les
-- demandes arrivant sur les QR d'un hôtel.
--
-- pg_net poste vers l'API Expo sans bloquer la transaction : une réservation
-- ne doit jamais échouer parce qu'un serveur de notifications répond mal.

create extension if not exists pg_net with schema extensions;

-- ── Jetons des appareils ───────────────────────────────────────────────

-- Un compte peut avoir plusieurs téléphones ; le jeton est la clé, il
-- appartient à l'appareil et peut changer de main (réinstallation, autre
-- compte sur le même téléphone) — d'où l'écrasement du propriétaire.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null default 'ios' check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "chacun lit ses jetons" on public.push_tokens;
create policy "chacun lit ses jetons"
  on public.push_tokens for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "chacun enregistre son jeton" on public.push_tokens;
create policy "chacun enregistre son jeton"
  on public.push_tokens for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "chacun met à jour son jeton" on public.push_tokens;
create policy "chacun met à jour son jeton"
  on public.push_tokens for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "chacun retire son jeton" on public.push_tokens;
create policy "chacun retire son jeton"
  on public.push_tokens for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.push_tokens to authenticated;

-- ── Envoi ──────────────────────────────────────────────────────────────

-- Tous les appareils d'un compte, en un seul appel. Sans jeton enregistré,
-- la fonction ne fait rien : le compte n'a pas installé l'application.
create or replace function public.push_to_user(
  p_user uuid,
  p_title text,
  p_body text,
  p_url text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.push_to_user(uuid, text, text, text) from public;

-- ── Déclencheurs ───────────────────────────────────────────────────────

-- Tout ce qui allume la cloche du site part aussi sur le téléphone :
-- réservation entrante, avis client, ticket de caisse non rapproché.
create or replace function public.push_venue_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform push_to_user(new.owner_id, new.title, new.body, new.href);
  return new;
end;
$$;

drop trigger if exists trg_push_venue_notification on public.venue_notifications;
create trigger trg_push_venue_notification
  after insert on public.venue_notifications
  for each row execute function public.push_venue_notification();

-- Nouveau message : c'est l'autre partie du fil qui est prévenue, jamais
-- l'expéditeur. L'adresse dépend de l'espace du destinataire.
create or replace function public.push_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists trg_push_new_message on public.messages;
create trigger trg_push_new_message
  after insert on public.messages
  for each row execute function public.push_new_message();

-- Demande arrivée par un QR de l'hôtel : l'hôtel la voit dans son espace,
-- l'établissement est prévenu de son côté par venue_notifications.
create or replace function public.push_hotel_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
      || ' · ' || to_char(new.reservation_date, 'DD/MM')
      || coalesce(' · ' || new.reservation_time, '')
      || ' · ' || new.party_size || ' pers.',
    '/hotel/reservations'
  );
  return new;
end;
$$;

drop trigger if exists trg_push_hotel_reservation on public.qr_reservations;
create trigger trg_push_hotel_reservation
  after insert on public.qr_reservations
  for each row execute function public.push_hotel_reservation();
