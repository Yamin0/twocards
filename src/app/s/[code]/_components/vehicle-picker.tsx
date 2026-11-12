"use client";

import { useId, useState } from "react";
import { Car, ChevronDown, Minus, Plus, Ticket } from "lucide-react";
import type { GuestOffer, GuestService } from "@/lib/guest-catalog";
import { formatDeposit } from "@/lib/booking/deposit";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ReservationForm } from "../_hooks/use-reservation-form";

/* Panier de véhicules (quad, buggy…) : le client ouvre un modèle, puis
   choisit la durée et le nombre de véhicules. Plusieurs modèles peuvent se
   combiner : trois personnes prennent un buggy X3 et un quad, par exemple.
   Les prestations sont regroupées par `model` ; sans modèle, chaque
   prestation forme son propre groupe. */

type Group = { key: string; label: string; detail: string; services: GuestService[] };

function groupByModel(services: GuestService[]): Group[] {
  const groups = new Map<string, Group>();
  for (const s of services) {
    const key = s.model || s.name;
    const group = groups.get(key) ?? { key, label: key, detail: s.description, services: [] };
    group.services.push(s);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function Stepper({
  value,
  label,
  onChange,
  canAdd,
  tickets = false,
}: {
  value: number;
  label: string;
  onChange: (next: number) => void;
  canAdd: boolean;
  tickets?: boolean;
}) {
  const t = useT();
  const remove = tickets
    ? t(`Retirer une personne : ${label}`, `Remove a guest: ${label}`)
    : t(`Retirer un véhicule : ${label}`, `Remove a vehicle: ${label}`);
  const add = tickets
    ? t(`Ajouter une personne : ${label}`, `Add a guest: ${label}`)
    : t(`Ajouter un véhicule : ${label}`, `Add a vehicle: ${label}`);
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        aria-label={remove}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.12] bg-white text-neutral-800 disabled:opacity-30"
      >
        <Minus size={16} strokeWidth={2.25} aria-hidden />
      </button>
      <span className="num w-6 text-center text-base font-black" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={add}
        disabled={!canAdd}
        onClick={() => onChange(value + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)] disabled:opacity-30"
      >
        <Plus size={16} strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}

/* Entrées à la personne (day pass adulte, enfant…) : une ligne par tarif,
   sans accordéon, et le nombre de personnes sur chaque ligne. */
function TicketPicker({ form, offer }: { form: ReservationForm; offer: GuestOffer }) {
  const t = useT();
  const titleId = useId();
  const count = form.vehicleCount;
  const full = count >= 20;
  return (
    <section role="group" aria-labelledby={titleId}>
      <h3 id={titleId} className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-700">
        <Ticket size={13} strokeWidth={2.25} aria-hidden /> {t("Entrées", "Tickets")}
      </h3>
      <ul className="divide-y divide-black/[0.08] overflow-hidden rounded-xl border border-black/[0.12] bg-white">
        {offer.services.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-tight text-neutral-900">{s.name}</span>
              {s.description && <span className="mt-0.5 block text-sm leading-relaxed text-neutral-600">{s.description}</span>}
              {s.price && (
                <span className="num mt-0.5 block text-sm text-neutral-700">
                  {t(`${s.price} par personne`, `${s.price} per guest`)}
                </span>
              )}
            </span>
            <Stepper
              value={form.cart[s.id] ?? 0}
              label={s.name}
              canAdd={!full}
              tickets
              onChange={(next) => form.setQty(s.id, next)}
            />
          </li>
        ))}
      </ul>
      {count > 0 && count !== form.partySize && (
        <p className="num mt-3 text-sm font-medium leading-relaxed text-red-700">
          {t(
            `${count} entrée${count > 1 ? "s" : ""} pour ${form.partySize} personne${form.partySize > 1 ? "s" : ""} : ajustez l'un ou l'autre.`,
            `${count} ticket${count > 1 ? "s" : ""} for ${form.partySize} guest${form.partySize > 1 ? "s" : ""}: adjust one or the other.`
          )}
        </p>
      )}
    </section>
  );
}

