"use client";

import { Check, ChevronDown, Clock, Hotel } from "lucide-react";
import { mad } from "@/lib/commissions";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import { fmtDate, type MonthGroup, type Settlement } from "./commissions-lib";

/* Hôtels d'un mois, chacun dépliable sur ses sorties. */
export function HotelList({
  month,
  settled,
  open,
  toggle,
}: {
  month: MonthGroup;
  settled: (period: string, hotelId: string | null) => Settlement | null;
  open: Set<string>;
  toggle: (key: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <ul className="space-y-2">
      {month.hotels.map((h) => {
        const key = `${month.period}|${h.key}`;
        const isOpen = open.has(key);
        const s = settled(month.period, h.hotelId);
        return (
          <li key={key} className="rounded-xl border border-line bg-fill">
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fill-2">
                <Hotel size={15} strokeWidth={1.75} className="text-ink" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-ui text-sm font-semibold text-ink truncate">{h.name}</p>
                <p className="font-ui text-xs text-ink-3">
                  {t(
                    `${h.rows.length} sortie${h.rows.length > 1 ? "s" : ""} · ${mad(h.spent, locale)} dépensés`,
                    `${h.rows.length} outing${h.rows.length === 1 ? "" : "s"} · ${mad(h.spent, locale)} spent`
                  )}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-base text-warn tabular-nums">{mad(h.commission, locale)}</p>
                {s ? (
                  <p className="font-ui inline-flex items-center gap-1 text-xs text-ok">
                    <Check size={11} strokeWidth={2.5} />
                    {t("réglé le", "settled on")} {new Date(s.settled_at).toLocaleDateString(intlLocale(locale))}
                  </p>
                ) : (
                  <p className="font-ui inline-flex items-center gap-1 text-xs text-warn">
                    <Clock size={11} strokeWidth={2} />
                    {t("à régler", "due")}
                  </p>
                )}
              </div>
              <ChevronDown
                size={15}
                strokeWidth={1.75}
                className={`shrink-0 text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <ul className="divide-y divide-line border-t border-line px-4">
                {h.rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-ui text-sm text-ink truncate">
                        {r.guest_name}
                        {r.service_name && <span className="text-info"> · {r.service_name}</span>}
                      </p>
                      <p className="font-ui text-xs text-ink-3">
                        {fmtDate(r.reservation_date, locale)} · {mad(r.amount_spent ?? 0, locale)} {t("dépensés", "spent")} · {Math.round(r.commission_rate * 100)}{t(" %", "%")}
                        {r.amount_source === "pos" ? t(" · caisse", " · POS") : ""}
                      </p>
                    </div>
                    <span className="font-display shrink-0 text-sm text-warn tabular-nums">{mad(r.commission, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
