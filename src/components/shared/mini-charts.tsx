"use client";

import { Star } from "lucide-react";

/* Graphes légers des dashboards — pas de dépendance, du DOM et c'est tout.
   L'échelle est relative au maximum de la série ; une série vide affiche des
   socles à hauteur minimale pour garder la silhouette du graphe. */

export function MiniBars({
  data,
  color = "bg-blue-400/70",
  format = (n: number) => String(n),
}: {
  data: { label: string; value: number }[];
  color?: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div
          key={`${d.label}-${i}`}
          className="flex-1 flex flex-col items-center gap-1 min-w-0"
          title={`${d.label} : ${format(d.value)}`}
        >
          <span className="text-[9px] text-white/50 font-ui tabular-nums">
            {d.value > 0 ? format(d.value) : ""}
          </span>
          <div
            className={`w-full rounded-t-md ${d.value > 0 ? color : "bg-white/10"}`}
            style={{
              height: `${Math.max((d.value / max) * 72, 3)}px`,
            }}
          />
          <span className="text-[9px] text-white/40 font-ui truncate max-w-full">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Note moyenne : étoiles pleines/vides + valeur. */
export function RatingStars({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          className={
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-white/25"
          }
        />
      ))}
    </span>
  );
}

/* Répartition d'un total en segments horizontaux (catégories, statuts). */
export function SplitBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0)
    return (
      <div className="h-2 rounded-full bg-white/10" aria-hidden />
    );
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              className={s.color}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label} : ${s.value}`}
            />
          ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5 text-[10px] text-white/50 font-ui"
          >
            <span className={`h-2 w-2 rounded-full ${s.color}`} />
            {s.label} · {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}

/* Série hebdomadaire : n dernières semaines à partir de created_at. */
export function weeklySeries(
  dates: string[],
  weeks = 8
): { label: string; value: number }[] {
  const now = new Date();
  const out: { label: string; value: number; start: number; end: number }[] =
    [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    out.push({
      label: `${end.getDate()}/${end.getMonth() + 1}`,
      value: 0,
      start: start.getTime(),
      end: end.getTime(),
    });
  }
  for (const d of dates) {
    const t = new Date(d).getTime();
    const bucket = out.find((b) => t > b.start && t <= b.end);
    if (bucket) bucket.value += 1;
  }
  return out.map(({ label, value }) => ({ label, value }));
}
