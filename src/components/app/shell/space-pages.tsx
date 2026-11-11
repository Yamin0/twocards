"use client";

import { useEffect } from "react";
import { Compass } from "lucide-react";
import { Card, EmptyState, ErrorState, LinkButton, PageSkeleton } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";

/* Pages d'erreur, d'adresse inconnue et de chargement, communes aux
   espaces connectés (fichiers error.tsx, not-found.tsx, loading.tsx). */

export function SpaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Card padded={false} className="mx-auto max-w-lg">
      <ErrorState
        title={t("Cette page n'a pas pu s'afficher", "This page couldn't be displayed")}
        description={t(
          "Réessayez. Si le problème persiste, rechargez la page.",
          "Try again. If the problem persists, reload the page."
        )}
        onRetry={reset}
      />
    </Card>
  );
}

export function SpaceNotFound({ home }: { home: string }) {
  const t = useT();
  return (
    <Card padded={false} className="mx-auto max-w-lg">
      <EmptyState
        icon={Compass}
        title={t("Page introuvable", "Page not found")}
        description={t("Cette adresse n'existe pas dans votre espace.", "This address doesn't exist in your workspace.")}
        action={
          <LinkButton href={home} variant="primary">
            {t("Revenir à Aujourd'hui", "Back to Today")}
          </LinkButton>
        }
      />
    </Card>
  );
}

export function SpaceLoading() {
  return <PageSkeleton kpis={4} rows={5} />;
}
