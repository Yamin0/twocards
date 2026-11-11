"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/app/ui";

/* Clair ou sombre : décide de la couleur de la coche posée sur la pastille.
   Les pastilles portent les couleurs de l'établissement, pas les jetons du
   back-office. */
function isDark(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

/* Choix d'une couleur : pastilles proposées et couleur libre. */
export function ColorField({
  label,
  swatchLabel,
  customLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  /** Préfixe du nom accessible de chaque pastille (« Couleur », « Fond »). */
  swatchLabel: string;
  customLabel: string;
  value: string;
  options: string[];
  onChange: (hex: string) => void;
}) {
  return (
    <Field label={label}>
      <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
        {options.map((c) => {
          const active = value.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`${swatchLabel} ${c}`}
              aria-pressed={active}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border border-line-2 transition-transform hover:scale-105",
                active && "ring-2 ring-link ring-offset-2 ring-offset-panel"
              )}
              style={{ background: c }}
            >
              {active && (
                <Check
                  size={16}
                  strokeWidth={2.5}
                  aria-hidden
                  style={{ color: isDark(c) ? "#ffffff" : "#0f1b2d" }}
                />
              )}
            </button>
          );
        })}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={customLabel}
          title={customLabel}
          className="h-10 w-10 cursor-pointer rounded-full border border-line-2 bg-transparent"
        />
      </div>
    </Field>
  );
}
