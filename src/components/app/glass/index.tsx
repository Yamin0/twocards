"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { Translate } from "@/lib/i18n";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* Pièces des accueils (établissement, hôtel), dans la DA twocards : la
   carte marine reprend la carte de visite (as en filigrane, capitales
   espacées), le reste est du papier à filets. Aucune ne charge de données :
   chaque page leur passe ses chiffres. */

/** Mot en italique fin dans un titre gras, comme sur le site
    (« Bien plus qu'un *QR code*. »). */
export function Script({ children }: { children: ReactNode }) {
  return <em>{children}</em>;
}

export const greeting = (t: Translate, d = new Date()) => {
  const h = d.getHours();
  return h < 5
    ? t("Bonne nuit", "Good night")
    : h < 12
      ? t("Bonjour", "Good morning")
      : h < 18
        ? t("Bon après-midi", "Good afternoon")
        : t("Bonsoir", "Good evening");
};

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "•"
  );
}

/* ─── Titre de section ──────────────────────────────────────────────────── */

export function SectionTitle({
  id,
  children,
  hint,
  more,
}: {
  id?: string;
  children: ReactNode;
  hint?: ReactNode;
  more?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <div className="min-w-0">
        <h2 id={id} className="font-display text-[1.5rem] leading-tight text-ink sm:text-[1.75rem]">
          {children}
        </h2>
        {hint && <p className="mt-1 text-[14px] text-ink-3">{hint}</p>}
      </div>
      {more && (
        <Link href={more.href} className="tc-link text-[13px] font-medium text-ink hover:text-ink-2">
          {more.label}
        </Link>
      )}
    </div>
  );
}

/* ─── Carte du service (marine, comme la carte de visite) ───────────────── */

