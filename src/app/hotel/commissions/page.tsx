"use client";

import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  TrendingUp,
  Wallet,
  Clock,
  Search,
  Check,
  QrCode,
} from "lucide-react";

type HotelCommission = {
  id: string;
  venue: string;
  guest: string;
  qrLabel: string;
  date: string;
  montant: string;
  status: "versé" | "en attente";
};

export default function HotelCommissionsPage() {
  const { isLoading } = useAuthUser();
  const [filter, setFilter] = useState("tous");
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();

  if (isLoading) return <TableSkeleton />;

  /* Les commissions découlent des réservations réelles ; zéro par défaut. */
  const commissions: HotelCommission[] = [];
  const searchLower = search.toLowerCase();
  const filtered = commissions.filter((c) => {
    const matchesFilter = filter === "tous" || c.status === filter;
    const matchesSearch =
      !search ||
      c.venue.toLowerCase().includes(searchLower) ||
      c.guest.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const totalMonth = 0;
  const pending = 0;
  const paid = 0;

  const handleExport = () => {
    const today = new Date().toISOString().split("T")[0];
    const headers = ["Établissement", "Client", "QR scanné", "Date", "Montant", "Statut"];
    const csv = [
      headers.join(","),
      ...commissions.map((c) =>
        [c.venue, c.guest, c.qrLabel, c.date, c.montant, c.status]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-hotel-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV téléchargé");
  };

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-[family-name:var(--font-manrope)]">
            Commissions
          </h1>
          <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-0.5">
            Vos gains sur les réservations issues de vos QR codes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={16}
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/[0.05] rounded-full text-sm text-white font-[family-name:var(--font-inter)] placeholder:text-white/30 focus:ring-1 focus:ring-white/30 focus:outline-none w-48"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white/[0.07] border border-white/10 text-white/60 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white/[0.1] transition-colors font-[family-name:var(--font-inter)]"
          >
            <Download size={16} strokeWidth={1.5} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="px-4 sm:px-6 pb-6 grid grid-cols-3 gap-3">
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Wallet size={16} strokeWidth={1.5} className="text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              Total ce mois
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {totalMonth.toLocaleString()} MAD
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={16} strokeWidth={1.5} className="text-amber-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              En attente
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {pending.toLocaleString()} MAD
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp size={16} strokeWidth={1.5} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              Versé
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {paid.toLocaleString()} MAD
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
        {["tous", "versé", "en attente"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-colors font-[family-name:var(--font-inter)] ${
              filter === f
                ? "bg-white/20 text-white border border-white/20"
                : "bg-white/[0.05] text-white/50 border border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table / empty state */}
      <div className="px-4 sm:px-6 pb-8">
        {filtered.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
              Aucune commission pour le moment
            </h2>
            <p className="text-sm text-white/50 font-[family-name:var(--font-inter)] max-w-md mx-auto">
              Chaque réservation confirmée après un scan de vos QR codes vous
              rapporte une commission. Elles apparaîtront ici avec leur statut
              de versement.
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Établissement", "Client", "QR scanné", "Date", "Montant", "Statut"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)]"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-4 py-3 text-sm text-white font-[family-name:var(--font-manrope)]">
                      {c.venue}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {c.guest}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {c.qrLabel}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {c.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-[family-name:var(--font-manrope)]">
                      {c.montant}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-inter)] ${
                          c.status === "versé"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/15 text-white px-4 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
