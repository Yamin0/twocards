"use client";

import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Ticket,
} from "lucide-react";

/* ── demo data ──────────────────────────────────────────── */

const DEMO_STATS = [
  { label: "Réservations totales", value: "148", change: "+12%", positive: true, icon: CalendarDays },
  { label: "En attente", value: "24", change: "+3", positive: false, icon: Clock },
  { label: "Couverts ce mois", value: "1 247", change: "+18%", positive: true, icon: Users },
  { label: "Taux de confirmation", value: "87%", change: "+5%", positive: true, icon: TrendingUp },
];

const DEMO_RESERVATIONS = [
  {
    guest: "Youssef Alaoui",
    rp: "Liam Hamza",
    conciergerie: "Jota Conciergerie",
    event: "Nuit Blanche",
    date: "28 Oct",
    time: "23:00",
    covers: 6,
    type: "Table VIP",
    status: "confirmed" as const,
  },
  {
    guest: "Asmae Boutaleb",
    rp: "Karim Bennani",
    conciergerie: "Atlas Concierge",
    event: "Gala de Minuit",
    date: "29 Oct",
    time: "22:00",
    covers: 4,
    type: "Guest List",
    status: "pending" as const,
  },
  {
    guest: "Khalid Bousfiha",
    rp: "Youssef El Idrissi",
    conciergerie: "Noctis VIP",
    event: "Nuit Blanche",
    date: "28 Oct",
    time: "23:00",
    covers: 8,
    type: "Table VIP",
    status: "confirmed" as const,
  },
  {
    guest: "Salma Chraibi",
    rp: "Sofia Alaoui",
    conciergerie: "Jota Conciergerie",
    event: "After Dark Sessions",
    date: "4 Nov",
    time: "00:00",
    covers: 2,
    type: "Guest List",
    status: "rejected" as const,
  },
  {
    guest: "Amine Tazi",
    rp: "Nadia Chraibi",
    conciergerie: "Atlas Concierge",
    event: "Soirée Tropicale",
    date: "3 Nov",
    time: "20:00",
    covers: 10,
    type: "Table VIP",
    status: "confirmed" as const,
  },
  {
    guest: "Fatima Zahra B.",
    rp: "Rachid Mouline",
    conciergerie: "Noctis VIP",
    event: "Gala de Minuit",
    date: "29 Oct",
    time: "22:00",
    covers: 4,
    type: "Guest List",
    status: "pending" as const,
  },
  {
    guest: "Mehdi Lahlou",
    rp: "Hind Fassi",
    conciergerie: "Prestige Access",
    event: "Nuit Blanche",
    date: "28 Oct",
    time: "23:00",
    covers: 6,
    type: "Table VIP",
    status: "confirmed" as const,
  },
  {
    guest: "Nora Kadiri",
    rp: "Amine Tazi",
    conciergerie: "Prestige Access",
    event: "Soirée Tropicale",
    date: "3 Nov",
    time: "20:00",
    covers: 3,
    type: "Guest List",
    status: "pending" as const,
  },
];

const DEMO_UPCOMING_EVENTS = [
  { name: "Nuit Blanche", date: "Ven 28 Oct", time: "23:00", reservations: 12, capacity: 300, fill: 78 },
  { name: "Gala de Minuit", date: "Sam 29 Oct", time: "22:00", reservations: 8, capacity: 200, fill: 62 },
  { name: "Soirée Tropicale", date: "Jeu 3 Nov", time: "20:00", reservations: 5, capacity: 150, fill: 45 },
  { name: "After Dark Sessions", date: "Ven 4 Nov", time: "00:00", reservations: 3, capacity: 120, fill: 23 },
];

const STATUS_CONFIG = {
  confirmed: { label: "Confirmée", bg: "bg-green-400/10", text: "text-green-400", dot: "bg-green-400" },
  pending: { label: "En attente", bg: "bg-amber-400/10", text: "text-amber-400", dot: "bg-amber-400" },
  rejected: { label: "Refusée", bg: "bg-red-400/10", text: "text-red-400", dot: "bg-red-400" },
};

