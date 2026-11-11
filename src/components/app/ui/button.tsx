"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* Boutons du back-office. Une action principale par écran (primary, bleu
   nuit) ; le reste en secondary ou ghost. Hauteur 44 px en md : la cible
   tient sous le pouce. */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent" | "success";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-strong",
  accent: "bg-[#13305c] text-white hover:bg-[#0c2244]",
  success: "bg-ok text-white hover:brightness-95",
  secondary: "bg-white text-ink border border-line-2 hover:border-ink",
  ghost: "bg-transparent text-ink-2 hover:bg-fill-2 hover:text-ink",
  danger: "bg-danger-soft text-danger border border-danger/20 hover:bg-danger/15",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-full",
};

export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className = ""
) {
  return cn(
    "inline-flex items-center justify-center font-bold whitespace-nowrap select-none transition-all duration-150 active:scale-[0.98]",
    "disabled:opacity-50 disabled:pointer-events-none",
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
  const iconSize = size === "sm" ? 14 : 16;
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <Loader2 size={iconSize} strokeWidth={2} className="animate-spin" aria-hidden />
      ) : Icon ? (
        <Icon size={iconSize} strokeWidth={1.75} aria-hidden />
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
      {Icon && <Icon size={size === "sm" ? 14 : 16} strokeWidth={1.75} aria-hidden />}
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

/* Bouton réduit à une icône : le libellé est obligatoire, il sert de nom
   accessible et d'infobulle. */
export function IconButton({
  icon: Icon,
  label,
  className,
  size = 18,
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
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40",
        tone === "danger"
          ? "text-ink-3 hover:bg-danger-soft hover:text-danger"
          : "text-ink-3 hover:bg-fill-2 hover:text-ink",
        className
      )}
      {...props}
    >
      <Icon size={size} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
