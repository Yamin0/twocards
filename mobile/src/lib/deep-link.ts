import { useSyncExternalStore } from 'react'

/* Page du site demandée par une notification touchée.

   Le gestionnaire de notification s'exécute hors de React : la cible vit
   donc dans le module, et l'onglet concerné vient la chercher au rendu
   suivant, puis la consomme. */

let pending: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function openSitePath(path: string) {
  pending = path
  emit()
}

export function clearSitePath() {
  if (pending === null) return
  pending = null
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = () => pending

export function usePendingSitePath(): string | null {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
