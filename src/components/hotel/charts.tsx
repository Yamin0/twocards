"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Series } from "@/lib/hotel/analytics";
import { useLocale, useT } from "@/lib/i18n/client";

/* Graphes légers de l'espace hôtel : du DOM et du SVG, aucune dépendance.
   Les échelles sont relatives au maximum de la série. Les couleurs sont
   les jetons du back-office (bg-link, bg-ok, bg-warn, bg-plum) : des
   aplats pleins, lisibles sur une carte blanche. */

export function Bars({
  data,
  color = "bg-link",
  format = (n: number) => String(n),
  height = 120,
  highlightLast = true,
}: {
  data: Series;
  color?: string;
  format?: (n: number) => string;
  height?: number;
  highlightLast?: boolean;
}) {
  const locale = useLocale();
  const sep = locale === "en" ? ":" : " :";
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
      {data.map((d, i) => {
        const last = highlightLast && i === data.length - 1;
        return (
          <li
            key={d.key}
            className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            title={`${d.label}${sep} ${format(d.value)}`}
          >
            <span className="sr-only">
              {d.label}
              {sep} {format(d.value)}
            </span>
            <span
              aria-hidden
              className="num max-w-full truncate text-xs font-bold text-ink-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
              {d.value > 0 ? format(d.value) : ""}
            </span>
            <div
              aria-hidden
              className={cn(
                "w-full rounded-md transition-opacity",
                d.value > 0 ? color : "bg-fill-2",
                d.value > 0 && !last && highlightLast && "opacity-60 group-hover:opacity-100"
              )}
              style={{ height: `${Math.max((d.value / max) * (height - 40), 4)}px` }}
            />
            <span aria-hidden className="num max-w-full truncate text-xs text-ink-3">
              {d.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function SplitBar({
  segments,
  format = (n: number) => String(n),
}: {
  segments: { label: string; value: number; color: string }[];
  format?: (n: number) => string;
}) {
  const locale = useLocale();
  const sep = locale === "en" ? ":" : " :";
  const pct = locale === "en" ? "%" : " %";
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      {total === 0 ? (
        <div className="h-2.5 rounded-full bg-fill-2" aria-hidden />
      ) : (
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                className={cn("rounded-sm first:rounded-l-full last:rounded-r-full", s.color)}
                style={{ width: `${(s.value / total) * 100}%` }}
                title={`${s.label}${sep} ${format(s.value)}`}
              />
            ))}
        </div>
      )}
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs text-ink-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", s.color)} aria-hidden />
            <span className="truncate">{s.label}</span>
            <span className="num ml-auto font-bold text-ink">
              {total > 0 ? `${Math.round((s.value / total) * 100)}${pct}` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Classement horizontal : le premier prend toute la largeur. */
export function RankedBars({
  items,
  format = (n: number) => String(n),
  color = "bg-link",
  empty,
  href,
}: {
  items: { label: string; value: number; sub?: string; id?: string }[];
  format?: (n: number) => string;
  color?: string;
  empty?: string;
  href?: (id: string) => string;
}) {
  const t = useT();
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0)
    return (
      <p className="text-[13px] leading-relaxed text-ink-3">{empty ?? t("Aucune donnée", "No data yet")}</p>
    );
  return (
    <ol className="space-y-3">
      {items.map((it, i) => {
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="num w-4 shrink-0 text-xs font-bold text-ink-3">{i + 1}</span>
                <span className="truncate text-sm font-bold text-ink">{it.label}</span>
                {it.sub && <span className="hidden truncate text-xs text-ink-3 sm:inline">{it.sub}</span>}
              </span>
              <span className="num shrink-0 text-sm font-bold text-ink">{format(it.value)}</span>
            </div>
            <div className="ml-6 mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill-2" aria-hidden>
              <div className={cn("h-full rounded-full", color)} style={{ width: `${(it.value / max) * 100}%` }} />
            </div>
          </>
        );
        return (
          <li key={it.id ?? it.label}>
            {href && it.id ? (
              <Link href={href(it.id)} className="-mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-fill">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function RatingStars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  const t = useT();
  return (
    <span
      role="img"
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={t(`${value.toFixed(1)} sur 5`, `${value.toFixed(1)} out of 5`)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          aria-hidden
          className={n <= Math.round(value) ? "fill-amber-500 text-amber-500" : "text-ink-4"}
        />
      ))}
    </span>
  );
}

/* Anneau de progression (taux de conversion, part d'un total). `color` est
   une couleur CSS : par défaut le bleu des liens du back-office. */
export function Ring({
  ratio,
  size = 72,
  stroke = 7,
  color = "var(--app-link)",
  children,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--app-fill-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