/* ── filters ────────────────────────────────────────────── */

const FILTER_TABS = ["Toutes", "Confirmées", "En attente", "Refusées"] as const;

/* ── component ──────────────────────────────────────────── */

type ResStatus = "confirmed" | "pending" | "rejected";

export default function ReservationsPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_TABS)[number]>("Toutes");
  const [statuses, setStatuses] = useState<Record<number, ResStatus>>(
    Object.fromEntries(DEMO_RESERVATIONS.map((r, i) => [i, r.status]))
  );
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  if (isLoading) return <DashboardSkeleton />;

  const reservations = isDemoVenue ? DEMO_RESERVATIONS : [];
  const events = isDemoVenue ? DEMO_UPCOMING_EVENTS : [];
  const stats = isDemoVenue ? DEMO_STATS : [];

  const pendingRequests = isDemoVenue
    ? reservations
        .map((r, i) => ({ ...r, idx: i }))
        .filter((r) => statuses[r.idx] === "pending")
    : [];

  const filteredReservations = reservations
    .map((r, i) => ({ ...r, idx: i, currentStatus: statuses[i] ?? r.status }))
    .filter((r) => {
      const matchSearch = searchQuery
        ? r.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.rp.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.event.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchFilter =
        activeFilter === "Toutes"
          ? true
          : activeFilter === "Confirmées"
            ? r.currentStatus === "confirmed"
            : activeFilter === "En attente"
              ? r.currentStatus === "pending"
              : r.currentStatus === "rejected";
      return matchSearch && matchFilter;
    });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-manrope)]">
              Réservations
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Suivez toutes les réservations de votre réseau RP
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reservations/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={1.5} />
              <span className="hidden sm:inline">Nouvelle résa</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {isDemoVenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5 transition-all duration-500 hover:bg-white/[0.1]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon size={20} strokeWidth={1.5} className="text-blue-400" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      stat.positive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {stat.positive ? (
                      <ArrowUpRight size={12} strokeWidth={2} />
                    ) : (
                      <ArrowDownRight size={12} strokeWidth={2} />
                    )}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white font-[family-name:var(--font-manrope)]">
                  {stat.value}
                </p>
                <p className="text-white/40 text-xs mt-1 font-[family-name:var(--font-inter)]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Reservations table ── */}
        <div className="xl:col-span-2 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === tab
                      ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all w-44"
                />
              </div>
              <button className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
                <Download size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredReservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3 pl-1">
                      Invité
                    </th>
                    <th className="text-left text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                      RP / Conciergerie
                    </th>
                    <th className="text-left text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                      Événement
                    </th>
                    <th className="text-center text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                      Couverts
                    </th>
                    <th className="text-center text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                      Type
                    </th>
                    <th className="text-center text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3 pr-1">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((res) => {
                    const status = STATUS_CONFIG[res.currentStatus];
                    const isOpen = openDropdown === res.idx;
                    return (
                      <tr
                        key={res.idx}
                        className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3.5 pl-1">
                          <div>
                            <p className="text-sm font-medium text-white font-[family-name:var(--font-manrope)]">
                              {res.guest}
                            </p>
                            <p className="text-[0.6875rem] text-white/30 mt-0.5">
                              {res.date} · {res.time}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div>
                            <p className="text-sm text-white/80">{res.rp}</p>
                            <p className="text-[0.6875rem] text-white/30">{res.conciergerie}</p>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="text-sm text-white/70">{res.event}</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-sm font-semibold text-white">{res.covers}</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span
                            className={`text-[0.6875rem] font-medium px-2.5 py-1 rounded-full ${
                              res.type === "Table VIP"
                                ? "bg-purple-400/10 text-purple-400"
                                : "bg-blue-400/10 text-blue-400"
                            }`}
                          >
                            {res.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-center pr-1 relative">
                          <button
                            onClick={() => setOpenDropdown(isOpen ? null : res.idx)}
                            className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-medium px-2.5 py-1 rounded-full cursor-pointer transition-all hover:scale-105 ${status.bg} ${status.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </button>
                          {isOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setOpenDropdown(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1 shadow-xl min-w-[130px]">
                                {(
                                  [
                                    ["confirmed", "Confirmée"],
                                    ["pending", "En attente"],
                                    ["rejected", "Refusée"],
                                  ] as [ResStatus, string][]
                                ).map(([key, label]) => {
                                  const cfg = STATUS_CONFIG[key];
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => {
                                        setStatuses((prev) => ({ ...prev, [res.idx]: key }));
                                        setOpenDropdown(null);
                                      }}
                                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/10 ${
                                        res.currentStatus === key ? "bg-white/[0.06]" : ""
                                      } ${cfg.text}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <CalendarDays size={48} strokeWidth={1} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-sm">Aucune réservation trouvée</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Nouvelles demandes (pending) */}
          {isDemoVenue && (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                  Nouvelles demandes
                </h3>
                {pendingRequests.length > 0 && (
                  <span className="text-[0.625rem] font-bold bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.idx}
                      className="p-3.5 rounded-xl bg-white/[0.04] border border-amber-400/10 hover:bg-white/[0.06] transition-all"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white font-[family-name:var(--font-manrope)] truncate">
                            {req.guest}
                          </p>
                          <p className="text-[0.6875rem] text-white/40 mt-0.5">
                            {req.covers} couverts · {req.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[0.6875rem] text-white/30 mb-3">
                        <span>{req.event}</span>
                        <span>·</span>
                        <span>{req.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[0.625rem] text-white/40">
                          via <span className="text-white/60">{req.rp}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setStatuses((prev) => ({ ...prev, [req.idx]: "rejected" }))
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-[0.6875rem] font-medium hover:bg-red-400/20 transition-all"
                          >
                            <XCircle size={12} strokeWidth={2} />
                            Refuser
                          </button>
                          <button
                            onClick={() =>
                              setStatuses((prev) => ({ ...prev, [req.idx]: "confirmed" }))
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-400/10 text-green-400 text-[0.6875rem] font-medium hover:bg-green-400/20 transition-all"
                          >
                            <CheckCircle2 size={12} strokeWidth={2} />
                            Accepter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 size={32} strokeWidth={1} className="text-green-400/30 mx-auto mb-2" />
                  <p className="text-xs text-white/30">Aucune demande en attente</p>
                </div>
              )}
            </div>
          )}

          {/* Événements à venir */}
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                Événements à venir
              </h3>
              <Link
                href="/dashboard/events"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                Voir tout
                <ChevronRight size={12} strokeWidth={2} />
              </Link>
            </div>
            <div className="space-y-3">
              {events.map((event, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white font-[family-name:var(--font-manrope)]">
                        {event.name}
                      </p>
                      <p className="text-[0.6875rem] text-white/40 mt-0.5">
                        {event.date} · {event.time}
                      </p>
                    </div>
                    <span className="text-xs text-white/50 bg-white/[0.06] px-2 py-0.5 rounded-md">
                      {event.reservations} résa
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.625rem] text-white/30">Remplissage</span>
                      <span className="text-[0.625rem] text-white/50 font-medium">{event.fill}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          event.fill > 70
                            ? "bg-green-400"
                            : event.fill > 40
                              ? "bg-blue-400"
                              : "bg-amber-400"
                        }`}
                        style={{ width: `${event.fill}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résa par conciergerie */}
          {isDemoVenue && (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)] mb-4">
                Résa par conciergerie
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Jota Conciergerie", count: 42, pct: 28 },
                  { name: "Atlas Concierge", count: 38, pct: 26 },
                  { name: "Noctis VIP", count: 35, pct: 24 },
                  { name: "Prestige Access", count: 33, pct: 22 },
                ].map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60">{c.name}</span>
                      <span className="text-xs text-white/80 font-medium">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400/60 rounded-full"
                        style={{ width: `${c.pct * 3.5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
