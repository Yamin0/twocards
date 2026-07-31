"use client";

import { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Carrousel éditorial à scroll-snap natif : fluide au doigt sur mobile,
 * flèches + barre de progression sur desktop. Les enfants fixent leur
 * propre largeur (ex. w-[280px] md:w-[360px]).
 */
export function SnapCarousel({
  children,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={className}>
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6"
      >
        {children}
      </div>

      {/* Contrôles */}
      <div className="mt-6 flex items-center justify-between gap-6">
        <div className="h-px flex-1 bg-black/10">
          <div
            className="h-px bg-[var(--landing-ink)] transition-[width] duration-200"
            style={{ width: `${Math.max(8, progress * 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollBy(-1)}
            disabled={!canPrev}
            aria-label="Précédent"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-[var(--landing-ink)] transition-all hover:bg-[var(--landing-ink)] hover:text-[var(--landing-ivory)] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[var(--landing-ink)]"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            disabled={!canNext}
            aria-label="Suivant"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-[var(--landing-ink)] transition-all hover:bg-[var(--landing-ink)] hover:text-[var(--landing-ivory)] disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-[var(--landing-ink)]"
          >
            <ArrowRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
