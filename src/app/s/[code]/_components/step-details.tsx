"use client";

import { useId } from "react";
import { Calendar, ChevronRight, Clock, Minus, Plus, Sparkles, Users, type LucideIcon } from "lucide-react";
import type { GuestCategory, GuestOffer } from "@/lib/guest-catalog";
import { dayChip, isoDay, longDate } from "@/lib/booking/dates";
import { formatDeposit } from "@/lib/booking/deposit";
import { GUEST_SLOTS, isGuestSlotPast } from "@/lib/booking/slots";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { OTHER_TIME, type ReservationForm } from "../_hooks/use-reservation-form";
import { Gallery } from "./gallery";
import { VehiclePicker } from "./vehicle-picker";
import { FIELD, SheetAction } from "./sheet-parts";

const CHOICE = "border-black/[0.12] bg-white text-neutral-900 hover:bg-neutral-50";
const CHOSEN = "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]";

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <section role="group" aria-labelledby={id}>
      <h3 id={id} className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-700">
        <Icon size={13} strokeWidth={2.25} aria-hidden /> {title}
        {hint && <span className="font-medium normal-case tracking-normal text-neutral-600">{hint}</span>}
      </h3>
      {children}
    </section>
  );
}

/* Prestation à prix partenaire : l'acompte (la part twocards) se paie en
   ligne, par véhicule ou par entrée ; le reste se règle sur place au
   partenaire. */
function VehicleDepositNote({
  amount,
  unit,
  onSite,
  vehicles,
  tickets = false,
}: {
  amount: string;
  unit?: string;
  onSite: string;
  vehicles: number;
  tickets?: boolean;
}) {
  const t = useT();
  const what = tickets ? t("personnes", "guests") : t("véhicules", "vehicles");
  const split = vehicles <= 1 ? "" : unit ? ` (${vehicles} ${what} × ${unit})` : ` (${vehicles} ${what})`;
  return (
    <p className="num mt-2.5 text-center text-xs leading-relaxed text-neutral-600">
      {t(
        `Acompte en ligne : ${amount}${split}. Reste ${onSite} à régler sur place.`,
        `Online deposit: ${amount}${split}. ${onSite} left to pay on site.`
      )}
    </p>
  );
}

/* Étape 1 : la fiche de l'adresse, puis prestation, personnes, date, heure.
   C'est un formulaire à part entière : Entrée (dans « Autre heure », par
   exemple) fait « Continuer », jamais l'envoi de la demande. */
