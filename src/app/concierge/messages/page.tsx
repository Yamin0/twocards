"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Messenger } from "@/components/shared/messenger";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useT } from "@/lib/i18n/client";

/* Messagerie du concierge : conversations réelles avec les établissements
   partenaires (Supabase + temps réel). L'interface vit dans le composant
   partagé Messenger. `?to=<profil>` ouvre d'office la conversation avec cet
   établissement — c'est le lien « Message » de l'annuaire de l'accueil. */

function ConciergeMessages() {
  const { isLoading } = useAuthUser();
  const t = useT();
  const to = useSearchParams().get("to");
  if (isLoading) return <ConciergeSkeleton />;

  return (
    <Messenger
        initialCounterpartId={to}
        labels={{
          searchPlaceholder: t("Rechercher un établissement...", "Search venues..."),
          counterpartHint: t("Établissement partenaire", "Partner venue"),
          emptyHint:
            t(
              "Démarrez une conversation avec un établissement partenaire via le bouton « Nouvelle ».",
              "Start a conversation with a partner venue using the “New” button.",
            ),
          directoryEmpty: t("Aucun établissement inscrit pour le moment.", "No venues have signed up yet."),
        }}
    />
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
