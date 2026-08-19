-- Intégration POS : la caisse de l'établissement pousse les tickets fermés
-- vers twocards (Edge Function pos-webhook). Le rapprochement se fait par le
-- libellé de table + la fenêtre de dates, le montant remplit amount_spent et
-- le trigger existant dérive la commission — plus de saisie manuelle.

-- Une intégration par établissement. La clé d'API n'est jamais stockée en
-- clair : seul son hash SHA-256 l'est, le texte n'est montré qu'une fois.
create table if not exists public.venue_integrations (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null default 'generic',
  api_key_hash text,
  status text not null default 'inactive'
    check (status in ('inactive', 'active')),
  last_event_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.venue_integrations enable row level security;

create policy "owner lit son intégration"
  on public.venue_integrations for select to authenticated
  using (owner_id = auth.uid());

revoke insert, update, delete on public.venue_integrations from anon, authenticated;

-- Journal des événements reçus de la caisse : rapprochés ou non, chaque
-- appel laisse une trace consultable dans le dashboard.
create table if not exists public.pos_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  provider text,
  ticket_id text,
  table_label text,
  amount numeric,
  status text not null check (status in ('matched', 'unmatched', 'duplicate')),
  reason text,
  reservation_id uuid references public.qr_reservations (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists pos_events_owner_idx
  on public.pos_events (owner_id, created_at desc);

-- Idempotence : un même ticket ne peut être rapproché qu'une fois.
create unique index if not exists pos_events_ticket_uniq
  on public.pos_events (owner_id, ticket_id)
  where ticket_id is not null and status = 'matched';

alter table public.pos_events enable row level security;

create policy "owner lit ses événements POS"
  on public.pos_events for select to authenticated
  using (owner_id = auth.uid());

revoke insert, update, delete on public.pos_events from anon, authenticated;

-- Provenance du montant : saisi à la main ou poussé par la caisse.
alter table public.qr_reservations
  add column if not exists amount_source text not null default 'manuel'
    check (amount_source in ('manuel', 'pos')),
  add column if not exists pos_ticket_id text;

-- Génération / rotation de la clé d'API par l'établissement. SECURITY
-- DEFINER : la table n'est pas écrivable directement. Le texte de la clé
-- n'est retourné qu'ici, une seule fois.
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

revoke all on function public.pos_rotate_key(text) from public;
grant execute on function public.pos_rotate_key(text) to authenticated;
