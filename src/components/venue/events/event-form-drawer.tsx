"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { EVENT_STATUSES, type EventStatus } from "@/hooks/use-venue-events";
import {
  Button,
  Drawer,
  Field,
  IconButton,
  Segmented,
  Select,
  inputClass,
  useFieldId,
} from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { CoverPicker } from "./cover-picker";
import { MiniCalendar } from "./mini-calendar";
import { HOURS, eventStatusLabel, formatEventDate, type EventForm } from "./event-lib";

/* Une heure enregistrée hors de la liste (ancienne saisie) reste proposée. */
function hourOptions(current: string, placeholder: string) {
  const hours = current && !HOURS.includes(current) ? [current, ...HOURS] : HOURS;
  return [{ value: "", label: placeholder }, ...hours.map((h) => ({ value: h, label: h }))];
}

/* Création et modification d'un événement. Monté à l'ouverture avec le
   formulaire de départ : fermer puis rouvrir repart d'un état propre. */
export function EventFormDrawer({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial: EventForm;
  onClose: () => void;
  /** Renvoie vrai si l'enregistrement a réussi (le tiroir se ferme alors). */
  onSubmit: (form: EventForm) => Promise<boolean>;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const [form, setForm] = useState<EventForm>(initial);
  const [saving, setSaving] = useState(false);
  const ids = {
    title: useFieldId("ev-title"),
    venue: useFieldId("ev-venue"),
    spots: useFieldId("ev-spots"),
    genre: useFieldId("ev-genre"),
    description: useFieldId("ev-desc"),
  };
  const isEdit = mode === "edit";
  const patch = (p: Partial<EventForm>) => setForm((prev) => ({ ...prev, ...p }));
  const canSave = form.title.trim().length > 0;

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const ok = await onSubmit(form);
    /* En cas de succès le tiroir est démonté par la page. */
    if (!ok) setSaving(false);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? t("Modifier l'événement", "Edit event") : t("Nouvel événement", "New event")}
      footer={
        <>
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button
            variant="primary"
            icon={Save}
            className="flex-1"
            disabled={!canSave}
            loading={saving}
            onClick={submit}
          >
            {isEdit ? t("Enregistrer", "Save") : t("Créer", "Create")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <CoverPicker form={form} onChange={patch} />

        <Field label={t("Nom (obligatoire)", "Name (required)")} htmlFor={ids.title}>
          <input
            id={ids.title}
            data-autofocus
            type="text"
            required
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder={t("Ex. : Gala de minuit", "e.g. Midnight Gala")}
            className={inputClass}
          />
        </Field>

        <Field label={t("Lieu", "Location")} htmlFor={ids.venue}>
          <input
            id={ids.venue}
            type="text"
            value={form.venue}
            onChange={(e) => patch({ venue: e.target.value })}
            placeholder={t("Ex. : la terrasse", "e.g. the terrace")}
            className={inputClass}
          />
        </Field>

        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-[13px] font-bold text-ink-2">{t("Date", "Date")}</legend>
          {form.dateObj && (
            <div className="flex items-center gap-1">
              <span className="rounded-lg bg-fill-2 px-3 py-1.5 text-sm font-bold text-ink">
                {formatEventDate(form.dateObj, intl)}
              </span>
              <IconButton
                icon={X}
                size={16}
                tone="danger"
                label={t("Effacer la date", "Clear date")}
                onClick={() => patch({ dateObj: null })}
              />
            </div>
          )}
          <MiniCalendar selected={form.dateObj} onSelect={(d) => patch({ dateObj: d })} />
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Ouverture", "Opens")}>
            <Select
              label={t("Heure d'ouverture", "Opening time")}
              value={form.timeOpen}
              onChange={(v) => patch({ timeOpen: v })}
              options={hourOptions(form.timeOpen, "--:--")}
            />
          </Field>
          <Field label={t("Fermeture", "Closes")}>
            <Select
              label={t("Heure de fermeture", "Closing time")}
              value={form.timeClose}
              onChange={(v) => patch({ timeClose: v })}
              options={hourOptions(form.timeClose, "--:--")}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-bold text-ink-2">{t("Statut", "Status")}</legend>
          {/* Les valeurs sont celles de la base ; seul le libellé est traduit. */}
          <Segmented<EventStatus>
            size="sm"
            label={t("Statut", "Status")}
            value={form.status}
            onChange={(status) => patch({ status })}
            options={EVENT_STATUSES.map((s) => ({ value: s, label: eventStatusLabel(s, t) }))}
          />
        </fieldset>

        <Field label={t("Capacité (places)", "Capacity (spots)")} htmlFor={ids.spots}>
          <input
            id={ids.spots}
            type="number"
            inputMode="numeric"
            min={0}
            value={form.totalSpots}
            onChange={(e) => patch({ totalSpots: parseInt(e.target.value) || 0 })}
            className={cn(inputClass, "num")}
          />
        </Field>

        <Field
          label={t("Genres", "Genres")}
          hint={t("Séparés par des virgules.", "Separated by commas.")}
          htmlFor={ids.genre}
        >
          <input
            id={ids.genre}
            type="text"
            value={form.genre}
            onChange={(e) => patch({ genre: e.target.value })}
            placeholder={t("Ex. : Electro, House", "e.g. Electro, House")}
            className={inputClass}
          />
        </Field>

        <Field label={t("Description", "Description")} htmlFor={ids.description}>
          <textarea
            id={ids.description}
            rows={3}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder={t("Décrivez votre événement", "Describe your event")}
            className={cn(inputClass, "resize-none")}
          />
        </Field>
      </div>
    </Drawer>
  );
}
