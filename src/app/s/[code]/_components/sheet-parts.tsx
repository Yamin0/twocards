/* Briques communes aux étapes de la feuille de réservation. */

/* Champ de saisie : 16 px, pour qu'iOS ne zoome pas à la prise de focus. */
export const FIELD =
  "h-12 w-full rounded-xl border border-black/[0.14] bg-[#f7f6f3] px-4 text-base text-neutral-900 placeholder:text-neutral-500 focus:border-[var(--accent-on-white)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-on-white)]/25";

/* Bouton principal de l'étape, collé au bas de la feuille : toujours sous le
   pouce, sans avoir à défiler. La marge basse laisse la place à la barre
   d'accueil iOS (`env(safe-area-inset-bottom)`). */
export function SheetAction({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-black/[0.08] bg-white/95 px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-7">
      {children}
    </div>
  );
}