export function VehiclePicker({ form, offer }: { form: ReservationForm; offer: GuestOffer }) {
  if (form.ticketMode) return <TicketPicker form={form} offer={offer} />;
  return <VehicleCartPicker form={form} offer={offer} />;
}

function VehicleCartPicker({ form, offer }: { form: ReservationForm; offer: GuestOffer }) {
  const t = useT();
  const intl = useIntlLocale();
  const titleId = useId();
  const groups = groupByModel(offer.services);
  /* Un seul modèle ouvert à la fois ; le premier choisi reste ouvert. */
  const [open, setOpen] = useState<string | null>(null);
  const full = form.vehicleCount >= 20;

  return (
    <section role="group" aria-labelledby={titleId}>
      <h3 id={titleId} className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-700">
        <Car size={13} strokeWidth={2.25} aria-hidden /> {t("Véhicules", "Vehicles")}
        <span className="font-medium normal-case tracking-normal text-neutral-600">
          {t("(modèle, puis durée)", "(model, then duration)")}
        </span>
      </h3>

      <div className="space-y-2">
        {groups.map((group, index) => {
          const isOpen = open === group.key;
          const chosen = group.services.reduce((sum, s) => sum + (form.cart[s.id] ?? 0), 0);
          const prices = group.services.map((s) => s.clientPrice).filter((p): p is number => typeof p === "number");
          const from = prices.length
            ? formatDeposit(Math.min(...prices), group.services[0].currency ?? "mad", intl)
            : group.services[0].price;
          const panelId = `${titleId}-${index}`;
          return (
            <div
              key={group.key}
              className={cn(
                "overflow-hidden rounded-xl border bg-white transition-colors",
                chosen > 0 ? "border-[var(--accent-on-white)] ring-1 ring-[var(--accent-on-white)]" : "border-black/[0.12]"
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : group.key)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold leading-tight text-neutral-900">{group.label}</span>
                  {group.detail && <span className="mt-0.5 block text-sm leading-relaxed text-neutral-600">{group.detail}</span>}
                </span>
                {chosen > 0 ? (
                  <span className="num shrink-0 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-sm font-bold text-[var(--on-accent)]">
                    {chosen}
                  </span>
                ) : (
                  from && <span className="num shrink-0 text-sm text-neutral-700">{t(`dès ${from}`, `from ${from}`)}</span>
                )}
                <ChevronDown
                  size={18}
                  strokeWidth={2.25}
                  aria-hidden
                  className={cn("shrink-0 text-neutral-500 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <ul id={panelId} className="divide-y divide-black/[0.08] border-t border-black/[0.08] bg-[#f7f6f3]">
                  {group.services.map((s) => {
                    const qty = form.cart[s.id] ?? 0;
                    const label = s.duration || s.name;
                    return (
                      <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="num block text-[15px] font-bold text-neutral-900">{label}</span>
                          {s.price && (
                            <span className="num block text-sm text-neutral-600">
                              {t(`${s.price} par véhicule`, `${s.price} per vehicle`)}
                            </span>
                          )}
                        </span>
                        <Stepper
                          value={qty}
                          label={`${group.label} · ${label}`}
                          canAdd={!full}
                          onChange={(next) => form.setQty(s.id, next)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {form.vehicleCount > 0 && (
        <p className="num mt-3 text-sm leading-relaxed text-neutral-700">
          {t(
            `${form.vehicleCount} véhicule${form.vehicleCount > 1 ? "s" : ""} · ${form.seatsChosen} place${form.seatsChosen > 1 ? "s" : ""}`,
            `${form.vehicleCount} vehicle${form.vehicleCount > 1 ? "s" : ""} · ${form.seatsChosen} seat${form.seatsChosen > 1 ? "s" : ""}`
          )}
          {form.seatsChosen < form.partySize && (
            <span className="block font-medium text-red-700">
              {t(
                `Il manque des places pour ${form.partySize} personnes : ajoutez un véhicule ou précisez-le à l'étape suivante.`,
                `Not enough seats for ${form.partySize} guests: add a vehicle or say so in the next step.`
              )}
            </span>
          )}
        </p>
      )}
    </section>
  );
}
