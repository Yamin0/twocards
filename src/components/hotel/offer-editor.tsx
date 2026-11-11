"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Star, Trash2, X } from "lucide-react";
import { CATEGORY_KEYS, categoryLabel, fallbackImage, type GuestCategoryKey } from "@/lib/guest-catalog";
import { uploadImage } from "@/lib/hotel/upload-image";
import { Button, Field, IconButton, InfoNote, Modal, Segmented, Switch, inputClass } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

/* Fiche d'une adresse, partagée par l'administrateur (catalogue réseau) et
   par l'hôtel (adresses maison) : mêmes champs, mêmes limites que la base.
   L'administrateur voit deux champs de plus, la ville (le catalogue est
   filtré par ville côté client) et l'identifiant. */

export type OfferDraft = {
  category: GuestCategoryKey;
  name: string;
  tag: string;
  description: string;
  price: string;
  /* Couverture, puis les photos suivantes. */
  image_url: string | null;
  images: string[];
  active: boolean;
  city: string;
  slug: string;
};

export const EMPTY_DRAFT: OfferDraft = {
  category: "restaurants",
  name: "",
  tag: "",
  description: "",
  price: "",
  image_url: null,
  images: [],
  active: true,
  city: "",
  slug: "",
};

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

/* Huit photos par adresse, comme la contrainte de la base. */
const MAX_PHOTOS = 8;

const getTagHints = (t: Translate): Record<GuestCategoryKey, string> => ({
  restaurants: t("Restaurant, Rooftop, Gastronomique…", "Restaurant, Rooftop, Fine dining…"),
  activites: t("Aventure, Bien-être, Culture, Excursion…", "Adventure, Wellness, Culture, Day trip…"),
  clubs: t("Club, Bar, Lounge…", "Club, Bar, Lounge…"),
  services: t("Transport, Famille, Lifestyle, Conciergerie…", "Transport, Family, Lifestyle, Concierge…"),
});

export const CITIES = ["Marrakech", "Casablanca", "Tanger", "Rabat", "Agadir", "Fès", "Essaouira"];

