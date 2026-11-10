"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale, useSetLocale } from "@/lib/i18n/client";

/* Sélecteur de langue FR / EN. Deux libellés courts, la langue active en
   plein, l'autre atténuée. `tone` adapte les couleurs au fond (sombre :
   navbar du héros ; clair : pages ivoire et espaces connectés). */
export function LanguageSwitcher({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const locale = useLocale();
  const { setLocale, pending } = useSetLocale();
  const onDark = tone === "dark";

  return (
    <div
      role="group"
      aria-label={locale === "en" ? "Language" : "Langue"}
      className={`inline-flex items-center gap-0.5 rounded-full p-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ring-1 ${
        onDark ? "ring-white/15" : "ring-black/10"
      } ${pending ? "opacity-60" : ""} ${className}`}
    >
      {LOCALES.map((l: Locale) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={active}
            aria-label={l === "fr" ? "Français" : "English"}
            disabled={active || pending}
            onClick={() => setLocale(l)}
            className={`rounded-full px-2 py-1 leading-none transition-colors ${
              active
                ? onDark
                  ? "bg-white text-black"
                  : "bg-[var(--landing-ink,#111)] text-white"
                : onDark
                  ? "text-white/60 hover:text-white"
                  : "text-black/50 hover:text-black"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
