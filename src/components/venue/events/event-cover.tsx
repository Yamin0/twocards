"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ICONS } from "./event-lib";

/* Couverture d'un événement : la photo choisie, sinon le dégradé et
   l'icône. Les dégradés sont tous sombres et la photo reçoit un voile en
   bas : le titre posé dessus (`title`) est donc rendu en clair sur sombre
   par la classe tc-dark. Les pastilles passées en `children` restent
   opaques, lisibles sur n'importe quelle image. */
export function EventCover({
  coverImage,
  gradient,
  iconIdx,
  alt = "",
  title,
  subtitle,
  className,
  iconSize = 80,
  sizes = "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw",
  muted = false,
  compact = false,
  children,
}: {
  coverImage: string | null;
  gradient: string;
  iconIdx: number;
  alt?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  iconSize?: number;
  sizes?: string;
  /** Événement fermé : couverture désaturée. */
  muted?: boolean;
  /** Vignette : icône centrée. */
  compact?: boolean;
  children?: ReactNode;
}) {
  const Icon = ICONS[iconIdx] ?? ICONS[0];
  return (
    <div className={cn("relative overflow-hidden", muted && "grayscale", className)}>
      {coverImage ? (
        <>
          {/* Couvertures venues du stockage, d'Unsplash ou d'anciennes
              data-URL : servies telles quelles. */}
          <Image src={coverImage} alt={alt} fill sizes={sizes} className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden />
        </>
      ) : (
        <div className={cn("tc-dark absolute inset-0 bg-gradient-to-br", gradient)} aria-hidden>
          <Icon
            size={iconSize}
            strokeWidth={compact ? 1.5 : 0.75}
            className={compact ? "absolute inset-0 m-auto text-ink-2" : "absolute bottom-2 right-4 text-ink-4"}
          />
        </div>
      )}
      {(title || subtitle) && (
        <div className="tc-dark absolute inset-x-4 bottom-3 z-10 min-w-0">
          {title && <p className="truncate text-lg font-bold text-ink">{title}</p>}
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-ink-2">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
