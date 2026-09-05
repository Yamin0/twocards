"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Series } from "@/lib/hotel/analytics";

/* Graphes légers de l'espace hôtel : du DOM et du SVG, aucune dépendance.
   Les échelles sont relatives au maximum de la série. */

export function Bars({
  data,
  color = "bg-sky-400",
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
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
      {data.map((d, i) => {
        const last = highlightLast && i === data.length - 1;
        return (
          <div
            key={d.key}
            className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            title={`${d.label} : ${format(d.value)}`}
          >
            <span className="num text-[10px] font-bold text-white/70 opacity-0 transition-opacity group-hover:opacity-100">
              {d.value > 0 ? format(d.value) : ""}
            </span>
            <div
              className={cn(
                "w-full rounded-md transition-all",
                d.value > 0 ? color : "bg-white/10",
                d.value > 0 && !last && "opacity-70 group-hover:opacity-100"
              )}
              style={{ height: `${Math.max((d.value / max) * (height - 40), 4)}px` }}
            />
            <span className="num max-w-full truncate text-[10px] text-white/40">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Deux séries superposées (scans vs réservations) sur la même échelle. */
export function DualBars({
  primary,
  secondary,
  labels,
  height = 140,
}: {
  primary: { data: Series; label: string; color: string };
  secondary: { data: Series; label: string; color: string };
  labels?: boolean;
  height?: number;
}) {
  const max = Math.max(...primary.data.map((d) => d.value), ...secondary.data.map((d) => d.value), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {primary.data.map((d, i) => {
          const s = secondary.data[i]?.value ?? 0;
          return (
            <div
              key={d.key}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
              title={`${d.label} · ${primary.label} : ${d.value} · ${secondary.label} : ${s}`}
            >
              <div className="flex w-full items-end justify-center gap-0.5">
                <div
                  className={cn("w-1/2 rounded-t-md", d.value > 0 ? primary.color : "bg-white/10")}
                  style={{ height: `${Math.max((d.value / max) * (height - 28), 3)}px` }}
                />
                <div
                  className={cn("w-1/2 rounded-t-md", s > 0 ? secondary.color : "bg-white/10")}
                  style={{ height: `${Math.max((s / max) * (height - 28), 3)}px` }}
                />
              </div>
              {labels !== false && (
                <span className="num max-w-full truncate text-[10px] text-white/40">{d.label}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-sm", primary.color)} /> {primary.label}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-sm", secondary.color)} /> {secondary.label}
        </span>
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  className,
  stroke = "#7dd3fc",
}: {
  data: number[];
  className?: string;
  stroke?: string;
}) {
  const w = 120;
  const h = 32;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * w : w / 2;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-[120px]", className)} aria-hidden>
      <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts.join(" ")} />
    </svg>
  );
}

export function SplitBar({
  segments,
  format = (n: number) => String(n),
}: {
  segments: { label: string; value: number; color: string }[];
  format?: (n: number) => string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      {total === 0 ? (
        <div className="h-2.5 rounded-full bg-white/10" aria-hidden />
      ) : (
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.label}
                className={cn("rounded-sm first:rounded-l-full last:rounded-r-full", s.color)}
                style={{ width: `${(s.value / total) * 100}%` }}
                title={`${s.label} : ${format(s.value)}`}
              />
            ))}
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-2 text-xs text-white/60">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", s.color)} />
            <span className="truncate">{s.label}</span>
            <span className="num ml-auto font-bold text-white/80">
              {total > 0 ? `${Math.round((s.value / total) * 100)} %` : "—"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* Classement horizontal : le premier prend toute la largeur. */
export function RankedBars({
  items,
  format = (n: number) => String(n),
  color = "bg-sky-400/80",
  empty = "Aucune donnée",
  href,
}: {
  items: { label: string; value: number; sub?: string; id?: string }[];
  format?: (n: number) => string;
  color?: string;
  empty?: string;
  href?: (id: string) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) return <p className="text-xs text-white/40">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="num w-4 shrink-0 text-[11px] font-bold text-white/35">{i + 1}</span>
                <span className="truncate text-sm font-medium text-white">{it.label}</span>
                {it.sub && <span className="hidden truncate text-xs text-white/40 sm:inline">{it.sub}</span>}
              </span>
              <span className="num shrink-0 text-sm font-bold text-white/85">{format(it.value)}</span>
            </div>
            <div className="mt-1.5 ml-6 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", color)} style={{ width: `${(it.value / max) * 100}%` }} />
            </div>
          </>
        );
        return (
          <li key={it.id ?? it.label}>
            {href && it.id ? (
              <a href={href(it.id)} className="block rounded-lg transition-colors hover:bg-white/[0.04]">
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function RatingStars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-white/20"}
        />
      ))}
    </span>
  );
}

/* Anneau de progression (taux de conversion, part d'un total). */
export function Ring({
  ratio,
  size = 72,
  stroke = 7,
  color = "#38bdf8",
  children,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
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
