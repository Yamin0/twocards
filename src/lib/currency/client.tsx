"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/client";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, formatMoney, type Currency } from "./index";
import { AMOUNTS, type Amount, type AmountKey, type Money } from "./amounts";

/* La devise descend du layout racine (lue dans le cookie côté serveur,
   posé par le proxy) : rendu serveur et client concordent. */
const CurrencyContext = createContext<Currency>(DEFAULT_CURRENCY);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: Currency;
  children: React.ReactNode;
}) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): Currency {
  return useContext(CurrencyContext);
}

/** `const money = useMoney(); money("hotelTotal")` → « 2 140 MAD », « €200 »… */
export function useMoney(): Money {
  const currency = useCurrency();
  const locale = useLocale();
  return useCallback(
    (amount: AmountKey | Amount) => {
      const value = typeof amount === "string" ? AMOUNTS[amount] : amount;
      return formatMoney(value[currency], currency, locale);
    },
    [currency, locale],
  );
}

/** Change de devise : cookie d'un an, puis nouveau rendu serveur de la page. */
export function useSetCurrency() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const setCurrency = useCallback(
    (next: Currency) => {
      document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      startTransition(() => router.refresh());
    },
    [router],
  );
  return { setCurrency, pending };
}
