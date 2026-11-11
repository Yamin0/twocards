"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RemoteImage } from "@/components/booking/remote-image";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* Galerie de la fiche : la couverture, puis les autres photos de l'adresse.
   Seules la photo visible et la suivante sont montées : la suivante est déjà
   en cache au moment du geste, les autres ne coûtent rien en 4G tant qu'on ne
   les demande pas. On avance aux flèches (44 px) ou en balayant du doigt ;
   les points ne sont qu'un repère. */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  if (images.length === 0) return null;
  const count = images.length;
  const go = (step: number) => setIndex((n) => (n + step + count) % count);
  const next = (index + 1) % count;
  /* Clé = position : une même photo saisie deux fois ne casse pas la liste. */
  const mounted = count > 1 ? [index, next] : [index];

  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-200"
      role="group"
      aria-roledescription={t("galerie", "gallery")}
      aria-label={t(`Photos de ${name}`, `Photos of ${name}`)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        if (start === null || count < 2) return;
        const dx = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      {mounted.map((n) => (
        <RemoteImage
          key={n}
          src={images[n]}
          fill
          loading="eager"
          sizes="(max-width: 640px) 100vw, 512px"
          className={cn("object-cover transition-opacity duration-300 motion-reduce:transition-none", n === index ? "opacity-100" : "opacity-0")}
        />
      ))}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("Photo précédente", "Previous photo")}
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow transition-colors hover:bg-white"
          >
            <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("Photo suivante", "Next photo")}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow transition-colors hover:bg-white"
          >
            <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, n) => (
              <span
                key={n}
                className={cn("h-1.5 rounded-full transition-all", n === index ? "w-5 bg-white" : "w-1.5 bg-white/70")}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            {t(`Photo ${index + 1} sur ${count}`, `Photo ${index + 1} of ${count}`)}
          </p>
        </>
      )}
    </div>
  );
}
