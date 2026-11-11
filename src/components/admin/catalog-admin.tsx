"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, BookOpen, Eye, EyeOff, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_KEYS, CATEGORY_LABELS, fallbackImage, type GuestCategoryKey } from "@/lib/guest-catalog";
import { EMPTY_DRAFT, OfferEditor, type OfferDraft } from "@/components/hotel/offer-editor";
import { ConfirmDialog, Segmented, Select, Switch } from "@/components/hotel/ui";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

/* Catalogue du réseau twocards, dans la console d'administration : les
   adresses proposées à tous les hôtels (filtrées par ville côté client).
   L'écriture est gardée en base par la policy admin ; ici, la liste, la
   fiche et l'ordre d'affichage. Chaque adresse créée reçoit sa fiche dans
   venues par trigger : c'est par elle que les réservations remontent au
   compte de l'établissement. */

export type CatalogRow = {
  slug: string;
  category: GuestCategoryKey;
  name: string;
  city: string | null;
  tag: string;
  description: string;
  price: string | null;
  image_url: string | null;
  images: string[];
  active: boolean;
  sort_order: number;
  updated_at: string;
};

const SELECT =
  "slug, category, name, city, tag, description, price, image_url, images, active, sort_order, updated_at";

type Filter = "toutes" | GuestCategoryKey;

const toDraft = (o: CatalogRow): OfferDraft => ({
  category: o.category,
  name: o.name,
  tag: o.tag,
  description: o.description,
  price: o.price ?? "",
  image_url: o.image_url,
  images: o.images ?? [],
  active: o.active,
  city: o.city ?? "",
  slug: o.slug,
});

