"use client";

import {
  CalendarDays,
  Check,
  Coins,
  Users,
} from "lucide-react";
import {
  currentPeriod,
  isDue,
  mad,
  type LedgerRow,
  type Settlement,
} from "@/components/admin/commissions-admin";
import type { Translate } from "@/lib/i18n";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";
import { cardClass } from "@/components/app/ui";
import type { Account } from "./account-row";

export type Tab = "overview" | "accounts" | "catalog" | "commissions";
const panel = cardClass;

/* Vue d'ensemble du réseau : comptes, réservations récentes, commissions. */

export const STATUS_TONE: Record<string, string> = {
  "en attente": "bg-warn-soft text-warn",
  confirmée: "bg-ok-soft text-ok",
  annulée: "bg-danger-soft text-danger",
  "no-show": "bg-fill-2 text-ink-3",
};

/* Libellé affiché du statut (la valeur en base reste en français). */
export const statusLabel = (status: string, t: Translate) =>
  ({
    "en attente": t("en attente", "pending"),
    confirmée: t("confirmée", "confirmed"),
    annulée: t("annulée", "cancelled"),
    "no-show": t("no-show", "no-show"),
  })[status] ?? status;

export function Overview({
  accounts,
  ledger,
  settlements,
  onOpenTab,
}: {
  accounts: Account[] | null;
  ledger: LedgerRow[];
  settlements: Settlement[];
  onOpenTab: (t: Tab) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const now = currentPeriod();
  const byRole = (role: string) => (accounts ?? []).filter((a) => a.role === role).length;
  const thisMonth = ledger.filter((r) => r.period === now);
  const due = ledger.filter(isDue);
  const dueMonth = due.filter((r) => r.period === now);
  const settledKeys = new Set(settlements.map((s) => `${s.period}|${s.venue_owner_id}|${s.hotel_id}`));
  const remaining = due
    .filter((r) => !(r.venue_owner_id && r.hotel_id && settledKeys.has(`${r.period}|${r.venue_owner_id}|${r.hotel_id}`)))
    .reduce((s, r) => s + r.commission, 0);
  const pending = ledger.filter((r) => r.status === "en attente").length;
  const recent = [...ledger]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  const kpis = [
    { label: t("Comptes", "Accounts"), value: String(accounts?.length ?? "…"), hint: t(`${byRole("etablissement")} établ. · ${byRole("hotel")} hôtels · ${byRole("concierge")} concierges`, `${byRole("etablissement")} venues · ${byRole("hotel")} hotels · ${byRole("concierge")} concierges`), icon: Users, tab: "accounts" as Tab },
    { label: t("Réservations ce mois", "Reservations this month"), value: String(thisMonth.length), hint: t(`${ledger.length} au total · ${pending} en attente`, `${ledger.length} in total · ${pending} pending`), icon: CalendarDays, tab: "commissions" as Tab },
    { label: t("Commissions ce mois", "Commissions this month"), value: mad(dueMonth.reduce((s, r) => s + r.commission, 0), locale), hint: t(`${mad(dueMonth.reduce((s, r) => s + (r.amount_spent ?? 0), 0), locale)} dépensés`, `${mad(dueMonth.reduce((s, r) => s + (r.amount_spent ?? 0), 0), locale)} spent`), icon: Coins, tab: "commissions" as Tab },
    { label: t("Restant à régler", "Outstanding"), value: mad(remaining, locale), hint: t("tous mois confondus", "across all months"), icon: Check, tab: "commissions" as Tab },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.label}
              type="button"
              onClick={() => onOpenTab(k.tab)}
              className={`${panel} p-4 text-left transition-colors hover:bg-fill sm:p-5`}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-fill-2">
                <Icon size={16} className="text-info" />
              </div>
              <p className="text-xs font-bold text-ink-3">{k.label}</p>
              <p className="mt-1 text-2xl font-light text-ink tabular-nums">{k.value}</p>
              <p className="mt-0.5 text-xs text-ink-3">{k.hint}</p>
            </button>
          );
        })}
      </div>

      <div className={`${panel} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t("Dernières réservations", "Latest reservations")}</h2>
            <p className="text-xs text-ink-3">{t("Toutes les demandes du réseau, les plus récentes en premier.", "Every request across the network, newest first.")}</p>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">{t("Aucune réservation pour le moment.", "No reservations yet.")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">
                    {r.guest_name}
                    <span className="text-ink-3"> · {r.venue_name}</span>
                    {r.service_name && <span className="text-info"> · {r.service_name}</span>}
                  </p>
                  <p className="text-xs text-ink-3">
                    {new Date(`${r.reservation_date}T00:00:00`).toLocaleDateString(intl)}
                    {r.hotel_name ? ` · via ${r.hotel_name}` : r.source === "portal" ? t(" · portail", " · portal") : t(" · maison", " · direct")}
                    {r.amount_spent !== null ? ` · ${mad(r.amount_spent, locale)}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_TONE[r.status] ?? "bg-fill-2 text-ink-2"}`}>
                  {statusLabel(r.status, t)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
