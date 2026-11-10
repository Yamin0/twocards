import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, makeT, type Locale } from "./index";

/* Langue courante côté serveur (composants serveur, generateMetadata,
   server actions, route handlers). Le proxy pose toujours le cookie avant
   le rendu, y compris au tout premier passage. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

/** `const t = await getT(); t("Bonjour", "Hello")` */
export async function getT() {
  return makeT(await getLocale());
}
