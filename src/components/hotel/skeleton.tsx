"use client";

/* Squelettes de chargement de l'espace hôtel : mêmes silhouettes que les
   pages réelles, pour que la mise en page ne saute pas à l'arrivée des
   données. Ils ne s'affichent qu'au premier chargement de l'espace — le
   cache partagé rend ensuite les navigations instantanées. */

const block = "animate-pulse rounded-lg bg-white/[0.08]";

export function PageSkeleton({ kpis = 4, table = false }: { kpis?: 0 | 3 | 4; table?: boolean }) {
  return (
    <div className="space-y-6" aria-busy>
      <div>
        <div className={`${block} mb-3 h-3 w-32`} />
        <div className={`${block} h-8 w-64`} />
        <div className={`${block} mt-3 h-4 w-96 max-w-full bg-white/[0.05]`} />
      </div>
      {kpis > 0 && (
        <div className={`grid gap-3 ${kpis === 4 ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
          {Array.from({ length: kpis }).map((_, i) => (
            <div key={i} className="hotel-panel px-6 py-5">
              <div className={`${block} h-3 w-24 bg-white/[0.06]`} />
              <div className={`${block} mt-3 h-8 w-20`} />
              <div className={`${block} mt-3 h-3 w-28 bg-white/[0.05]`} />
            </div>
          ))}
        </div>
      )}
      {table ? (
        <div className="hotel-panel p-6">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${block} h-3 flex-1 bg-white/[0.06]`} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-white/[0.06] py-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className={`${block} h-4 flex-1 bg-white/[0.05]`} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="hotel-panel p-6 xl:col-span-2">
            <div className={`${block} mb-6 h-4 w-48`} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-t border-white/[0.06] py-3 first:border-0">
                <div className={`${block} h-9 w-9 rounded-full`} />
                <div className="flex-1">
                  <div className={`${block} mb-2 h-4 w-40`} />
                  <div className={`${block} h-3 w-24 bg-white/[0.05]`} />
                </div>
                <div className={`${block} h-5 w-16 rounded-full`} />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="hotel-panel p-6">
              <div className={`${block} mb-4 h-4 w-32`} />
              <div className="flex h-24 items-end gap-2">
                {[45, 65, 38, 72, 55, 80, 50].map((h, i) => (
                  <div key={i} className={`${block} flex-1 bg-white/[0.05]`} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="hotel-panel p-6">
              <div className={`${block} mb-4 h-4 w-28`} />
              {[1, 2, 3].map((i) => (
                <div key={i} className="mb-3 flex items-center gap-3">
                  <div className={`${block} h-8 w-8`} />
                  <div className={`${block} h-3 flex-1 bg-white/[0.05]`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
