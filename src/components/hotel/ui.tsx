"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* Kit d'interface de l'espace hôtel. Verre sombre sur fond zellige, Satoshi
   partout : Bold pour les titres, Medium pour l'interface, Regular pour les
   textes, Black pour les KPI, Light pour les grands chiffres secondaires.
   Une seule définition de chaque primitive, réutilisée par toutes les pages. */

/* ─── Boutons ───────────────────────────────────────────────────────────────── */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-black hover:bg-white/90 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.5)]",
  accent: "bg-sky-500 text-white hover:bg-sky-400",
  secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/10",
  danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-400/20",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-sm gap-2 rounded-xl",
};

export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className = ""
) {
  return cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-200 select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
    "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon: Icon,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 14 : 16} strokeWidth={2} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : 16} strokeWidth={1.75} />
      ) : null}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  icon: Icon,
  className,
  children,
  external,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  const cls = buttonClass(variant, size, className);
  const inner = (
    <>
      {Icon && <Icon size={size === "sm" ? 14 : 16} strokeWidth={1.75} />}
      {children}
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function IconButton({
  icon: Icon,
  label,
  className,
  size = 16,
  tone = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  size?: number;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-40",
        tone === "danger"
          ? "text-white/40 hover:bg-red-500/15 hover:text-red-300"
          : "text-white/55 hover:bg-white/10 hover:text-white",
        className
      )}
      {...props}
    >
      <Icon size={size} strokeWidth={1.75} />
    </button>
  );
}

/* ─── Structure de page ─────────────────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white"
          >
            <span aria-hidden>←</span>
            {back.label}
          </Link>
        )}
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-[2.1rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
  solid = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
  solid?: boolean;
}) {
  return (
    <section className={cn(solid ? "hotel-panel-solid" : "hotel-panel", "overflow-hidden", className)}>
      {(title || actions) && (
        <div
          className={cn(
            "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
            padded ? "px-5 pt-5 sm:px-6 sm:pt-6" : "px-5 pt-5 sm:px-6 sm:pt-6 pb-4"
          )}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-base font-bold text-white">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-white/50">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(padded && "px-5 pb-5 sm:px-6 sm:pb-6", (title || actions) && padded && "pt-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/* ─── KPI ───────────────────────────────────────────────────────────────────── */

export type Kpi = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  icon?: LucideIcon;
  tone?: "default" | "amber" | "emerald" | "sky" | "violet";
};

const TONE_TEXT: Record<NonNullable<Kpi["tone"]>, string> = {
  default: "text-white/70",
  amber: "text-amber-300",
  emerald: "text-emerald-300",
  sky: "text-sky-300",
  violet: "text-violet-300",
};

