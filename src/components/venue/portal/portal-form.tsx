"use client";

import { useRef } from "react";
import { ImagePlus, Save } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, Field, Switch, inputClass, useFieldId } from "@/components/app/ui";
import { slugifyPortal, type VenuePortal } from "@/hooks/use-venue-portal";
import { ColorField } from "./color-field";

const ACCENTS = ["#13305c", "#0d0d0d", "#7c2d3a", "#1f6a4f", "#8a6d1d", "#4c3a8f"];
const BACKGROUNDS = ["#f5f5f4", "#ffffff", "#ece4d8", "#101726", "#0d0d0d", "#0e2a22"];
const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 ? "30" : "00"}`;
});

/* Réglages du portail : identité, couleurs, couverture, créneaux, mise en
   ligne. L'état du formulaire vit dans la page ; ici, la saisie seulement. */
export function PortalForm({
  form,
  onChange,
  onSave,
  saving,
  onUploadCover,
  uploading,
}: {
  form: VenuePortal;
  onChange: <K extends keyof VenuePortal>(key: K, value: VenuePortal[K]) => void;
  onSave: () => void;
  saving: boolean;
  onUploadCover: (file: File) => void;
  uploading: boolean;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useFieldId("portal");

  return (
    <Card title={t("Configuration", "Setup")}>
      <div className="space-y-5">
        <Field label={t("Nom affiché", "Display name")} htmlFor={`${id}-name`}>
          <input
            id={`${id}-name`}
            className={inputClass}
            value={form.display_name}
            onChange={(e) => onChange("display_name", e.target.value)}
            maxLength={80}
            placeholder="Jimmy'z Marrakech"
          />
        </Field>

        <Field label={t("Adresse de la page", "Page address")} htmlFor={`${id}-slug`}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-ink-3" aria-hidden>
              /r/
            </span>
            <input
              id={`${id}-slug`}
              className={inputClass}
              value={form.slug}
              onChange={(e) => onChange("slug", slugifyPortal(e.target.value))}
              maxLength={40}
              placeholder="jimmyz-marrakech"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
        </Field>

        <Field
          label={t("Phrase d'accueil (facultatif)", "Welcome line (optional)")}
          htmlFor={`${id}-tagline`}
        >
          <input
            id={`${id}-tagline`}
            className={inputClass}
            value={form.tagline}
            onChange={(e) => onChange("tagline", e.target.value)}
            maxLength={160}
            placeholder={t("La nuit légendaire de l'Hivernage", "Hivernage's legendary nights")}
          />
        </Field>

        <ColorField
          label={t("Couleur d'accent", "Accent colour")}
          swatchLabel={t("Couleur", "Colour")}
          customLabel={t("Couleur personnalisée", "Custom colour")}
          value={form.accent_color}
          options={ACCENTS}
          onChange={(c) => onChange("accent_color", c)}
        />

        <ColorField
          label={t("Fond de la page", "Page background")}
          swatchLabel={t("Fond", "Background")}
          customLabel={t("Fond personnalisé", "Custom background")}
          value={form.background_color}
          options={BACKGROUNDS}
          onChange={(c) => onChange("background_color", c)}
        />

        <Field
          label={t("Photo de couverture (facultatif)", "Cover photo (optional)")}
          hint={t("Bandeau en haut de la page.", "Banner at the top of the page.")}
        >
          <div className="flex flex-wrap items-center gap-3">
            {form.cover_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={form.cover_url}
                alt={t("Couverture du portail", "Portal cover")}
                className="h-16 w-28 rounded-lg border border-line-2 object-cover"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadCover(f);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              icon={ImagePlus}
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading
                ? t("Envoi en cours…", "Uploading…")
                : form.cover_url
                  ? t("Remplacer", "Replace")
                  : t("Importer une image", "Upload an image")}
            </Button>
            {form.cover_url && (
              <Button size="sm" variant="ghost" onClick={() => onChange("cover_url", null)}>
                {t("Retirer", "Remove")}
              </Button>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Couverts max.", "Max. covers")} htmlFor={`${id}-party`}>
            <select
              id={`${id}-party`}
              className={inputClass}
              value={form.party_max}
              onChange={(e) => onChange("party_max", Number(e.target.value))}
            >
              {[4, 6, 8, 10, 12, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {t(`${n} personnes`, `${n} guests`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Créneaux toutes les", "Time slots every")} htmlFor={`${id}-interval`}>
            <select
              id={`${id}-interval`}
              className={inputClass}
              value={form.interval_minutes}
              onChange={(e) => onChange("interval_minutes", Number(e.target.value))}
            >
              {[15, 30, 60].map((n) => (
                <option key={n} value={n}>
                  {t(`${n} minutes`, `${n} minutes`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Premier créneau", "First slot")} htmlFor={`${id}-start`}>
            <select
              id={`${id}-start`}
              className={inputClass}
              value={form.start_time}
              onChange={(e) => onChange("start_time", e.target.value)}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Dernier créneau", "Last slot")} htmlFor={`${id}-end`}>
            <select
              id={`${id}-end`}
              className={inputClass}
              value={form.end_time}
              onChange={(e) => onChange("end_time", e.target.value)}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={form.active}
              onChange={(next) => onChange("active", next)}
              label={t("Portail en ligne", "Portal live")}
            />
            <span className="text-sm text-ink-2" aria-hidden>
              {form.active ? t("Portail en ligne", "Portal live") : t("Portail désactivé", "Portal disabled")}
            </span>
          </div>
          <Button variant="primary" icon={Save} loading={saving} onClick={onSave}>
            {t("Enregistrer", "Save")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
