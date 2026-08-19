"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useHotelReservations,
  type HotelReservation,
} from "@/hooks/use-hotel-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { StatStripThree } from "@/components/shared/stat-strip";
import { Coins, HelpCircle, Download, Percent } from "lucide-react";

/* Une ligne de commission = une réservation dont le montant dépensé est
   renseigné. Avant cela, la sortie n'a pas encore eu lieu (ou le montant
   n'est pas remonté) : elle compte comme « en attente de montant ». */
const hasCommission = (r: HotelReservation) =>
  r.amount_spent !== null && r.status !== "annulée";

const sameMonth = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
};

function exportCsv(rows: HotelReservation[]) {
  const header = [
    "Date sortie",
    "Client",
    "Sortie",
    "Catégorie",
    "Chambre",
    "Montant dépensé (MAD)",
    "Taux",
    "Commission (MAD)",
  ];
  const lines = rows.map((r) =>
    [
      r.reservation_date,
      r.guest_name,
      r.venue_name,
      r.category,
      r.qr_label ?? "",
      r.amount_spent ?? "",
      `${Math.round(r.commission_rate * 100)}%`,
      r.commission,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `commissions-hotel-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HotelCommissionsPage() {
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useHotelReservations();

  if (isLoading || loadingData || reservations === null)
    return <TableSkeleton />;

  const rows = reservations.filter(hasCommission);
  const total = rows.reduce((sum, r) => sum + r.commission, 0);
  const totalMonth = rows
    .filter((r) => sameMonth(r.created_at))
    .reduce((sum, r) => sum + r.commission, 0);
  const awaitingAmount = reservations.filter(
    (r) => r.amount_spent === null && r.status !== "annulée"
  ).length;

  const stats = [
    { label: "Commissions cumulées", value: `${total.toLocaleString()} MAD` },
    { label: "Ce mois-ci", value: `${totalMonth.toLocaleString()} MAD` },
    { label: "En attente de montant", value: awaitingAmount },
  ];

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-white">
            Commissions
          </h1>
          <p className="font-ui text-sm text-white/60 mt-1.5">
            Vos gains sur chaque sortie réservée via vos QR codes
          </p>
        </div>
        {rows.length > 0 && (
          <button
            onClick={() => exportCsv(rows)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors font-ui"
          >
            <Download size={16} strokeWidth={1.5} />
            Exporter en CSV
          </button>
        )}
      </div>

      {/* Bandeau KPI */}
      <div className="px-4 sm:px-6 pb-6">
        <StatStripThree stats={stats} />
      </div>

      {/* Règle de calcul, énoncée plutôt que devinée */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-500/[0.07] p-4">
          <Percent size={16} strokeWidth={1.5} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-white/60 font-ui max-w-2xl">
            Votre commission est un pourcentage du montant réellement dépensé
            par le client — 10&nbsp;% par défaut, le taux peut varier selon
            l&apos;établissement. Elle est calculée automatiquement dès que le
            montant de la sortie est renseigné par twocards, après la sortie.
          </p>
        </div>
      </div>

      {/* Table / empty state */}
      <div className="px-4 sm:px-6 pb-8">
        {rows.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mx-auto mb-5">
              <Coins size={26} strokeWidth={1.5} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-ui mb-2">
              Aucune commission pour le moment
            </h2>
            <p className="text-sm text-white/50 font-ui max-w-md mx-auto">
              {awaitingAmount > 0
                ? `${awaitingAmount} réservation${awaitingAmount > 1 ? "s" : ""} en attente de montant — vos commissions apparaîtront ici dès que les montants des sorties seront renseignés.`
                : "Chaque sortie réservée via vos QR codes vous rapporte un pourcentage du montant dépensé. Tout apparaîtra ici, exportable en CSV."}
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Date", "Client", "Sortie", "Chambre", "Montant", "Taux", "Commission"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 font-ui"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-4 py-3 text-sm text-white/70 font-ui whitespace-nowrap">
                      {new Date(r.reservation_date + "T00:00:00").toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-ui">
                      {r.guest_name}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white/80 font-ui">
                        {r.venue_name}
                      </p>
                      <p className="text-xs text-white/40 font-ui">
                        {r.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-ui">
                      {r.qr_label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-ui whitespace-nowrap">
                      {(r.amount_spent ?? 0).toLocaleString()} MAD
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-ui">
                      {Math.round(r.commission_rate * 100)}%
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-amber-400 font-ui whitespace-nowrap">
                      {r.commission.toLocaleString()} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note versements */}
      <div className="px-4 sm:px-6 pb-8 -mt-4">
        <p className="flex items-start gap-2 text-xs text-white/40 font-ui max-w-2xl">
          <HelpCircle size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          Les commissions sont versées mensuellement. Pour toute question sur un
          montant, contactez votre référent twocards.
        </p>
      </div>
    </div>
  );
}
