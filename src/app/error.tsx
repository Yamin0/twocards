"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--landing-ivory)] px-6 text-center font-body text-[var(--landing-ink)]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
        {t("Une erreur est survenue", "Something went wrong")}
      </p>
      <h1 className="font-title text-4xl font-normal leading-tight md:text-6xl">
        {t(
          <>Un léger <em className="italic">contretemps</em>.</>,
          <>A slight <em className="italic">hiccup</em>.</>
        )}
      </h1>
      <p className="mt-5 max-w-md text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
        {t(
          "Quelque chose s'est mal passé de notre côté. Réessayez. Si le problème persiste, contactez-nous.",
          "Something went wrong on our end. Please try again. If the problem persists, get in touch."
        )}
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-full bg-[var(--landing-ink)] px-8 py-3.5 text-sm font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-85"
      >
        {t("Réessayer", "Try again")}
      </button>
    </div>
  );
}
