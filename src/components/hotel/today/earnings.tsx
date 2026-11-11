"use client";

import Link from "next/link";
import { Printer, QrCode, Trophy } from "lucide-react";
import { Card, EmptyState, LinkButton } from "@/components/app/ui";
import { RankedBars } from "@/components/hotel/charts";
import { commissionRule } from "@/components/hotel/states";
import type { QrPerformance } from "@/lib/hotel/analytics";
import { formatMad, formatNumber, plural } from "@/lib/hotel/format";
import type { TodaySummary } from "@/lib/hotel/today";
import { useLocale, useT } from "@/lib/i18n/client";

/* Quel QR rapporte le plus : le premier en grand, les suivants classés.
   Tant qu'aucune commission n'est acquise, le classement se lit en
   réservations (et le dit). */
export function TopQrCard({
  top,
  byCommission,
  hasQr,
}: {
  top: QrPerformance[];
  byCommission: boolean;
  hasQr: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const first = top[0];
  const metric = (q: QrPerformance) => (byCommission ? q.commission : q.liveReservations);
  const format = (n: number) =>
    byCommission
      ? formatMad(n, false, locale)
      : `${formatNumber(n, locale)} ${t(plural(n, "réservation"), plural(n, "reservation", undefined, "en"))}`;

  return (
    <Card
      title={t("Le QR qui rapporte le plus", "Your top-earning QR")}
      description={
        first
          ? byCommission
            ? t("Commissions acquises, depuis la création", "Commissions earned since creation")
            : t(
                "Aucune commission acquise pour l'instant : classement par réservations",
                "No commission earned yet: ranked by reservations"
              )
          : undefined
      }
      actions={
        first && (
          <LinkButton
            href={`/hotel/chambres?tri=${byCommission ? "commission" : "resas"}`}
            size="sm"
            variant="ghost"
          >
            {t("Classement", "Ranking")}
          </LinkButton>
        )
      }
      padded={Boolean(first)}
    >
      {!first ? (
        <EmptyState
          compact
          icon={QrCode}
          title={t("Pas encore de réservation par QR", "No QR reservations yet")}
          description={t(
            "Dès qu'un scan devient une réservation, le classement de vos emplacements apparaît ici.",
            "As soon as a scan becomes a reservation, your locations are ranked here."
          )}
          action={
            hasQr ? (
              <LinkButton href="/hotel/chambres/imprimer" icon={Printer}>
                {t("Imprimer les cartes", "Print the cards")}
              </LinkButton>
            ) : (
              <LinkButton href="/hotel/chambres?nouveau=1" icon={QrCode} variant="primary">
                {t("Créer un QR code", "Create a QR code")}
              </LinkButton>
            )
          }
        />
      ) : (
        <>
          <Link
            href={`/hotel/chambres/${first.id}`}
            className="flex items-center gap-3 rounded-xl border border-line bg-fill px-4 py-3 transition-colors hover:border-line-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ok-soft">
              <Trophy size={18} strokeWidth={1.75} className="text-ok" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{first.label}</span>
              <span className="num block truncate text-xs text-ink-3">
                {formatNumber(first.liveReservations, locale)}{" "}
                {t(
                  plural(first.liveReservations, "réservation"),
                  plural(first.liveReservations, "reservation", undefined, "en")
                )}{" "}
                · {formatNumber(first.scans, locale)} {t(plural(first.scans, "scan"), plural(first.scans, "scan", undefined, "en"))}
              </span>
            </span>
            {byCommission && (
              <span className="num font-display shrink-0 text-xl text-ink">
                {formatMad(first.commission, false, locale)}
              </span>
            )}
          </Link>
          {top.length > 1 && (
            <div className="mt-4">
              <RankedBars
                items={top.map((q) => ({ id: q.id, label: q.label, value: metric(q) }))}
                format={format}
                color="bg-ok"
                href={(id) => `/hotel/chambres/${id}`}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/* Le mois en cours, en trois lignes, et la règle de calcul avec le taux lu
   dans les réservations. */
export function MonthCard({ summary }: { summary: TodaySummary }) {
  const t = useT();
  const locale = useLocale();
  const rows = [
    {
      label: t("Commissions acquises", "Commissions earned"),
      value: formatMad(summary.commissionMonth, false, locale),
    },
    {
      label: t("Sorties avec montant saisi", "Outings with an amount entered"),
      value: formatNumber(summary.paidOutingsMonth, locale),
    },
    {
      label: t("Mois précédent", "Previous month"),
      value: formatMad(summary.commissionPrev, false, locale),
    },
  ];
  return (
    <Card
      title={t("Ce mois-ci", "This month")}
      actions={
        <LinkButton href="/hotel/commissions" size="sm" variant="ghost">
          {t("Relevé", "Statement")}
        </LinkButton>
      }
    >
      <dl className="divide-y divide-line rounded-xl border border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-[13px] text-ink-2">{r.label}</dt>
            <dd className="num text-sm font-bold text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      {summary.awaitingAmount > 0 && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
          {t(
            `${summary.awaitingAmount} ${plural(summary.awaitingAmount, "sortie passée attend", "sorties passées attendent")} encore le montant saisi par l'établissement.`,
            `${summary.awaitingAmount} past ${plural(summary.awaitingAmount, "outing is", "outings are", "en")} still waiting for the venue to enter the amount.`
          )}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        {t("Votre commission : ", "Your commission: ")}
        {commissionRule(summary.rates, locale)}.
      </p>
    </Card>
  );
}
