"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export const isDue = (r: LedgerRow) =>
  r.source === "qr" &&
  r.amount_spent !== null &&
  r.status !== "annulée" &&
  r.status !== "no-show";

export const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (period: string) => {
  const label = new Date(`${period}-01T00:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const mad = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} MAD`;

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
        hotelLabel: r.hotel_name ?? "Hôtel partenaire",
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
  const hotels = sides((r) => ({ id: r.hotel_id, label: r.hotel_name ?? "Hôtel partenaire" }));

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
      onError("Impossible de noter le règlement.");
      return;
    }
    onChanged(`${p.venueLabel} → ${p.hotelLabel} : ${mad(p.commission)} notés réglés pour ${monthLabel(period)}`);
  };

  const unmark = async (p: Pair) => {
    const s = pairSettlement(p);
    if (!s) return;
    setBusy(p.key);
    const { error } = await createClient().from("commission_settlements").delete().eq("id", s.id);
    setBusy(null);
    if (error) {
      onError("Impossible d'annuler le règlement.");
      return;
    }
    onChanged("Règlement annulé");
  };

  const th = "font-ui px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 text-left";
  const tabBtn = (active: boolean) =>
    `font-ui rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? "bg-white text-black" : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="space-y-4">
      {/* Mois */}
      <div className={`${panel} p-4 sm:p-5`}>
        <p className="font-ui mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Période</p>
        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={tabBtn(period === p)}>
              {monthLabel(p)}
            </button>
          ))}
          <button type="button" onClick={() => setPeriod("all")} className={tabBtn(period === "all")}>
            Tout
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Commissions", value: mad(total), hint: `${rows.length} sortie${rows.length > 1 ? "s" : ""}` },
            { label: "Réglées", value: mad(settledTotal), hint: "notées par twocards" },
            { label: "Restant à régler", value: mad(total - settledTotal), hint: "à collecter puis reverser" },
            { label: "Couples", value: String(pairs.length), hint: "établissement → hôtel" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
              <p className="font-ui text-[10px] font-bold uppercase tracking-wider text-white/45">{k.label}</p>
              <p className="font-display mt-1 text-xl text-white tabular-nums">{k.value}</p>
              <p className="font-ui text-[11px] text-white/40">{k.hint}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vue */}
      <div className={`${panel} p-4 sm:p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setView("pairs")} className={tabBtn(view === "pairs")}>
              Qui doit à qui
            </button>
            <button type="button" onClick={() => setView("venues")} className={tabBtn(view === "venues")}>
              Établissements
            </button>
            <button type="button" onClick={() => setView("hotels")} className={tabBtn(view === "hotels")}>
              Hôtels
            </button>
          </div>
          <p className="font-ui text-xs text-white/40">
            {view === "pairs"
              ? "L'établissement paie, twocards reverse à l'hôtel."
              : view === "venues"
                ? "Ce que chaque établissement doit."
                : "Ce que chaque hôtel doit recevoir."}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="py-8 text-center font-ui text-sm text-white/40">Aucune commission sur cette période.</p>
        ) : view === "pairs" ? (
          <div className="tc-stack overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={th}>Établissement</th>
                  <th className={th}>Hôtel</th>
                  <th className={th}>Sorties</th>
                  <th className={th}>Dépensé</th>
                  <th className={th}>Commission</th>
                  <th className={th}>Règlement</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((p) => {
                  const s = pairSettlement(p);
                  const canSettle = period !== "all" && !!p.venueOwnerId && !!p.hotelId;
                  return (
                    <tr key={p.key} className="border-b border-white/[0.06] last:border-0">
                      <td data-head className="px-4 py-3">
                        <p className="font-ui text-sm font-semibold text-white">{p.venueLabel}</p>
                        {!p.venueOwnerId && (
                          <p className="font-ui text-[11px] text-amber-300/90">fiche sans compte relié</p>
                        )}
                      </td>
                      <td data-label="Hôtel" className="px-4 py-3">
                        <span className="font-ui inline-flex items-center gap-1.5 text-sm text-white/80">
                          <ArrowRight size={12} strokeWidth={2} className="text-white/35" />
                          {p.hotelLabel}
                        </span>
                      </td>
                      <td data-label="Sorties" className="font-ui px-4 py-3 text-sm text-white/70 tabular-nums">{p.count}</td>
                      <td data-label="Dépensé" className="font-ui px-4 py-3 text-sm text-white/70 tabular-nums whitespace-nowrap">{mad(p.spent)}</td>
                      <td data-label="Commission" className="font-display px-4 py-3 text-sm text-amber-300 tabular-nums whitespace-nowrap">{mad(p.commission)}</td>
                      <td data-actions className="px-4 py-3">
                        {s ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-ui inline-flex items-center gap-1 text-xs text-emerald-300">
                              <Check size={12} strokeWidth={2.5} />
                              réglé le {new Date(s.settled_at).toLocaleDateString("fr-FR")}
                            </span>
                            <button
                              type="button"
                              onClick={() => unmark(p)}
                              disabled={busy === p.key}
                              aria-label="Annuler le règlement"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50"
                            >
                              {busy === p.key ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} strokeWidth={1.75} />}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markSettled(p)}
                            disabled={!canSettle || busy === p.key}
                            title={!canSettle ? (period === "all" ? "Choisissez un mois" : "Fiche sans compte relié") : undefined}
                            className="font-ui inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {busy === p.key ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                            Marquer réglé
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
          <div className="tc-stack overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={th}>{view === "venues" ? "Établissement" : "Hôtel"}</th>
                  <th className={th}>Sorties</th>
                  <th className={th}>Dépensé</th>
                  <th className={th}>{view === "venues" ? "Doit payer" : "Doit recevoir"}</th>
                  <th className={th}>Réglé</th>
                  <th className={th}>Restant</th>
                </tr>
              </thead>
              <tbody>
                {(view === "venues" ? venues : hotels).map((s) => (
                  <tr key={s.key} className="border-b border-white/[0.06] last:border-0">
                    <td data-head className="px-4 py-3">
                      <p className="font-ui text-sm font-semibold text-white">{s.label}</p>
                      {!s.id && <p className="font-ui text-[11px] text-amber-300/90">sans compte relié</p>}
                    </td>
                    <td data-label="Sorties" className="font-ui px-4 py-3 text-sm text-white/70 tabular-nums">{s.count}</td>
                    <td data-label="Dépensé" className="font-ui px-4 py-3 text-sm text-white/70 tabular-nums whitespace-nowrap">{mad(s.spent)}</td>
                    <td data-label={view === "venues" ? "Doit payer" : "Doit recevoir"} className="font-display px-4 py-3 text-sm text-amber-300 tabular-nums whitespace-nowrap">{mad(s.commission)}</td>
                    <td data-label="Réglé" className="font-ui px-4 py-3 text-sm text-emerald-300 tabular-nums whitespace-nowrap">{mad(s.settledAmount)}</td>
                    <td data-label="Restant" className="font-ui px-4 py-3 text-sm text-white tabular-nums whitespace-nowrap">{mad(s.commission - s.settledAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="font-ui text-xs leading-relaxed text-white/40">
        Un règlement noté vaut pour les deux mouvements : l&apos;établissement a payé, l&apos;hôtel a été reversé.
        Il apparaît aussitôt comme « réglé » dans l&apos;espace de chacun. Une fiche « sans compte relié » est une adresse
        du catalogue dont personne ne gère encore l&apos;espace : reliez-la depuis le catalogue pour pouvoir noter ses règlements.
      </p>
    </div>
  );
}
