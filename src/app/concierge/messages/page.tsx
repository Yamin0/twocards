"use client";

import { Messenger } from "@/components/shared/messenger";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";

/* Messagerie du concierge : conversations réelles avec les établissements
   partenaires (Supabase + temps réel). L'interface vit dans le composant
   partagé Messenger. */

export default function ConciergeMessagesPage() {
  const { isLoading } = useAuthUser();
  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="p-4 sm:p-6">
      <Messenger
        labels={{
          searchPlaceholder: "Rechercher un établissement...",
          counterpartHint: "Établissement partenaire",
          emptyHint:
            "Démarrez une conversation avec un établissement partenaire via le bouton « Nouvelle ».",
          directoryEmpty: "Aucun établissement inscrit pour le moment.",
        }}
      />
    </div>
  );
}
