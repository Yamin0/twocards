"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Card, ErrorState, LinkButton } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";

export default function HotelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error("Hotel error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-lg py-10">
      <Card padded={false}>
        <ErrorState
          title={t("Une erreur est survenue", "Something went wrong")}
          description={t(
            "Cette page n'a pas pu s'afficher. Réessayez ; si le problème persiste, contactez votre référent twocards.",
            "This page couldn't be displayed. Try again; if the problem persists, contact your twocards account manager."
          )}
          onRetry={reset}
        />
        <div className="flex flex-col items-center gap-2 border-t border-line px-6 py-4">
          <LinkButton href="/hotel" variant="ghost" size="sm" icon={ArrowLeft}>
            {t("Retour à l'accueil", "Back to home")}
          </LinkButton>
          {error.digest && (
            <p className="num text-xs text-ink-3">
              {t("Réf.", "Ref.")} {error.digest}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
