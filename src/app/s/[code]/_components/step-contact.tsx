"use client";

import { useId } from "react";
import { CreditCard, Loader2, Lock, Phone, User } from "lucide-react";
import { fromIsoDay, longDate } from "@/lib/booking/dates";
import { formatDeposit } from "@/lib/booking/deposit";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ReservationForm } from "../_hooks/use-reservation-form";
import { FIELD, SheetAction } from "./sheet-parts";

const LABEL = "mb-1.5 block text-sm font-bold text-neutral-800";

/* Étape 2 : nom, téléphone, précision. Seul ce formulaire envoie la demande. */
export function StepContact({ form, hotelName }: { form: ReservationForm; hotelName: string }) {
  const t = useT();
  const intl = useIntlLocale();
  const nameId = useId();
  const phoneId = useId();
  const notesId = useId();
  const errorId = useId();
  const n = form.partySize;
  const deposit = form.deposit ? formatDeposit(form.deposit.amount, form.deposit.currency, intl) : null;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void form.submit();
      }}
      className="flex flex-1 flex-col"
    >
      <div className="flex-1 space-y-4 px-5 pb-6 pt-5 sm:px-7">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[#f7f6f3] py-1 pl-4 pr-1 text-sm">
          <p className="py-2 text-neutral-700">
            {form.service ? `${form.service.name} · ` : ""}
            <span className="num font-bold text-neutral-900">{n}</span>{" "}
            {t(`personne${n > 1 ? "s" : ""}`, n === 1 ? "guest" : "guests")} · {longDate(fromIsoDay(form.date), intl)}
            {form.chosenTime ? ` · ${form.chosenTime}` : ""}
          </p>
          <button
            type="button"
            onClick={() => form.setStep("details")}
            className="flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-bold text-[var(--accent-on-white)] underline underline-offset-4"
          >
            {t("Modifier", "Edit")}
          </button>
        </div>

        <div>
          <label htmlFor={nameId} className={LABEL}>
            {t("Votre nom", "Your name")}
          </label>
          <div className="relative">
            <User size={17} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
            <input
              id={nameId}
              className={cn(FIELD, "pl-11")}
              value={form.name}
              onChange={(e) => form.setName(e.target.value)}
              required
              maxLength={120}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label htmlFor={phoneId} className={LABEL}>
            {t("Téléphone (WhatsApp)", "Phone (WhatsApp)")}
          </label>
          <div className="relative">
            <Phone size={17} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
            <input
              id={phoneId}
              className={cn(FIELD, "num pl-11")}
              type="tel"
              inputMode="tel"
              placeholder="+212 6 12 34 56 78"
              value={form.phone}
              onChange={(e) => form.setPhone(e.target.value)}
              required
              maxLength={40}
              autoComplete="tel"
              enterKeyHint="send"
            />
          </div>
        </div>

        <div>
          <label htmlFor={notesId} className={LABEL}>
            {t("Une précision ?", "Anything to add?")}{" "}
            <span className="font-medium text-neutral-600">{t("(facultatif)", "(optional)")}</span>
          </label>
          <textarea
            id={notesId}
            className={cn(FIELD, "h-auto min-h-24 resize-none py-3")}
            placeholder={t("Occasion, allergies, table souhaitée…", "Occasion, allergies, preferred table…")}
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
            maxLength={500}
          />
        </div>

        {form.errorMsg && (
          <p id={errorId} role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
            {form.errorMsg}
          </p>
        )}
      </div>

      <SheetAction>
        <button
          type="submit"
          disabled={form.sending}
          aria-describedby={form.errorMsg ? errorId : undefined}
          className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-base font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {form.sending ? (
            <>
              <Loader2 size={17} strokeWidth={2.5} className="animate-spin" aria-hidden />{" "}
              {deposit ? t("Ouverture du paiement…", "Opening payment…") : t("Envoi…", "Sending…")}
            </>
          ) : deposit ? (
            <>
              <CreditCard size={18} strokeWidth={2.25} aria-hidden /> {t(`Payer l'acompte · ${deposit}`, `Pay deposit · ${deposit}`)}
            </>
          ) : form.errorMsg ? (
            t("Réessayer l'envoi", "Try sending again")
          ) : (
            t("Envoyer ma demande", "Send my request")
          )}
        </button>
        {deposit ? (
          <p className="mt-2.5 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-neutral-600">
            <Lock size={12} strokeWidth={2.5} className="mt-[3px] shrink-0" aria-hidden />
            <span>
              {t(
                `L'acompte de ${deposit} confirme votre réservation. Paiement sécurisé par Stripe pour Twocards, LLC ; ${hotelName} et l'établissement sont prévenus.`,
                `The ${deposit} deposit confirms your booking. Secure payment by Stripe for Twocards, LLC; ${hotelName} and the venue are notified.`
              )}
            </span>
          </p>
        ) : (
        <p className="mt-2.5 text-center text-xs leading-relaxed text-neutral-600">
          {t(
            <>
              Sans engagement ni paiement : {hotelName} et l&apos;établissement sont prévenus, la confirmation arrive par téléphone ou WhatsApp.
            </>,
            <>
              No commitment, no payment: {hotelName} and the venue are notified, and confirmation comes by phone or WhatsApp.
            </>
          )}
        </p>
        )}
      </SheetAction>
    </form>
  );
}
