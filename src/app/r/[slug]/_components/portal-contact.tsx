"use client";

import { useId } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { longDate } from "@/lib/booking/dates";
import type { Portal } from "@/lib/booking/load";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import type { PortalBooking } from "../_hooks/use-portal-booking";

/* 16 px : iOS ne zoome pas à la prise de focus. */
const FIELD =
  "w-full rounded-xl border border-neutral-400 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-500 focus:border-neutral-900";
const LABEL = "mb-1.5 block text-sm font-medium text-neutral-800";

/* Étape 2 : coordonnées. Seul ce formulaire envoie la demande. */
export function PortalContact({ booking, portal }: { booking: PortalBooking; portal: Portal }) {
  const t = useT();
  const intl = useIntlLocale();
  const firstId = useId();
  const lastId = useId();
  const phoneId = useId();
  const notesId = useId();
  const errorId = useId();
  const n = booking.party;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void booking.submit();
      }}
    >
      <button
        type="button"
        onClick={() => booking.setStep("slots")}
        className="-ml-2 mb-2 flex h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden /> {t("Retour", "Back")}
      </button>

      <div className="mb-2 rounded-xl bg-neutral-100 px-4 py-3">
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-neutral-900">{portal.display_name}</span>{" "}
          {t(`${n} personne${n > 1 ? "s" : ""}`, `${n} ${n === 1 ? "guest" : "guests"}`)} · {longDate(booking.selectedDate, intl)} ·{" "}
          {booking.time}
        </p>
      </div>
      {/* La promesse avant l'effort : on demande un numéro, on dit tout de
          suite pourquoi et ce qui n'est pas demandé. */}
      <p className="mb-5 px-1 text-sm leading-relaxed text-neutral-600">
        {t(
          "Sans prépaiement, l'établissement vous confirme par téléphone ou WhatsApp.",
          "No prepayment: the venue will confirm by phone or WhatsApp."
        )}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={firstId} className={LABEL}>
            {t("Prénom", "First name")}
          </label>
          <input
            id={firstId}
            value={booking.firstName}
            onChange={(e) => booking.setFirstName(e.target.value)}
            required
            maxLength={60}
            autoComplete="given-name"
            autoCapitalize="words"
            enterKeyHint="next"
            autoFocus
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor={lastId} className={LABEL}>
            {t("Nom", "Last name")}
          </label>
          <input
            id={lastId}
            value={booking.lastName}
            onChange={(e) => booking.setLastName(e.target.value)}
            required
            maxLength={59}
            autoComplete="family-name"
            autoCapitalize="words"
            enterKeyHint="next"
            className={FIELD}
          />
        </div>
      </div>

      <label htmlFor={phoneId} className={`${LABEL} mt-4`}>
        {t("Téléphone", "Phone")}
      </label>
      <input
        id={phoneId}
        value={booking.phone}
        onChange={(e) => booking.setPhone(e.target.value)}
        type="tel"
        inputMode="tel"
        placeholder="+212 6 12 34 56 78"
        required
        maxLength={40}
        autoComplete="tel"
        enterKeyHint="send"
        className={FIELD}
      />

      <label htmlFor={notesId} className={`${LABEL} mt-4`}>
        {t("Une précision ?", "Anything to add?")}{" "}
        <span className="font-normal text-neutral-600">{t("(facultatif)", "(optional)")}</span>
      </label>
      <textarea
        id={notesId}
        value={booking.notes}
        onChange={(e) => booking.setNotes(e.target.value)}
        placeholder={t("Occasion, allergies, demande particulière…", "Occasion, allergies, special request…")}
        maxLength={500}
        className={`${FIELD} min-h-20 resize-none`}
      />

      {booking.error && (
        <p id={errorId} role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
          {booking.error}
        </p>
      )}

      <button
        type="submit"
        disabled={booking.sending}
        aria-describedby={booking.error ? errorId : undefined}
        className="mt-5 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[var(--portal-accent)] px-4 text-base font-bold text-[var(--portal-on-accent)] transition-opacity disabled:opacity-60"
      >
        {booking.sending ? (
          <>
            <Loader2 size={17} strokeWidth={2} className="animate-spin" aria-hidden /> {t("Envoi…", "Sending…")}
          </>
        ) : booking.error ? (
          t("Réessayer l'envoi", "Try sending again")
        ) : (
          t("Confirmer la réservation", "Confirm reservation")
        )}
      </button>
    </form>
  );
}
