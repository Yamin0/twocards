"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/client";

/* Affichage des données : indicateurs, statuts, tableaux. */

/* ─── Indicateurs ───────────────────────────────────────────────────────── */

export type Tone = "default" | "amber" | "emerald" | "sky" | "violet" | "danger";

export type Kpi = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** Variation relative (0,12 = +12 %). null : pas de période de comparaison. */
  delta?: number | null;
  deltaLabel?: string;
  /** Conservé pour compatibilité : le bandeau n'affiche pas d'icône. */
  icon?: LucideIcon;
  tone?: Tone;
  /** Rend la cellule cliquable. */
  href?: string;
  /** Conservé pour compatibilité ; non affiché. */
  trend?: number[];
  /** Chiffre en marine : l'indicateur qui compte le plus (un seul). */
  highlight?: boolean;
};

/* Indicateurs : un seul bandeau de papier, colonnes séparées par des
   filets, libellé en capitales espacées, grand chiffre. Pas d'icône dans
   une boîte : le chiffre est le sujet. */
function KpiCell({ kpi }: { kpi: Kpi }) {
  const locale = useLocale();
  const hasDelta = typeof kpi.delta === "number" && Number.isFinite(kpi.delta);
  const body = (
    <>
      <p className="truncate text-[13.5px] text-ink-3">{kpi.label}</p>
      <p
        className={cn(
          "num font-display mt-3 truncate text-[2rem] leading-none sm:text-[2.375rem]",
          kpi.highlight ? "text-[#13305c]" : "text-ink"
        )}
      >
        {kpi.value}
      </p>
      {(hasDelta || kpi.hint || (kpi.delta === null && kpi.deltaLabel)) && (
        <p className="mt-2.5 truncate text-[12.5px] text-ink-3">
          {hasDelta && (
            <span className={cn("num font-bold", kpi.delta! >= 0 ? "text-ok" : "text-danger")}>
              {kpi.delta! >= 0 ? "+" : "−"}
              {Math.abs(Math.round(kpi.delta! * 100))}
              {locale === "en" ? "%" : " %"}
            </span>
          )}
          {hasDelta && (kpi.hint || kpi.deltaLabel) ? " " : ""}
          {kpi.hint ?? (kpi.delta === null ? kpi.deltaLabel : null)}
        </p>
      )}
    </>
  );
  const cls = "block min-w-0 px-5 py-5 sm:px-6";
  return kpi.href ? (
    <Link href={kpi.href} className={cn(cls, "transition-colors hover:bg-fill")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Un indicateur seul, dans sa propre carte. */
export function KpiCard({ kpi, className }: { kpi: Kpi; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[18px] border border-line bg-panel", className)}>
      <KpiCell kpi={kpi} />
    </div>
  );
}

export function KpiGrid({ items, columns = 4 }: { items: Kpi[]; columns?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-[18px] border border-line bg-panel",
        "[&>*]:border-line [&>*:not(:first-child)]:border-t",
        columns === 4
          ? "grid-cols-2 xl:grid-cols-4 [&>*:nth-child(2)]:border-t-0 [&>*:nth-child(even)]:border-l xl:[&>*]:!border-t-0 xl:[&>*:not(:first-child)]:border-l"
          : columns === 3
            ? "grid-cols-1 sm:grid-cols-3 sm:[&>*]:!border-t-0 sm:[&>*:not(:first-child)]:border-l"
            : "grid-cols-2 [&>*:nth-child(2)]:border-t-0 [&>*:nth-child(even)]:border-l"
      )}
    >
      {items.map((k) => (
        <KpiCell key={k.label} kpi={k} />
      ))}
    </div>
  );
}

/* ─── Badges et statuts ─────────────────────────────────────────────────── */

export type BadgeTone = "neutral" | "ok" | "warn" | "danger" | "info" | "plum" | "brand";

const BADGE: Record<BadgeTone, string> = {
  neutral: "bg-fill-2 text-ink-2",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  plum: "bg-plum-soft text-plum",
  brand: "bg-brand text-on-brand",
};

const DOT: Record<BadgeTone, string> = {
  neutral: "bg-ink-4",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  plum: "bg-plum",
  brand: "bg-on-brand",
};

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold",
        BADGE[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}

/* Statuts : la valeur reste celle de la base (français, jamais traduite ni
   comparée traduite) ; seul le libellé affiché suit la langue. */
const STATUS_TONE: Record<string, BadgeTone> = {
  confirmée: "ok",
  "en attente": "warn",
  annulée: "danger",
  "no-show": "neutral",
  actif: "ok",
  inactif: "neutral",
  payée: "ok",
  réglée: "ok",
  due: "warn",
};

const STATUS_LABELS: Record<string, [string, string]> = {
  confirmée: ["Confirmée", "Confirmed"],
  "en attente": ["En attente", "Pending"],
  annulée: ["Annulée", "Cancelled"],
  "no-show": ["No-show", "No-show"],
  actif: ["Actif", "Active"],
  inactif: ["Inactif", "Inactive"],
  payée: ["Payée", "Paid"],
  réglée: ["Réglée", "Settled"],
  due: ["Due", "Due"],
};

export function statusLabel(status: string, locale: Locale = "fr") {
  const pair = STATUS_LABELS[status];
  if (pair) return locale === "en" ? pair[1] : pair[0];
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const locale = useLocale();
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"} dot className={className}>
      {statusLabel(status, locale)}
    </Badge>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-fill-2 px-2 py-0.5 text-xs font-bold text-ink-2",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ─── Tableaux ──────────────────────────────────────────────────────────────
   Sous 768 px, `stack` replie chaque ligne en carte (classe .tc-stack de
   globals.css) : poser data-label sur chaque cellule, data-head sur la
   cellule titre, data-actions sur la cellule d'actions. */

export function Table({
  children,
  className,
  stack = false,
  minWidth = 640,
}: {
  children: ReactNode;
  className?: string;
  stack?: boolean;
  minWidth?: number;
}) {
  return (
    <div className={cn(stack ? "tc-stack md:overflow-x-auto" : "overflow-x-auto", className)}>
      <table className="w-full text-left" style={stack ? undefined : { minWidth }}>
        {children}
      </table>
    </div>
  );
}

type Align = "left" | "right" | "center";
const ALIGN: Record<Align, string> = { left: "", right: "text-right", center: "text-center" };

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: Align;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-fill px-4 py-2.5 text-xs font-bold text-ink-3 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
        ALIGN[align],
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  muted = false,
  label,
  head,
  actions,
}: {
  children?: ReactNode;
  className?: string;
  align?: Align;
  muted?: boolean;
  /** Intitulé de colonne repris en vue carte (mobile). */
  label?: string;
  head?: boolean;
  actions?: boolean;
}) {
  return (
    <td
      data-label={label}
      data-head={head ? "" : undefined}
      data-actions={actions ? "" : undefined}
      className={cn(
        "px-4 py-3 text-sm first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
        muted ? "text-ink-2" : "text-ink",
        ALIGN[align],
        className
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-line last:border-0",
        onClick && "cursor-pointer transition-colors hover:bg-fill",
        className
      )}
    >
      {children}
    </tr>
  );
}

/* ─── Divers ────────────────────────────────────────────────────────────── */

/** Pastille d'initiales, teinte stable par nom. */
export function NameAvatar({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `hsl(${h} 42% 36%)`,
      }}
    >
      {initials || "?"}
    </span>
  );
}