export function OfferEditor({
  open,
  onClose,
  initial,
  onSave,
  userId,
  uploadPrefix,
  admin = false,
  title,
  saving = false,
}: {
  open: boolean;
  onClose: () => void;
  initial: OfferDraft;
  onSave: (draft: OfferDraft) => Promise<string | null>;
  userId: string | null;
  uploadPrefix: string;
  admin?: boolean;
  title: string;
  saving?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const tagHints = getTagHints(t);
  const [draft, setDraft] = useState<OfferDraft>(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) =>
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (admin && key === "name" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });

  const submit = async () => {
    setError(null);
    if (draft.name.trim().length === 0) {
      setError(t("Le nom est obligatoire.", "Name is required."));
      return;
    }
    if (admin && !/^[a-z0-9][a-z0-9-]{1,39}$/.test(draft.slug)) {
      setError(
        t(
          "Identifiant invalide : lettres minuscules, chiffres et tirets, 2 à 40 caractères.",
          "Invalid ID: lowercase letters, numbers and hyphens, 2 to 40 characters."
        )
      );
      return;
    }
    const msg = await onSave({ ...draft, name: draft.name.trim(), tag: draft.tag.trim(), description: draft.description.trim(), price: draft.price.trim(), city: draft.city.trim() });
    if (msg) setError(msg);
  };

  /* Une seule liste en mémoire : la première photo est la couverture. */
  const photos = draft.image_url ? [draft.image_url, ...draft.images] : draft.images;
  const setPhotos = (next: string[]) =>
    setDraft((d) => ({ ...d, image_url: next[0] ?? null, images: next.slice(1) }));

  const upload = async (files: FileList) => {
    if (!userId) return;
    setUploading(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, Math.max(room, 0))) {
        added.push(await uploadImage(file, userId, uploadPrefix, 1600, locale));
      }
      if (added.length > 0) setPhotos([...photos, ...added]);
      if (Array.from(files).length > room) setError(t(`${MAX_PHOTOS} photos au maximum par adresse.`, `${MAX_PHOTOS} photos maximum per place.`));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("L'envoi de l'image a échoué", "Image upload failed"));
    }
    setUploading(false);
  };

  const preview = photos[0] || fallbackImage(draft.slug || draft.name || "x", draft.category);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={uploading}>
            {t("Enregistrer", "Save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        {/* Photo */}
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-fill">
            <Image src={preview} alt="" fill unoptimized={preview.startsWith("http")} sizes="240px" className="object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-panel px-2 py-1 text-center text-xs font-bold text-ink-2">
              {photos.length === 0 ? t("Photo par défaut", "Default photo") : t("Couverture", "Cover")}
            </span>
          </div>

          {/* Photos suivantes : montrées dans la fiche, au clic du client. */}
          {photos.length > 1 && (
            <ul className="mt-2 grid grid-cols-3 gap-1.5">
              {photos.slice(1).map((url, i) => (
                <li key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                  <Image src={url} alt="" fill unoptimized={url.startsWith("http")} sizes="80px" className="object-cover" />
                  {/* Toujours visibles : au doigt, il n'y a pas de survol. */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between p-0.5">
                    <IconButton
                      icon={Star}
                      size={14}
                      label={t("Définir comme couverture", "Set as cover")}
                      onClick={() => setPhotos([url, ...photos.filter((u) => u !== url)])}
                      className="h-8 w-8 bg-panel text-ink shadow-sm hover:bg-panel"
                    />
                    <IconButton
                      icon={X}
                      size={14}
                      tone="danger"
                      label={t("Retirer cette photo", "Remove this photo")}
                      onClick={() => setPhotos(photos.filter((u) => u !== url))}
                      className="h-8 w-8 bg-panel text-ink shadow-sm hover:bg-panel"
                    />
                  </div>
                  <span className="num absolute left-1 top-1 rounded bg-panel px-1 text-xs font-bold text-ink">
                    {i + 2}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              icon={ImagePlus}
              loading={uploading}
              disabled={photos.length >= MAX_PHOTOS}
              onClick={() => fileInput.current?.click()}
              className="flex-1"
            >
              {photos.length === 0 ? t("Ajouter des photos", "Add photos") : t("Ajouter", "Add")}
            </Button>
            {photos.length > 0 && (
              <IconButton icon={Trash2} tone="danger" size={16} label={t("Retirer la couverture", "Remove cover")} onClick={() => setPhotos(photos.slice(1))} className="h-9 w-9" />
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            {t(
              <>
                La première photo est la couverture, seule visible sur la carte. Les suivantes s&apos;affichent dans la
                fiche, au clic du client. Jusqu&apos;à {MAX_PHOTOS}, format paysage conseillé.
              </>,
              <>
                The first photo is the cover, the only one shown on the card. The others appear in the detail view
                when a guest taps it. Up to {MAX_PHOTOS}, landscape format recommended.
              </>
            )}
          </p>
        </div>

        {/* Champs */}
        <div className="space-y-4">
          <Field label={t("Catégorie", "Category")}>
            <Segmented<GuestCategoryKey>
              size="sm"
              label={t("Catégorie", "Category")}
              value={draft.category}
              onChange={(v) => set("category", v)}
              options={CATEGORY_KEYS.map((k) => ({ value: k, label: categoryLabel(k, locale) }))}
            />
          </Field>
          <Field label={t("Nom", "Name")} htmlFor="offer-name">
            <input id="offer-name" value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={120} className={inputClass} placeholder={t("Nom de l'adresse", "Name of the place")} data-autofocus />
          </Field>
          <div className={cn("grid gap-4", admin ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            <Field label={t("Étiquette", "Tag")} htmlFor="offer-tag" hint={tagHints[draft.category]}>
              <input id="offer-tag" value={draft.tag} onChange={(e) => set("tag", e.target.value)} maxLength={40} className={inputClass} placeholder="Restaurant" />
            </Field>
            <Field label={t("Prix indicatif", "Guide price")} htmlFor="offer-price" hint={t("Facultatif, texte libre.", "Optional, free text.")}>
              <input id="offer-price" value={draft.price} onChange={(e) => set("price", e.target.value)} maxLength={40} className={cn(inputClass, "num")} placeholder={t("dès 450 MAD", "from 450 MAD")} />
            </Field>
            {admin && (
              <Field label={t("Ville", "City")} htmlFor="offer-city" hint={t("Vide = proposée dans toutes les villes.", "Empty = offered in every city.")}>
                <input id="offer-city" list="offer-cities" value={draft.city} onChange={(e) => set("city", e.target.value)} maxLength={80} className={inputClass} placeholder={t("Toutes", "All")} />
                <datalist id="offer-cities">
                  {CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            )}
          </div>
          <Field label="Description" htmlFor="offer-desc" hint={`${draft.description.length}/300`}>
            <textarea id="offer-desc" value={draft.description} onChange={(e) => set("description", e.target.value.slice(0, 300))} rows={3} className={cn(inputClass, "resize-none")} placeholder={t("En une ou deux phrases : ce qui rend l'adresse désirable.", "In one or two sentences: what makes this place worth a visit.")} />
          </Field>
          <div className={cn("grid gap-4 items-end", admin ? "sm:grid-cols-2" : "")}>
            {admin && (
              <Field
                label={t("Identifiant", "ID")}
                htmlFor="offer-slug"
                hint={
                  initial.slug
                    ? t("Ne change pas : les réservations passées y sont rattachées.", "Cannot be changed: past reservations are linked to it.")
                    : t("Généré depuis le nom, modifiable avant création.", "Generated from the name, editable before creation.")
                }
              >
                <input
                  id="offer-slug"
                  value={draft.slug}
                  disabled={!!initial.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  className={cn(inputClass, "num")}
                />
              </Field>
            )}
            <div className="flex h-11 items-center gap-3 rounded-xl border border-line-2 bg-panel px-3.5">
              <Switch checked={draft.active} onChange={(v) => set("active", v)} label={t("Adresse proposée", "Place offered")} />
              <span className="text-sm text-ink-2">{draft.active ? t("Proposée aux clients", "Offered to guests") : t("Masquée pour l'instant", "Hidden for now")}</span>
            </div>
          </div>
          {error && (
            <div role="alert">
              <InfoNote tone="danger">{error}</InfoNote>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
