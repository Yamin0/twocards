-- Prix client par devise (13 nov. 2026).
--
-- twocards_prix_client() ajoute 20 % au prix partenaire puis arrondit à la
-- tranche de 50 supérieure : pensé pour le dirham (360 -> 450 MAD). En euros,
-- 95 € deviendrait 150 €. La tranche dépend désormais de la devise de la
-- prestation : 50 en MAD, 1 en EUR et USD (95 € -> 114 €, +20 % exact).
--
-- Les trois fonctions qui appellent twocards_prix_client() (menu, devis
-- simple, devis panier) sont réécrites à partir de leur définition en base :
-- seul l'appel au prix change, le reste du corps est conservé à l'identique.
-- Relançable : si l'appel est déjà à jour, la fonction n'est pas touchée.

create or replace function public.twocards_tranche(p_currency text)
returns numeric
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case lower(coalesce(p_currency, 'mad')) when 'mad' then 50 else 1 end::numeric;
$$;

do $$
declare
  v_def text;
  v_fn record;
begin
  for v_fn in
    select * from (values
      ('public.qr_menu_extras(text[])',
       'public.twocards_prix_client(s.partner_price)',
       'public.twocards_prix_client(s.partner_price, 0.20, public.twocards_tranche(s.price_currency))'),
      ('public.qr_deposit_quote(text,text,integer,text)',
       'public.twocards_prix_client(v_line.partner_price)',
       'public.twocards_prix_client(v_line.partner_price, 0.20, public.twocards_tranche(v_line.price_currency))'),
      ('public.qr_deposit_quote_lines(text,text,jsonb)',
       'public.twocards_prix_client(s.partner_price)',
       'public.twocards_prix_client(s.partner_price, 0.20, public.twocards_tranche(s.price_currency))')
    ) as t(fn, old_call, new_call)
  loop
    v_def := pg_get_functiondef(v_fn.fn::regprocedure);
    if position(v_fn.new_call in v_def) > 0 then
      continue; -- déjà appliqué
    end if;
    if position(v_fn.old_call in v_def) = 0 then
      raise exception 'Appel introuvable dans %', v_fn.fn;
    end if;
    execute replace(v_def, v_fn.old_call, v_fn.new_call);
  end loop;
end;
$$;
