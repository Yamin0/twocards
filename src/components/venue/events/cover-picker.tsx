"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Images, Upload, X } from "lucide-react";
import { Button, IconButton, useNotify } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { pick } from "@/lib/i18n";
import { EventCover } from "./event-cover";
import {
  GRADIENTS,
  ICONS,
  UNSPLASH_PHOTOS,
  gradientLabels,
  iconLabels,
  unsplashFull,
  unsplashThumb,
  type EventForm,
} from "./event-lib";
import { uploadEventCover } from "./upload-event-cover";

/* Habillage de l'événement : aperçu, photo importée ou choisie dans la
   banque, sinon un dégradé et une icône. */
export function CoverPicker({
  form,
  onChange,
}: {
  form: EventForm;
  onChange: (patch: Partial<EventForm>) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify(t("Choisissez une image", "Please choose an image"), "error");
      return;
    }
    setUploading(true);
    try {
      onChange({ coverImage: await uploadEventCover(file) });
    } catch {
      notify(t("L'envoi de l'image a échoué", "Image upload failed"), "error");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <EventCover
        coverImage={form.coverImage}
        gradient={form.gradient}
        iconIdx={form.iconIdx}
        alt={t("Couverture", "Cover")}
        title={form.title || undefined}
        iconSize={70}
        sizes="460px"
        className="h-36 rounded-2xl"
      >
        {form.coverImage && (
          <IconButton
            icon={X}
            label={t("Retirer la couverture", "Remove cover")}
            onClick={() => onChange({ coverImage: null })}
            className="absolute right-2 top-2 z-20 h-9 w-9 bg-panel text-ink shadow-card hover:bg-panel"
          />
        )}
      </EventCover>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {/* Deux voies explicites vers une couverture, en boutons : le survol
          de l'aperçu n'existe pas au toucher. */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          icon={Upload}
          loading={uploading}
          className="flex-1"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? t("Import en cours…", "Uploading…") : t("Importer une image", "Upload an image")}
        </Button>
        <Button
          size="sm"
          icon={Images}
          className="flex-1"
          aria-expanded={galleryOpen}
          onClick={() => setGalleryOpen((v) => !v)}
        >
          {t("Photo Unsplash", "Unsplash photo")}
        </Button>
      </div>

      {galleryOpen && (
        <div className="rounded-2xl border border-line bg-fill p-3">
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto scrollbar-thin">
            {UNSPLASH_PHOTOS.map((photo) => {
              const full = unsplashFull(photo.id);
              const alt = pick(locale, photo.alt, photo.altEn);
              const active = form.coverImage === full;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onChange({ coverImage: full })}
                  title={alt}
                  aria-label={alt}
                  aria-pressed={active}
                  className={cn(
                    "relative aspect-[3/2] overflow-hidden rounded-lg border-2 transition-colors",
                    active ? "border-brand" : "border-transparent hover:border-line-2"
                  )}
                >
                  <Image
                    src={unsplashThumb(photo.id)}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized
                  />
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center bg-scrim" aria-hidden>
                      <Check size={18} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Crédit : Unsplash demande d'attribuer la source. */}
          <p className="mt-2.5 text-xs text-ink-3">
            {t("Photos", "Photos")}{" "}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded underline underline-offset-2 hover:text-ink"
            >
              Unsplash
            </a>
            {t(", libres d'utilisation.", ", free to use.")}
          </p>
        </div>
      )}

      {/* Le dégradé ne se voit que sans photo. */}
      {!form.coverImage && (
        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-ink-2">
            {t("Couleur de fond", "Background colour")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {GRADIENTS.map((g, i) => {
              const active = form.gradient === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onChange({ gradient: g })}
                  aria-label={gradientLabels(t)[i]}
                  title={gradientLabels(t)[i]}
                  aria-pressed={active}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ring-offset-2 ring-offset-panel transition-shadow",
                    g,
                    active ? "ring-2 ring-brand" : "hover:ring-2 hover:ring-line-2"
                  )}
                >
                  {active && <Check size={16} strokeWidth={3} className="text-white" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-[13px] font-bold text-ink-2">{t("Icône", "Icon")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((Icon, idx) => {
            const active = form.iconIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange({ iconIdx: idx })}
                aria-label={iconLabels(t)[idx]}
                title={iconLabels(t)[idx]}
                aria-pressed={active}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                  active
                    ? "border-brand bg-brand text-on-brand"
                    : "border-line bg-panel text-ink-2 hover:bg-fill-2 hover:text-ink"
                )}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
