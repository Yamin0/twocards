"use client";

import { useState } from "react";
import { Eye, Save } from "lucide-react";
import { Button, Card, Field, LinkButton, inputClass, useNotify } from "@/components/app/ui";
import { previewUrl } from "@/components/concierge/link-hero";
import { CITIES } from "@/components/hotel/offer-editor";
import { useConciergeSpace } from "@/lib/concierge/space";
import type { HotelProfile } from "@/lib/hotel/store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

const HEX = /^#[0-9a-fA-F]{6}$/;

type MenuForm = { name: string; city: string; accent: string; welcome: string; phone: string };

/* Réglages du menu client du concierge : ce que voit la personne qui ouvre
   son lien. Écrit dans hotel_profiles (une ligne par compte), comme le
   menu d'un hôtel ; les autres colonnes du profil ne sont pas touchées. */
function MenuSettingsForm({
  initial,
  profile,
  save,
  previewLink,
}: {
  initial: MenuForm;
  profile: HotelProfile;
  save: (patch: Partial<HotelProfile>) => Promise<boolean>;
  previewLink: string | null;
}) {
  const t = useT();
  const notify = useNotify();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof MenuForm, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const accentValid = HEX.test(form.accent);

  const dirty =
    form.name.trim() !== (profile.hotel_name ?? "") ||
    form.city.trim() !== (profile.city ?? "") ||
    form.accent !== profile.accent_color ||
    form.welcome.trim() !== (profile.welcome_message ?? "") ||
    form.phone.trim() !== (profile.reception_phone ?? "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accentValid || saving) return;
    setSaving(true);
    const ok = await save({
      hotel_name: form.name.trim() || null,
      city: form.city.trim() || null,
      accent_color: form.accent,
      welcome_message: form.welcome.trim() || null,
      reception_phone: form.phone.trim() || null,
    });
    setSaving(false);
    if (ok) notify(t("Menu enregistré, visible dès la prochaine ouverture", "Menu saved, live from the next open"));
    else notify(t("Le menu n'a pas pu être enregistré.", "The menu couldn't be saved."), "error");
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field
        label={t("Nom affiché", "Display name")}
        htmlFor="m-nom"
        hint={t(
          "En grand, en tête du menu. C'est aussi le nom que voit l'établissement sur vos réservations.",
          "In large type at the top of the menu. It's also the name venues see on your reservations."
        )}
        className="sm:col-span-2"
      >
        <input
          id="m-nom"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          maxLength={120}
          className={inputClass}
        />
      </Field>
      <Field
        label={t("Ville", "City")}
        htmlFor="m-ville"
        hint={t("Détermine les adresses proposées dans le menu.", "Determines the places offered in the menu.")}
      >
        <input
          id="m-ville"
          list="m-villes"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          maxLength={80}
          className={inputClass}
        />
        <datalist id="m-villes">
          {CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field
        label={t("Couleur", "Colour")}
        htmlFor="m-couleur"
        error={accentValid ? undefined : t("Format attendu : #13305c", "Expected format: #13305c")}
        hint={t("Boutons et accents du menu.", "The menu's buttons and accents.")}
      >
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={t("Choisir la couleur", "Pick the colour")}
            value={accentValid ? form.accent : profile.accent_color}
            onChange={(e) => set("accent", e.target.value)}
            className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-line-2 bg-panel p-1"
          />
          <input
            id="m-couleur"
            value={form.accent}
            onChange={(e) => set("accent", e.target.value.trim())}
            maxLength={7}
            spellCheck={false}
            className={cn(inputClass, "num")}
          />
        </div>
      </Field>
      <Field
        label={t("Message d'accueil", "Welcome message")}
        htmlFor="m-accueil"
        hint={t(
          `Sous votre nom. Vide : le message par défaut du menu. ${form.welcome.length}/240`,
          `Below your name. Empty: the menu's default message. ${form.welcome.length}/240`
        )}
        className="sm:col-span-2"
      >
        <textarea
          id="m-accueil"
          value={form.welcome}
          onChange={(e) => set("welcome", e.target.value)}
          maxLength={240}
          rows={3}
          className={cn(inputClass, "resize-none")}
        />
      </Field>
      <Field
        label={t("Téléphone WhatsApp", "WhatsApp phone")}
        htmlFor="m-tel"
        hint={t(
          "Ajoute en bas du menu un bouton WhatsApp vers ce numéro (son libellé actuel : « Écrire à la réception »). Vide : pas de bouton.",
          "Adds a WhatsApp button to this number at the bottom of the menu (currently labelled “Message reception”). Empty: no button."
        )}
        className="sm:col-span-2"
      >
        <input
          id="m-tel"
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          maxLength={40}
          placeholder="+212 6 …"
          className={cn(inputClass, "num")}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" icon={Save} loading={saving} disabled={!dirty || !accentValid}>
          {t("Enregistrer le menu", "Save menu")}
        </Button>
        {previewLink && (
          <LinkButton href={previewUrl(previewLink)} external icon={Eye}>
            {t("Voir le menu", "View menu")}
          </LinkButton>
        )}
      </div>
    </form>
  );
}

export function MenuSettingsCard() {
  const t = useT();
  const { profile, saveProfile, displayName, city, mainLink, linkOf } = useConciergeSpace();
  return (
    <Card
      title={t("Menu client", "Guest menu")}
      description={t(
        "Ce que voit la personne qui ouvre votre lien ou scanne votre QR.",
        "What people see when they open your link or scan your QR code."
      )}
    >
      <MenuSettingsForm
        initial={{
          name: displayName ?? "",
          city: city ?? "",
          accent: profile.accent_color,
          welcome: profile.welcome_message ?? "",
          phone: profile.reception_phone ?? "",
        }}
        profile={profile}
        save={saveProfile}
        previewLink={mainLink ? linkOf(mainLink) : null}
      />
    </Card>
  );
}
