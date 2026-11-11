"use client";

import { useRef, useState } from "react";
import { Star } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* Cinq étoiles en groupe de boutons radio : une seule tabulation pour y
   entrer, les flèches pour changer la note, chaque étoile annoncée avec son
   libellé (« 4 étoiles, Très bien »). Cibles de 48 px. */
export function StarRating({
  value,
  onChange,
  labels,
  labelledBy,
  disabled = false,
}: {
  value: number;
  onChange: (n: number) => void;
  /* Libellés des notes, index 1 à 5. */
  labels: string[];
  labelledBy: string;
  disabled?: boolean;
}) {
  const t = useT();
  const [hover, setHover] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hover || value;

  const move = (n: number) => {
    const next = Math.min(5, Math.max(1, n));
    onChange(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, n: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      move(n + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      move(n - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(1);
    } else if (e.key === "End") {
      e.preventDefault();
      move(5);
    }
  };

  return (
    <>
      <div role="radiogroup" aria-labelledby={labelledBy} aria-required="true" className="mt-6 flex items-center justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => {
              refs.current[n] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${t(`${n} étoile${n > 1 ? "s" : ""}`, `${n} star${n === 1 ? "" : "s"}`)}, ${labels[n]}`}
            /* Une seule étoile dans l'ordre de tabulation : la note choisie,
               ou la première tant qu'aucune ne l'est. */
            tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(n)}
            onKeyDown={(e) => onKeyDown(e, n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:h-14 sm:w-14"
          >
            <Star
              size={38}
              strokeWidth={1.5}
              aria-hidden
              className={cn(n <= shown ? "fill-amber-400 text-amber-500" : "text-neutral-400")}
            />
          </button>
        ))}
      </div>
      <p className="mt-1 h-6 text-base font-bold text-amber-800" aria-hidden>
        {shown > 0 ? labels[shown] : ""}
      </p>
    </>
  );
}
