import { cookies } from "next/headers";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, parseCurrency, type Currency } from "./index";

/* Devise courante côté serveur. Le proxy pose toujours le cookie sur la
   requête avant le rendu (choix manuel, sinon déduite du pays), même
   quand rien n'est mémorisé chez le visiteur. */
export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  return parseCurrency(store.get(CURRENCY_COOKIE)?.value) ?? DEFAULT_CURRENCY;
}
