"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Messenger } from "@/components/shared/messenger";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";

/* Messagerie de l'établissement : conversations réelles avec les concierges
   du réseau (Supabase + temps réel). L'interface vit dans le composant
   partagé Messenger. Le paramètre d'URL « with » (ex. depuis la page
   Réseau apporteurs) ouvre directement la conversation avec ce partenaire. */

function MessagesContent() {
  const { isLoading } = useAuthUser();
  const searchParams = useSearchParams();
  const withId = searchParams.get("with");

  if (isLoading) return <DashboardSkeleton />;

  return (
    <Messenger
      initialCounterpartId={withId}
      labels={{
        searchPlaceholder: "Rechercher un concierge...",
        counterpartHint: "Concierge du réseau",
        emptyHint:
          "Démarrez une conversation avec un concierge du réseau via le bouton « Nouvelle ».",
        directoryEmpty: "Aucun concierge inscrit pour le moment.",
      }}
    />
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MessagesContent />
    </Suspense>
  );
}
