"use client";

import { useState } from "react";
import { Check, Link2, LogIn, Pencil, Phone, RotateCcw, UserX, X } from "lucide-react";
import { Badge, Button, IconButton, StatusPill, inputClass } from "@/components/app/ui";
import { RatingStars } from "@/components/shared/mini-charts";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import {
  awaitsArrival,
  billLocked,
  isOut,
  isPending,
  needsBill,
  parseAmount,
  todayIso,
  type Reservation,
} from "@/lib/venue/reservations";

/* Une réservation et ses gestes, sur une ligne. L'action attendue est
   toujours le bouton plein, à droite sur ordinateur et en bas (sous le
   pouce) sur téléphone :
     en attente            → Confirmer / Refuser
     confirmée, ce jour    → Arrivé
     venue, sans addition  → champ Addition + Enregistrer
   Le reste (no-show, annuler, rétablir, table, lien d'avis) est secondaire. */

export type VenueTable = { id: number; label: string; vip: boolean };

export type RowActions = {
  setStatus: (r: Reservation, status: Reservation["status"]) => void;
  checkIn: (r: Reservation) => void;
  saveBill: (r: Reservation, amount: number) => Promise<boolean>;
  assignTable: (r: Reservation, tableId: number | null, label?: string) => void;
  copyReviewLink: (r: Reservation) => void;
  openReview: (r: Reservation) => void;
};

function Source({ r }: { r: Reservation }) {
  const t = useT();
  if (r.source === "qr")
    return <Badge tone="plum">{r.referrer_name ?? t("Hôtel partenaire", "Partner hotel")}</Badge>;
  if (r.source === "portal") return <Badge tone="info">{t("Portail direct", "Direct portal")}</Badge>;
  return <Badge>{t("Prise par vous", "Taken by you")}</Badge>;
}

function BillEditor({
  r,
  busy,
  onSave,
  onCancel,
}: {
  r: Reservation;
  busy: boolean;
  onSave: (amount: number) => void;
  onCancel?: () => void;
}) {
  const t = useT();
  const [value, setValue] = useState(r.amount_spent !== null ? String(r.amount_spent) : "");
  const [invalid, setInvalid] = useState(false);
  const id = `addition-${r.id}`;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseAmount(value);
    if (amount === null) {
      setInvalid(true);
      return;
    }
    onSave(amount);
  };
  return (
    <form onSubmit={submit} className="flex w-full items-start gap-2 sm:w-auto">
      <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
        <label htmlFor={id} className="sr-only">
          {t(`Addition de ${r.guest_name}, en dirhams`, `Bill for ${r.guest_name}, in dirhams`)}
        </label>
        <div className="relative">
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setInvalid(false);
            }}
            placeholder={t("Addition", "Bill")}
            aria-invalid={invalid || undefined}
            className={`${inputClass} num h-11 py-0 pr-12 ${invalid ? "border-danger" : ""}`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3">MAD</span>
        </div>
        {invalid && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {t("Montant invalide.", "Invalid amount.")}
          </p>
        )}
      </div>
      <Button type="submit" variant="primary" loading={busy} icon={Check}>
        {t("Enregistrer", "Save")}
      </Button>
      {onCancel && <IconButton icon={X} label={t("Annuler la modification", "Cancel editing")} onClick={onCancel} className="h-11 w-11" />}
    </form>
  );
}

