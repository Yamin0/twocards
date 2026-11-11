/* Paramètres d'URL de l'espace hôtel (?onglet=, ?periode=, ?tri=, ?statut=).
   Une valeur inconnue — lien ancien, faute de frappe — retombe sur la
   valeur par défaut au lieu d'afficher une page vide. */

export function oneOf<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  return value !== null && value !== undefined && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** Comme oneOf, mais null quand le paramètre est absent ou inconnu. */
export function oneOfOrNull<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[]
): T | null {
  return value !== null && value !== undefined && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}
