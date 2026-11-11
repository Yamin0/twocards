"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/* Graphiques de la page Analyses, sans dépendance. Couleurs prises dans les
   jetons du back-office : barres pleines en bleu d'action sur carte
   blanche, socles gris pour les valeurs nulles. */

/* ---------- Histogramme ----------
   L'échelle se déduit du maximum : les hauteurs ne peuvent pas contredire
   les chiffres. Au-delà de 14 barres, les valeurs passent en infobulle et
   les libellés s'espacent pour rester lisibles. Le graphique est annoncé
   comme une image ; la liste des valeurs est donnée en texte aux lecteurs
   d'écran. */
export function Bars({
  data,
  format,
  short,
  label,
}: {
  data: { label: string; full: string; value: number }[];
  format: (v: number) => string;
  short?: (v: number) => string;
  /** Nom du graphique pour les lecteurs d'écran. */
  label: string;
}) {
  const t = useT();
  const max = Math.max(...data.map((d) => d.value), 1);
  const showValues = data.length <= 14;
  /* Une date sur n quand les barres sont nombreuses : chaque libellé a la
     place de plusieurs colonnes et n'est jamais tronqué. */
  const labelEvery = data.length <= 14 ? 1 : Math.ceil(data.length / 7);
  const gap = data.length > 20 ? "gap-[3px]" : "gap-1.5";
  return (
    <div>
      {/* Barres : toutes partent de la même ligne de base. La valeur, quand
          il y a la place, est posée au-dessus de la barre. */}
      <div role="img" aria-label={label} className={cn("flex h-36 items-end border-b border-line", gap)}>
        {data.map((d, i) => (
          <div
            key={`${d.label}-${i}`}
            title={t(`${d.full} : ${format(d.value)}`, `${d.full}: ${format(d.value)}`)}
            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
          >
            {showValues && d.value > 0 && (
              <span className="num mb-1 whitespace-nowrap text-[11px] text-ink-2">{(short ?? format)(d.value)}</span>
            )}
            <div
              className={cn(
                "w-full max-w-[28px] rounded-t-[3px] transition-colors",
                d.value > 0 ? "bg-link group-hover:bg-link-strong" : "bg-fill-3"
              )}
              style={{ height: d.value > 0 ? `${Math.max((d.value / max) * (showValues ? 80 : 100), 3)}%` : "2px" }}
            />
          </div>
        ))}
      </div>
      {/* Dates : même découpage en colonnes, libellé centré sous sa barre et
          libre de déborder sur les colonnes voisines, laissées vides. */}
      <div aria-hidden className={cn("mt-2 flex", gap)}>
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="relative h-4 min-w-0 flex-1">
            {i % labelEvery === 0 && (
              <span
                className={cn(
                  "absolute top-0 whitespace-nowrap text-[11px] text-ink-3",
                  i === 0 && labelEvery > 1 ? "left-0" : "left-1/2 -translate-x-1/2"
                )}
              >
                {d.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {data.map((d, i) => (
          <li key={`${d.label}-${i}`}>
            {t(`${d.full} : ${format(d.value)}`, `${d.full}: ${format(d.value)}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Anneau par canal ----------
   Les arcs sont calculés (strokeDasharray sur la circonférence réelle) :
   légende et anneau décrivent forcément les mêmes proportions. */

const DONUT_RADIUS = 14;
const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS;

export type ChannelSegment = {
  label: string;
  value: number;
  /** Couleur du trait : un jeton `var(--app-…)`. */
  stroke: string;
  /** Classe de fond de la pastille de légende, même couleur. */
  dot: string;
  icon: LucideIcon;
};

export function ChannelDonut({
  segments,
  total,
  label,
}: {
  segments: ChannelSegment[];
  total: number;
  label: string;
}) {
  const t = useT();
  /* Chaque segment démarre là où le précédent s'arrête. */
  const arcs: { segment: ChannelSegment; arc: number; offset: number }[] = [];
  for (const s of segments) {
    if (s.value <= 0) continue;
    const prev = arcs[arcs.length - 1];
    arcs.push({
      segment: s,
      arc: (s.value / total) * DONUT_CIRC,
      offset: prev ? prev.offset + prev.arc : 0,
    });
  }
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 36 36" role="img" aria-label={label} className="h-full w-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={DONUT_RADIUS}
            fill="none"
            stroke="var(--app-fill-3)"
            strokeWidth="4"
          />
          {arcs.map(({ segment, arc, offset }) => (
            <circle
              key={segment.label}
              cx="18"
              cy="18"
              r={DONUT_RADIUS}
              fill="none"
              stroke={segment.stroke}
              strokeWidth="4"
              strokeDasharray={`${arc} ${DONUT_CIRC}`}
              strokeDashoffset={-offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-2xl font-bold leading-tight text-ink">{total}</span>
          <span className="text-xs text-ink-3">
            {t(`réservation${total > 1 ? "s" : ""}`, `reservation${total === 1 ? "" : "s"}`)}
          </span>
        </div>
      </div>

      <ul className="min-w-0 space-y-3">
        {segments.map((s) => {
          const Icon = s.icon;
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="flex items-center gap-2.5">
              <span className={cn("h-3 w-3 shrink-0 rounded-full", s.dot)} aria-hidden />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  <Icon size={14} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
                  {s.label}
                </p>
                <p className="num text-xs text-ink-3">
                  {s.value} · {pct}
                  {t(" %", "%")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
