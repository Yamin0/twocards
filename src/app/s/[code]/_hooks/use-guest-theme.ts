import { useMemo, type CSSProperties } from "react";
import { inkOn, isDarkHex, onColor } from "@/lib/booking/color";

/* Thème du menu client : deux couleurs choisies par l'hôtel (accent, fond),
   dont on déduit toutes les encres. Aucune n'est supposée : un accent clair
   reçoit un texte sombre, un fond sombre un texte clair, et l'accent ne sert
   d'encre que là où il tient le contraste AA. */
export function useGuestTheme(accent: string, background: string) {
  return useMemo(() => {
    const darkPage = isDarkHex(background);
    const onPage = darkPage ? "#ffffff" : "#171717";
    const style = {
      "--accent": accent,
      "--on-accent": onColor(accent),
      "--page": background,
      "--on-page": onPage,
      "--on-page-muted": darkPage ? "rgba(255,255,255,0.74)" : "rgba(23,23,23,0.7)",
      /* Filets du titre. */
      "--rule": darkPage ? "rgba(255,255,255,0.2)" : "rgba(23,23,23,0.18)",
      /* L'accent comme encre : sur le fond de la page, puis sur les surfaces
         blanches (cartes, feuille de réservation). */
      "--accent-ink": inkOn(accent, background, onPage),
      "--accent-on-white": inkOn(accent, "#ffffff", "#171717"),
    } as CSSProperties;
    return { style, darkPage };
  }, [accent, background]);
}
