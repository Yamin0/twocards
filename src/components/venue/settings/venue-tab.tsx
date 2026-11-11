"use client";

import { useT } from "@/lib/i18n/client";
import { Button, Card, Field, inputClass } from "@/components/app/ui";
import { managedNote, venueTypeLabel } from "./settings-lib";
import type { VenueSettings } from "./use-venue-settings";

export function VenueTab({ settings, onSave }: { settings: VenueSettings; onSave: () => void }) {
  const t = useT();
  const { form, updateForm, saving } = settings;

  return (
    <Card title={t("Votre établissement", "Your venue")} bodyClassName="space-y-5">
      <Field
        label={t("Nom de l'établissement", "Venue name")}
        htmlFor="set-venue-name"
        hint={managedNote(t)}
      >
        <input id="set-venue-name" type="text" value={form.venueName} disabled className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("Type", "Type")} htmlFor="set-venue-type" hint={managedNote(t)}>
          <input
            id="set-venue-type"
            type="text"
            value={venueTypeLabel(form.venueType, t)}
            disabled
            className={inputClass}
          />
        </Field>
        <Field label={t("Capacité", "Capacity")} htmlFor="set-capacity">
          <input
            id="set-capacity"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.capacity}
            onChange={(e) => updateForm("capacity", e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={t("Adresse", "Address")} htmlFor="set-address">
        <input
          id="set-address"
          type="text"
          autoComplete="street-address"
          value={form.address}
          onChange={(e) => updateForm("address", e.target.value)}
          placeholder={t("Adresse complète", "Full address")}
          className={inputClass}
        />
      </Field>

      <Field label={t("Description", "Description")} htmlFor="set-description">
        <textarea
          id="set-description"
          rows={3}
          value={form.description}
          onChange={(e) => updateForm("description", e.target.value)}
          placeholder={t("Décrivez votre établissement…", "Describe your venue…")}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <Field label={t("Horaires d'ouverture", "Opening hours")} htmlFor="set-hours">
        <input
          id="set-hours"
          type="text"
          value={form.hours}
          onChange={(e) => updateForm("hours", e.target.value)}
          placeholder={t("Ex. : Lun-Ven 19h-02h", "e.g. Mon–Fri 7pm–2am")}
          className={inputClass}
        />
      </Field>

      <Field label={t("Consommation minimum", "Minimum spend")} htmlFor="set-min-spend">
        <input
          id="set-min-spend"
          type="text"
          value={form.minSpend}
          onChange={(e) => updateForm("minSpend", e.target.value)}
          placeholder={t("Ex. : Table standard : 500 MAD", "e.g. Standard table: 500 MAD")}
          className={inputClass}
        />
      </Field>

      {/* Lien « Demander des avis » de la fiche Google : proposé à chaque
          client après sa note, sur la page /avis/[id]. */}
      <Field
        label={t("Lien d'avis Google", "Google review link")}
        htmlFor="set-google-review"
        hint={t(
          "Dans votre fiche Google Business Profile, « Demander des avis », puis copiez le lien. Après avoir noté sa soirée, chaque client est invité à laisser un avis Google.",
          "In your Google Business Profile, open “Ask for reviews” and copy the link. After rating their evening, each guest is invited to leave a Google review."
        )}
      >
        <input
          id="set-google-review"
          type="url"
          inputMode="url"
          value={form.googleReviewUrl}
          onChange={(e) => updateForm("googleReviewUrl", e.target.value)}
          placeholder="https://g.page/r/…/review"
          className={inputClass}
        />
      </Field>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onSave} loading={saving}>
          {saving ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
        </Button>
      </div>
    </Card>
  );
}
