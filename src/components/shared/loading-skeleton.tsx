"use client";

export function DashboardSkeleton() {
  return (
    <div className="bg-surface min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="px-8 pt-8 pb-4">
        <div className="h-8 w-64 bg-surface-mid rounded-md mb-2" />
        <div className="h-4 w-48 bg-surface-low rounded-md" />
      </div>

      {/* Stats strip skeleton */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-surface-card rounded-md editorial-shadow"
            />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div className="h-6 w-40 bg-surface-mid rounded-md mb-4" />
          <div className="space-y-0 rounded-md overflow-hidden editorial-shadow">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface-card border-b border-surface-low" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="h-6 w-36 bg-surface-mid rounded-md mb-4" />
          <div className="space-y-0 rounded-md overflow-hidden editorial-shadow">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface-card border-b border-surface-low" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConciergeSkeleton() {
  return (
    <div className="bg-surface min-h-screen animate-pulse">
      {/* Header skeleton */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="h-8 w-32 bg-surface-mid rounded-md" />
            <div className="h-8 w-36 bg-surface-mid rounded-md" />
          </div>
          <div className="h-9 w-48 bg-surface-low rounded-lg" />
        </div>
      </div>

      {/* Month nav skeleton */}
      <div className="px-4 sm:px-6 pb-4 flex items-center gap-3">
        <div className="h-6 w-6 bg-surface-low rounded-lg" />
        <div className="h-6 w-28 bg-surface-mid rounded-md" />
        <div className="h-6 w-6 bg-surface-low rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-outline-variant/10">
              <div className="h-40 bg-surface-mid" />
              <div className="p-3 space-y-3">
                <div className="h-4 w-20 bg-surface-low rounded-md" />
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-surface-low rounded-md" />
                  <div className="h-4 w-16 bg-surface-low rounded-md" />
                  <div className="h-4 w-16 bg-surface-low rounded-md" />
                </div>
                <div className="h-10 bg-surface-low rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface min-h-screen animate-pulse">
      <div className="px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-surface-mid rounded-md mb-2" />
          <div className="h-4 w-36 bg-surface-low rounded-md" />
        </div>
        <div className="h-10 w-36 bg-surface-mid rounded-lg" />
      </div>
      <div className="px-4 sm:px-6 pb-8">
        <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="px-4 py-3 flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-3 flex-1 bg-surface-low rounded" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-4 border-t border-outline-variant/5">
              {Array.from({ length: cols }).map((_, j) => (
                <div key={j} className="h-4 flex-1 bg-surface-low rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
