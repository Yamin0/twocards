"use client";

import { Check } from "lucide-react";
import type { GuestOffer } from "@/lib/guest-catalog";
import { fromIsoDay, longDate } from "@/lib/booking/dates";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import type { ReservationForm } from "../_hooks/use-reservation-form";

/* Confirmation : ce qui a été demandé, qui rappelle, sur quel numéro. */
export function StepDone({
  form,
  offer,
  hotelName,
  kind,
  preview,
  titleId,
  onClose,
}: {
  form: ReservationForm;
  offer: GuestOffer;
  /* Hôtel ou concierge nommé ; `null` pour un concierge sans nom. */
  hotelName: string | null;
  kind: "hotel" | "concierge";
  preview: boolean;
  titleId: string;
  onClose: () => void;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const n = form.partySize;
  const phone = form.phone.trim();
  /* « Le Royal est prévenu. » chez un hôtel, mot pour mot comme avant. Chez
     un concierge, une tournure qui ne suppose pas de genre ; sans nom, rien. */
  const notified = !hotelName
    ? null
    : kind === "concierge"
      ? t(` Votre demande a aussi été transmise à ${hotelName}.`, ` ${hotelName} has been notified.`)
      : t(` ${hotelName} est prévenu.`, ` ${hotelName} has been notified.`);
  return (
    <div className="px-7 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 text-center" role="status">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Check size={30} strokeWidth={2.5} aria-hidden />
      </div>
      <h2 id={titleId} className="font-display text-2xl font-black tracking-tight">
        {t("Demande envoyée", "Request sent")}
      </h2>
      <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed text-neutral-700">
        <span className="font-bold text-neutral-900">{offer.name}</span>
        {form.service ? ` — ${form.service.name}` : ""}, {longDate(fromIsoDay(form.date), intl)}
        {t(
          `${form.chosenTime ? ` à ${form.chosenTime}` : ""}, pour ${n} personne${n > 1 ? "s" : ""}.`,
          `${form.chosenTime ? ` at ${form.chosenTime}` : ""}, for ${n} guest${n === 1 ? "" : "s"}.`
        )}
      </p>
      <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-neutral-600">
        {t(
          <>
            L&apos;établissement vous confirme au <span className="num font-bold text-neutral-900">{phone}</span> par
            téléphone ou WhatsApp.{notified}
          </>,
          <>
            The venue will confirm on <span className="num font-bold text-neutral-900">{phone}</span> by phone or
            WhatsApp.{notified}
          </>
        )}
      </p>
      {preview && (
        <p className="mt-3 text-sm font-bold text-amber-800">
          {t("Aperçu : aucune demande n'a été envoyée.", "Preview: no request was sent.")}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-8 min-h-[3.25rem] w-full rounded-xl bg-[var(--accent)] text-base font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90"
      >
        {t("Parfait", "Perfect")}
      </button>
    </div>
  );
}
