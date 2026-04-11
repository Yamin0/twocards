"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="h-7 w-56 bg-white/[0.08] rounded-xl mb-2" />
        <div className="h-4 w-40 bg-white/[0.05] rounded-lg" />
      </div>

      {/* Stats strip skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5"
          >
            <div className="h-10 w-10 bg-white/[0.06] rounded-xl mb-3" />
            <div className="h-6 w-20 bg-white/[0.08] rounded-lg mb-1" />
            <div className="h-3 w-16 bg-white/[0.04] rounded-md" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
          <div className="h-5 w-48 bg-white/[0.08] rounded-lg mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.06] last:border-0">
                <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-white/[0.08] rounded-md mb-1" />
                  <div className="h-3 w-24 bg-white/[0.04] rounded-md" />
                </div>
                <div className="h-4 w-16 bg-white/[0.06] rounded-md" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
            <div className="h-4 w-36 bg-white/[0.08] rounded-lg mb-4" />
            <div className="flex items-end gap-2 h-28">
              {[45, 65, 38, 72, 55, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-white/[0.04] rounded-md" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
            <div className="h-4 w-28 bg-white/[0.08] rounded-lg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
                  <div className="flex-1 h-3 bg-white/[0.05] rounded-md" />
                  <div className="h-4 w-10 bg-white/[0.06] rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConciergeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="h-8 w-32 bg-white/[0.08] rounded-xl" />
            <div className="h-8 w-36 bg-white/[0.06] rounded-xl" />
          </div>
          <div className="h-9 w-48 bg-white/[0.06] rounded-xl" />
        </div>
      </div>

      {/* Month nav skeleton */}
      <div className="flex items-center gap-3 px-2">
        <div className="h-6 w-6 bg-white/[0.06] rounded-lg" />
        <div className="h-6 w-28 bg-white/[0.08] rounded-lg" />
        <div className="h-6 w-6 bg-white/[0.06] rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-hidden">
            <div className="h-40 bg-white/[0.04]" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-24 bg-white/[0.08] rounded-md" />
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-white/[0.05] rounded-md" />
                <div className="h-3 w-16 bg-white/[0.05] rounded-md" />
              </div>
              <div className="h-10 bg-white/[0.04] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 bg-white/[0.08] rounded-xl mb-2" />
            <div className="h-4 w-36 bg-white/[0.05] rounded-lg" />
          </div>
          <div className="h-10 w-36 bg-white/[0.06] rounded-xl" />
        </div>
      </div>
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex gap-4 mb-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 flex-1 bg-white/[0.06] rounded-md" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-4 border-t border-white/[0.06]">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 flex-1 bg-white/[0.05] rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
