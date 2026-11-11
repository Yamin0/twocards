"use client";

import { currentPeriod, isDue, mad, monthLabel } from "@/lib/commissions";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

/* Commissions vues du réseau : qui doit combien à qui. Chaque sortie
   apportée par un QR d'hôtel, avec addition connue, crée une dette de
   l'établissement (montant × taux) que twocards collecte puis reverse à
   l'hôtel. Un règlement se note par mois et par couple établissement →
   hôtel ; les deux espaces le voient alors passer à « réglé ». */

export type LedgerRow = {
  id: string;
  reservation_date: string;
  created_at: string;
  period: string;
  guest_name: string;
  category: string;
  venue_slug: string | null;
  venue_name: string;
  venue_owner_id: string | null;
  venue_account: string | null;
  hotel_id: string | null;
  hotel_name: string | null;
  source: string;
  status: string;
  amount_spent: number | null;
  commission_rate: number;
  commission: number;
  service_name: string | null;
};

export type Settlement = {
  id: string;
  period: string;
  venue_owner_id: string;
  hotel_id: string;
  amount: number;
  note: string;
  settled_at: string;
};

export { currentPeriod, isDue, mad, monthLabel };

type Pair = {
  key: string;
  venueOwnerId: string | null;
  venueLabel: string;
  hotelId: string | null;
  hotelLabel: string;
  count: number;
  spent: number;
  commission: number;
};

type Side = {
  key: string;
  id: string | null;
  label: string;
  count: number;
  spent: number;
  commission: number;
  settledAmount: number;
};

const settlementKey = (period: string, venue: string, hotel: string) =>
  `${period}|${venue}|${hotel}`;

