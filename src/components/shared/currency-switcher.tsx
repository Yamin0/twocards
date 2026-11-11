"use client";

import { ChevronDown } from "lucide-react";
import { CURRENCIES, CURRENCY_LABELS, type Currency } from "@/lib/currency";
import { useCurrency, useSetCurrency } from "@/lib/currency/client";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* Sélecteur de devise (Maroc · MAD, Europe · EUR, International · USD),
   à côté du sélecteur de langue sur les pages publiques. La pastille
   n'affiche que le code court ; un vrai <select> natif, transparent,
   est posé dessus : liste du système sur mobile, clavier et lecteurs
   d'écran gérés sans code. `tone` suit celui du LanguageSwitcher. */
export function CurrencySwitcher({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const currency = useCurrency();
  const locale = useLocale();
  const { setCurrency, pending } = useSetCurrency();
  const onDark = tone === "dark";

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase leading-none tracking-[0.14em] ring-1 transition-colors",
        onDark
          ? "text-white/80 ring-white/15 hover:text-white"
          : "text-black/60 ring-black/10 hover:text-black",
        pending && "opacity-60",
        className,
      )}
    >
      <span aria-hidden>{currency}</span>
      <ChevronDown aria-hidden size={11} strokeWidth={2} className="opacity-60" />
      <select
        aria-label={locale === "en" ? "Currency" : "Devise"}
        value={currency}
        disabled={pending}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {CURRENCY_LABELS[c][locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
