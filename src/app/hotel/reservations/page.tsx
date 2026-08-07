"use client";

import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import {
  CalendarDays,
  Users,
  Clock,
  CheckCircle2,
  Search,
  QrCode,
} from "lucide-react";

type HotelReservation = {
  id: string;
  guest: string;
  venue: string;
  qrLabel: string;
  date: string;
  partySize: number;
  status: "confirmée" | "en attente" | "annulée";
};

const FILTERS = ["toutes", "confirmée", "en attente", "annulée"] as const;

export default function HotelReservationsPage() {
  const { isLoading } = useAuthUser();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("toutes");
  const [search, setSearch] = useState("");

  if (isLoading) return <TableSkeleton />;

  /* Les réservations arriveront des scans réels ; aucune donnée décorative. */
  const reservations: HotelReservation[] = [];
  const searchLower = search.toLowerCase();
  const filtered = reservations.filter((r) => {
    const matchesFilter = filter === "toutes" || r.status === filter;
    const matchesSearch =
      !search ||
      r.guest.toLowerCase().includes(searchLower) ||
      r.venue.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const confirmed = reservations.filter((r) => r.status === "confirmée").length;
  const pending = reservations.filter((r) => r.status === "en attente").length;

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-[family-name:var(--font-manrope)]">
            Réservations
          </h1>
          <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-0.5">
            Sorties réservées par vos clients après un scan
          </p>
        </div>
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
      </div>

      {/* Stats cards */}
      <div className="px-4 sm:px-6 pb-6 grid grid-cols-3 gap-3">
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <CalendarDays size={16} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              Total
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {reservations.length}
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={16} strokeWidth={1.5} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              Confirmées
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {confirmed}
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
            {pending}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
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
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
              Aucune réservation pour le moment
            </h2>
            <p className="text-sm text-white/50 font-[family-name:var(--font-inter)] max-w-md mx-auto">
              Dès qu&apos;un client scanne l&apos;un de vos QR codes et réserve
              une table chez un partenaire, la réservation apparaît ici avec
              l&apos;emplacement du scan.
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Client", "Établissement", "QR scanné", "Date", "Pers.", "Statut"].map(
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
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-4 py-3 text-sm text-white font-[family-name:var(--font-manrope)]">
                      {r.guest}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {r.venue}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {r.qrLabel}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} strokeWidth={1.5} />
                        {r.partySize}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-inter)] ${
                          r.status === "confirmée"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : r.status === "en attente"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