export function CommissionsAdmin({
  ledger,
  settlements,
  panel,
  onChanged,
  onError,
}: {
  ledger: LedgerRow[];
  settlements: Settlement[];
  panel: string;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const due = useMemo(() => ledger.filter(isDue), [ledger]);
  const periods = useMemo(
    () => [...new Set(due.map((r) => r.period))].sort().reverse(),
    [due]
  );
  const [period, setPeriod] = useState<string>(() => {
    const now = currentPeriod();
    return periods.includes(now) ? now : (periods[0] ?? "all");
  });
  const [view, setView] = useState<"pairs" | "venues" | "hotels">("pairs");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = due.filter((r) => period === "all" || r.period === period);
  const settledMap = new Map(
    settlements.map((s) => [settlementKey(s.period, s.venue_owner_id, s.hotel_id), s])
  );
  const isSettled = (r: LedgerRow) =>
    !!(r.venue_owner_id && r.hotel_id && settledMap.get(settlementKey(r.period, r.venue_owner_id, r.hotel_id)));

  /* Couples établissement → hôtel. */
  const pairs: Pair[] = [];
  {
    const map = new Map<string, Pair>();
    for (const r of rows) {
      const key = `${r.venue_owner_id ?? r.venue_slug ?? r.venue_name}|${r.hotel_id ?? "?"}`;
      const p = map.get(key) ?? {
        key,
        venueOwnerId: r.venue_owner_id,
        venueLabel: r.venue_account ?? r.venue_name,
        hotelId: r.hotel_id,
        hotelLabel: r.hotel_name ?? t("Hôtel partenaire", "Partner hotel"),
        count: 0,
        spent: 0,
        commission: 0,
      };
      p.count += 1;
      p.spent += r.amount_spent ?? 0;
      p.commission += r.commission;
      map.set(key, p);
    }
    pairs.push(...[...map.values()].sort((a, b) => b.commission - a.commission));
  }

  const sides = (pick: (r: LedgerRow) => { id: string | null; label: string }): Side[] => {
    const map = new Map<string, Side>();
    for (const r of rows) {
      const { id, label } = pick(r);
      const key = id ?? label;
      const s = map.get(key) ?? { key, id, label, count: 0, spent: 0, commission: 0, settledAmount: 0 };
      s.count += 1;
      s.spent += r.amount_spent ?? 0;
      s.commission += r.commission;
      if (isSettled(r)) s.settledAmount += r.commission;
      map.set(key, s);
    }
    return [...map.values()].sort((a, b) => b.commission - a.commission);
  };
  const venues = sides((r) => ({ id: r.venue_owner_id, label: r.venue_account ?? r.venue_name }));
  const hotels = sides((r) => ({ id: r.hotel_id, label: r.hotel_name ?? t("Hôtel partenaire", "Partner hotel") }));

  const total = rows.reduce((s, r) => s + r.commission, 0);
  const settledTotal = rows.filter(isSettled).reduce((s, r) => s + r.commission, 0);
  const pairSettlement = (p: Pair) =>
    period !== "all" && p.venueOwnerId && p.hotelId
      ? settledMap.get(settlementKey(period, p.venueOwnerId, p.hotelId)) ?? null
      : null;

  const markSettled = async (p: Pair) => {
    if (period === "all" || !p.venueOwnerId || !p.hotelId) return;
    setBusy(p.key);
    const { error } = await createClient()
      .from("commission_settlements")
      .upsert(
        { period, venue_owner_id: p.venueOwnerId, hotel_id: p.hotelId, amount: p.commission },
        { onConflict: "period,venue_owner_id,hotel_id" }
      );
    setBusy(null);
    if (error) {
      onError(t("Impossible de noter le règlement.", "Couldn’t record the settlement."));
      return;
    }
    onChanged(
      t(
        `${p.venueLabel} → ${p.hotelLabel} : ${mad(p.commission, locale)} notés réglés pour ${monthLabel(period, locale)}`,
        `${p.venueLabel} → ${p.hotelLabel}: ${mad(p.commission, locale)} marked as settled for ${monthLabel(period, locale)}`
      )
    );
  };

  const unmark = async (p: Pair) => {
    const s = pairSettlement(p);
    if (!s) return;
    setBusy(p.key);
    const { error } = await createClient().from("commission_settlements").delete().eq("id", s.id);
    setBusy(null);
    if (error) {
      onError(t("Impossible d'annuler le règlement.", "Couldn’t undo the settlement."));
      return;
    }
    onChanged(t("Règlement annulé", "Settlement undone"));
  };

  const th = "font-ui px-4 py-3 text-xs font-bold text-ink-3 text-left";
  const tabBtn = (active: boolean) =>
    `font-ui rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-fill-2 hover:text-ink"
    }`;

  return (
    <div className="space-y-4">
      {/* Mois */}
      <div className={`${panel} p-4 sm:p-5`}>
        <p className="font-ui mb-2 text-xs font-bold text-ink-3">{t("Période", "Period")}</p>
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={tabBtn(period === p)}>
              {monthLabel(p, locale)}
            </button>
          ))}
          <button type="button" onClick={() => setPeriod("all")} className={tabBtn(period === "all")}>
            {t("Tout", "All")}
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("Commissions", "Commissions"), value: mad(total, locale), hint: t(`${rows.length} sortie${rows.length > 1 ? "s" : ""}`, `${rows.length} outing${rows.length === 1 ? "" : "s"}`) },
            { label: t("Réglées", "Settled"), value: mad(settledTotal, locale), hint: t("notées par twocards", "recorded by twocards") },
            { label: t("Restant à régler", "Outstanding"), value: mad(total - settledTotal, locale), hint: t("à collecter puis reverser", "to collect, then pay out") },
            { label: t("Couples", "Pairs"), value: String(pairs.length), hint: t("établissement → hôtel", "venue → hotel") },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-line bg-fill px-4 py-3">
              <p className="font-ui text-xs font-bold text-ink-3">{k.label}</p>
              <p className="font-display mt-1 text-xl text-ink tabular-nums">{k.value}</p>
              <p className="font-ui text-xs text-ink-3">{k.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vue */}
      <div className={`${panel} p-4 sm:p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setView("pairs")} className={tabBtn(view === "pairs")}>
              {t("Qui doit à qui", "Who owes whom")}
            </button>
            <button type="button" onClick={() => setView("venues")} className={tabBtn(view === "venues")}>
              {t("Établissements", "Venues")}
            </button>
            <button type="button" onClick={() => setView("hotels")} className={tabBtn(view === "hotels")}>
              {t("Hôtels", "Hotels")}
            </button>
          </div>
          <p className="font-ui text-xs text-ink-3">
            {view === "pairs"
              ? t("L'établissement paie, twocards reverse à l'hôtel.", "The venue pays; twocards passes it on to the hotel.")
              : view === "venues"
                ? t("Ce que chaque établissement doit.", "What each venue owes.")
                : t("Ce que chaque hôtel doit recevoir.", "What each hotel is owed.")}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center font-ui text-sm text-ink-3">{t("Aucune commission sur cette période.", "No commissions for this period.")}</p>
        ) : view === "pairs" ? (
          <div className="tc-stack overflow-x-auto rounded-xl border border-line">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{t("Établissement", "Venue")}</th>
                  <th className={th}>{t("Hôtel", "Hotel")}</th>
                  <th className={th}>{t("Sorties", "Outings")}</th>
                  <th className={th}>{t("Dépensé", "Spent")}</th>
                  <th className={th}>{t("Commission", "Commission")}</th>
                  <th className={th}>{t("Règlement", "Settlement")}</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((p) => {
                  const s = pairSettlement(p);
                  const canSettle = period !== "all" && !!p.venueOwnerId && !!p.hotelId;
                  return (
                    <tr key={p.key} className="border-b border-line last:border-0">
                      <td data-head className="px-4 py-3">
                        <p className="font-ui text-sm font-semibold text-ink">{p.venueLabel}</p>
                        {!p.venueOwnerId && (
                          <p className="font-ui text-xs text-warn">{t("fiche sans compte relié", "listing with no linked account")}</p>
                        )}
                      </td>
                      <td data-label={t("Hôtel", "Hotel")} className="px-4 py-3">
                        <span className="font-ui inline-flex items-center gap-1.5 text-sm text-ink">
                          <ArrowRight size={12} strokeWidth={2} className="text-ink-3" />
                          {p.hotelLabel}
                        </span>
                      </td>
                      <td data-label={t("Sorties", "Outings")} className="font-ui px-4 py-3 text-sm text-ink-2 tabular-nums">{p.count}</td>
                      <td data-label={t("Dépensé", "Spent")} className="font-ui px-4 py-3 text-sm text-ink-2 tabular-nums whitespace-nowrap">{mad(p.spent, locale)}</td>
                      <td data-label={t("Commission", "Commission")} className="font-display px-4 py-3 text-sm text-warn tabular-nums whitespace-nowrap">{mad(p.commission, locale)}</td>
                      <td data-actions className="px-4 py-3">
                        {s ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-ui inline-flex items-center gap-1 text-xs text-ok">
                              <Check size={12} strokeWidth={2.5} />
                              {t("réglé le", "settled on")} {new Date(s.settled_at).toLocaleDateString(intl)}
                            </span>
                            <button
                              type="button"
                              onClick={() => unmark(p)}
                              disabled={busy === p.key}
                              aria-label={t("Annuler le règlement", "Undo settlement")}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-fill-2 hover:text-ink disabled:opacity-50"
                            >
                              {busy === p.key ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} strokeWidth={1.75} />}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markSettled(p)}
                            disabled={!canSettle || busy === p.key}
                            title={!canSettle ? (period === "all" ? t("Choisissez un mois", "Pick a month") : t("Fiche sans compte relié", "Listing with no linked account")) : undefined}
                            className="font-ui inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-3 text-xs font-bold text-on-brand transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {busy === p.key ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                            {t("Marquer réglé", "Mark as settled")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tc-stack overflow-x-auto rounded-xl border border-line">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>{view === "venues" ? t("Établissement", "Venue") : t("Hôtel", "Hotel")}</th>
                  <th className={th}>{t("Sorties", "Outings")}</th>
                  <th className={th}>{t("Dépensé", "Spent")}</th>
                  <th className={th}>{view === "venues" ? t("Doit payer", "Owes") : t("Doit recevoir", "Is owed")}</th>
                  <th className={th}>{t("Réglé", "Settled")}</th>
                  <th className={th}>{t("Restant", "Outstanding")}</th>
                </tr>
              </thead>
              <tbody>
                {(view === "venues" ? venues : hotels).map((s) => (
                  <tr key={s.key} className="border-b border-line last:border-0">
                    <td data-head className="px-4 py-3">
                      <p className="font-ui text-sm font-semibold text-ink">{s.label}</p>
                      {!s.id && <p className="font-ui text-xs text-warn">{t("sans compte relié", "no linked account")}</p>}
                    </td>
                    <td data-label={t("Sorties", "Outings")} className="font-ui px-4 py-3 text-sm text-ink-2 tabular-nums">{s.count}</td>
                    <td data-label={t("Dépensé", "Spent")} className="font-ui px-4 py-3 text-sm text-ink-2 tabular-nums whitespace-nowrap">{mad(s.spent, locale)}</td>
                    <td data-label={view === "venues" ? t("Doit payer", "Owes") : t("Doit recevoir", "Is owed")} className="font-display px-4 py-3 text-sm text-warn tabular-nums whitespace-nowrap">{mad(s.commission, locale)}</td>
                    <td data-label={t("Réglé", "Settled")} className="font-ui px-4 py-3 text-sm text-ok tabular-nums whitespace-nowrap">{mad(s.settledAmount, locale)}</td>
                    <td data-label={t("Restant", "Outstanding")} className="font-ui px-4 py-3 text-sm text-ink tabular-nums whitespace-nowrap">{mad(s.commission - s.settledAmount, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="font-ui text-xs leading-relaxed text-ink-3">
        {t(
          <>
            Un règlement noté vaut pour les deux mouvements : l&apos;établissement a payé, l&apos;hôtel a été reversé.
            Il apparaît aussitôt comme « réglé » dans l&apos;espace de chacun. Une fiche « sans compte relié » est une adresse
            du catalogue dont personne ne gère encore l&apos;espace : reliez-la depuis le catalogue pour pouvoir noter ses règlements.
          </>,
          <>
            A recorded settlement covers both legs: the venue has paid and the hotel has been paid out.
            It shows as &ldquo;settled&rdquo; in both dashboards straight away. A listing with &ldquo;no linked account&rdquo; is a catalogue
            place nobody manages yet: link it from the catalogue to record its settlements.
          </>
        )}
      </p>
    </div>
  );
}
