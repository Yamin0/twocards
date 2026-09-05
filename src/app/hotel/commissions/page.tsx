"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Coins, Download, HelpCircle, Hourglass, Percent, TrendingUp, Wallet } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace, type HotelReservation } from "@/lib/hotel/store";
import { CATEGORIES, CATEGORY_COLORS, hasCommission, isLive, monthlySeries, sumBy, topN } from "@/lib/hotel/analytics";
import { formatDate, formatMad, formatNumber, monthKey, monthLabel, plural, sameMonth, todayIso } from "@/lib/hotel/format";
import {
  Button,
  EmptyState,
  InfoNote,
  KpiGrid,
  PageHeader,
  Panel,
  Segmented,
  Select,
  Table,
  Tag,
  Td,
  Th,
  Tr,
} from "@/components/hotel/ui";
import { Bars, RankedBars, SplitBar } from "@/components/hotel/charts";
import { PageSkeleton } from "@/components/hotel/skeleton";

type Scope = "mois" | "precedent" | "tout";

function exportCsv(rows: HotelReservation[], suffix: string) {
  const header = ["Date sortie", "Client", "Sortie", "Catégorie", "Chambre", "Montant dépensé (MAD)", "Taux", "Commission (MAD)", "Source du montant"];
  const lines = rows.map((r) =>
    [r.reservation_date, r.guest_name, r.venue_name, r.category, r.qr_label ?? "", r.amount_spent ?? "", `${Math.round(r.commission_rate * 100)}%`, r.commission, r.amount_source]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const total = rows.reduce((s, r) => s + r.commission, 0);
  const blob = new Blob(["﻿" + [header.join(";"), ...lines, `"TOTAL";;;;;;;"${total}";`].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commissions-${suffix}-${todayIso()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HotelCommissionsPage() {
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, isLoading } = useHotelSpace();
  const [scope, setScope] = useState<Scope>("mois");
  const [month, setMonth] = useState<string>("tous");

  const earning = useMemo(() => reservations.filter(hasCommission), [reservations]);
  const months = useMemo(() => {
    const keys = [...new Set(earning.map((r) => monthKey(r.reservation_date)))].sort().reverse();
    return keys;
  }, [earning]);

  if (authLoading || isLoading) return <PageSkeleton kpis={4} table />;

  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const total = earning.reduce((s, r) => s + r.commission, 0);
  const thisMonth = earning.filter((r) => sameMonth(r.reservation_date)).reduce((s, r) => s + r.commission, 0);
  const prevMonth = earning.filter((r) => sameMonth(r.reservation_date, prev)).reduce((s, r) => s + r.commission, 0);
  const awaiting = reservations.filter((r) => isLive(r) && r.amount_spent === null && r.reservation_date < todayIso());
  const upcoming = reservations.filter((r) => isLive(r) && r.amount_spent === null && r.reservation_date >= todayIso());
  const avgTicket = earning.length > 0 ? earning.reduce((s, r) => s + (r.amount_spent ?? 0), 0) / earning.length : 0;
  const avgCommission = earning.length > 0 ? total / earning.length : 0;

  const series = monthlySeries(earning, 6, (r) => r.commission);
  const byCategory = CATEGORIES.map((label) => ({
    label,
    value: earning.filter((r) => r.category === label).reduce((s, r) => s + r.commission, 0),
    color: CATEGORY_COLORS[label],
  }));
  const byRoom = topN(sumBy(earning, (r) => r.qr_label ?? "QR supprimé", (r) => r.commission), 5);
  const byVenue = topN(sumBy(earning, (r) => r.venue_name, (r) => r.commission), 5);

  /* Relevé mensuel : mois en cours = « en cours », mois clos = « clôturé ». */
  const statement = months.map((key) => {
    const rows = earning.filter((r) => monthKey(r.reservation_date) === key);
    return {
      key,
      rows: rows.length,
      spent: rows.reduce((s, r) => s + (r.amount_spent ?? 0), 0),
      commission: rows.reduce((s, r) => s + r.commission, 0),
      current: key === monthKey(todayIso()),
    };
  });

  const detail = earning
    .filter((r) => {
      if (scope === "mois") return sameMonth(r.reservation_date);
      if (scope === "precedent") return sameMonth(r.reservation_date, prev);
      return month === "tous" || monthKey(r.reservation_date) === month;
    })
    .sort((a, b) => b.reservation_date.localeCompare(a.reservation_date));
  const detailTotal = detail.reduce((s, r) => s + r.commission, 0);
  const suffix = scope === "mois" ? monthKey(todayIso()) : scope === "precedent" ? monthKey(prev.toISOString()) : month;

  return (
    <>
      <PageHeader
        eyebrow="Commissions"
        title="Vos gains"
        description="Chaque sortie réservée depuis un de vos QR codes vous rapporte un pourcentage du montant réellement dépensé par le client. Ici, tout est tracé : par mois, par emplacement, par adresse."
        actions={
          <Button icon={Download} onClick={() => exportCsv(detail, suffix)} disabled={detail.length === 0}>
            Exporter le relevé
          </Button>
        }
      />

      <KpiGrid
        items={[
          {
            label: "Ce mois-ci",
            value: formatMad(thisMonth, true),
            delta: prevMonth > 0 ? (thisMonth - prevMonth) / prevMonth : null,
            deltaLabel: "premier mois",
            hint: `vs ${formatMad(prevMonth, true)} le mois dernier`,
            icon: Wallet,
            tone: "amber",
          },
          { label: "Cumulées", value: formatMad(total, true), hint: `${earning.length} ${plural(earning.length, "sortie commissionnée", "sorties commissionnées")}`, icon: Coins, tone: "emerald" },
          { label: "Commission moyenne", value: formatMad(avgCommission), hint: `sur un panier moyen de ${formatMad(avgTicket)}`, icon: TrendingUp, tone: "sky" },
          { label: "En attente de montant", value: formatNumber(awaiting.length), hint: `${upcoming.length} ${plural(upcoming.length, "sortie")} à venir`, icon: Hourglass, tone: "violet" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Commissions par mois" description="6 derniers mois, sorties commissionnées" className="xl:col-span-2">
          <Bars data={series} color="bg-amber-400" height={160} format={(n) => formatMad(n, true)} />
          <div className="mt-5 border-t border-white/[0.08] pt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Par catégorie</p>
            <SplitBar segments={byCategory} format={(n) => formatMad(n)} />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Emplacements les plus rentables">
            <RankedBars items={byRoom} format={(n) => formatMad(n, true)} color="bg-amber-400/80" empty="Aucune commission pour le moment." />
          </Panel>
          <Panel title="Adresses les plus rentables">
            <RankedBars items={byVenue} format={(n) => formatMad(n, true)} color="bg-emerald-400/80" empty="Aucune commission pour le moment." />
          </Panel>
        </div>
      </div>

      {statement.length > 0 && (
        <Panel title="Relevé mensuel" description="Un mois clôturé est versé le mois suivant. Pour toute question sur un montant, contactez votre référent twocards." padded={false}>
          <Table>
            <thead>
              <tr>
                <Th>Mois</Th>
                <Th>Statut</Th>
                <Th align="right">Sorties</Th>
                <Th align="right">Montant dépensé</Th>
                <Th align="right">Commissions</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {statement.map((m) => (
                <Tr key={m.key}>
                  <Td className="font-bold capitalize">{monthLabel(m.key, true)}</Td>
                  <Td>
                    <Tag className={m.current ? "bg-sky-500/15 text-sky-200" : "bg-emerald-500/15 text-emerald-300"}>
                      {m.current ? "En cours" : "Clôturé"}
                    </Tag>
                  </Td>
                  <Td align="right" className="num" muted>{formatNumber(m.rows)}</Td>
                  <Td align="right" className="num" muted>{formatMad(m.spent)}</Td>
                  <Td align="right" className="num font-bold text-amber-300">{formatMad(m.commission)}</Td>
                  <Td align="right">
                    <button
                      type="button"
                      onClick={() => exportCsv(earning.filter((r) => monthKey(r.reservation_date) === m.key), m.key)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 hover:text-sky-200"
                    >
                      <Download size={12} strokeWidth={2} /> CSV
                    </button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}

      <Panel
        title="Détail des commissions"
        description={`${detail.length} ${plural(detail.length, "ligne")} · ${formatMad(detailTotal)}`}
        actions={
          <>
            <Segmented<Scope>
              size="sm"
              value={scope}
              onChange={setScope}
              options={[
                { value: "mois", label: "Ce mois" },
                { value: "precedent", label: "Mois dernier" },
                { value: "tout", label: "Par mois" },
              ]}
            />
            {scope === "tout" && (
              <Select
                label="Mois"
                value={month}
                onChange={setMonth}
                className="w-44"
                options={[{ value: "tous", label: "Tous les mois" }, ...months.map((k) => ({ value: k, label: monthLabel(k, true) }))]}
              />
            )}
          </>
        }
        padded={false}
      >
        {detail.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="Aucune commission sur cette période"
            description={
              awaiting.length > 0
                ? `${awaiting.length} ${plural(awaiting.length, "sortie passée", "sorties passées")} ${plural(awaiting.length, "attend", "attendent")} encore un montant — les commissions apparaîtront dès que l'établissement l'aura renseigné.`
                : "Chaque sortie réservée via vos QR codes vous rapporte un pourcentage du montant dépensé. Tout apparaîtra ici, exportable en CSV."
            }
            compact
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Client</Th>
                <Th>Sortie</Th>
                <Th>Emplacement</Th>
                <Th align="right">Montant</Th>
                <Th align="right">Taux</Th>
                <Th align="right">Commission</Th>
              </tr>
            </thead>
            <tbody>
              {detail.map((r) => (
                <Tr key={r.id}>
                  <Td muted className="num whitespace-nowrap">{formatDate(r.reservation_date)}</Td>
                  <Td>
                    <Link href={`/hotel/reservations?id=${r.id}`} className="font-bold hover:underline">{r.guest_name}</Link>
                  </Td>
                  <Td>
                    <p className="font-medium">{r.venue_name}</p>
                    <p className="text-xs text-white/45">{r.category}</p>
                  </Td>
                  <Td muted>{r.qr_label ?? "—"}</Td>
                  <Td align="right" muted className="num whitespace-nowrap">
                    {formatMad(r.amount_spent ?? 0)}
                    {r.amount_source === "pos" && <span className="ml-1 text-[10px] text-white/35" title="Montant remonté par la caisse">POS</span>}
                  </Td>
                  <Td align="right" muted className="num">{Math.round(r.commission_rate * 100)} %</Td>
                  <Td align="right" className="num whitespace-nowrap font-bold text-amber-300">{formatMad(r.commission)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoNote icon={Percent} tone="amber">
          Votre commission est un pourcentage du montant réellement dépensé par le client — 10 % par défaut, le taux peut
          varier selon l&apos;établissement. Elle est calculée automatiquement dès que le montant est renseigné par
          l&apos;établissement ou remonté par sa caisse.
        </InfoNote>
        <InfoNote icon={HelpCircle}>
          Les commissions d&apos;un mois clôturé sont versées le mois suivant. Le relevé CSV reprend chaque ligne avec son
          taux : c&apos;est votre justificatif comptable.
        </InfoNote>
      </div>
    </>
  );
}
