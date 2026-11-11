"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Coins, Download, HelpCircle, Hourglass, Percent, TrendingUp, Wallet } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace, type HotelReservation } from "@/lib/hotel/store";
import { CATEGORIES, CATEGORY_COLORS, hasCommission, isLive, monthlySeries, reservationCategoryLabel, sumBy, topN } from "@/lib/hotel/analytics";
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
import type { Locale, Translate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

type Scope = "mois" | "precedent" | "tout";

function exportCsv(rows: HotelReservation[], suffix: string, t: Translate, locale: Locale) {
  const header = [
    t("Date sortie", "Outing date"),
    t("Client", "Guest"),
    t("Sortie", "Outing"),
    t("Catégorie", "Category"),
    t("Chambre", "Room"),
    t("Montant dépensé (MAD)", "Amount spent (MAD)"),
    t("Taux", "Rate"),
    t("Commission (MAD)", "Commission (MAD)"),
    t("Source du montant", "Amount source"),
  ];
  const lines = rows.map((r) =>
    [r.reservation_date, r.guest_name, r.venue_name, reservationCategoryLabel(r.category, locale), r.qr_label ?? "", r.amount_spent ?? "", `${Math.round(r.commission_rate * 100)}%`, r.commission, r.amount_source]
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
  const t = useT();
  const locale = useLocale();

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

  const series = monthlySeries(earning, 6, (r) => r.commission, undefined, locale);
  const byCategory = CATEGORIES.map((label) => ({
    label: reservationCategoryLabel(label, locale),
    value: earning.filter((r) => r.category === label).reduce((s, r) => s + r.commission, 0),
    color: CATEGORY_COLORS[label],
  }));
  const byRoom = topN(sumBy(earning, (r) => r.qr_label ?? t("QR supprimé", "Deleted QR"), (r) => r.commission), 5);
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
        eyebrow={t("Commissions", "Commissions")}
        title={t("Vos gains", "Your earnings")}
        description={t(
          "Chaque sortie réservée depuis un de vos QR codes vous rapporte un pourcentage du montant réellement dépensé par le client. Ici, tout est tracé : par mois, par emplacement, par adresse.",
          "Every outing booked from one of your QR codes earns you a percentage of what the guest actually spends. Everything is tracked here: by month, by location, by place."
        )}
        actions={
          <Button icon={Download} onClick={() => exportCsv(detail, suffix, t, locale)} disabled={detail.length === 0}>
            {t("Exporter le relevé", "Export statement")}
          </Button>
        }
      />

      <KpiGrid
        items={[
          {
            label: t("Ce mois-ci", "This month"),
            value: formatMad(thisMonth, true, locale),
            delta: prevMonth > 0 ? (thisMonth - prevMonth) / prevMonth : null,
            deltaLabel: t("premier mois", "first month"),
            hint: t(`vs ${formatMad(prevMonth, true)} le mois dernier`, `vs ${formatMad(prevMonth, true, "en")} last month`),
            icon: Wallet,
            tone: "amber",
          },
          { label: t("Cumulées", "All-time"), value: formatMad(total, true, locale), hint: t(`${earning.length} ${plural(earning.length, "sortie commissionnée", "sorties commissionnées")}`, `${earning.length} ${plural(earning.length, "commissioned outing", undefined, "en")}`), icon: Coins, tone: "emerald" },
          { label: t("Commission moyenne", "Average commission"), value: formatMad(avgCommission, false, locale), hint: t(`sur un panier moyen de ${formatMad(avgTicket)}`, `on an average spend of ${formatMad(avgTicket, false, "en")}`), icon: TrendingUp, tone: "sky" },
          { label: t("En attente de montant", "Awaiting amount"), value: formatNumber(awaiting.length, locale), hint: t(`${upcoming.length} ${plural(upcoming.length, "sortie")} à venir`, `${upcoming.length} upcoming ${plural(upcoming.length, "outing", undefined, "en")}`), icon: Hourglass, tone: "violet" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("Commissions par mois", "Commissions per month")} description={t("6 derniers mois, sorties commissionnées", "Last 6 months, commissioned outings")} className="xl:col-span-2">
          <Bars data={series} color="bg-warn" height={160} format={(n) => formatMad(n, true, locale)} />
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-bold text-ink-3">{t("Par catégorie", "By category")}</p>
            <SplitBar segments={byCategory} format={(n) => formatMad(n, false, locale)} />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title={t("Emplacements les plus rentables", "Top-earning locations")}>
            <RankedBars items={byRoom} format={(n) => formatMad(n, true, locale)} color="bg-warn-soft" empty={t("Aucune commission pour le moment.", "No commissions yet.")} />
          </Panel>
          <Panel title={t("Adresses les plus rentables", "Top-earning places")}>
            <RankedBars items={byVenue} format={(n) => formatMad(n, true, locale)} color="bg-ok-soft" empty={t("Aucune commission pour le moment.", "No commissions yet.")} />
          </Panel>
        </div>
      </div>

      {statement.length > 0 && (
        <Panel
          title={t("Relevé mensuel", "Monthly statement")}
          description={t(
            "Un mois clôturé est versé le mois suivant. Pour toute question sur un montant, contactez votre référent twocards.",
            "A closed month is paid out the following month. For any question about an amount, contact your twocards representative."
          )}
          padded={false}
        >
          <Table>
            <thead>
              <tr>
                <Th>{t("Mois", "Month")}</Th>
                <Th>{t("Statut", "Status")}</Th>
                <Th align="right">{t("Sorties", "Outings")}</Th>
                <Th align="right">{t("Montant dépensé", "Amount spent")}</Th>
                <Th align="right">{t("Commissions", "Commissions")}</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {statement.map((m) => (
                <Tr key={m.key}>
                  <Td className="font-bold capitalize">{monthLabel(m.key, true, locale)}</Td>
                  <Td>
                    <Tag className={m.current ? "bg-info-soft text-info" : "bg-ok-soft text-ok"}>
                      {m.current ? t("En cours", "In progress") : t("Clôturé", "Closed")}
                    </Tag>
                  </Td>
                  <Td align="right" className="num" muted>{formatNumber(m.rows, locale)}</Td>
                  <Td align="right" className="num" muted>{formatMad(m.spent, false, locale)}</Td>
                  <Td align="right" className="num font-bold text-warn">{formatMad(m.commission, false, locale)}</Td>
                  <Td align="right">
                    <button
                      type="button"
                      onClick={() => exportCsv(earning.filter((r) => monthKey(r.reservation_date) === m.key), m.key, t, locale)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-info hover:text-info"
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
        title={t("Détail des commissions", "Commission details")}
        description={t(
          `${detail.length} ${plural(detail.length, "ligne")} · ${formatMad(detailTotal)}`,
          `${detail.length} ${plural(detail.length, "line", undefined, "en")} · ${formatMad(detailTotal, false, "en")}`
        )}
        actions={
          <>
            <Segmented<Scope>
              size="sm"
              value={scope}
              onChange={setScope}
              options={[
                { value: "mois", label: t("Ce mois", "This month") },
                { value: "precedent", label: t("Mois dernier", "Last month") },
                { value: "tout", label: t("Par mois", "By month") },
              ]}
            />
            {scope === "tout" && (
              <Select
                label={t("Mois", "Month")}
                value={month}
                onChange={setMonth}
                className="w-44"
                options={[{ value: "tous", label: t("Tous les mois", "All months") }, ...months.map((k) => ({ value: k, label: monthLabel(k, true, locale) }))]}
              />
            )}
          </>
        }
        padded={false}
      >
        {detail.length === 0 ? (
          <EmptyState
            icon={Coins}
            title={t("Aucune commission sur cette période", "No commissions for this period")}
            description={
              awaiting.length > 0
                ? t(
                    `${awaiting.length} ${plural(awaiting.length, "sortie passée", "sorties passées")} ${plural(awaiting.length, "attend", "attendent")} encore un montant, les commissions apparaîtront dès que l'établissement l'aura renseigné.`,
                    `${awaiting.length} past ${plural(awaiting.length, "outing", undefined, "en")} ${awaiting.length === 1 ? "is" : "are"} still awaiting an amount; commissions will appear as soon as the venue enters it.`
                  )
                : t(
                    "Chaque sortie réservée via vos QR codes vous rapporte un pourcentage du montant dépensé. Tout apparaîtra ici, exportable en CSV.",
                    "Every outing booked through your QR codes earns you a percentage of the amount spent. It will all appear here, exportable to CSV."
                  )
            }
            compact
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("Date", "Date")}</Th>
                <Th>{t("Client", "Guest")}</Th>
                <Th>{t("Sortie", "Outing")}</Th>
                <Th>{t("Emplacement", "Location")}</Th>
                <Th align="right">{t("Montant", "Amount")}</Th>
                <Th align="right">{t("Taux", "Rate")}</Th>
                <Th align="right">{t("Commission", "Commission")}</Th>
              </tr>
            </thead>
            <tbody>
              {detail.map((r) => (
                <Tr key={r.id}>
                  <Td muted className="num whitespace-nowrap">{formatDate(r.reservation_date, "medium", locale)}</Td>
                  <Td>
                    <Link href={`/hotel/reservations?id=${r.id}`} className="font-bold hover:underline">{r.guest_name}</Link>
                  </Td>
                  <Td>
                    <p className="font-medium">{r.venue_name}</p>
                    <p className="text-xs text-ink-3">{reservationCategoryLabel(r.category, locale)}</p>
                  </Td>
                  <Td muted>{r.qr_label ?? "—"}</Td>
                  <Td align="right" muted className="num whitespace-nowrap">
                    {formatMad(r.amount_spent ?? 0, false, locale)}
                    {r.amount_source === "pos" && <span className="ml-1 text-xs text-ink-3" title={t("Montant remonté par la caisse", "Amount reported by the till")}>POS</span>}
                  </Td>
                  <Td align="right" muted className="num">{Math.round(r.commission_rate * 100)}{t(" %", "%")}</Td>
                  <Td align="right" className="num whitespace-nowrap font-bold text-warn">{formatMad(r.commission, false, locale)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoNote icon={Percent} tone="amber">
          {t(
            <>
              Votre commission est un pourcentage du montant réellement dépensé par le client : 10 % par défaut, le taux peut
              varier selon l&apos;établissement. Elle est calculée automatiquement dès que le montant est renseigné par
              l&apos;établissement ou remonté par sa caisse.
            </>,
            <>
              Your commission is a percentage of what the guest actually spends: 10% by default, and the rate may vary by
              venue. It&apos;s calculated automatically as soon as the venue enters the amount or its till reports it.
            </>
          )}
        </InfoNote>
        <InfoNote icon={HelpCircle}>
          {t(
            <>
              Les commissions d&apos;un mois clôturé sont versées le mois suivant. Le relevé CSV reprend chaque ligne avec son
              taux : c&apos;est votre justificatif comptable.
            </>,
            <>
              Commissions for a closed month are paid out the following month. The CSV statement lists every line with its
              rate: it&apos;s your accounting record.
            </>
          )}
        </InfoNote>
      </div>
    </>
  );
}
