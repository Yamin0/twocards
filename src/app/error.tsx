"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--landing-ivory)] px-6 text-center font-body text-[var(--landing-ink)]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
        Une erreur est survenue
      </p>
      <h1 className="font-title text-4xl font-normal leading-tight md:text-6xl">
        Un léger <em className="italic">contretemps</em>.
      </h1>
      <p className="mt-5 max-w-md text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
        Quelque chose s&apos;est mal passé de notre côté. Réessayez — si le
        problème persiste, contactez-nous.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-full bg-[var(--landing-ink)] px-8 py-3.5 text-sm font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-85"
      >
        Réessayer
      </button>
    </div>
  );
}
