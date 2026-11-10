/* ─── Langues du site ────────────────────────────────────────────────────
   Deux langues : le français (langue d'origine) et l'anglais. La langue
   vit dans un cookie (`tc-lang`), pas dans l'URL : toutes les routes
   restent les mêmes et le choix suit l'utilisateur partout, du site public
   aux espaces connectés et aux pages clients (QR, portail, avis).

   Premier passage sans cookie : le proxy choisit d'après la langue du
   navigateur (Accept-Language), puis pose le cookie. `?lang=en` ou
   `?lang=fr` dans n'importe quelle URL force la langue (lien à partager).

   Les textes sont écrits côte à côte dans le code : `t("Bonjour", "Hello")`.
   Le français reste la source ; l'anglais est à côté, facile à relire. */

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "tc-lang";

export function isLocale(v: unknown): v is Locale {
  return v === "fr" || v === "en";
}

/** Code BCP 47 pour Intl / toLocaleString : "fr-FR" ou "en-GB". */
export function intlLocale(locale: Locale) {
  return locale === "en" ? "en-GB" : "fr-FR";
}

/** Choisit le texte de la langue courante. Fonctionne aussi pour du JSX. */
export function pick<T>(locale: Locale, fr: T, en: T): T {
  return locale === "en" ? en : fr;
}

export type Translate = <T>(fr: T, en: T) => T;

export function makeT(locale: Locale): Translate {
  return (fr, en) => (locale === "en" ? en : fr);
}

/** Langue préférée d'après l'en-tête Accept-Language (premier fr/en trouvé). */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const langs = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of langs) {
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("en")) return "en";
  }
  /* Ni français ni anglais (arabe, espagnol, allemand…) : l'anglais est la
     langue commune des visiteurs étrangers. */
  return langs.length ? "en" : DEFAULT_LOCALE;
}
