"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { CATEGORY_KEYS, CATEGORY_LABELS, fallbackImage, type GuestCategoryKey } from "@/lib/guest-catalog";
import { uploadImage } from "@/lib/hotel/upload-image";
import { Button, Field, Modal, Segmented, Switch, inputClass } from "@/components/hotel/ui";
import { cn } from "@/lib/utils";

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
  image_url: string | null;
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

const TAG_HINTS: Record<GuestCategoryKey, string> = {
  restaurants: "Restaurant, Rooftop, Gastronomique…",
  activites: "Aventure, Bien-être, Culture, Excursion…",
  clubs: "Club, Bar, Lounge…",
  services: "Transport, Famille, Lifestyle, Conciergerie…",
};

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
      setError("Le nom est obligatoire.");
      return;
    }
    if (admin && !/^[a-z0-9][a-z0-9-]{1,39}$/.test(draft.slug)) {
      setError("Identifiant invalide : lettres minuscules, chiffres et tirets, 2 à 40 caractères.");
      return;
    }
    const msg = await onSave({ ...draft, name: draft.name.trim(), tag: draft.tag.trim(), description: draft.description.trim(), price: draft.price.trim(), city: draft.city.trim() });
    if (msg) setError(msg);
  };

  const upload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, userId, uploadPrefix, 1200);
      set("image_url", url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'envoi de l'image a échoué");
    }
    setUploading(false);
  };

  const preview = draft.image_url || fallbackImage(draft.slug || draft.name || "x");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} loading={saving} disabled={uploading}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        {/* Photo */}
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <Image src={preview} alt="" fill unoptimized={preview.startsWith("http")} sizes="200px" className="object-cover" />
            {!draft.image_url && (
              <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/70">
                Photo par défaut
              </span>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" icon={ImagePlus} loading={uploading} onClick={() => fileInput.current?.click()} className="flex-1">
              {draft.image_url ? "Changer" : "Ajouter une photo"}
            </Button>
            {draft.image_url && (
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => set("image_url", null)} aria-label="Retirer la photo" />
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">Format paysage conseillé. Redimensionnée automatiquement.</p>
        </div>

        {/* Champs */}
        <div className="space-y-4">
          <Field label="Catégorie">
            <Segmented<GuestCategoryKey>
              size="sm"
              value={draft.category}
              onChange={(v) => set("category", v)}
              options={CATEGORY_KEYS.map((k) => ({ value: k, label: CATEGORY_LABELS[k] }))}
            />
          </Field>
          <Field label="Nom" htmlFor="offer-name">
            <input id="offer-name" value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={120} className={inputClass} placeholder="Nom de l'adresse" autoFocus />
          </Field>
          <div className={cn("grid gap-4", admin ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            <Field label="Étiquette" htmlFor="offer-tag" hint={TAG_HINTS[draft.category]}>
              <input id="offer-tag" value={draft.tag} onChange={(e) => set("tag", e.target.value)} maxLength={40} className={inputClass} placeholder="Restaurant" />
            </Field>
            <Field label="Prix indicatif" htmlFor="offer-price" hint="Facultatif, texte libre.">
              <input id="offer-price" value={draft.price} onChange={(e) => set("price", e.target.value)} maxLength={40} className={cn(inputClass, "num")} placeholder="dès 450 MAD" />
            </Field>
            {admin && (
              <Field label="Ville" htmlFor="offer-city" hint="Vide = proposée dans toutes les villes.">
                <input id="offer-city" list="offer-cities" value={draft.city} onChange={(e) => set("city", e.target.value)} maxLength={80} className={inputClass} placeholder="Toutes" />
                <datalist id="offer-cities">
                  {CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            )}
          </div>
          <Field label="Description" htmlFor="offer-desc" hint={`${draft.description.length}/300`}>
            <textarea id="offer-desc" value={draft.description} onChange={(e) => set("description", e.target.value.slice(0, 300))} rows={3} className={cn(inputClass, "resize-none")} placeholder="En une ou deux phrases : ce qui rend l'adresse désirable." />
          </Field>
          <div className={cn("grid gap-4 items-end", admin ? "sm:grid-cols-2" : "")}>
            {admin && (
              <Field label="Identifiant" htmlFor="offer-slug" hint={initial.slug ? "Ne change pas : les réservations passées y sont rattachées." : "Généré depuis le nom, modifiable avant création."}>
                <input
                  id="offer-slug"
                  value={draft.slug}
                  disabled={!!initial.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                  className={cn(inputClass, "font-mono-satoshi")}
                />
              </Field>
            )}
            <div className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4">
              <Switch checked={draft.active} onChange={(v) => set("active", v)} label="Adresse proposée" />
              <span className="text-sm text-white/70">{draft.active ? "Proposée aux clients" : "Masquée pour l'instant"}</span>
            </div>
          </div>
          {error && <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
