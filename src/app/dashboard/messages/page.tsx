"use client";

import { Messenger } from "@/components/shared/messenger";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";

/* Messagerie de l'établissement : conversations réelles avec les concierges
   du réseau (Supabase + temps réel). L'interface vit dans le composant
   partagé Messenger. */

export default function MessagesPage() {
  const { isLoading } = useAuthUser();
  if (isLoading) return <DashboardSkeleton />;

  return (
    <Messenger
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
