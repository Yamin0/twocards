"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* Structure de page : un en-tête (titre en Gotham, une phrase, les actions)
   puis des cartes blanches sur le fond papier. */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  /** Fil d'Ariane court, facultatif. Pas de capitales espacées. */
  eyebrow?: ReactNode;
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
            className="mb-2 inline-flex h-9 items-center gap-1.5 rounded-lg text-[13px] font-bold text-ink-3 transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} strokeWidth={2} aria-hidden />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="mb-1 text-[13px] text-ink-3">{eyebrow}</p>}
        <h1 className="text-[1.75rem] leading-tight text-ink sm:text-[2.125rem]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export const cardClass = "rounded-2xl border border-line bg-panel shadow-card";

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
  as: Tag = "section",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
  /** Conservé pour compatibilité : toutes les cartes sont opaques. */
  solid?: boolean;
  as?: "section" | "div" | "article";
}) {
  const hasHead = Boolean(title || actions);
  return (
    <Tag className={cn(cardClass, "overflow-hidden", className)}>
      {hasHead && (
        <div
          className={cn(
            "flex flex-col gap-2 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6",
            !padded && "pb-4"
          )}
        >
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div
        className={cn(
          padded && "px-5 pb-5 sm:px-6 sm:pb-6",
          padded && (hasHead ? "pt-4" : "pt-5 sm:pt-6"),
          bodyClassName
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

/** Ancien nom de Card dans le kit hôtel. */
export const Panel = Card;

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-line", className)} />;
}

export function InfoNote({
  children,
  icon: Icon,
  tone = "default",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "amber" | "sky" | "danger";
}) {
  const tones = {
    default: "border-line bg-fill text-ink-2",
    amber: "border-warn/20 bg-warn-soft text-ink-2",
    sky: "border-info/20 bg-info-soft text-ink-2",
    danger: "border-danger/20 bg-danger-soft text-ink-2",
  } as const;
  const iconTones = {
    default: "text-ink-3",
    amber: "text-warn",
    sky: "text-info",
    danger: "text-danger",
  } as const;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed",
        tones[tone]
      )}
    >
      {Icon && (
        <Icon size={16} strokeWidth={1.75} className={cn("mt-0.5 shrink-0", iconTones[tone])} aria-hidden />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
