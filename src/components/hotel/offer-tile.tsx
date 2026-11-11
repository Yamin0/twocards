"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Badge, Switch } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/* Carte d'adresse de l'espace hôtel : la photo en 4/3, le nom, le prix
   indicatif, et l'interrupteur « proposée » à la place du bouton Réserver
   du menu client. */
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
  const t = useT();
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel",
        !active && "bg-fill"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-fill-2">
        <Image
          src={image}
          alt=""
          fill
          unoptimized={image.startsWith("http")}
          sizes="(max-width: 640px) 100vw, 360px"
          className={cn("object-cover", !active && "opacity-50 grayscale")}
        />
        {badges && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-3 pt-3.5">
        <p className="text-sm font-bold leading-tight text-ink">{name}</p>
        <p className="num mt-0.5 min-h-[1.25rem] text-[13px] text-ink-3">{price ?? ""}</p>
        <div className="mt-auto flex items-center gap-2 border-t border-line pt-2.5">
          <Switch size="sm" checked={active} disabled={disabled} onChange={onToggle} label={toggleLabel} />
          <span className="mr-auto truncate text-xs text-ink-3">{hint ?? (active ? t("Proposée", "Offered") : t("Masquée", "Hidden"))}</span>
          {actions}
        </div>
      </div>
    </div>
  );
}

/* Pastille posée sur la photo : fond plein, pour rester lisible quelle
   que soit l'image. */
export function TileBadge({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "accent" | "muted" }) {
  return (
    <Badge tone={tone === "accent" ? "brand" : "neutral"} className={cn("shadow-sm", tone !== "accent" && "bg-panel text-ink")}>
      {children}
    </Badge>
  );
}
