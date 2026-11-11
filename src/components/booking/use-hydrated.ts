"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/* Faux pendant le rendu serveur et l'hydratation, vrai ensuite. Sert à ne
   calculer « aujourd'hui » et « maintenant » que dans le navigateur : le
   serveur n'est pas dans le fuseau du client, et un jour d'écart ferait
   diverger les deux rendus. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
