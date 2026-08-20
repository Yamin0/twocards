"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { StatStrip } from "@/components/shared/stat-strip";
import { Coins, Download, Globe, Percent } from "lucide-react";

/* Commissions du Venue Manager — ce que l'établissement reverse au réseau
   d'apporteurs. Une ligne = une sortie apportée par le réseau (canal QR)
   dont le montant est connu : la commission est dérivée en base, la page
   ne fait qu'agréger. Le canal direct (portail) est à 0 % par
   construction — il apparaît dans les compteurs, jamais dans les lignes. */

const isDue = (r: VenueQrReservation) =>
  r.source === "qr" && r.amount_spent !== null && r.status !== "annulée";

const sameMonth = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
};

function exportCsv(rows: VenueQrReservation[]) {
  const header = [
    "Date sortie",
    "Client",
    "Montant dépensé (MAD)",
    "Taux",
    "Commission reversée (MAD)",
    "Origine du montant",
  ];
  const lines = rows.map((r) =>
    [
      r.reservation_date,
      r.guest_name,
      r.amount_spent ?? "",
      `${Math.round(r.commission_rate * 100)}%`,
      r.commission,
      r.amount_source === "pos" ? "caisse" : "saisie manuelle",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VenueCommissionsPage() {
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();

  if (isLoading || loadingData || reservations === null)
    return <TableSkeleton />;

  const rows = reservations
    .filter(isDue)
    .sort((a, b) => (a.reservation_date < b.reservation_date ? 1 : -1));
  const total = rows.reduce((sum, r) => sum + r.commission, 0);
  const totalMonth = rows
    .filter((r) => sameMonth(r.created_at))
    .reduce((sum, r) => sum + r.commission, 0);
  const awaiting = reservations.filter(
    (r) =>
      r.source === "qr" && r.amount_spent === null && r.status !== "annulée"
  ).length;
  const directCount = reservations.filter(
    (r) => r.source === "portal" && r.status !== "annulée"
  ).length;

  const stats = [
    { label: "Commissions reversées", value: `${total.toLocaleString()} MAD` },
    { label: "Ce mois-ci", value: `${totalMonth.toLocaleString()} MAD` },
    {
      label: "En attente de montant",
      value: awaiting,
      hint: awaiting > 0 ? "saisissez l'addition pour solder" : undefined,
    },
    {
      label: "Canal direct",
      value: "0 MAD",
      hint: `${directCount} sortie${directCount > 1 ? "s" : ""} sans commission`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-white">
            Commissions
          </h1>
          <p className="font-ui text-sm text-white/60 mt-1.5">
            Ce que vous reversez au réseau d&apos;apporteurs — mis à jour en
            temps réel
          </p>
        </div>
        {rows.length > 0 && (
          <button
            onClick={() => exportCsv(rows)}
            className="font-ui flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Download size={16} strokeWidth={1.5} />
            Exporter en CSV
          </button>
        )}
      </div>

      {/* KPI */}
      <StatStrip stats={stats} />

      {/* Règle énoncée */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-500/[0.07] backdrop-blur-xl p-4">
        <Percent
          size={16}
          strokeWidth={1.5}
          className="text-amber-400 shrink-0 mt-0.5"
        />
        <p className="font-ui text-xs leading-relaxed text-white/60 max-w-2xl">
          Vous reversez un pourcentage du montant réellement dépensé — 10 % par
          défaut — uniquement sur les clients apportés par le réseau twocards
          (hôtels, concierges). La commission se calcule automatiquement dès
          que l&apos;addition est saisie ou remontée par votre caisse. Les
          réservations de votre portail direct ne sont jamais commissionnées.
        </p>
      </div>

      {/* Table / vide */}
      {rows.length === 0 ? (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mx-auto mb-5">
            <Coins size={26} strokeWidth={1.5} className="text-amber-400" />
          </div>
          <h2 className="font-display text-xl font-normal text-white mb-2">
            Aucune commission pour le moment
          </h2>
          <p className="font-ui text-sm text-white/50 max-w-md mx-auto">
            {awaiting > 0
              ? `${awaiting} sortie${awaiting > 1 ? "s" : ""} du réseau en attente de montant — saisissez l'addition (ou connectez votre caisse) et les commissions apparaîtront ici.`
              : "Dès qu'un client apporté par le réseau sort chez vous et que son addition est connue, la commission reversée s'affiche ici, exportable en CSV."}
          </p>
        </div>
      ) : (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  "Date",
                  "Client",
                  "Montant dépensé",
                  "Origine",
                  "Taux",
                  "Commission reversée",
                ].map((h) => (
                  <th
                    key={h}
                    className="font-ui px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/[0.06] last:border-0"
                >
                  <td className="font-ui px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                    {new Date(
                      r.reservation_date + "T00:00:00"
                    ).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white">
                    {r.guest_name}
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                    {(r.amount_spent ?? 0).toLocaleString()} MAD
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-ui rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        r.amount_source === "pos"
                          ? "bg-blue-500/15 text-blue-300"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {r.amount_source === "pos" ? "caisse" : "manuel"}
                    </span>
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white/70">
                    {Math.round(r.commission_rate * 100)}%
                  </td>
                  <td className="font-display px-4 py-3 text-sm text-amber-400 tabular-nums whitespace-nowrap">
                    {r.commission.toLocaleString()} MAD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Note canal direct */}
      <p className="font-ui flex items-start gap-2 text-xs text-white/40 max-w-2xl">
        <Globe size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
        Les versements sont consolidés mensuellement par twocards. Le détail
        par réservation ci-dessus fait foi — même calcul, même base, que ce
        que voient vos apporteurs.
      </p>
    </div>
  );
}
