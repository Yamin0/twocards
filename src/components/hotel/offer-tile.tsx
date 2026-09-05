"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Switch, Tag } from "@/components/hotel/ui";
import { cn } from "@/lib/utils";

/* Carte d'adresse du dashboard hôtel : même dessin que la carte du menu
   client (photo en 4/3, nom en Satoshi Black, prix en italique léger), en
   verre sombre, avec l'interrupteur « proposée » à la place du bouton
   Réserver. */
export function OfferTile({
  image,
  name,
  price,
  badges,
  active,
  onToggle,
  toggleLabel,
  actions,
  disabled = false,
  hint,
}: {
  image: string;
  name: string;
  price?: string | null;
  badges?: ReactNode;
  active: boolean;
  onToggle: () => void;
  toggleLabel: string;
  actions?: ReactNode;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-opacity",
        !active && "opacity-55"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
        <Image src={image} alt="" fill unoptimized={image.startsWith("http")} sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {badges && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-3 pt-3.5">
        <p className="font-display text-base font-black leading-tight tracking-tight text-white">{name}</p>
        <p className="num mt-0.5 min-h-[1.25rem] text-sm font-light italic text-white/55">{price ?? ""}</p>
        <div className="mt-auto flex items-center gap-2 border-t border-white/[0.08] pt-2.5">
          <Switch size="sm" checked={active} disabled={disabled} onChange={onToggle} label={toggleLabel} />
          <span className="mr-auto truncate text-xs text-white/55">{hint ?? (active ? "Proposée" : "Masquée")}</span>
          {actions}
        </div>
      </div>
    </div>
  );
}

export function TileBadge({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "accent" | "muted" }) {
  return (
    <Tag
      className={cn(
        "backdrop-blur",
        tone === "accent" ? "bg-sky-500/80 text-white" : tone === "muted" ? "bg-black/55 text-white/70" : "bg-black/55 text-white"
      )}
    >
      {children}
    </Tag>
  );
}
