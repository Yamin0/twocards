-- Modèle de commission : pourcentage du montant réellement dépensé.
-- Le prix d'une sortie n'est connu qu'après coup (addition, dépense au club) :
-- la commission ne peut donc pas être figée à la confirmation. On stocke le
-- montant quand il est connu, et la commission est DÉRIVÉE — jamais saisie —
-- par trigger : amount_spent × commission_rate (10 % par défaut, ajustable
-- réservation par réservation).

alter table public.qr_reservations
  add column if not exists amount_spent numeric
    check (amount_spent is null or amount_spent >= 0),
  add column if not exists commission_rate numeric not null default 0.10
    check (commission_rate >= 0 and commission_rate <= 1);

create or replace function public.qr_apply_commission()
returns trigger
language plpgsql
as $$
begin
  -- Toujours recalculée : aucune dérive possible entre montant et commission.
  new.commission := coalesce(round(new.amount_spent * new.commission_rate, 2), 0);
  return new;
end;
$$;

drop trigger if exists trg_qr_apply_commission on public.qr_reservations;
create trigger trg_qr_apply_commission
  before insert or update on public.qr_reservations
  for each row execute function public.qr_apply_commission();

-- Lecture seule pour les hôtels, décision produit : personne ne modifie les
-- réservations depuis un dashboard pour l'instant. On retire la policy
-- d'update accordée précédemment ET les privilèges d'écriture — le seul
-- chemin d'entrée reste la RPC SECURITY DEFINER du parcours client, et les
-- montants seront saisis plus tard par un rôle de service.
drop policy if exists "hotel met à jour les réservations de ses QR"
  on public.qr_reservations;
revoke insert, update, delete on public.qr_reservations from anon, authenticated;

-- Flux temps réel : les nouvelles réservations apparaissent dans le dashboard
-- hôtel sans recharger. La RLS s'applique aussi aux événements Realtime.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public' and tablename = 'qr_reservations'
     ) then
    alter publication supabase_realtime add table public.qr_reservations;
  end if;
end;
$$;
