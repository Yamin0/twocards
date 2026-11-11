"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/* Champs et contrôles. Texte des champs à 16 px sur téléphone : en dessous,
   iOS zoome à chaque saisie. */

export const inputClass =
  "w-full rounded-[12px] border border-line-2 bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-4 transition-colors hover:border-ink-4 focus:border-link focus:outline-none focus:ring-2 focus:ring-link/25 disabled:opacity-50 disabled:bg-fill sm:text-sm";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-bold text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs leading-relaxed text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-relaxed text-ink-3">{hint}</p>
      )}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  /** Nom accessible ; le placeholder sert par défaut. */
  label?: string;
}) {
  const t = useT();
  return (
    <div className={cn("relative", className)}>
      <Search
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        enterKeyHint="search"
        className={cn(inputClass, "h-11 py-0 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("Effacer la recherche", "Clear search")}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 hover:text-ink"
        >
          <X size={15} strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  label: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(inputClass, "h-11 appearance-none py-0 pr-9 font-bold")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const shift = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        /* La zone de clic déborde le dessin pour atteindre 44 px. */
        "relative inline-flex shrink-0 items-center rounded-full transition-colors before:absolute before:-inset-2.5 before:content-[''] disabled:opacity-40",
        w,
        checked ? "bg-ok" : "bg-ink-4"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 rounded-full bg-white shadow transition-transform",
          knob,
          checked ? shift : "translate-x-0"
        )}
      />
    </button>
  );
}

/* Choix exclusif entre quelques vues ou filtres. Balisé en groupe de
   boutons (aria-pressed) : ce ne sont pas des onglets au sens ARIA, il n'y
   a pas de panneau associé. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
  label,
}: {
  options: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line-2 bg-white p-1",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-bold transition-colors",
              size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-[13px]",
              active ? "bg-brand text-on-brand shadow-sm" : "text-ink-3 hover:text-ink"
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "num rounded-full px-1.5 text-[11px]",
                  active ? "bg-white/20 text-on-brand" : "bg-fill-3 text-ink-2"
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Copie dans le presse-papiers, avec un état « copié » temporaire. */
export function useCopy(timeout = 1800) {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
      return true;
    } catch {
      return false;
    }
  };
  return { copied, copy };
}

/** Identifiant stable pour relier un label à son champ. */
export function useFieldId(prefix = "f") {
  return `${prefix}-${useId()}`;
}