export function ServiceCard({
  title,
  text,
  stats,
  primary,
}: {
  title: ReactNode;
  text: ReactNode;
  stats: { value: ReactNode; label: string }[];
  primary: { href: string; label: string };
}) {
  return (
    <section className="tc-card-navy relative isolate flex flex-col overflow-hidden rounded-[18px] p-6 sm:p-8">
      <Image
        src="/logo-header.png"
        alt=""
        width={300}
        height={300}
        className="tc-aces absolute -right-10 -top-6 -z-10 h-[300px] w-[300px] rotate-[8deg] sm:-right-4"
      />
      <h2 className="font-display max-w-xl text-[2rem] leading-[1.05] text-white sm:text-[2.75rem]">{title}</h2>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/70">{text}</p>
      <dl className="mt-8 grid max-w-lg grid-cols-3 border-t border-white/15">
        {stats.map((s, i) => (
          <div key={s.label} className={cn("min-w-0 pt-4", i > 0 && "border-l border-white/15 pl-4 sm:pl-6")}>
            <dt className="truncate text-[13px] text-white/60 first-letter:uppercase">{s.label}</dt>
            <dd className="num font-display mt-2 truncate text-[1.75rem] leading-none text-white">{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href={primary.href}
          className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[14px] font-medium text-[#0d0d0d] transition-colors hover:bg-white/90"
        >
          {primary.label}
        </Link>
      </div>
    </section>
  );
}

/* ─── Agenda de la semaine ──────────────────────────────────────────────── */

export type CalendarEvent = {
  id: string;
  time: string;
  title: string;
  sub?: string;
  /** Mention courte à droite (« Prochaine »). */
  tag?: string;
  /** En attente de confirmation : l'heure passe en gris. */
  pending?: boolean;
};

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function CalendarCard({
  date = new Date(),
  busyDays,
  events,
  countLabel,
  href,
  emptyLabel,
}: {
  date?: Date;
  /** Jours (AAAA-MM-JJ) qui ont au moins une réservation : un point dessous. */
  busyDays: Set<string>;
  events: CalendarEvent[];
  countLabel: string;
  href: string;
  emptyLabel: string;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const today = isoOf(date);

  return (
    <section className="flex flex-col rounded-[18px] border border-line bg-panel p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] capitalize text-ink-3">{date.toLocaleDateString(intl, { month: "long", year: "numeric" })}</p>
        <Link href={href} className="tc-link text-[12.5px] font-medium text-ink">
          {t("Agenda", "Calendar")}
        </Link>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <span className="num font-display text-[3.5rem] leading-[0.85] text-[#13305c]">{date.getDate()}</span>
        <span className="pb-1">
          <span className="block text-[17px] font-bold capitalize leading-tight text-ink">
            {date.toLocaleDateString(intl, { weekday: "long" })}
          </span>
          <span className="block text-[13px] text-ink-3">{countLabel}</span>
        </span>
      </div>

      <ol className="mt-6 grid grid-cols-7 border-y border-line py-2.5">
        {week.map((d) => {
          const k = isoOf(d);
          const on = k === today;
          return (
            <li key={k} aria-current={on ? "date" : undefined} className="flex flex-col items-center gap-1">
              <span className="text-[12px] text-ink-3">{d.toLocaleDateString(intl, { weekday: "narrow" })}</span>
              <span
                className={cn(
                  "num flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold",
                  on ? "bg-[#13305c] text-white" : "text-ink"
                )}
              >
                {d.getDate()}
              </span>
              <span aria-hidden className={cn("h-1 w-1 rounded-full", busyDays.has(k) ? "bg-ink" : "bg-transparent")} />
            </li>
          );
        })}
      </ol>

      <ul className="flex-1 divide-y divide-line">
        {events.length === 0 ? (
          <li className="py-5 text-[13.5px] text-ink-3">{emptyLabel}</li>
        ) : (
          events.slice(0, 3).map((e) => (
            <li key={e.id} className="flex items-baseline gap-4 py-3.5">
              <span className={cn("num w-12 shrink-0 text-[15px] font-bold", e.pending ? "text-ink-3" : "text-ink")}>
                {e.time}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-bold text-ink">{e.title}</span>
                {e.sub && <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{e.sub}</span>}
              </span>
              {e.tag && <span className="shrink-0 text-[12.5px] font-medium text-[#13305c]">{e.tag}</span>}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

/* ─── Raccourcis : où aller ─────────────────────────────────────────────── */

export type QuickItem = {
  icon: LucideIcon;
  label: string;
  hint: string;
  href: string;
  /** Nombre en attente (demandes, non-lus) ; rien à 0. */
  count?: number;
  /** Conservé pour compatibilité. */
  alert?: boolean;
};

/* Une barre de papier, découpée par des filets, comme la navbar du site. */
export function QuickActions({ items, label }: { items: QuickItem[]; label?: string }) {
  return (
    <nav aria-label={label} className="overflow-hidden rounded-[18px] border border-line bg-panel">
      <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {items.map(({ icon: Icon, label: name, hint, href, count }, i) => (
          <li
            key={href + name}
            className={cn(
              "border-line",
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t",
              "sm:border-l-0 sm:border-t-0",
              i % 3 !== 0 && "sm:border-l",
              i >= 3 && "sm:border-t",
              "xl:border-t-0",
              i > 0 ? "xl:border-l" : "xl:border-l-0"
            )}
          >
            <Link href={href} className="group flex h-full flex-col px-5 py-4 transition-colors hover:bg-fill">
              <span className="flex items-center justify-between gap-2 text-ink-3">
                <Icon size={17} strokeWidth={1.6} aria-hidden />
                {count ? (
                  <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-[#13305c] px-1.5 text-[11px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                ) : (
                  <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </span>
              <span className="mt-4 block truncate text-[14.5px] font-bold text-ink">{name}</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ─── Barres par mois ───────────────────────────────────────────────────── */

export type MonthPoint = { key: string; label: string; a: number; b: number };

export function TrendCard({
  title,
  description,
  months,
  series,
  format,
  action,
}: {
  title: ReactNode;
  description: ReactNode;
  /** Les 12 derniers mois, du plus ancien au plus récent. */
  months: MonthPoint[];
  /** a : la barre ; b : le chiffre secondaire, affiché avec le mois. */
  series: { a: string; b: string };
  format: (n: number) => string;
  action?: ReactNode;
}) {
  const t = useT();
  const [span, setSpan] = useState<3 | 6 | 12>(6);
  const [hover, setHover] = useState<number | null>(null);
  const data = months.slice(-span);
  const max = Math.max(1, ...data.map((m) => m.a));
  const shown = hover !== null ? data[hover] : data[data.length - 1];

  return (
    <section className="rounded-[18px] border border-line bg-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1.375rem] leading-tight text-ink">{title}</h2>
          <p className="mt-1 text-[13.5px] text-ink-3">{description}</p>
        </div>
        <div className="flex items-center gap-5">
          <div role="group" aria-label={t("Période", "Period")} className="flex gap-4">
            {([3, 6, 12] as const).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={span === n}
                onClick={() => setSpan(n)}
                className={cn(
                  "pb-1 text-[13px] font-medium transition-colors",
                  span === n ? "border-b border-ink text-ink" : "text-ink-3 hover:text-ink"
                )}
              >
                {t(`${n} mois`, `${n} mo`)}
              </button>
            ))}
          </div>
          {action}
        </div>
      </div>

      {shown && (
        <p className="mt-6 flex flex-wrap items-baseline gap-x-3 text-ink">
          <span className="num font-display text-[2rem] leading-none">{format(shown.a)}</span>
          <span className="text-[13px] capitalize text-ink-3">
            {shown.label} · {series.b} {format(shown.b)}
          </span>
        </p>
      )}

      <div
        className="mt-6 flex h-44 items-end gap-2 sm:gap-3"
        role="img"
        aria-label={`${series.a} : ${data.map((m) => `${m.label} ${format(m.a)}`).join(", ")}`}
        onMouseLeave={() => setHover(null)}
      >
        {data.map((m, i) => {
          const active = hover === i || (hover === null && i === data.length - 1);
          return (
            <div key={m.key} className="flex h-full min-w-0 flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)}>
              <div
                className={cn("w-full rounded-t-[4px] transition-colors", active ? "bg-[#13305c]" : "bg-[#13305c]/20")}
                style={{ height: `${Math.max(2, (m.a / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 border-t border-line pt-2 sm:gap-3">
        {data.map((m) => (
          <span key={m.key} className="min-w-0 flex-1 truncate text-center text-[12px] capitalize text-ink-3">
            {m.label}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─── Répartition ───────────────────────────────────────────────────────── */

export function DonutCard({
  title,
  description,
  total,
  totalLabel,
  segments,
}: {
  title: ReactNode;
  description: ReactNode;
  total: ReactNode;
  totalLabel: string;
  segments: { label: string; value: number; display: string }[];
}) {
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <section className="flex flex-col rounded-[18px] border border-line bg-panel p-6">
      <h2 className="font-display text-[1.375rem] leading-tight text-ink">{title}</h2>
      <p className="mt-1 text-[13.5px] text-ink-3">{description}</p>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="num font-display text-[2rem] leading-none text-ink">{total}</span>
        <span className="text-[13px] text-ink-3">{totalLabel}</span>
      </p>
      <ul className="mt-6 space-y-4">
        {segments.map((s) => {
          const pct = Math.round((s.value / sum) * 100);
          return (
            <li key={s.label}>
              <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                <span className="truncate text-ink">{s.label}</span>
                <span className="num shrink-0 text-ink-3">
                  <span className="font-bold text-ink">{s.display}</span> · {pct} %
                </span>
              </div>
              <div className="mt-2 h-[3px] rounded-full bg-fill-2">
                <div className="h-full rounded-full bg-[#13305c]" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─── Calculs communs aux deux accueils ─────────────────────────────────── */

type Dated = { reservation_date: string; status: string };

/** Valeur par jour sur les `days` derniers jours (aujourd'hui compris). */
export function dailySeries<T extends Dated>(rows: T[], value: (r: T) => number, days = 14, now = new Date()) {
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const k = isoOf(d);
    out.push(rows.filter((r) => r.reservation_date === k).reduce((s, r) => s + value(r), 0));
  }
  return out;
}

/** Les 12 derniers mois, deux séries. */
export function monthlySeries<T extends Dated>(
  rows: T[],
  a: (r: T) => number,
  b: (r: T) => number,
  intl: string,
  now = new Date()
): MonthPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inMonth = rows.filter((r) => r.reservation_date.startsWith(key));
    return {
      key,
      label: d.toLocaleDateString(intl, { month: "short" }).replace(".", ""),
      a: inMonth.reduce((s, r) => s + a(r), 0),
      b: inMonth.reduce((s, r) => s + b(r), 0),
    };
  });
}

/** Réservations de la semaine en cours (lundi → dimanche). */
export function thisWeek<T extends Dated>(rows: T[], now = new Date()) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const from = isoOf(monday);
  const to = isoOf(sunday);
  return rows.filter((r) => r.reservation_date >= from && r.reservation_date <= to);
}