export function KpiGrid({ items, columns = 4 }: { items: Kpi[]; columns?: 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 4 ? "grid-cols-2 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
      )}
    >
      {items.map((k) => (
        <div key={k.label} className="hotel-panel px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
              {k.label}
            </p>
            {k.icon && (
              <k.icon size={15} strokeWidth={1.75} className={TONE_TEXT[k.tone ?? "default"]} />
            )}
          </div>
          <p className="num font-display mt-2 text-[1.75rem] font-black leading-none tracking-tight text-white sm:text-[2rem]">
            {k.value}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/45">
            {typeof k.delta === "number" && Number.isFinite(k.delta) && (
              <span
                className={cn(
                  "num inline-flex items-center rounded-md px-1.5 py-0.5 font-bold",
                  k.delta >= 0
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-red-500/15 text-red-300"
                )}
              >
                {k.delta >= 0 ? "+" : ""}
                {Math.round(k.delta * 100)} %
              </span>
            )}
            {k.hint && <span>{k.hint}</span>}
            {k.delta === null && k.deltaLabel && <span>{k.deltaLabel}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Badges et statuts ─────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  confirmée: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
  "en attente": "bg-amber-500/15 text-amber-300 ring-amber-400/20",
  annulée: "bg-red-500/15 text-red-300 ring-red-400/20",
  "no-show": "bg-white/10 text-white/50 ring-white/10",
  actif: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
  inactif: "bg-white/10 text-white/50 ring-white/10",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
        STATUS_STYLES[status] ?? "bg-white/10 text-white/60 ring-white/10",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "confirmée" || status === "actif"
            ? "bg-emerald-400"
            : status === "en attente"
              ? "bg-amber-400"
              : status === "annulée"
                ? "bg-red-400"
                : "bg-white/40"
        )}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ─── Contrôles ─────────────────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-1 backdrop-blur-xl",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? "bg-white text-black shadow-sm" : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "num rounded-md px-1.5 text-[10px] font-bold",
                  active ? "bg-black/10 text-black/70" : "bg-white/10 text-white/60"
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
        "relative inline-flex shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-40",
        w,
        checked ? "bg-emerald-500" : "bg-white/15"
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

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/30 transition-colors focus:border-white/25 focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-white/15 disabled:opacity-50 [color-scheme:dark]";

export function Field({
  label,
  hint,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-xs font-bold text-white/70">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] leading-relaxed text-white/40">{hint}</p>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={15}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputClass, "h-10 py-0 pl-10 pr-9")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/40 hover:text-white"
        >
          <X size={14} strokeWidth={2} />
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
        className={cn(inputClass, "h-10 appearance-none py-0 pr-9 text-[13px] font-medium")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#14161c] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
      />
    </div>
  );
}

/* ─── États ─────────────────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "px-6 py-10" : "px-6 py-16")}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
        <Icon size={22} strokeWidth={1.5} className="text-white/70" />
      </div>
      <h3 className="font-display text-base font-bold text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/50">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Toast({ message, tone = "success" }: { message: string | null; tone?: "success" | "error" }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-white/15 bg-black/80 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2"
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          tone === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
        )}
      >
        {tone === "success" ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
      </span>
      {message}
    </div>
  );
}

/* ─── Dialogues ─────────────────────────────────────────────────────────────── */

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEscape(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cn(
          "satoshi relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/15 bg-[#101318]/95 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 sm:rounded-3xl",
          size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h3 id={id} className="font-display text-lg font-bold text-white">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-white/55">{description}</p>
            )}
          </div>
          <IconButton icon={X} label="Fermer" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        {children && <div className="px-6 pt-5">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-6 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
        {!footer && <div className="pb-6" />}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  danger = false,
  loading = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-end sm:items-stretch">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className="satoshi relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-white/15 bg-[#101318]/95 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom-4 sm:m-3 sm:max-h-[calc(100dvh-24px)] sm:w-[440px] sm:rounded-3xl sm:slide-in-from-right-4"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-4 pt-6">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                {eyebrow}
              </p>
            )}
            <h3 className="font-display truncate text-xl font-bold text-white">{title}</h3>
          </div>
          <IconButton icon={X} label="Fermer" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer && (
          <div className="flex flex-wrap gap-2 border-t border-white/10 px-6 py-4">{footer}</div>
        )}
      </aside>
    </div>
  );
}

/* ─── Tableaux ──────────────────────────────────────────────────────────────── */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "border-b border-white/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  muted = false,
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  muted?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
        muted ? "text-white/60" : "text-white",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-white/[0.06] last:border-0",
        onClick && "cursor-pointer transition-colors hover:bg-white/[0.04]",
        className
      )}
    >
      {children}
    </tr>
  );
}

/* ─── Divers ────────────────────────────────────────────────────────────────── */

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  /* Teinte stable par nom : un même client garde la même couleur partout. */
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `hsl(${h} 45% 38% / 0.9)`,
      }}
    >
      {initials || "?"}
    </span>
  );
}

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

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-white/10", className)} />;
}

export function InfoNote({ children, icon: Icon, tone = "default" }: { children: ReactNode; icon?: LucideIcon; tone?: "default" | "amber" | "sky" }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed",
        tone === "amber"
          ? "border-amber-400/15 bg-amber-500/[0.07] text-white/65"
          : tone === "sky"
            ? "border-sky-400/15 bg-sky-500/[0.08] text-white/65"
            : "border-white/10 bg-white/[0.04] text-white/60"
      )}
    >
      {Icon && (
        <Icon
          size={15}
          strokeWidth={1.75}
          className={cn(
            "mt-0.5 shrink-0",
            tone === "amber" ? "text-amber-300" : tone === "sky" ? "text-sky-300" : "text-white/50"
          )}
        />
      )}
      <div>{children}</div>
    </div>
  );
}
