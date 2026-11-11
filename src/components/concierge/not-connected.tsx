"use client";

import type { LucideIcon } from "lucide-react";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";

/* Écran d'une section de l'espace concierge qui n'a pas encore de données
   derrière elle. Il dit ce qui manque au lieu d'afficher des chiffres
   d'exemple : rien d'inventé, aucune action simulée. */
export function NotConnected({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const t = useT();
  return (
    <>
      <PageHeader title={title} />
      <Card padded={false}>
        <EmptyState
          icon={icon}
          title={t("Pas encore disponible", "Not available yet")}
          description={description}
          action={
            <>
              <LinkButton href="/concierge" variant="primary">
                {t("Voir les établissements", "See venues")}
              </LinkButton>
              <LinkButton href="/concierge/messages">{t("Ouvrir les messages", "Open messages")}</LinkButton>
            </>
          }
        />
      </Card>
    </>
  );
}