export function StepDetails({ form, offer, category }: { form: ReservationForm; offer: GuestOffer; category: GuestCategory }) {
  const t = useT();
  const intl = useIntlLocale();
  const timeId = useId();
  const timeErrorId = useId();
  const slots = GUEST_SLOTS[category.key];
  const guests = (n: number) => t(`personne${n > 1 ? "s" : ""}`, `guest${n === 1 ? "" : "s"}`);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.toContact();
      }}
      className="flex flex-1 flex-col"
    >
      <div className="flex-1 space-y-6 px-5 pb-6 pt-5 sm:px-7">
        {/* L'adresse en un coup d'œil : photos, étiquette, prix, description. */}
        <section className="overflow-hidden rounded-2xl bg-[#f7f6f3]">
          <Gallery images={offer.images} name={offer.name} />
          {(offer.tag || offer.price || offer.description) && (
            <div className="px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-700">{offer.tag}</p>
                {offer.price && <p className="num text-sm font-light italic text-neutral-700">{offer.price}</p>}
              </div>
              {offer.description && <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-800">{offer.description}</p>}
            </div>
          )}
        </section>

        {/* Prestation : quad ou buggy, une heure ou une demi-journée. */}
        {offer.services.length > 0 && !form.cartMode && (
          <Section icon={Sparkles} title={t("Prestation", "Service")}>
            <div className="space-y-2">
              {offer.services.map((s) => {
                const active = form.service?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => form.setService(s)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      active ? "border-[var(--accent-on-white)] bg-white ring-1 ring-[var(--accent-on-white)]" : CHOICE
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold leading-tight text-neutral-900">{s.name}</span>
                      {(s.duration || s.description) && (
                        <span className="mt-0.5 block text-sm leading-relaxed text-neutral-600">
                          {[s.duration, s.description].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    {s.price && <span className="num shrink-0 text-sm font-bold text-neutral-900">{s.price}</span>}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        <Section icon={Users} title={t("Personnes", "Guests")}>
          <div className="flex items-center justify-between rounded-xl border border-black/[0.1] bg-[#f7f6f3] px-2 py-1.5">
            <button
              type="button"
              aria-label={t("Moins de personnes", "Fewer guests")}
              disabled={form.partySize <= 1}
              onClick={() => form.setPartySize((n) => Math.max(1, n - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm disabled:opacity-40"
            >
              <Minus size={17} strokeWidth={2.25} aria-hidden />
            </button>
            <p className="num text-xl font-black" aria-live="polite">
              {form.partySize} <span className="text-sm font-medium text-neutral-700">{guests(form.partySize)}</span>
            </p>
            <button
              type="button"
              aria-label={t("Plus de personnes", "More guests")}
              disabled={form.partySize >= 50}
              onClick={() => form.setPartySize((n) => Math.min(50, n + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-800 shadow-sm disabled:opacity-40"
            >
              <Plus size={17} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </Section>

        {/* Véhicules : après le nombre de personnes, pour comparer les places. */}
        {form.cartMode && <VehiclePicker form={form} offer={offer} />}

        <Section icon={Calendar} title={t("Date", "Date")}>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-0.5 sm:-mx-7 sm:px-7">
            {form.days.map((d, i) => {
              const iso = isoDay(d);
              const active = iso === form.date;
              const chip = dayChip(d, intl);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => form.setDate(iso)}
                  aria-pressed={active}
                  aria-label={longDate(d, intl)}
                  className={cn(
                    "flex min-h-[4.25rem] w-16 shrink-0 flex-col items-center justify-center rounded-xl border py-2 transition-colors",
                    active ? CHOSEN : CHOICE
                  )}
                >
                  <span className={cn("text-[11px] font-bold uppercase", !active && "text-neutral-600")}>
                    {i === 0 ? t("auj.", "Today") : i === 1 ? t("dem.", "Tmrw") : chip.weekday}
                  </span>
                  <span className="num text-lg font-black leading-tight">{chip.day}</span>
                  <span className={cn("text-[11px] font-medium", !active && "text-neutral-600")}>{chip.month}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section icon={Clock} title={t("Heure", "Time")} hint={t("(facultatif)", "(optional)")}>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {slots.map((s) => {
              const past = isGuestSlotPast(form.date, s);
              const active = form.time === s;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={past}
                  onClick={() => form.pickTime(active ? null : s)}
                  aria-pressed={active}
                  className={cn(
                    "num h-11 rounded-xl border text-sm font-bold transition-colors",
                    active ? CHOSEN : past ? "border-transparent bg-neutral-100 text-neutral-400 line-through" : CHOICE
                  )}
                >
                  {s}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => form.pickTime(form.time === OTHER_TIME ? null : OTHER_TIME)}
              aria-pressed={form.time === OTHER_TIME}
              aria-expanded={form.time === OTHER_TIME}
              className={cn("h-11 rounded-xl border text-sm font-bold transition-colors", form.time === OTHER_TIME ? CHOSEN : CHOICE)}
            >
              {t("Autre", "Other")}
            </button>
          </div>
          {form.time === OTHER_TIME && (
            <div className="mt-3">
              <label htmlFor={timeId} className="mb-1.5 block text-sm font-bold text-neutral-800">
                {t("Heure souhaitée", "Preferred time")}
              </label>
              <input
                id={timeId}
                type="time"
                value={form.customTime}
                onChange={(e) => form.changeCustomTime(e.target.value)}
                aria-invalid={form.timeError ? true : undefined}
                aria-describedby={form.timeError ? timeErrorId : undefined}
                className={cn(FIELD, "num", form.timeError && "border-red-600")}
                autoFocus
              />
              {form.timeError && (
                <p id={timeErrorId} role="alert" className="mt-2 text-sm font-medium leading-relaxed text-red-700">
                  {form.timeError}
                </p>
              )}
            </div>
          )}
        </Section>
      </div>

      <SheetAction>
        {form.errorMsg && form.step === "details" && (
          <p role="alert" className="mb-2.5 text-center text-sm font-medium text-red-700">
            {form.errorMsg}
          </p>
        )}
        <button
          type="submit"
          className="flex h-13 min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-base font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90"
        >
          {t("Continuer", "Continue")}
          <ChevronRight size={17} strokeWidth={2.5} aria-hidden />
        </button>
        {form.deposit?.vehicles ? (
          <VehicleDepositNote
            amount={formatDeposit(form.deposit.amount, form.deposit.currency, intl)}
            unit={form.deposit.unit ? formatDeposit(form.deposit.unit, form.deposit.currency, intl) : undefined}
            onSite={formatDeposit(form.deposit.onSite ?? 0, form.deposit.currency, intl)}
            vehicles={form.deposit.vehicles}
            tickets={form.ticketMode}
          />
        ) : form.deposit && offer.deposit && (
          <p className="num mt-2.5 text-center text-xs leading-relaxed text-neutral-600">
            {offer.deposit.mode === "per_person"
              ? t(
                  `Acompte en ligne : ${formatDeposit(offer.deposit.unit, offer.deposit.currency, intl)} par personne, soit ${formatDeposit(form.deposit.amount, form.deposit.currency, intl)}.`,
                  `Online deposit: ${formatDeposit(offer.deposit.unit, offer.deposit.currency, intl)} per guest, ${formatDeposit(form.deposit.amount, form.deposit.currency, intl)} in total.`
                )
              : t(
                  `Acompte en ligne de ${formatDeposit(form.deposit.amount, form.deposit.currency, intl)} pour confirmer la réservation.`,
                  `Online deposit of ${formatDeposit(form.deposit.amount, form.deposit.currency, intl)} to confirm the booking.`
                )}
          </p>
        )}
      </SheetAction>
    </form>
  );
}
