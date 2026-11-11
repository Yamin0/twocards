"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button, Field, IconButton, Modal, inputClass } from "@/components/app/ui";
import { RatingStars } from "@/components/shared/mini-charts";
import type { NewReservation } from "@/hooks/use-venue-reservations";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { todayIso, type Reservation } from "@/lib/venue/reservations";
import type { VenueTable } from "./reservation-row";

const emptyForm = (): NewReservation => ({
  name: "",
  phone: "",
  date: todayIso(),
  time: "",
  party: 2,
  tableId: "",
  notes: "",
});

/* Réservation prise au téléphone ou au passage. */
export function NewReservationModal({
  open,
  onClose,
  tables,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  tables: VenueTable[];
  onCreate: (form: NewReservation) => Promise<boolean>;
}) {
  const t = useT();
  const [form, setForm] = useState<NewReservation>(emptyForm);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof NewReservation>(key: K, value: NewReservation[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const ok = await onCreate({ ...form, name: form.name.trim(), phone: form.phone.trim() });
    setSaving(false);
    if (ok) {
      setForm(emptyForm());
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Nouvelle réservation", "New reservation")}
      description={t("Prise au téléphone ou au passage. Sans commission.", "Taken by phone or walk-in. No commission.")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button variant="primary" type="submit" form="nouvelle-reservation" loading={saving}>
            {t("Créer la réservation", "Create reservation")}
          </Button>
        </>
      }
    >
      <form id="nouvelle-reservation" onSubmit={submit} className="grid gap-4 pb-2 sm:grid-cols-2">
        <Field label={t("Nom du client", "Guest name")} htmlFor="nr-nom" className="sm:col-span-2">
          <input
            id="nr-nom"
            data-autofocus
            required
            maxLength={120}
            autoComplete="off"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t("Téléphone", "Phone")} htmlFor="nr-tel" className="sm:col-span-2">
          <input
            id="nr-tel"
            type="tel"
            inputMode="tel"
            required
            maxLength={40}
            autoComplete="off"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+212 6…"
            className={inputClass}
          />
        </Field>
        <Field label={t("Date", "Date")} htmlFor="nr-date">
          <input
            id="nr-date"
            type="date"
            required
            min={todayIso()}
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t("Heure", "Time")} htmlFor="nr-heure" hint={t("Facultatif", "Optional")}>
          <input
            id="nr-heure"
            type="time"
            value={form.time}
            onChange={(e) => set("time", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t("Personnes", "Party size")}>
          <div className="flex items-center gap-2">
            <IconButton
              icon={Minus}
              label={t("Une personne de moins", "One guest fewer")}
              disabled={form.party <= 1}
              onClick={() => set("party", Math.max(1, form.party - 1))}
              className="h-11 w-11 border border-line-2"
            />
            <span className="num w-10 text-center text-lg font-bold text-ink" aria-live="polite">
              {form.party}
            </span>
            <IconButton
              icon={Plus}
              label={t("Une personne de plus", "One more guest")}
              disabled={form.party >= 50}
              onClick={() => set("party", Math.min(50, form.party + 1))}
              className="h-11 w-11 border border-line-2"
            />
          </div>
        </Field>
        {tables.length > 0 && (
          <Field label={t("Table", "Table")} htmlFor="nr-table" hint={t("Facultatif", "Optional")}>
            <select
              id="nr-table"
              value={form.tableId}
              onChange={(e) => set("tableId", e.target.value)}
              className={`${inputClass} h-11 py-0`}
            >
              <option value="">{t("Sans table", "No table")}</option>
              {tables.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                  {x.vip ? " · VIP" : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t("Note", "Note")} htmlFor="nr-note" hint={t("Facultatif", "Optional")} className="sm:col-span-2">
          <textarea
            id="nr-note"
            rows={2}
            maxLength={500}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={inputClass}
          />
        </Field>
      </form>
    </Modal>
  );
}

/* Avis laissé par le client après sa sortie. */
export function ReviewModal({ review, onClose }: { review: Reservation | null; onClose: () => void }) {
  const t = useT();
  const intl = useIntlLocale();
  if (!review || review.rating === null) return null;
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t(`Avis de ${review.guest_name}`, `Review from ${review.guest_name}`)}
      description={
        <>
          {t("Sortie du", "Visit on")}{" "}
          {new Date(`${review.reservation_date}T00:00:00`).toLocaleDateString(intl, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {" · "}
          {t(`${review.party_size} pers.`, `${review.party_size} ${review.party_size === 1 ? "guest" : "guests"}`)}
        </>
      }
    >
      <div className="flex items-center gap-3 pb-2">
        <p className="num font-display text-4xl text-ink">
          {review.rating}
          <span className="text-lg text-ink-3">/5</span>
        </p>
        <RatingStars value={review.rating} size={18} />
      </div>
      <p className="pb-2 text-sm leading-relaxed text-ink-2">
        {review.rating_comment
          ? t(`« ${review.rating_comment} »`, `“${review.rating_comment}”`)
          : t("Le client n'a pas laissé de commentaire.", "The guest didn't leave a comment.")}
      </p>
    </Modal>
  );
}
