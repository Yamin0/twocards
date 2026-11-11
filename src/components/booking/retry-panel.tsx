"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCw, WifiOff } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* Panne de chargement : la base n'a pas répondu. Ce n'est ni « menu vide » ni
   « page introuvable » — on le dit, et on propose de réessayer. Le bouton
   relance le rendu serveur de la page (donc l'appel à la base). */
export function RetryPanel({
  title,
  children,
  onRetry,
  busy = false,
  className,
  buttonClassName,
}: {
  title: string;
  children: React.ReactNode;
  /* Sans `onRetry`, le bouton recharge les données de la page. */
  onRetry?: () => void;
  busy?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const working = busy || pending;
  const retry = onRetry ?? (() => startTransition(() => router.refresh()));

  return (
    <div role="alert" className={cn("mx-auto flex w-full max-w-md flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.06] text-neutral-700">
        <WifiOff size={20} strokeWidth={2} aria-hidden />
      </div>
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-600">{children}</p>
      <button
        type="button"
        onClick={retry}
        disabled={working}
        className={cn(
          "mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60",
          buttonClassName
        )}
      >
        {working ? (
          <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden />
        ) : (
          <RotateCw size={16} strokeWidth={2.25} aria-hidden />
        )}
        {t("Réessayer", "Try again")}
      </button>
    </div>
  );
}
