"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotify } from "@/components/app/ui";
import { useAuthUser } from "@/hooks/use-auth-user";
import { qrPerformance, type QrPerformance } from "@/lib/hotel/analytics";
import { isRoomLabel } from "@/lib/hotel/format";
import { oneOf } from "@/lib/hotel/params";
import { useHotelSpace, type HotelQrCode } from "@/lib/hotel/store";
import { downloadSvg, guestUrl } from "@/lib/qr";
import type { Locale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

export type QrFilter = "tous" | "chambres" | "espaces" | "actifs" | "inactifs";
export type QrSort = "recent" | "label" | "scans" | "resas" | "conversion" | "montant" | "commission";
export type QrView = "grille" | "liste";

/* Valeurs acceptées par ?tri= ; toute autre retombe sur « recent ». */
export const QR_SORTS: readonly QrSort[] = [
  "recent",
  "label",
  "scans",
  "resas",
  "conversion",
  "montant",
  "commission",
];

const VIEW_KEY = "hotel-qr-view";

function sortRows(rows: QrPerformance[], sort: QrSort, locale: Locale) {
  return [...rows].sort((a, b) => {
    switch (sort) {
      case "label":
        return a.label.localeCompare(b.label, locale, { numeric: true });
      case "scans":
        return b.scans - a.scans;
      case "resas":
        return b.liveReservations - a.liveReservations;
      case "conversion":
        return b.conversion - a.conversion;
      case "montant":
        return b.spent - a.spent || b.liveReservations - a.liveReservations;
      case "commission":
        return b.commission - a.commission || b.liveReservations - a.liveReservations;
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
}

/* État et actions de la page Chambres & QR : recherche, filtre, tri (lu
   dans ?tri=), vue, sélection multiple, création (?nouveau=1), suppression.
   Les écritures passent par le store, sans changement. */
export function useQrList() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();
  const { venueName, city, isLoading: authLoading } = useAuthUser();
  const space = useHotelSpace();
  const { qrCodes, reservations, profile, create, createMany, update, updateMany, remove } = space;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<QrFilter>("tous");
  const [sort, setSort] = useState<QrSort>(() => oneOf(params.get("tri"), QR_SORTS, "recent"));
  /* Préférence d'affichage, lue au premier rendu client : la page n'est
     rendue qu'une fois les données chargées, donc jamais côté serveur. */
  const [view, setViewState] = useState<QrView>(() => {
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) : null;
      return v === "liste" ? "liste" : "grille";
    } catch {
      return "grille";
    }
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  /* Le paramètre ?nouveau=1 vient de la barre latérale : on le consomme —
     ajustement d'état pendant le rendu, puis nettoyage de l'URL. */
  const wantsNew = params.get("nouveau") === "1";
  const [seenNew, setSeenNew] = useState(false);
  if (wantsNew !== seenNew) {
    setSeenNew(wantsNew);
    if (wantsNew) setCreateOpen(true);
  }
  useEffect(() => {
    if (wantsNew) router.replace("/hotel/chambres");
  }, [wantsNew, router]);

  const hotelName = profile.hotel_name || venueName;
  const hotelCity = profile.city || city;
  const linkOf = (q: HotelQrCode) => guestUrl(q.code, hotelName, hotelCity);

  const rows = useMemo(() => qrPerformance(qrCodes, reservations), [qrCodes, reservations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      rows.filter((r) => {
        if (q && !r.label.toLowerCase().includes(q) && !r.code.includes(q)) return false;
        switch (filter) {
          case "chambres":
            return isRoomLabel(r.label);
          case "espaces":
            return !isRoomLabel(r.label);
          case "actifs":
            return r.active;
          case "inactifs":
            return !r.active;
          default:
            return true;
        }
      }),
      sort,
      locale
    );
  }, [rows, search, filter, sort, locale]);

  /* Le QR qui rapporte le plus, tous filtres confondus. */
  const best = useMemo(() => {
    const top = sortRows(rows, "commission", locale)[0];
    return top && top.commission > 0 ? top : null;
  }, [rows, locale]);

  const setView = (v: QrView) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* stockage indisponible : la préférence ne vaut que pour cette visite */
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = selected.size > 0 && selected.size === filtered.length;
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)));
  const clearSelection = () => setSelected(new Set());

  const failure = () => notify(t("Échec de la mise à jour", "Update failed"), "error");

  const toggleActive = async (q: HotelQrCode) => {
    const ok = await update(q.id, { active: !q.active });
    if (!ok) return failure();
    notify(
      q.active
        ? t(`« ${q.label} » désactivé`, `“${q.label}” deactivated`)
        : t(`« ${q.label} » activé`, `“${q.label}” activated`)
    );
  };

  const bulkActive = async (active: boolean) => {
    setBusy(true);
    const ok = await updateMany([...selected], { active });
    setBusy(false);
    if (!ok) return failure();
    notify(
      active
        ? t(`${selected.size} QR activés`, `${selected.size} QR activated`)
        : t(`${selected.size} QR désactivés`, `${selected.size} QR deactivated`)
    );
    clearSelection();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    const ok = await remove(toDelete);
    setBusy(false);
    setToDelete(null);
    if (!ok) return notify(t("Échec de la suppression", "Delete failed"), "error");
    clearSelection();
    notify(
      toDelete.length > 1
        ? t(`${toDelete.length} QR supprimés`, `${toDelete.length} QR codes deleted`)
        : t("QR code supprimé", "QR code deleted")
    );
  };

  const copyLink = async (q: HotelQrCode) => {
    try {
      await navigator.clipboard.writeText(linkOf(q));
      notify(t("Lien copié", "Link copied"));
    } catch {
      notify(t("Impossible de copier le lien", "Couldn't copy the link"), "error");
    }
  };

  const download = (q: HotelQrCode) => {
    if (downloadSvg(`qr-${q.id}`, q.label)) notify(t("QR code téléchargé", "QR code downloaded"));
    else notify(t("Échec du téléchargement", "Download failed"), "error");
  };

  const createLabels = async (labels: string[]) => {
    const created =
      labels.length === 1
        ? await create(labels[0]).then((r) => (r ? [r] : null))
        : await createMany(labels);
    if (!created) {
      notify(t("Échec de la création", "Creation failed"), "error");
      return false;
    }
    notify(
      created.length === 1
        ? t(`« ${created[0].label} » créé`, `“${created[0].label}” created`)
        : t(`${created.length} QR codes créés`, `${created.length} QR codes created`)
    );
    return true;
  };

  const printHref =
    selected.size > 0
      ? `/hotel/chambres/imprimer?ids=${[...selected].join(",")}`
      : "/hotel/chambres/imprimer";

  return {
    ...space,
    isLoading: authLoading || space.isLoading,
    rows,
    filtered,
    best,
    linkOf,
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    view,
    setView,
    selected,
    toggleSelect,
    selectAll,
    allSelected,
    clearSelection,
    createOpen,
    setCreateOpen,
    toDelete,
    setToDelete,
    busy,
    toggleActive,
    bulkActive,
    confirmDelete,
    copyLink,
    download,
    createLabels,
    printHref,
  };
}

export type QrList = ReturnType<typeof useQrList>;
