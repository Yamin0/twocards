"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button, Field, Modal, inputClass } from "@/components/app/ui";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

/* Canaux proposés à la création : un lien par endroit où on le partage,
   pour savoir d'où viennent les réservations. */
const channels = (t: Translate) => [
  "Instagram",
  "WhatsApp",
  "TikTok",
  t("Carte de visite", "Business card"),
  t("Site web", "Website"),
  t("E-mail", "Email"),
];

/* Nom d'un lien, à la création ou au renommage. Le nom est repris sur la
   réservation (c'est lui qui dit d'où elle vient) et en tête du menu client
   (la page /s l'affiche au-dessus du nom) : le champ le dit. Deux liens ne
   peuvent pas porter le même nom. */
export function LinkNameDialog({
  mode,
  initial = "",
  existing,
  onClose,
  onSubmit,
}: {
  mode: "create" | "rename";
  initial?: string;
  /** Noms déjà pris (hors lien renommé). */
  existing: string[];
  onClose: () => void;
  onSubmit: (label: string) => Promise<boolean>;
}) {
  const t = useT();
  const [label, setLabel] = useState(initial);
  const [saving, setSaving] = useState(false);
  const taken = new Set(existing.map((l) => l.trim().toLowerCase()));
  const name = label.trim();
  const duplicate = name !== "" && taken.has(name.toLowerCase());
  const valid = name !== "" && !duplicate;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const ok = await onSubmit(name);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={mode === "create" ? t("Nouveau lien", "New link") : t("Renommer le lien", "Rename link")}
      description={
        mode === "create"
          ? t(
              "Un lien par canal : vous verrez d'où viennent vos réservations.",
              "One link per channel: you'll see where your reservations come from."
            )
          : t(
              "L'adresse et le QR ne changent pas : ce qui est déjà partagé ou imprimé reste valable.",
              "The address and QR code don't change: what's already shared or printed still works."
            )
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button
            variant="primary"
            icon={mode === "create" ? Plus : Save}
            onClick={submit}
            loading={saving}
            disabled={!valid}
          >
            {mode === "create" ? t("Créer le lien", "Create link") : t("Enregistrer", "Save")}
          </Button>
        </>
      }
    >
      <Field
        label={t("Nom du lien", "Link name")}
        htmlFor="lien-nom"
        error={duplicate ? t("Un de vos liens porte déjà ce nom.", "One of your links already has this name.") : undefined}
        hint={t(
          "Il s'affiche en petit en haut du menu client ouvert par ce lien, et sur vos réservations.",
          "It appears in small print at the top of the guest menu this link opens, and on your reservations."
        )}
      >
        <input
          id="lien-nom"
          data-autofocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("Instagram, Carte de visite…", "Instagram, Business card…")}
          maxLength={60}
          className={inputClass}
        />
      </Field>
      {mode === "create" && (
        <div className="mt-4">
          <p className="mb-2 text-[13px] font-bold text-ink-2">{t("Suggestions", "Suggestions")}</p>
          <div className="flex flex-wrap gap-2">
            {channels(t)
              .filter((c) => !taken.has(c.toLowerCase()))
              .map((c) => (
                <Button key={c} size="sm" onClick={() => setLabel(c)}>
                  {c}
                </Button>
              ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
