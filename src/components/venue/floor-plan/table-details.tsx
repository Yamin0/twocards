"use client";

import type { ReactNode } from "react";
import {
  Clock,
  Crown,
  Globe,
  GripVertical,
  LogIn,
  Minus,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Users,
  X,
} from "lucide-react";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { Badge, Button, Card, IconButton, type BadgeTone } from "@/components/app/ui";
import type { TableReservation } from "@/hooks/use-venue-tables";
import { tableStatusLabel, type FloorTable } from "./table-node";

/* Panneau de la table sélectionnée : capacité et statut, réservations du
   jour avec l'arrivée, walk-in sur une table libre, libération. */

/** Compteur − valeur + : capacité d'une table, couverts d'un walk-in. */
export function Stepper({
  value,
  onChange,
  min,
  max,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <IconButton
        icon={Minus}
        label={decreaseLabel}
        size={16}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="bg-fill-2 text-ink-2"
      />
      <span className="num w-9 text-center text-sm font-bold text-ink" aria-live="polite">
        {value}
      </span>
      <IconButton
        icon={Plus}
        label={increaseLabel}
        size={16}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="bg-fill-2 text-ink-2"
      />
    </div>
  );
}

function SourceBadge({ source }: { source: TableReservation["source"] }) {
  const t = useT();
  const map: Record<TableReservation["source"], { tone: BadgeTone; icon: typeof Globe; label: string }> = {
    portal: { tone: "plum", icon: Globe, label: t("Direct", "Direct") },
    venue: { tone: "ok", icon: Phone, label: t("Maison", "In-house") },
    qr: { tone: "info", icon: QrCode, label: t("QR hôtel", "Hotel QR") },
  };
  const { tone, icon: Icon, label } = map[source] ?? map.qr;
  return (
    <Badge tone={tone} className="mt-1">
      <Icon size={11} strokeWidth={2} aria-hidden />
      {label}
    </Badge>
  );
}

