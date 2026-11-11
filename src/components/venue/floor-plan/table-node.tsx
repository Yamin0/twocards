"use client";

import { Crown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";
import type { TableReservation, VenueTable } from "@/hooks/use-venue-tables";

/* Une table sur le plan : un vrai bouton (sélection au clavier), dessiné
   pour un fond clair. Quatre états lisibles sans la couleur seule :
   libre (blanc, filet plein), occupée (aplat bleu), VIP occupée (aplat
   ambre + couronne), bloquée (gris, filet pointillé). */

export type FloorTable = VenueTable & { reservation?: TableReservation };

/** Libellé affiché d'un statut de table (la valeur de base reste anglaise). */
export function tableStatusLabel(status: VenueTable["status"], t: Translate) {
  if (status === "occupied") return t("Occupée", "Occupied");
  if (status === "blocked") return t("Bloquée", "Blocked");
  return t("Disponible", "Available");
}

const LOOK = {
  available: "bg-panel text-ink border-line-2",
  occupied: "bg-info-soft text-info border-info/40",
  occupiedVip: "bg-warn-soft text-warn border-warn/40",
  blocked: "bg-fill-2 text-ink-3 border-dashed border-ink-4",
  selected: "bg-brand text-on-brand border-brand",
} as const;

function tableLook(status: VenueTable["status"], vip: boolean, selected: boolean) {
  if (selected) return LOOK.selected;
  if (status === "blocked") return LOOK.blocked;
  if (status === "occupied") return vip ? LOOK.occupiedVip : LOOK.occupied;
  return LOOK.available;
}

export function TableNode({
  table,
  selected,
  dragging,
  editMode,
  onSelect,
  onPointerDown,
  onKeyDown,
}: {
  table: FloorTable;
  selected: boolean;
  dragging: boolean;
  editMode: boolean;
  onSelect: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const t = useT();
  const time = table.reservation?.time?.slice(0, 5) ?? null;
  const arrived = Boolean(table.reservation?.arrivedAt);
  const status = tableStatusLabel(table.status, t);
  const name = [
    t(`Table ${table.label}`, `Table ${table.label}`),
    table.vip ? t("VIP", "VIP") : null,
    t(`${table.capacity} places`, `seats ${table.capacity}`),
    status,
    time ? t(`réservée à ${time}`, `booked at ${time}`) : null,
    arrived ? t("client arrivé", "guest arrived") : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      data-table-id={table.id}
      aria-label={name}
      aria-pressed={selected}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={cn(
        "absolute flex h-14 flex-col items-center justify-center gap-0.5 border-2 transition-shadow",
        table.shape === "round" ? "w-14 rounded-full" : "w-24 rounded-xl",
        tableLook(table.status, table.vip, selected),
        editMode ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-pointer",
        selected && "ring-2 ring-link ring-offset-2 ring-offset-panel",
        dragging ? "z-50 scale-110 shadow-pop" : "hover:shadow-card"
      )}
      style={{ left: table.x, top: table.y }}
    >
      <span className="num text-[13px] font-bold leading-none">{table.label}</span>
      <span className="num text-xs leading-none opacity-80">
        {time ?? t(`${table.capacity} p.`, `${table.capacity} p`)}
      </span>
      {table.vip && (
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-warn/40 bg-warn-soft text-warn"
        >
          <Crown size={11} strokeWidth={2} />
        </span>
      )}
      {/* Client arrivé : pastille verte visible de loin. */}
      {arrived && (
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-panel bg-ok"
        />
      )}
    </button>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={cn("h-3.5 w-3.5 border-2", swatch)} />
      <span>{label}</span>
    </li>
  );
}

export function FloorLegend({ editMode }: { editMode: boolean }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-2">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <LegendItem swatch={cn("rounded-full", LOOK.available)} label={t("Disponible", "Available")} />
        <LegendItem swatch={cn("rounded-full", LOOK.occupied)} label={t("Occupée", "Occupied")} />
        <LegendItem swatch={cn("rounded", LOOK.occupiedVip)} label={t("VIP occupée", "VIP occupied")} />
        <LegendItem swatch={cn("rounded", LOOK.blocked)} label={t("Bloquée", "Blocked")} />
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-full bg-ok" />
          <span>{t("Client arrivé", "Guest arrived")}</span>
        </li>
      </ul>
      {editMode && (
        <p className="flex items-center gap-1.5 font-bold text-info">
          <GripVertical size={14} strokeWidth={1.75} aria-hidden />
          {t(
            "Glissez pour déplacer (ou flèches du clavier) · clic droit pour les options",
            "Drag to move (or use the arrow keys) · right-click for options"
          )}
        </p>
      )}
    </div>
  );
}
