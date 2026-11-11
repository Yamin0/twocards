"use client";

import { PageSkeleton, SkeletonRows } from "@/components/app/ui";

/* Squelettes de chargement : ceux du kit, sous leurs anciens noms. */
export function DashboardSkeleton() {
  return <PageSkeleton kpis={4} rows={5} />;
}

export function ConciergeSkeleton() {
  return <PageSkeleton kpis={4} rows={4} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number; cols?: number }) {
  return <PageSkeleton kpis={0} rows={rows} />;
}

export { SkeletonRows };
