"use client";

import { MessageCircle, X } from "lucide-react";
import { PoweredBy } from "@/components/booking/powered-by";
import { waLink } from "@/lib/booking/contact";
import type { HostWords } from "@/lib/booking/host";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* Lien WhatsApp vers la réception de l'hôtel (ou vers le concierge), avec le
   début du message. Les mots viennent de `hostWords`. */
function ReceptionLink({ reception, words, className }: { reception: string; words: HostWords; className?: string }) {
  return (
    <a
      href={waLink(reception, words.greeting)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold", className)}
    >
      <MessageCircle size={16} strokeWidth={2} aria-hidden />
      {words.contactCta}
    </a>
  );
}

/* QR désactivé par son propriétaire (ou code inconnu) : la base a répondu, il
   n'y a pas de menu. Ce n'est pas une panne — pas de bouton « Réessayer ». */
export function InactiveMenu({ words, reception }: { words: HostWords; reception: string | null }) {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--on-page)]/10">
        <X size={20} strokeWidth={2} className="text-[var(--on-page-muted)]" aria-hidden />
      </div>
      <h2 className="font-display text-xl font-bold tracking-tight text-[var(--on-page)]">
        {t("Ce menu n'est plus disponible", "This menu is no longer available")}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--on-page-muted)]">
        {words.inactiveText}
      </p>
      {reception && (
        <ReceptionLink reception={reception} words={words} className="mt-6 bg-[var(--accent)] text-[var(--on-accent)]" />
      )}
    </main>
  );
}

/* Pied : contact de la réception, rappel « sans engagement », signature du
   réseau. La marge basse tient compte de la barre d'accueil iOS. */
export function GuestFooter({
  words,
  reception,
  darkPage,
}: {
  words: HostWords;
  reception: string | null;
  darkPage: boolean;
}) {
  const t = useT();
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 text-center lg:pb-12 lg:pt-16">
      {reception && (
        <ReceptionLink
          reception={reception}
          words={words}
          className="mb-4 border border-[color:var(--rule)] font-medium text-[color:var(--on-page)] transition-colors hover:border-[color:var(--on-page)]"
        />
      )}
      <p className="text-[13px] font-light italic leading-relaxed text-[var(--on-page-muted)]">
        {t(
          "Sans engagement, l'établissement confirme par téléphone ou WhatsApp.",
          "No commitment: the venue confirms by phone or WhatsApp."
        )}
      </p>
      <PoweredBy onDark={darkPage} className="mt-3" />
    </footer>
  );
}
