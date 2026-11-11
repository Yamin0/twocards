"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* « Propulsé par twocards. » — la signature du réseau, présente sur les trois
   pages clients, portail en iframe compris. Elle n'est jamais conditionnelle.
   `onDark` : la page de l'hôtel peut avoir un fond sombre. */
export function PoweredBy({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  const t = useT();
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 text-xs",
        onDark ? "text-white/75" : "text-neutral-600",
        className
      )}
    >
      <span>{t("Propulsé par", "Powered by")}</span>
      <Image
        src="/logo-header.png"
        alt=""
        width={16}
        height={16}
        className={cn("h-4 w-auto opacity-80", onDark && "brightness-0 invert")}
      />
      <span className={cn("font-bold", onDark ? "text-white" : "text-neutral-900")}>twocards.</span>
    </p>
  );
}
