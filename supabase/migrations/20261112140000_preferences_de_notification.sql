-- Préférences de notification de l'établissement : respectées par le push.
--
-- Dashboard › Paramètres › Notifications enregistre des interrupteurs dans
-- auth.users.raw_user_meta_data -> 'notif_prefs' (auth.updateUser). Jusqu'ici
-- rien ne les lisait. Cette migration branche les quatre interrupteurs qui
-- correspondent à un envoi réel, et seulement sur le PUSH (téléphone) :
--
--   clé notif_prefs    envoi réel                                  fonction
--   ----------------   -----------------------------------------   ------------------------
--   pushReservations   venue_notifications kind = 'reservation'    push_venue_notification
--   pushRatings        venue_notifications kind = 'rating'         push_venue_notification
--   pushPos            venue_notifications kind = 'pos'            push_venue_notification
--   pushMessages       nouveau message dans la messagerie          push_new_message
--
-- Règles :
--   - la ligne venue_notifications est toujours écrite (cloche de l'app,
--     temps réel) : seul l'appel à push_to_user est sauté ;
--   - préférence absente, ou de type inattendu => push ENVOYÉ (activé par
--     défaut). Seule la valeur JSON booléenne false coupe le push. Aucune
--     conversion de type : une métadonnée mal formée ne peut pas faire
--     échouer le trigger, donc jamais l'insertion d'une réservation ou d'un
--     message ;
--   - un type de notification inconnu (ajouté plus tard) est poussé ;
--   - push_to_user, les triggers, les droits et les règles RLS ne changent
--     pas. Les deux fonctions sont reprises à l'identique de leur version en
--     place (schema.sql), seul le contrôle de préférence est ajouté.

-- ─── 1. Cloche → téléphone (réservation, avis, caisse) ─────────────────────

create or replace function public.push_venue_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  v_key := case new.kind
             when 'reservation' then 'pushReservations'
             when 'rating' then 'pushRatings'
             when 'pos' then 'pushPos'
           end;

  if v_key is not null and exists (
    select 1
      from auth.users u
     where u.id = new.owner_id
       and u.raw_user_meta_data -> 'notif_prefs' -> v_key = 'false'::jsonb
  ) then
    return new;
  end if;

  perform push_to_user(new.owner_id, new.title, new.body, new.href);
  return new;
end;
$$;

-- ─── 2. Nouveau message ────────────────────────────────────────────────────

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

  -- Le destinataire a coupé le push des messages (le message reste lisible
  -- dans la messagerie).
  if exists (
    select 1
      from auth.users u
     where u.id = v_recipient
       and u.raw_user_meta_data -> 'notif_prefs' -> 'pushMessages' = 'false'::jsonb
  ) then
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

-- Fonctions trigger : jamais appelables par l'API (déjà le cas, create or
-- replace conserve les droits ; rappelé par sûreté).
revoke all on function public.push_venue_notification() from public, anon, authenticated;
revoke all on function public.push_new_message() from public, anon, authenticated;
