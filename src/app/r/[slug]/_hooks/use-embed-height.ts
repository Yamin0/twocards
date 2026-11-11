"use client";

import { useCallback } from "react";

/** Type du message envoyé à la page hôte. Le script du code d'intégration
    (dashboard → Portail, `portal-share`) l'écoute : garder les deux identiques. */
export const EMBED_HEIGHT_MESSAGE = "twocards:hauteur";

/* En iframe (`?embed=1`), le portail annonce sa hauteur à la page qui
   l'intègre, à chaque changement de taille : étape suivante, message
   d'erreur, photo chargée, passage en anglais. La page hôte ajuste alors
   l'iframe et le client ne voit jamais deux barres de défilement.

   On mesure le bloc du portail lui-même, pas le document : le document
   fait au moins la hauteur de l'iframe et ne pourrait jamais rétrécir.
   Le message part vers « * » : il ne contient qu'un nombre, et c'est la
   page hôte qui vérifie l'origine de l'expéditeur.

   Ref par fonction plutôt qu'un useEffect sur un objet ref : si React
   remplace le nœud (reprise après un écart d'hydratation), l'observateur
   suit le nouveau nœud au lieu de mesurer l'ancien, détaché. */
export function useEmbedHeight(enabled: boolean) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!enabled || !node || window.parent === window || typeof ResizeObserver === "undefined") return;
      let last = 0;
      const send = () => {
        const hauteur = Math.ceil(node.getBoundingClientRect().height);
        if (!hauteur || hauteur === last) return;
        last = hauteur;
        window.parent.postMessage({ type: EMBED_HEIGHT_MESSAGE, hauteur }, "*");
      };
      const observer = new ResizeObserver(send);
      observer.observe(node);
      send();
      return () => observer.disconnect();
    },
    [enabled]
  );
}
