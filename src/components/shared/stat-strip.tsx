"use client";

/* Bandeau de KPI des dashboards, dessin éditorial : un seul panneau, des
   colonnes séparées par des filets, un œil-de-perdrix en capitales espacées
   et le chiffre en serif display. Pas d'icônes dans des boîtes arrondies —
   le chiffre est le sujet. */

export type Stat = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/[0.08]">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-5 sm:px-6">
            <p className="font-ui text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              {s.label}
            </p>
            <p className="font-display mt-2 text-3xl font-light text-white tabular-nums sm:text-4xl">
              {s.value}
            </p>
            {s.hint && (
              <p className="font-ui mt-1 text-[11px] text-white/40">{s.hint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Variante compacte pour les pages à trois indicateurs. */
export function StatStripThree({ stats }: { stats: Stat[] }) {
  return (
    <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-white/[0.08]">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-4 sm:px-6 sm:py-5">
            <p className="font-ui text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              {s.label}
            </p>
            <p className="font-display mt-2 text-2xl font-light text-white tabular-nums sm:text-3xl">
              {s.value}
            </p>
            {s.hint && (
              <p className="font-ui mt-1 text-[11px] text-white/40">{s.hint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
