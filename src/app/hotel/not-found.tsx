"use client";

import { ArrowLeft, Compass } from "lucide-react";
import { Card, EmptyState, LinkButton } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";

export default function HotelNotFound() {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-lg py-10">
      <Card padded={false}>
        <EmptyState
          icon={Compass}
          title={t("Page introuvable", "Page not found")}
          description={t(
            "Cette page n'existe pas dans l'espace hôtel.",
            "This page doesn't exist in the hotel workspace."
          )}
          action={
            <LinkButton href="/hotel" variant="primary" icon={ArrowLeft}>
              {t("Retour à l'accueil", "Back to home")}
            </LinkButton>
          }
        />
      </Card>
    </div>
  );
}
