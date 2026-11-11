"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotify } from "@/components/app/ui";
import { useAuthUser } from "@/hooks/use-auth-user";
import { cityCatalog } from "@/lib/guest-catalog";
import { averageRating, conversionRate, isLive } from "@/lib/hotel/analytics";
import { todayIso } from "@/lib/hotel/format";
import { useHotelSpace } from "@/lib/hotel/store";
import { guestUrl } from "@/lib/qr";
import { useLocale, useT } from "@/lib/i18n/client";

const sameSet = (a: Iterable<string>, b: Iterable<string>) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/* Fiche d'un QR code : ses chiffres, et l'édition de son menu. Les adresses
   retirées et les catégories retirées sont modifiées localement, puis
   envoyées en base à l'enregistrement (mêmes écritures qu'avant, via le
   store). */
export function useQrDetail(id: string) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();
  const { isLoading: authLoading, venueName, city } = useAuthUser();
  const space = useHotelSpace();
  const { qrCodes, reservations, profile, catalog, hotelOffers, update, remove } = space;

  const qr = qrCodes.find((q) => q.id === id) ?? null;

  const [hidden, setHidden] = useState<Set<string> | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  /* Catégories retirées de ce QR, avec échéance facultative. */
  const [cats, setCats] = useState<Set<string> | null>(null);
  const [until, setUntil] = useState<string | null>(null);
  const [savingRules, setSavingRules] = useState(false);
  const [busy, setBusy] = useState(false);

  /* Ajustement d'état pendant le rendu plutôt qu'un effet : l'édition part
     des valeurs enregistrées dès que le QR est connu. */
  if (qr && hidden === null) setHidden(new Set(qr.hidden_offers));
  if (qr && cats === null) {
    setCats(new Set(qr.hidden_categories));
    setUntil(qr.hidden_until);
  }

  const hotelName = profile.hotel_name || venueName;
  const hotelCity = profile.city || city;
  const menuCatalog = useMemo(
    () => cityCatalog(hotelCity ?? null, catalog, hotelOffers, locale),
    [hotelCity, catalog, hotelOffers, locale]
  );

  const isLoading = authLoading || space.isLoading || Boolean(qr && (hidden === null || cats === null));

  const hiddenSet = hidden ?? new Set<string>();
  const catSet = cats ?? new Set<string>();
  const mine = useMemo(() => reservations.filter((r) => r.qr_code_id === id), [reservations, id]);
  const live = mine.filter(isLive);

  const toggleIn = (prev: Set<string> | null, key: string) => {
    const next = new Set(prev ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  const saveRules = async () => {
    if (!qr) return;
    setSavingRules(true);
    const ok = await update(qr.id, { hidden_categories: [...catSet], hidden_until: until || null });
    setSavingRules(false);
    if (ok) notify(t("Filtres enregistrés, visibles dès le prochain scan", "Filters saved, live from the next scan"));
    else notify(t("Impossible d'enregistrer les filtres", "Couldn't save the filters"), "error");
  };

  const saveMenu = async () => {
    if (!qr) return;
    setSavingMenu(true);
    const ok = await update(qr.id, { hidden_offers: [...hiddenSet] });
    setSavingMenu(false);
    if (ok) notify(t("Menu enregistré, visible dès le prochain scan", "Menu saved, live from the next scan"));
    else notify(t("Impossible d'enregistrer le menu", "Couldn't save the menu"), "error");
  };

  /** Renvoie true si le nouveau nom est enregistré (ou inchangé). */
  const rename = async (label: string) => {
    if (!qr) return false;
    const trimmed = label.trim();
    if (!trimmed || trimmed === qr.label) return true;
    const ok = await update(qr.id, { label: trimmed });
    if (ok) notify(t("Emplacement renommé", "Location renamed"));
    else notify(t("Échec du renommage", "Rename failed"), "error");
    return ok;
  };

  const toggleActive = async () => {
    if (!qr) return;
    const ok = await update(qr.id, { active: !qr.active });
    if (!ok) return notify(t("Échec de la mise à jour", "Update failed"), "error");
    notify(
      qr.active
        ? t(
            "QR désactivé, le lien affiche un message d'indisponibilité",
            "QR deactivated, the link now shows an unavailable message"
          )
        : t("QR réactivé", "QR reactivated")
    );
  };

  /** Supprime le QR ; en cas de succès, retour à la liste. */
  const removeQr = async () => {
    if (!qr) return false;
    setBusy(true);
    const ok = await remove([qr.id]);
    setBusy(false);
    if (!ok) {
      notify(t("Échec de la suppression", "Delete failed"), "error");
      return false;
    }
    if (ok.kept > 0) {
      notify(
        t(
          "Ce QR a des réservations : il est désactivé, pas supprimé, pour garder leur historique.",
          "This QR code has reservations: it was deactivated, not deleted, to keep their history."
        )
      );
      return true;
    }
    router.push("/hotel/chambres");
    return true;
  };

  return {
    ...space,
    isLoading,
    qr,
    link: qr ? guestUrl(qr.code, hotelName, hotelCity) : "",
    hotelName,
    hotelCity,
    mine,
    live,
    commission: live.reduce((s, r) => s + r.commission, 0),
    spent: live.reduce((s, r) => s + (r.amount_spent ?? 0), 0),
    rating: averageRating(mine),
    conversion: conversionRate(qr?.scans ?? 0, live.length),
    /* Menu : adresses retirées de ce QR. */
    menuCatalog,
    hiddenSet,
    /* Retraits valables pour tout l'hôtel (page Mes adresses) : affichés
       pour information, ils ne se règlent pas chambre par chambre. */
    globalHidden: new Set(profile.hidden_offers),
    menuDirty: qr ? !sameSet(hiddenSet, qr.hidden_offers) : false,
    toggleOffer: (offerId: string) => setHidden((prev) => toggleIn(prev, offerId)),
    setOffers: (ids: string[], propose: boolean) =>
      setHidden((prev) => {
        const next = new Set(prev ?? []);
        for (const oid of ids) {
          if (propose) next.delete(oid);
          else next.add(oid);
        }
        return next;
      }),
    resetMenu: () => qr && setHidden(new Set(qr.hidden_offers)),
    saveMenu,
    savingMenu,
    /* Filtres : catégories entières retirées, avec échéance. */
    catSet,
    until,
    setUntil,
    today: todayIso(),
    rulesDirty: qr
      ? !sameSet(catSet, qr.hidden_categories) || (until ?? null) !== (qr.hidden_until ?? null)
      : false,
    rulesExpired: Boolean(qr?.hidden_until && qr.hidden_until < todayIso()),
    toggleCat: (key: string) => setCats((prev) => toggleIn(prev, key)),
    hideCat: (key: string) => setCats((prev) => new Set([...(prev ?? []), key])),
    showAllCats: () => setCats(new Set()),
    resetRules: () => {
      if (!qr) return;
      setCats(new Set(qr.hidden_categories));
      setUntil(qr.hidden_until);
    },
    saveRules,
    savingRules,
    rename,
    toggleActive,
    removeQr,
    busy,
  };
}

export type QrDetail = ReturnType<typeof useQrDetail>;