export function CatalogAdmin({
  userId,
  panel,
  onSaved,
  onError,
  reloadKey = 0,
}: {
  userId: string | null;
  panel: string;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
  /* Incrémenté par le bouton Actualiser de la console : relance la lecture. */
  reloadKey?: number;
}) {
  const t = useT();
  const locale = useLocale();
  /* Libellé affiché de la catégorie (la clé en base ne change pas). */
  const categoryLabel = (k: GuestCategoryKey) =>
    t(CATEGORY_LABELS[k], k === "activites" ? "Activities" : CATEGORY_LABELS[k]);
  const [rows, setRows] = useState<CatalogRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("toutes");
  const [city, setCity] = useState("toutes");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ row: CatalogRow | null } | null>(null);
  const [toDelete, setToDelete] = useState<CatalogRow | null>(null);
  const [saving, setSaving] = useState(false);

  /* Lecture pure, sans setState : réutilisée au montage (dans le rappel de
     la promesse) et après chaque écriture. */
  const fetchRows = useCallback(async (): Promise<CatalogRow[] | null> => {
    const { data, error } = await createClient()
      .from("catalog_offers")
      .select(SELECT)
      .order("category")
      .order("sort_order")
      .order("name");
    return error ? null : ((data ?? []) as CatalogRow[]);
  }, []);

  const load = useCallback(async () => {
    const next = await fetchRows();
    if (next === null) onError(t("Impossible de charger le catalogue", "Couldn’t load the catalogue"));
    setRows(next ?? []);
  }, [fetchRows, onError, t]);

  useEffect(() => {
    let cancelled = false;
    fetchRows().then((next) => {
      if (cancelled) return;
      if (next === null) onError(t("Impossible de charger le catalogue", "Couldn’t load the catalogue"));
      setRows(next ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchRows, onError, reloadKey, t]);

  const cities = useMemo(
    () => [...new Set((rows ?? []).map((r) => r.city).filter((c): c is string => !!c))].sort(),
    [rows]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (filter === "toutes" || r.category === filter) &&
        (city === "toutes" || (city === "partout" ? r.city === null : r.city === city)) &&
        (!q || r.name.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q) || r.slug.includes(q))
    );
  }, [rows, filter, city, search]);

  const save = async (draft: OfferDraft) => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      category: draft.category,
      name: draft.name,
      city: draft.city || null,
      tag: draft.tag,
      description: draft.description,
      price: draft.price || null,
      image_url: draft.image_url,
      images: draft.images,
      active: draft.active,
    };
    let error;
    if (editing?.row) {
      ({ error } = await supabase.from("catalog_offers").update(payload).eq("slug", editing.row.slug));
    } else {
      const sort_order = (rows ?? []).filter((r) => r.category === draft.category).reduce((m, r) => Math.max(m, r.sort_order), 0) + 10;
      ({ error } = await supabase.from("catalog_offers").insert({ ...payload, slug: draft.slug, sort_order }));
    }
    setSaving(false);
    if (error) {
      return error.code === "23505"
        ? t("Cet identifiant existe déjà : choisissez-en un autre.", "This ID is already taken: choose another one.")
        : t(`Impossible d'enregistrer : ${error.message}`, `Couldn’t save: ${error.message}`);
    }
    setEditing(null);
    onSaved(editing?.row ? t("Adresse mise à jour", "Place updated") : t("Adresse ajoutée au catalogue", "Place added to the catalogue"));
    await load();
    return null;
  };

  const toggle = async (r: CatalogRow) => {
    const { error } = await createClient().from("catalog_offers").update({ active: !r.active }).eq("slug", r.slug);
    if (error) onError(t("Échec de la mise à jour", "Update failed"));
    else {
      setRows((prev) => (prev ?? []).map((x) => (x.slug === r.slug ? { ...x, active: !r.active } : x)));
      onSaved(
        r.active
          ? t(`« ${r.name} » retirée du menu`, `“${r.name}” removed from the menu`)
          : t(`« ${r.name} » proposée`, `“${r.name}” now on offer`)
      );
    }
  };

  /* Ordre au sein d'une catégorie : on échange les sort_order de deux voisins. */
  const move = async (r: CatalogRow, dir: -1 | 1) => {
    const siblings = (rows ?? []).filter((x) => x.category === r.category).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, locale));
    const i = siblings.findIndex((x) => x.slug === r.slug);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const other = siblings[j];
    /* Échange des rangs ; à rang égal (anciennes lignes), on décale. */
    const a = r.sort_order === other.sort_order ? r.sort_order + dir * 10 : other.sort_order;
    const b = r.sort_order;
    const supabase = createClient();
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("catalog_offers").update({ sort_order: a }).eq("slug", r.slug),
      supabase.from("catalog_offers").update({ sort_order: b }).eq("slug", other.slug),
    ]);
    if (e1 || e2) onError(t("Échec du réordonnancement", "Reordering failed"));
    await load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await createClient().from("catalog_offers").delete().eq("slug", toDelete.slug);
    setToDelete(null);
    if (error) onError(t("Échec de la suppression", "Deletion failed"));
    else {
      setRows((prev) => (prev ?? []).filter((x) => x.slug !== toDelete.slug));
      onSaved(t("Adresse supprimée du catalogue", "Place removed from the catalogue"));
    }
  };

  const activeCount = (rows ?? []).filter((r) => r.active).length;

  return (
    <div className={`${panel} satoshi p-6`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fill-2">
            <BookOpen size={17} className="text-info" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">{t("Catalogue réseau", "Network catalogue")}</h2>
            <p className="text-xs text-ink-3">
              {rows === null
                ? t("Chargement…", "Loading…")
                : t(
                    `${rows.length} adresse${rows.length > 1 ? "s" : ""} · ${activeCount} proposée${activeCount > 1 ? "s" : ""} aux hôtels, filtrées par ville`,
                    `${rows.length} place${rows.length === 1 ? "" : "s"} · ${activeCount} offered to hotels, filtered by city`
                  )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ row: null })}
          className="flex items-center gap-2 rounded-xl bg-link px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-link-strong"
        >
          <Plus size={14} />
          {t("Nouvelle adresse", "New place")}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "toutes", label: t("Toutes", "All"), count: rows?.length ?? 0 },
            ...CATEGORY_KEYS.map((k) => ({ value: k, label: categoryLabel(k), count: (rows ?? []).filter((r) => r.category === k).length })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Nom, étiquette, identifiant…", "Name, tag, ID…")}
              className="h-9 w-56 rounded-lg border border-line bg-fill pl-8 pr-3 text-xs text-ink placeholder:text-ink-4 focus:border-info/25 focus:outline-none"
            />
          </div>
          <Select
            label={t("Ville", "City")}
            value={city}
            onChange={setCity}
            className="w-48"
            options={[
              { value: "toutes", label: t("Toutes les villes", "All cities") },
              { value: "partout", label: t("Sans ville (partout)", "No city (everywhere)") },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>
      </div>

      {rows !== null && shown.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-3">
          {rows.length === 0 ? t("Le catalogue est vide.", "The catalogue is empty.") : t("Aucune adresse ne correspond.", "No places match.")}
        </p>
      )}

      <div className="space-y-2">
        {shown.map((r) => {
          const img = r.image_url || fallbackImage(r.slug);
          return (
            <div
              key={r.slug}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-line bg-fill p-2.5 pr-3",
                !r.active && "opacity-55"
              )}
            >
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-fill">
                <Image src={img} alt="" fill unoptimized={img.startsWith("http")} sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                  <span className="rounded-md bg-fill-2 px-1.5 py-0.5 text-xs font-bold text-ink-2">
                    {categoryLabel(r.category)}
                  </span>
                  {!r.active && <span className="text-xs font-bold text-warn">{t("Masquée", "Hidden")}</span>}
                </div>
                <p className="truncate text-xs text-ink-3">
                  {r.tag || t("Sans étiquette", "No tag")}
                  {" · "}
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin size={10} /> {r.city ?? t("toutes villes", "all cities")}
                  </span>
                  {r.price ? ` · ${r.price}` : ""}
                  {r.images?.length ? ` · ${r.images.length + 1} photos` : ""}
                  <span className="font-mono-satoshi text-ink-3"> · {r.slug}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" onClick={() => move(r, -1)} aria-label={t("Monter", "Move up")} className="rounded-lg p-1.5 text-ink-3 hover:bg-fill-2 hover:text-ink">
                  <ArrowUp size={14} />
                </button>
                <button type="button" onClick={() => move(r, 1)} aria-label={t("Descendre", "Move down")} className="rounded-lg p-1.5 text-ink-3 hover:bg-fill-2 hover:text-ink">
                  <ArrowDown size={14} />
                </button>
                <span className="mx-1 hidden sm:inline-flex">
                  <Switch size="sm" checked={r.active} onChange={() => toggle(r)} label={t(`Proposer ${r.name}`, `Offer ${r.name}`)} />
                </span>
                <button type="button" onClick={() => toggle(r)} aria-label={r.active ? t("Masquer", "Hide") : t("Proposer", "Offer")} className="rounded-lg p-1.5 text-ink-3 hover:bg-fill-2 hover:text-ink sm:hidden">
                  {r.active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button type="button" onClick={() => setEditing({ row: r })} aria-label={t("Modifier", "Edit")} className="rounded-lg p-1.5 text-ink-2 hover:bg-fill-2 hover:text-ink">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => setToDelete(r)} aria-label={t("Supprimer", "Delete")} className="rounded-lg p-1.5 text-ink-3 hover:bg-danger-soft hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <OfferEditor
          open
          admin
          onClose={() => setEditing(null)}
          initial={editing.row ? toDraft(editing.row) : EMPTY_DRAFT}
          onSave={save}
          saving={saving}
          userId={userId}
          uploadPrefix="catalog"
          title={editing.row ? t(`Modifier « ${editing.row.name} »`, `Edit “${editing.row.name}”`) : t("Nouvelle adresse du catalogue", "New catalogue place")}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        confirmLabel={t("Supprimer du catalogue", "Remove from catalogue")}
        title={toDelete ? t(`Supprimer « ${toDelete.name} » ?`, `Delete “${toDelete.name}”?`) : ""}
        description={t(
          "L'adresse disparaît du menu de tous les hôtels. Sa fiche établissement et les réservations passées sont conservées. Pour la retirer temporairement, désactivez-la plutôt.",
          "The place disappears from every hotel’s menu. Its venue listing and past reservations are kept. To remove it temporarily, switch it off instead."
        )}
      />
    </div>
  );
}
