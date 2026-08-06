"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Messenger } from "@/components/shared/messenger";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";

/* Messagerie du concierge : conversations réelles avec les établissements
   partenaires (Supabase + temps réel). L'interface vit dans le composant
   partagé Messenger. `?to=<profil>` ouvre d'office la conversation avec cet
   établissement — c'est le lien « Message » de l'annuaire de l'accueil. */

function ConciergeMessages() {
  const { isLoading } = useAuthUser();
  const to = useSearchParams().get("to");
  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="p-4 sm:p-6">
      <Messenger
        initialCounterpartId={to}
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

export default function ConciergeMessagesPage() {
  /* useSearchParams exige une frontière Suspense au prérendu. */
  return (
    <Suspense fallback={<ConciergeSkeleton />}>
      <ConciergeMessages />
    </Suspense>
  );
}
