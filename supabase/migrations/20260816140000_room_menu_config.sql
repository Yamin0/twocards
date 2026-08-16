-- Menu personnalisable par chambre : l'hôtel choisit, QR par QR, quelles
-- offres du catalogue twocards sont proposées au client qui scanne.
-- On stocke les offres MASQUÉES : par défaut (liste vide), tout le
-- catalogue de la ville est proposé — aucun réglage requis.

alter table public.hotel_qr_codes
  add column if not exists hidden_offers text[] not null default '{}';

-- Lecture du menu par le client (anonyme) au chargement de /s/[code].
-- Distincte de qr_track_scan : celle-ci n'incrémente rien et peut être
-- appelée à chaque affichage. SECURITY DEFINER : le visiteur n'a aucun
-- droit direct sur hotel_qr_codes.
create or replace function public.qr_get_menu(p_code text)
returns table (label text, hidden_offers text[])
language sql
security definer
set search_path = public
stable
as $$
  select q.label, q.hidden_offers
  from hotel_qr_codes q
  where q.code = p_code
    and q.active
    and char_length(p_code) <= 32;
$$;

revoke all on function public.qr_get_menu(text) from public;
grant execute on function public.qr_get_menu(text) to anon, authenticated;
