/* Couleurs choisies par l'hôtel ou l'établissement (accent, fond) : une seule
   façon de décider si une teinte est sombre, et quelle encre poser dessus. */

export const HEX = /^#[0-9a-fA-F]{6}$/;

/** Renvoie la teinte si c'est un `#rrggbb` valide, sinon la couleur de repli. */
export function safeHex(value: string | null | undefined, fallback: string) {
  return value && HEX.test(value) ? value : fallback;
}

/* Luminance relative WCAG 2 (0 = noir, 1 = blanc). */
function luminance(hex: string) {
  if (!HEX.test(hex)) return 0;
  const n = parseInt(hex.slice(1), 16);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** Rapport de contraste WCAG entre deux teintes (1 à 21). */
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = "#ffffff";
const INK = "#0a0a0a";

/** Une teinte est « sombre » quand le blanc s'y lit mieux que le noir. */
export function isDarkHex(hex: string) {
  return contrastRatio(hex, WHITE) >= contrastRatio(hex, INK);
}

/** Encre à poser sur un aplat de cette teinte : blanc ou presque noir. */
export function onColor(hex: string) {
  return isDarkHex(hex) ? WHITE : INK;
}

/** La teinte sert d'encre sur ce fond seulement si elle y tient le AA (4,5:1) ;
    sinon on rend l'encre de repli. */
export function inkOn(hex: string, background: string, fallback: string) {
  return contrastRatio(hex, background) >= 4.5 ? hex : fallback;
}
