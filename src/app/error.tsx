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
    <div className="landing-satoshi flex min-h-screen flex-col items-center justify-center bg-[var(--landing-ivory)] px-6 text-center font-body text-[var(--landing-ink)]">
      <p className="mb-4 text-[15px] font-medium text-[var(--landing-mute)]">
        {t("Une erreur est survenue", "Something went wrong")}
      </p>
      <h1 className="text-[40px] font-bold leading-[1.04] tracking-[-0.04em] md:text-[64px]">
        {t(
          <>Un léger <em className="font-light italic">contretemps</em>.</>,
          <>A slight <em className="font-light italic">hiccup</em>.</>
        )}
      </h1>
      <p className="mt-5 max-w-md text-[16px] font-normal leading-relaxed text-[var(--landing-ink)]/70">
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