function ReservationCard({
  res,
  canCheckIn,
  checkingIn,
  onCheckIn,
}: {
  res: TableReservation;
  canCheckIn: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
}) {
  const t = useT();
  const intl = useIntlLocale();
  return (
    <li className="space-y-3 rounded-xl border border-line bg-fill p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-bold text-info"
        >
          {res.initials || "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{res.client}</p>
          <SourceBadge source={res.source} />
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-ink-2">
        <p className="flex items-center gap-2">
          <Users size={14} strokeWidth={1.75} className="text-ink-3" aria-hidden />
          {t(
            `${res.partySize} personne${res.partySize > 1 ? "s" : ""}`,
            `${res.partySize} guest${res.partySize === 1 ? "" : "s"}`
          )}
        </p>
        <p className="flex items-center gap-2">
          <Clock size={14} strokeWidth={1.75} className="text-ink-3" aria-hidden />
          {res.time
            ? t(`Réservée à ${res.time.slice(0, 5)}`, `Booked for ${res.time.slice(0, 5)}`)
            : t("Heure non précisée", "No time given")}
        </p>
      </div>

      {res.arrivedAt ? (
        <p className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-[13px] font-bold text-ok">
          <LogIn size={14} strokeWidth={1.75} aria-hidden />
          {t("Arrivé à", "Arrived at")}{" "}
          {new Date(res.arrivedAt).toLocaleTimeString(intl, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : (
        canCheckIn && (
          <Button
            variant="primary"
            icon={LogIn}
            loading={checkingIn}
            onClick={onCheckIn}
            className="w-full"
          >
            {t("Marquer arrivé", "Mark as arrived")}
          </Button>
        )
      )}

      {res.notes && (
        <div className="border-t border-line pt-2.5">
          <p className="text-xs font-bold text-ink-3">{t("Notes", "Notes")}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{res.notes}</p>
        </div>
      )}
    </li>
  );
}

export function TableDetails({
  table,
  reservations,
  editMode,
  dateLabel,
  isToday,
  checkingInId,
  onCheckIn,
  walkIn,
  freeing,
  onFree,
  editor,
}: {
  table: FloorTable;
  reservations: TableReservation[];
  editMode: boolean;
  /** Date du plan, déjà mise en forme. */
  dateLabel: string;
  isToday: boolean;
  checkingInId: string | null;
  onCheckIn: (res: TableReservation) => void;
  walkIn: {
    party: number;
    onPartyChange: (n: number) => void;
    seating: boolean;
    error: string | null;
    onSeat: () => void;
  };
  freeing: boolean;
  onFree: () => void;
  /** Réglages de la table, affichés en mode édition. */
  editor: ReactNode;
}) {
  const t = useT();
  const statusTone: BadgeTone =
    table.status === "occupied" ? "info" : table.status === "available" ? "ok" : "neutral";

  return (
    <Card
      title={t(`Table ${table.label}`, `Table ${table.label}`)}
      actions={
        table.vip && (
          <Badge tone="warn">
            <Crown size={11} strokeWidth={2} aria-hidden />
            {t("VIP", "VIP")}
          </Badge>
        )
      }
      bodyClassName="space-y-5"
    >
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-fill p-3">
          <dt className="text-xs text-ink-3">{t("Capacité", "Capacity")}</dt>
          <dd className="mt-0.5 text-sm font-bold text-ink">
            {t(
              `${table.capacity} pers.`,
              `${table.capacity} ${table.capacity === 1 ? "guest" : "guests"}`
            )}
          </dd>
        </div>
        <div className="rounded-xl bg-fill p-3">
          <dt className="text-xs text-ink-3">{t("Statut", "Status")}</dt>
          <dd className="mt-1">
            <Badge tone={statusTone} dot>
              {tableStatusLabel(table.status, t)}
            </Badge>
          </dd>
        </div>
      </dl>

      {reservations.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-[13px] font-bold text-ink-2">
            {reservations.length > 1
              ? t(
                  `${reservations.length} réservations ce jour-là`,
                  `${reservations.length} reservations that day`
                )
              : t("Réservation", "Reservation")}
          </h3>
          <ul className="space-y-3">
            {reservations.map((res) => (
              <ReservationCard
                key={res.resId}
                res={res}
                canCheckIn={!editMode}
                checkingIn={checkingInId === res.resId}
                onCheckIn={() => onCheckIn(res)}
              />
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-line bg-fill p-4">
          <p className="text-center text-[13px] text-ink-2">
            {t(
              `Aucune réservation sur cette table le ${dateLabel}.`,
              `No reservations on this table on ${dateLabel}.`
            )}
          </p>
          {/* Walk-in : installer tout de suite un client qui se présente. */}
          {!editMode && table.status !== "blocked" && isToday && (
            <div className="space-y-3 border-t border-line pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-bold text-ink-2">{t("Couverts", "Covers")}</span>
                <Stepper
                  value={walkIn.party}
                  onChange={walkIn.onPartyChange}
                  min={1}
                  max={50}
                  decreaseLabel={t("Moins de couverts", "Fewer covers")}
                  increaseLabel={t("Plus de couverts", "More covers")}
                />
              </div>
              <Button
                variant="primary"
                icon={LogIn}
                loading={walkIn.seating}
                onClick={walkIn.onSeat}
                className="w-full"
              >
                {walkIn.seating
                  ? t("Installation…", "Seating…")
                  : t("Installer un walk-in", "Seat a walk-in")}
              </Button>
              {walkIn.error && (
                <p role="alert" className="text-[13px] leading-relaxed text-danger">
                  {walkIn.error}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {reservations.length > 0 && !editMode && (
        <Button variant="ghost" icon={X} loading={freeing} onClick={onFree} className="w-full">
          {t("Libérer la table", "Free up table")}
        </Button>
      )}

      {editMode && editor}
    </Card>
  );
}

/** Aucun table sélectionnée : dit quoi faire. */
export function NoTableSelected({ editMode }: { editMode: boolean }) {
  const t = useT();
  const Icon = editMode ? Pencil : GripVertical;
  return (
    <Card>
      <div className="flex flex-col items-center px-2 py-4 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-fill-2">
          <Icon size={20} strokeWidth={1.5} className={editMode ? "text-info" : "text-ink-3"} aria-hidden />
        </div>
        <p className="text-sm font-bold text-ink">
          {editMode
            ? t("Sélectionnez une table pour la modifier", "Select a table to edit it")
            : t("Sélectionnez une table pour voir ses réservations", "Select a table to see its reservations")}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          {editMode
            ? t(
                "Clic droit sur le plan pour ajouter ou supprimer une table.",
                "Right-click the plan to add or delete a table."
              )
            : t(
                "« Modifier » permet de réorganiser le plan.",
                "Use “Edit” to rearrange the plan."
              )}
        </p>
      </div>
    </Card>
  );
}
