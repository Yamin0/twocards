"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, intlLocale, LOCALE_COOKIE, makeT, type Locale } from "./index";

/* La langue descend du layout racine (lue dans le cookie côté serveur) :
   rendu serveur et client concordent, pas de clignotement. */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** `const t = useT(); t("Bonjour", "Hello")` */
export function useT() {
  const locale = useLocale();
  return useMemo(() => makeT(locale), [locale]);
}

/** Code Intl de la langue courante ("fr-FR" / "en-GB"). */
export function useIntlLocale() {
  return intlLocale(useLocale());
}

/** Change de langue : cookie d'un an, puis nouveau rendu serveur de la page. */
export function useSetLocale() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      startTransition(() => router.refresh());
    },
    [router],
  );
  return { setLocale, pending };
}
