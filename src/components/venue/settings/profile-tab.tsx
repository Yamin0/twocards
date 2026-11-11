"use client";

import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useT } from "@/lib/i18n/client";
import { Button, Card, Field, inputClass, useNotify } from "@/components/app/ui";
import { deleteMailto, managedNote } from "./settings-lib";
import type { VenueSettings } from "./use-venue-settings";

export function ProfileTab({ settings, onSave }: { settings: VenueSettings; onSave: () => void }) {
  const t = useT();
  const notify = useNotify();
  const { form, updateForm, saving } = settings;

  return (
    <div className="space-y-4">
      <Card title={t("Photo de profil", "Profile photo")}>
        <AvatarUploader onMessage={(message) => notify(message)} />
      </Card>

      <Card title={t("Vos coordonnées", "Your details")} bodyClassName="space-y-5">
        <Field label={t("Nom complet", "Full name")} htmlFor="set-name">
          <input
            id="set-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            placeholder={t("Votre nom", "Your name")}
            className={inputClass}
          />
        </Field>
        <Field label={t("E-mail", "Email")} htmlFor="set-email" hint={managedNote(t)}>
          <input id="set-email" type="email" value={form.email} disabled className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Téléphone", "Phone")} htmlFor="set-phone">
            <input
              id="set-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="+212 6 00 00 00 00"
              className={inputClass}
            />
          </Field>
          <Field label={t("Ville", "City")} htmlFor="set-city">
            <input
              id="set-city"
              type="text"
              value={form.city}
              onChange={(e) => updateForm("city", e.target.value)}
              placeholder={t("Votre ville", "Your city")}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onSave} loading={saving}>
            {saving ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
          </Button>
        </div>
      </Card>

      {/* Langue de l'interface (visible aussi dans l'app mobile). */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-ink">{t("Langue", "Language")}</h2>
            <p className="mt-0.5 text-[13px] text-ink-3">
              {t("Langue de votre espace twocards.", "The language of your twocards workspace.")}
            </p>
          </div>
          <LanguageSwitcher tone="light" />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">{t("Supprimer le compte", "Delete account")}</h2>
            <p className="mt-0.5 max-w-md text-[13px] text-ink-3">
              {t(
                "La demande est envoyée à notre support et traitée sous 30 jours.",
                "Your request goes to our support team and is handled within 30 days."
              )}
            </p>
          </div>
          <a
            href={deleteMailto(t)}
            className="inline-flex h-11 shrink-0 items-center rounded-xl px-1 text-sm font-bold text-danger underline-offset-4 hover:underline"
          >
            {t("Demander la suppression", "Request deletion")}
          </a>
        </div>
      </Card>
    </div>
  );
}
