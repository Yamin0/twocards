"use client";

/* Choix unique présenté en pastilles : de vrais boutons radio, donc
   utilisables aux flèches du clavier. Chaque pastille fait au moins 44 px
   de haut. */
export function Choices<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-[14px] font-medium">
        {label}
        {hint && <span className="text-[13px] font-normal text-[var(--landing-mute)]">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-11 items-center rounded-full border border-black/20 bg-white px-4 text-[14px] text-[var(--landing-ink)]/80 transition-colors hover:border-black/40 peer-checked:border-[var(--landing-ink)] peer-checked:bg-[var(--landing-ink)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--landing-ink)] peer-focus-visible:ring-offset-2">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
