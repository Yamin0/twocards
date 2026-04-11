"use client";

import { useState, useCallback } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { usePRQuality } from "@/contexts/pr-quality-context";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import Link from "next/link";
import {
  Users,
  Network,
  CreditCard,
  BarChart3,
  TrendingUp,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Download,
  UserCheck,
  DollarSign,
  Eye,
  Check,
  Star as StarIcon,
} from "lucide-react";

/* ── helpers ────────────────────────────────────────────── */

function Stars({
  count,
  onChange,
}: {
  count: number;
  onChange?: (value: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1 === count ? 0 : i + 1)}
          className="transition-colors hover:scale-110"
        >
          <StarIcon
            size={14}
            strokeWidth={1.5}
            className={
              i < count
                ? "fill-blue-400 text-blue-400"
                : "text-white/20 hover:text-white/40"
            }
          />
        </button>
      ))}
    </div>
  );
}

/* ── demo data ──────────────────────────────────────────── */

const DEMO_STATS = [
  { label: "RP Actifs", value: "34", change: "+3", positive: true, icon: Network },
  { label: "Couverts ce mois", value: "1 247", change: "+18%", positive: true, icon: Users },
  { label: "CA via RP", value: "782K MAD", change: "+12%", positive: true, icon: TrendingUp },
  { label: "Commissions dues", value: "24 850 MAD", change: "-4%", positive: false, icon: CreditCard },
];

const TEAM_MEMBERS = [
  {
    name: "Liam Hamza",
    role: "Jota Conciergerie",
    avatar: "LH",
    ca: "128 500",
    commission: "12 850",
    reservations: 38,
    quality: 4,
    attendance: "99%",
  },
  {
    name: "Karim Bennani",
    role: "Atlas Concierge",
    avatar: "KB",
    ca: "98 200",
    commission: "9 820",
    reservations: 31,
    quality: 4,
    attendance: "85%",
  },
  {
    name: "Youssef El Idrissi",
    role: "Noctis VIP",
    avatar: "YE",
    ca: "87 600",
    commission: "8 760",
    reservations: 27,
    quality: 5,
    attendance: "100%",
  },
  {
    name: "Sofia Alaoui",
    role: "Jota Conciergerie",
    avatar: "SA",
    ca: "63 750",
    commission: "6 375",
    reservations: 22,
    quality: 3,
    attendance: "80%",
  },
  {
    name: "Amine Tazi",
    role: "Prestige Access",
    avatar: "AT",
    ca: "52 100",
    commission: "5 210",
    reservations: 18,
    quality: 5,
    attendance: "92%",
  },
  {
    name: "Nadia Chraibi",
    role: "Atlas Concierge",
    avatar: "NC",
    ca: "41 300",
    commission: "4 130",
    reservations: 15,
    quality: 4,
    attendance: "78%",
  },
  {
    name: "Rachid Mouline",
    role: "Noctis VIP",
    avatar: "RM",
    ca: "31 200",
    commission: "3 120",
    reservations: 11,
    quality: 2,
    attendance: "50%",
  },
  {
    name: "Hind Fassi",
    role: "Prestige Access",
    avatar: "HF",
    ca: "18 400",
    commission: "1 840",
    reservations: 7,
    quality: 4,
    attendance: "100%",
  },
];


const RECENT_ACTIVITY = [
  { type: "reservation", text: "Liam H. a ajouté 4 couverts pour samedi", time: "il y a 12 min" },
  { type: "commission", text: "Commission de 9 820 MAD versée à Karim B.", time: "il y a 1h" },
  { type: "new_rp", text: "Nouveau RP: Hind F. a rejoint le réseau", time: "il y a 3h" },
  { type: "reservation", text: "Youssef E. — Table VIP confirmée pour vendredi", time: "il y a 5h" },
  { type: "commission", text: "Paiement en attente: 3 120 MAD pour Rachid M.", time: "hier" },
];

const WEEKLY_DATA = [
  { day: "Lun", value: 35 },
  { day: "Mar", value: 52 },
  { day: "Mer", value: 41 },
  { day: "Jeu", value: 68 },
  { day: "Ven", value: 89 },
  { day: "Sam", value: 124 },
  { day: "Dim", value: 76 },
];

/* ── component ──────────────────────────────────────────── */