export function ReservationRow({
  r,
  busy,
  tables,
  actions,
}: {
  r: Reservation;
  busy: boolean;
  tables: VenueTable[];
  actions: RowActions;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const today = todayIso();
  const [editingBill, setEditingBill] = useState(false);

  const isToday = r.reservation_date === today;
  const day = isToday
    ? t("Aujourd'hui", "Today")
    : new Date(`${r.reservation_date}T00:00:00`).toLocaleDateString(intl, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
  const pending = isPending(r);
  const out = isOut(r);
  const wantsBill = needsBill(r, today);
  const hasBill = r.amount_spent !== null;
  const table = tables.find((x) => x.id === r.table_id);
  const money = (n: number) => `${n.toLocaleString(intl)} MAD`;

  return (
    <li
      className={`rounded-[18px] border border-line bg-panel p-4 sm:p-5 ${out ? "opacity-70" : ""}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Quand */}
        <div className="flex items-baseline gap-2 lg:w-32 lg:shrink-0 lg:flex-col lg:gap-0">
          <p className="num font-display text-2xl leading-none text-ink">
            {r.reservation_time ?? "—"}
          </p>
          <p className={`text-[13px] ${isToday ? "font-bold text-brand" : "text-ink-3"}`}>{day}</p>
        </div>

        {/* Qui */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-base font-bold text-ink">{r.guest_name}</p>
            <span className="num text-sm text-ink-2">
              {t(
                `${r.party_size} pers.`,
                `${r.party_size} ${r.party_size === 1 ? "guest" : "guests"}`
              )}
            </span>
            <StatusPill status={r.status} />
            {r.arrived_at && !out && <Badge tone="ok">{t("Arrivé", "Arrived")}</Badge>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
            <Source r={r} />
            <a href={`tel:${r.guest_phone}`} className="num inline-flex h-7 items-center gap-1 text-link hover:underline">
              <Phone size={13} strokeWidth={1.75} aria-hidden />
              {r.guest_phone}
            </a>
            {r.service_name && <span>{r.service_name}</span>}
            {table && (
              <span>
                {t("Table", "Table")} {table.label}
                {table.vip ? " · VIP" : ""}
              </span>
            )}
          </div>
          {r.notes && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r.notes}</p>}
        </div>

        {/* Addition saisie */}
        {hasBill && !editingBill && (
          <div className="flex items-center gap-1 lg:w-44 lg:shrink-0 lg:justify-end lg:text-right">
            <div>
              <p className="num text-base font-bold text-ink">{money(r.amount_spent ?? 0)}</p>
              <p className="num text-xs text-ink-3">
                {r.source === "qr"
                  ? t(`Commission ${money(r.commission)}`, `Commission ${money(r.commission)}`)
                  : t("Sans commission", "No commission")}
              </p>
            </div>
            {billLocked(r) ? (
              <Badge className="ml-1">{t("Caisse", "Till")}</Badge>
            ) : (
              !out && (
                <IconButton
                  icon={Pencil}
                  size={15}
                  label={t(`Modifier l'addition de ${r.guest_name}`, `Edit the bill for ${r.guest_name}`)}
                  onClick={() => setEditingBill(true)}
                />
              )
            )}
          </div>
        )}

        {/* Gestes */}
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
          {pending && (
            <>
              <Button variant="primary" icon={Check} className="flex-1 sm:flex-none" onClick={() => actions.setStatus(r, "confirmée")}>
                {t("Confirmer", "Confirm")}
              </Button>
              <Button variant="secondary" icon={X} className="flex-1 sm:flex-none" onClick={() => actions.setStatus(r, "annulée")}>
                {t("Refuser", "Decline")}
              </Button>
            </>
          )}
          {awaitsArrival(r, today) && (
            <Button variant="accent" icon={LogIn} className="flex-1 sm:flex-none" onClick={() => actions.checkIn(r)}>
              {t("Arrivé", "Arrived")}
            </Button>
          )}
          {((wantsBill && !hasBill) || editingBill) && (
            <BillEditor
              r={r}
              busy={busy}
              onCancel={editingBill ? () => setEditingBill(false) : undefined}
              onSave={async (amount) => {
                if (await actions.saveBill(r, amount)) setEditingBill(false);
              }}
            />
          )}
          {r.status === "confirmée" && !hasBill && r.reservation_date <= today && (
            <Button variant="ghost" size="sm" icon={UserX} onClick={() => actions.setStatus(r, "no-show")}>
              {t("No-show", "No-show")}
            </Button>
          )}
          {r.status === "confirmée" && r.reservation_date > today && (
            <Button variant="ghost" size="sm" icon={X} onClick={() => actions.setStatus(r, "annulée")}>
              {t("Annuler", "Cancel")}
            </Button>
          )}
          {out && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              /* Une annulée repasse en attente (à confirmer de nouveau) ;
                 un no-show, qui était confirmé, redevient confirmé. */
              onClick={() => actions.setStatus(r, r.status === "no-show" ? "confirmée" : "en attente")}
            >
              {t("Rétablir", "Restore")}
            </Button>
          )}
          {tables.length > 0 && !out && (
            <select
              aria-label={t(`Table de ${r.guest_name}`, `Table for ${r.guest_name}`)}
              value={r.table_id ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                actions.assignTable(r, id, tables.find((x) => x.id === id)?.label);
              }}
              className="h-9 rounded-lg border border-line-2 bg-panel px-2 text-[13px] text-ink-2"
            >
              <option value="">{t("Sans table", "No table")}</option>
              {tables.map((x) => (
                <option key={x.id} value={x.id}>
                  {t("Table", "Table")} {x.label}
                  {x.vip ? " · VIP" : ""}
                </option>
              ))}
            </select>
          )}
          {r.rating !== null ? (
            <button
              type="button"
              onClick={() => actions.openReview(r)}
              aria-label={t(`Avis de ${r.guest_name} : ${r.rating} sur 5`, `Review from ${r.guest_name}: ${r.rating} out of 5`)}
              className="inline-flex h-9 items-center rounded-lg px-2 hover:bg-fill"
            >
              <RatingStars value={r.rating} size={14} />
            </button>
          ) : (
            hasBill &&
            !out && (
              <Button variant="ghost" size="sm" icon={Link2} onClick={() => actions.copyReviewLink(r)}>
                {t("Lien d'avis", "Review link")}
              </Button>
            )
          )}
        </div>
      </div>
      {pending && r.reservation_date <= today && (
        <p className="mt-3 text-xs text-ink-3">
          {t(
            "Le client est déjà venu ? Confirmez, puis saisissez l'addition.",
            "Has the guest already been? Confirm, then enter the bill."
          )}
        </p>
      )}
    </li>
  );
}
