"use client";

import type { ReactNode } from "react";
import { RefreshCw, WifiOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Button } from "./button";
import { cardClass } from "./layout";

/* Les trois états d'une donnée distante, dessinés une fois : chargement
   (squelette à la forme du contenu), erreur (une phrase, réessayer), vide
   (une phrase, une action). */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-6 py-8" : "px-6 py-14")}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-fill-2">
        <Icon size={22} strokeWidth={1.5} className="text-ink-3" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-2">{description}</p>
      )}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  compact = false,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const t = useT();
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center text-center", compact ? "px-6 py-8" : "px-6 py-14")}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft">
        <WifiOff size={22} strokeWidth={1.5} className="text-danger" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-ink">
        {title ?? t("Chargement impossible", "Couldn't load this")}
      </h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-2">
        {description ??
          t(
            "Vérifiez votre connexion, puis réessayez.",
            "Check your connection, then try again."
          )}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button icon={RefreshCw} onClick={onRetry}>
            {t("Réessayer", "Try again")}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Squelettes ────────────────────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-fill-2", className)} />;
}

function Busy({ children, className }: { children: ReactNode; className?: string }) {
  const t = useT();
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{t("Chargement…", "Loading…")}</span>
      {children}
    </div>
  );
}

export function SkeletonKpis({ count = 4 }: { count?: 3 | 4 }) {
  return (
    <div className={cn("grid gap-3", count === 4 ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(cardClass, "px-5 py-4 sm:px-6 sm:py-5")}>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Lignes d'une liste ou d'un tableau : pastille, deux lignes de texte, valeur. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn(cardClass, "divide-y divide-line", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(cardClass, "p-5")}>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-3 h-3 w-4/5" />
          <Skeleton className="mt-2 h-3 w-3/5" />
          <Skeleton className="mt-5 h-9 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Squelette d'une page type : en-tête, indicateurs, liste. */
export function PageSkeleton({
  kpis = 4,
  rows = 6,
}: {
  kpis?: 0 | 3 | 4;
  rows?: number;
}) {
  return (
    <Busy className="space-y-6">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {kpis !== 0 && <SkeletonKpis count={kpis} />}
      <SkeletonRows rows={rows} />
    </Busy>
  );
}

/** Enveloppe qui choisit entre chargement, erreur, vide et contenu. */
export function DataState({
  loading,
  error,
  empty,
  onRetry,
  skeleton,
  emptyState,
  children,
}: {
  loading: boolean;
  error?: boolean;
  empty?: boolean;
  onRetry?: () => void;
  skeleton?: ReactNode;
  emptyState?: ReactNode;
  children: ReactNode;
}) {
  if (loading) return <Busy>{skeleton ?? <SkeletonRows />}</Busy>;
  if (error)
    return (
      <div className={cardClass}>
        <ErrorState onRetry={onRetry} />
      </div>
    );
  if (empty && emptyState) return <div className={cardClass}>{emptyState}</div>;
  return <>{children}</>;
}