export default function DashboardPage() {
  const { isDemoVenue, isLoading, fullName } = useAuthUser();
  const { qualities, setQuality } = usePRQuality();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleExportCSV = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const headers = ["Nom", "Agence", "CA", "Commission", "Réservations", "Attendance"];
    const csv = [
      headers.join(","),
      ...TEAM_MEMBERS.map((m) =>
        [m.name, m.role, m.ca + " MAD", m.commission + " MAD", m.reservations, m.attendance]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipe-rp-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV téléchargé");
  }, [showToast]);

  if (isLoading) return <DashboardSkeleton />;

  const stats = isDemoVenue ? DEMO_STATS : [];
  const maxBar = Math.max(...WEEKLY_DATA.map((d) => d.value));

  const searchedMembers = searchQuery
    ? TEAM_MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : TEAM_MEMBERS;

  const VISIBLE_COUNT = 3;
  const filteredMembers = showAllMembers || searchQuery
    ? searchedMembers
    : searchedMembers.slice(0, VISIBLE_COUNT);
  const hasMore = !searchQuery && searchedMembers.length > VISIBLE_COUNT;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-manrope)]">
              Bonjour, {fullName || "Directeur"}.
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Gérez votre équipe RP et suivez leurs performances
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 h-4 w-4" />
              <input
                placeholder="Rechercher un RP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all w-48"
              />
            </div>
            <div className="relative sm:hidden flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 h-4 w-4" />
              <input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all w-full"
              />
            </div>
            <Link
              href="/dashboard/notifications"
              className="p-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all relative"
            >
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full" />
            </Link>
            <Link
              href="/dashboard/network"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={1.5} />
              <span className="hidden sm:inline">Inviter un RP</span>
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
                <p className="text-lg sm:text-2xl font-bold text-white font-[family-name:var(--font-manrope)] whitespace-nowrap">
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

      {/* ── Main grid: Table + sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Team performance table (fourvenues style) ── */}
        <div className="xl:col-span-2 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white font-[family-name:var(--font-manrope)]">
                Performance de l&apos;équipe RP
              </h2>
              <p className="text-white/40 text-xs mt-0.5">
                Classement par entrées générées
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
              title="Exporter CSV"
            >
              <Download size={16} strokeWidth={1.5} />
            </button>
          </div>

          {isDemoVenue ? (
            <>
              {/* Mobile: card list */}
              <div className="md:hidden space-y-3">
                {filteredMembers.map((member, i) => (
                  <div
                    key={member.name}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-white/30 text-sm w-5 shrink-0">{i + 1}.</span>
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-[0.625rem] font-semibold text-white">
                          {member.avatar}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate font-[family-name:var(--font-manrope)]">
                          {member.name}
                        </p>
                        <p className="text-[0.6875rem] text-white/40">{member.role}</p>
                      </div>
                      <Stars
                        count={qualities[member.name] ?? member.quality}
                        onChange={(v) => setQuality(member.name, v)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[0.6rem] text-white/30 uppercase tracking-wider">CA</p>
                        <p className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                          {member.ca}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.6rem] text-white/30 uppercase tracking-wider">Résa</p>
                        <p className="text-sm font-medium text-white/80">{member.reservations}</p>
                      </div>
                      <div>
                        <p className="text-[0.6rem] text-white/30 uppercase tracking-wider">Attendance</p>
                        <p className="text-sm font-medium text-white/80">{member.attendance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3 pl-1">
                        Nom
                      </th>
                      <th className="text-center text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                        CA
                      </th>
                      <th className="text-center text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                        Commission
                      </th>
                      <th className="text-center text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                        Résa
                      </th>
                      <th className="text-center text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3">
                        Qualité
                      </th>
                      <th className="text-right text-[0.6875rem] font-semibold text-white/40 uppercase tracking-wider pb-3 pr-1">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member, i) => (
                      <tr
                        key={member.name}
                        className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3.5 pl-1">
                          <div className="flex items-center gap-3">
                            <span className="text-white/30 text-sm w-5 shrink-0">{i + 1}.</span>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                              <span className="text-[0.625rem] font-semibold text-white">
                                {member.avatar}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate font-[family-name:var(--font-manrope)]">
                                {member.name}
                              </p>
                              <p className="text-[0.6875rem] text-white/40">
                                {member.role}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                            {member.ca} MAD
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-sm text-white/60">{member.commission} MAD</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-sm text-white/80">{member.reservations}</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex justify-center">
                            <Stars
                              count={qualities[member.name] ?? member.quality}
                              onChange={(v) => setQuality(member.name, v)}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 text-right pr-1">
                          <span className="text-sm font-medium text-white/80">
                            {member.attendance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show more / less */}
              {hasMore && (
                <button
                  onClick={() => setShowAllMembers(!showAllMembers)}
                  className="w-full mt-4 py-2.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl transition-all"
                >
                  {showAllMembers
                    ? `Voir moins`
                    : `Afficher tout (${searchedMembers.length})`}
                </button>
              )}
            </>

          ) : (
            <div className="text-center py-16">
              <Network size={48} strokeWidth={1} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-sm">Aucun RP dans votre réseau</p>
              <Link
                href="/dashboard/network"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all"
              >
                <Plus size={16} strokeWidth={1.5} />
                Inviter votre premier RP
              </Link>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6">
          {/* Weekly chart */}
          {isDemoVenue && (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                  Entrées cette semaine
                </h3>
                <span className="text-xs text-green-400 font-medium">+18%</span>
              </div>
              <div className="flex items-end gap-2 h-28">
                {WEEKLY_DATA.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full relative">
                      <div
                        className="w-full bg-blue-500/20 rounded-md transition-all hover:bg-blue-500/30"
                        style={{ height: `${(d.value / maxBar) * 80}px` }}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-blue-500 rounded-md"
                          style={{ height: `${(d.value / maxBar) * 80 * 0.6}px` }}
                        />
                      </div>
                    </div>
                    <span className="text-[0.625rem] text-white/30">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick stats */}
          {isDemoVenue && (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)] mb-4">
                Résumé rapide
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center">
                      <UserCheck size={16} strokeWidth={1.5} className="text-green-400" />
                    </div>
                    <span className="text-sm text-white/60">Taux d&apos;activation</span>
                  </div>
                  <span className="text-sm font-semibold text-white">87%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
                      <DollarSign size={16} strokeWidth={1.5} className="text-blue-400" />
                    </div>
                    <span className="text-sm text-white/60">Taux de commission</span>
                  </div>
                  <span className="text-sm font-semibold text-white">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center">
                      <Eye size={16} strokeWidth={1.5} className="text-purple-400" />
                    </div>
                    <span className="text-sm text-white/60">Entrées / RP moy.</span>
                  </div>
                  <span className="text-sm font-semibold text-white">90</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                      <StarIcon size={16} strokeWidth={1.5} className="text-amber-400" />
                    </div>
                    <span className="text-sm text-white/60">Top performer</span>
                  </div>
                  <span className="text-sm font-semibold text-white">L. Hamza</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent activity */}
          {isDemoVenue && (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                  Activité récente
                </h3>
                <Link
                  href="/dashboard/analytics"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  Voir tout
                  <ChevronRight size={12} strokeWidth={2} />
                </Link>
              </div>
              <div className="space-y-3">
                {RECENT_ACTIVITY.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2 border-b border-white/[0.06] last:border-0"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        activity.type === "reservation"
                          ? "bg-blue-400"
                          : activity.type === "commission"
                            ? "bg-green-400"
                            : "bg-purple-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-white/70 leading-relaxed">
                        {activity.text}
                      </p>
                      <p className="text-[0.625rem] text-white/30 mt-0.5">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/network"
          className="group backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] rounded-2xl p-5 hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
                <Network size={20} strokeWidth={1.5} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                  Réseau RP
                </p>
                <p className="text-xs text-white/40">Gérer vos partenaires</p>
              </div>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all"
            />
          </div>
        </Link>
        <Link
          href="/dashboard/commissions"
          className="group backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] rounded-2xl p-5 hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
                <CreditCard size={20} strokeWidth={1.5} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                  Commissions
                </p>
                <p className="text-xs text-white/40">Paiements et suivi</p>
              </div>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all"
            />
          </div>
        </Link>
        <Link
          href="/dashboard/analytics"
          className="group backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] rounded-2xl p-5 hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <BarChart3 size={20} strokeWidth={1.5} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                  Analyses
                </p>
                <p className="text-xs text-white/40">Rapports et stats</p>
              </div>
            </div>
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              className="text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all"
            />
          </div>
        </Link>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl">
          <Check size={16} strokeWidth={2} className="text-blue-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
