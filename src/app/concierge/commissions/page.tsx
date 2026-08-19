"use client";

import { useState } from "react";
import { Download, TrendingUp, Wallet, Clock, Percent, Check, Search } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";

const DEMO_COMMISSIONS = [
  { id: 1, venue: "Le Comptoir Darna", client: "Mehdi Alaoui", event: "OPENING NIGHT", date: "6 Avr.", montant: "6 400 MAD", status: "versé" },
  { id: 2, venue: "Sky Bar Casa", client: "Sarah Cohen", event: "SUNSET SESSION", date: "5 Avr.", montant: "2 800 MAD", status: "versé" },
  { id: 3, venue: "Le Lotus Club", client: "Omar Tazi", event: "LOTUS NIGHTS", date: "4 Avr.", montant: "9 600 MAD", status: "en attente" },
  { id: 4, venue: "Le Comptoir Darna", client: "Lina Berrada", event: "LATIN VIBES", date: "3 Avr.", montant: "4 200 MAD", status: "versé" },
  { id: 5, venue: "Pacha Marrakech", client: "Youssef Fassi", event: "HOUSE AFFAIR", date: "2 Avr.", montant: "7 800 MAD", status: "en attente" },
  { id: 6, venue: "Sky Bar Casa", client: "Amira Benjelloun", event: "DEEP & CHILL", date: "1 Avr.", montant: "3 200 MAD", status: "versé" },
  { id: 7, venue: "Le Comptoir Darna", client: "Karim Tazi", event: "R&B CLASSICS", date: "31 Mar.", montant: "5 400 MAD", status: "versé" },
  { id: 8, venue: "Le Lotus Club", client: "Nadia Chraibi", event: "AFRO HOUSE", date: "30 Mar.", montant: "9 200 MAD", status: "en attente" },
];

export default function ConciergeCommissionsPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const [filter, setFilter] = useState("tous");
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();

  if (isLoading) return <TableSkeleton />;

  const commissions = isDemoConcierge ? DEMO_COMMISSIONS : [];
  const searchLower = search.toLowerCase();
  const filtered = commissions.filter((c) => {
    const matchesFilter = filter === "tous" || c.status === filter;
    const matchesSearch =
      !search ||
      c.venue.toLowerCase().includes(searchLower) ||
      c.client.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const totalMonth = isDemoConcierge ? 48600 : 0;
  const pending = isDemoConcierge ? 18800 : 0;
  const paid = isDemoConcierge ? 29800 : 0;

  const handleExport = () => {
    const today = new Date().toISOString().split("T")[0];
    const headers = ["Établissement", "Événement", "Client", "Date", "Montant", "Statut"];
    const csv = [
      headers.join(","),
      ...commissions.map((c) =>
        [c.venue, c.event, c.client, c.date, c.montant, c.status].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-concierge-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV téléchargé");
  };

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Commissions
          </h1>
          <p className="text-sm text-white/60 font-ui mt-0.5">
            Suivez vos gains et versements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60/40" size={16} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/[0.05] rounded-full text-sm text-white font-ui focus:ring-1 focus:ring-white/30/30 focus:outline-none w-48"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white/[0.07] border border-white/10/20 text-white/60 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors font-ui"
          >
            <Download size={16} strokeWidth={1.5} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="px-4 sm:px-6 pb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/[0.07] rounded-xl border border-white/10/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/15/10 flex items-center justify-center">
              <Wallet size={16} strokeWidth={1.5} className="text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
              Total ce mois
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-ui">
            {totalMonth.toLocaleString()} MAD
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={16} strokeWidth={1.5} className="text-amber-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
              En attente
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-ui">
            {pending.toLocaleString()} MAD
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp size={16} strokeWidth={1.5} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
              Versé
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-ui">
            {paid.toLocaleString()} MAD
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Percent size={16} strokeWidth={1.5} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
              Taux moyen
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-ui">
            10%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 pb-4 flex items-center gap-2">
        {[
          { key: "tous", label: "Tous" },
          { key: "versé", label: "Versé" },
          { key: "en attente", label: "En attente" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors font-ui ${
              filter === f.key
                ? "bg-white/15 text-white"
                : "bg-white/[0.07] border border-white/10/20 text-white/60 hover:bg-white/[0.05]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 pb-8">
        <div className="bg-white/[0.07] rounded-xl border border-white/10/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10/10">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Établissement
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Événement
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Montant
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-white/10/5 hover:bg-white/[0.05]/50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-transparent/30"
                    }`}
                  >
                    <td className="px-4 py-3.5 text-white font-medium font-ui">
                      {c.venue}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold text-white/60/80 font-ui">
                        {c.event}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white font-ui">
                      {c.client}
                    </td>
                    <td className="px-4 py-3.5 text-white/60 font-ui">
                      {c.date}
                    </td>
                    <td className="px-4 py-3.5 text-right text-white font-bold font-ui">
                      {c.montant}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                          c.status === "versé"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center mb-4">
                          <Wallet size={24} strokeWidth={1.5} className="text-white/60/40" />
                        </div>
                        <p className="text-sm font-medium text-white/60 font-ui">
                          Aucune commission pour le moment
                        </p>
                        <p className="text-xs text-white/60/60 font-ui mt-1">
                          Vos commissions apparaîtront ici
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white/15-dark text-white px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
