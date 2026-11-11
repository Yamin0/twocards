"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { Smartphone } from "lucide-react";
import { isDarkHex } from "@/lib/hotel/format";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export type PrintSize = "petit" | "moyen" | "grand";
export type PrintTheme = "clair" | "accent";

/* Colonnes à l'écran et sur le papier (A4 : 9, 4 ou 1 carte par page). */
export const PRINT_SIZES: Record<PrintSize, { cols: string; qr: number; pad: string }> = {
  petit: { cols: "grid-cols-2 md:grid-cols-3 print:grid-cols-3", qr: 128, pad: "p-5" },
  moyen: { cols: "grid-cols-1 sm:grid-cols-2 print:grid-cols-2", qr: 176, pad: "p-7" },
  grand: { cols: "grid-cols-1 print:grid-cols-1", qr: 260, pad: "p-10" },
};

/* Carte de chambre imprimable : toujours noir sur blanc, quelle que soit
   la charte de l'écran, pour que le QR se lise et que l'encre reste
   raisonnable. Seul le bandeau, facultatif, prend la couleur de l'hôtel. */
export function PrintCard({
  label,
  url,
  hotelName,
  accent,
  size,
  theme,
  headline,
  subline,
}: {
  label: string;
  url: string;
  hotelName: string;
  accent: string;
  size: PrintSize;
  theme: PrintTheme;
  headline: string;
  subline: string;
}) {
  const t = useT();
  const conf = PRINT_SIZES[size];
  return (
    <article className="print-card flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-center text-neutral-900 shadow-card print:rounded-xl print:border-neutral-300 print:shadow-none">
      {theme === "accent" && (
        <p
          className={cn("px-4 text-xs font-bold", size === "grand" ? "py-3 text-sm" : "py-2.5")}
          style={{
            background: accent,
            color: isDarkHex(accent) ? "#ffffff" : "#0a0a0a",
            /* Sans cela, le navigateur n'imprime pas les aplats de couleur. */
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          {hotelName}
        </p>
      )}
      <div className={cn("flex flex-1 flex-col items-center", conf.pad)}>
        {theme === "clair" && <p className="text-xs font-bold text-neutral-600">{hotelName}</p>}
        <h2
          className={cn(
            "font-bold leading-tight tracking-tight text-neutral-900",
            size === "grand" ? "mt-3 text-4xl" : size === "moyen" ? "mt-2 text-2xl" : "mt-1.5 text-lg"
          )}
        >
          {label}
        </h2>
        <div className={cn("rounded-xl border-4 border-neutral-100 bg-white p-3", size === "petit" ? "mt-4" : "mt-6")}>
          <QRCode value={url} size={conf.qr} />
        </div>
        <p
          className={cn(
            "font-bold leading-snug",
            size === "grand" ? "mt-6 text-xl" : size === "moyen" ? "mt-5 text-base" : "mt-4 text-sm"
          )}
        >
          {headline}
        </p>
        {size !== "petit" && (
          <p className={cn("mx-auto mt-2 max-w-xs leading-relaxed text-neutral-600", size === "grand" ? "text-sm" : "text-xs")}>
            {subline}
          </p>
        )}
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-neutral-600">
          <Smartphone size={12} strokeWidth={1.75} aria-hidden />
          {t("Ouvrez l'appareil photo, visez le code", "Open your camera and point it at the code")}
        </p>
        <p className="mt-auto flex items-center justify-center gap-1.5 pt-5 text-xs text-neutral-500">
          {t("Propulsé par", "Powered by")}
          <Image src="/logo-header.png" alt="" width={16} height={16} className="h-4 w-auto opacity-70" />
          <span className="font-bold text-neutral-700">twocards.</span>
        </p>
      </div>
    </article>
  );
}
