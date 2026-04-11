"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { usePRQuality } from "@/contexts/pr-quality-context";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  Search,
  ChevronDown,
  UserPlus,
  MapPin,
  Users,
  Star,
  X,
  TrendingUp,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Trash2,
  Award,
  BarChart3,
  Send,
} from "lucide-react";

/* ── types ── */

type PRStatus = "Actif" | "En attente" | "Inactif";

interface PRCard {
  id: number;
  initials: string;
  name: string;
  agency: string;
  status: PRStatus;
  location: string;
  phone: string;
  email: string;
  couverts: number;
  ca: string;
  caNum: number;
  commission: string;
  quality: number;
  events: number;
}

/* ── demo data ── */

const DEMO_PR_CARDS: PRCard[] = [
  { id: 1, initials: "LH", name: "Liam Hamza", agency: "Jota Conciergerie", status: "Actif", location: "Casablanca", phone: "+212 6 12 34 56 78", email: "liam@jota.ma", couverts: 62, ca: "31 200 MAD", caNum: 31200, commission: "3 120 MAD", quality: 5, events: 8 },
  { id: 2, initials: "KB", name: "Karim Bennani", agency: "Atlas Concierge", status: "Actif", location: "Casablanca", phone: "+212 6 98 76 54 32", email: "karim@atlas.ma", couverts: 48, ca: "24 800 MAD", caNum: 24800, commission: "2 480 MAD", quality: 4, events: 6 },
  { id: 3, initials: "YE", name: "Youssef El Idrissi", agency: "Noctis VIP", status: "Actif", location: "Marrakech", phone: "+212 6 55 44 33 22", email: "youssef@noctis.ma", couverts: 36, ca: "19 200 MAD", caNum: 19200, commission: "1 920 MAD", quality: 5, events: 5 },
  { id: 4, initials: "SA", name: "Sofia Alaoui", agency: "Jota Conciergerie", status: "Actif", location: "Tanger", phone: "+212 6 11 22 33 44", email: "sofia@jota.ma", couverts: 29, ca: "14 500 MAD", caNum: 14500, commission: "1 450 MAD", quality: 4, events: 4 },
  { id: 5, initials: "HF", name: "Hind Fassi", agency: "Prestige Access", status: "Actif", location: "Casablanca", phone: "+212 6 77 88 99 00", email: "hind@prestige.ma", couverts: 24, ca: "12 000 MAD", caNum: 12000, commission: "1 200 MAD", quality: 3, events: 3 },
  { id: 6, initials: "NC", name: "Nadia Chraibi", agency: "Atlas Concierge", status: "En attente", location: "Rabat", phone: "+212 6 33 22 11 00", email: "nadia@atlas.ma", couverts: 8, ca: "4 200 MAD", caNum: 4200, commission: "420 MAD", quality: 0, events: 1 },
  { id: 7, initials: "RM", name: "Rachid Mouline", agency: "Noctis VIP", status: "En attente", location: "Marrakech", phone: "+212 6 44 55 66 77", email: "rachid@noctis.ma", couverts: 5, ca: "2 800 MAD", caNum: 2800, commission: "280 MAD", quality: 0, events: 0 },
  { id: 8, initials: "MF", name: "Mehdi Fassi-Fihri", agency: "Independent", status: "Inactif", location: "Casablanca", phone: "+212 6 99 88 77 66", email: "mehdi@gmail.com", couverts: 7, ca: "3 200 MAD", caNum: 3200, commission: "320 MAD", quality: 2, events: 2 },
];

const MONTHLY_CA = [
  { month: "Oct", value: 62 },
  { month: "Nov", value: 71 },
  { month: "Dec", value: 89 },
  { month: "Jan", value: 58 },
  { month: "Fév", value: 74 },
  { month: "Mar", value: 85 },
];

/* ── helpers ── */

function statusBadge(status: PRStatus) {
  switch (status) {
    case "Actif": return "bg-green-400/15 text-green-400 border border-green-400/20";
    case "En attente": return "bg-amber-400/15 text-amber-400 border border-amber-400/20";
    case "Inactif": return "bg-white/[0.06] text-white/30 border border-white/10";
  }
}

/* ── component ── */

export default function NetworkPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const { qualities, setQuality } = usePRQuality();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"ca" | "couverts" | "events">("ca");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const prCards = isDemoVenue ? DEMO_PR_CARDS : [];

  const filteredPRs = useMemo(() => {
    let result = prCards.filter((pr) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!pr.name.toLowerCase().includes(q) && !pr.agency.toLowerCase().includes(q) && !pr.location.toLowerCase().includes(q)) return false;
      }
      if (filterStatus && pr.status !== filterStatus) return false;
      return true;
    });
    if (sortBy === "ca") result = [...result].sort((a, b) => b.caNum - a.caNum);
    else if (sortBy === "couverts") result = [...result].sort((a, b) => b.couverts - a.couverts);
    else result = [...result].sort((a, b) => b.events - a.events);
    return result;
  }, [searchQuery, filterStatus, sortBy, prCards]);

  // Stats
  const activePRs = prCards.filter((p) => p.status === "Actif").length;
  const totalCouverts = prCards.reduce((sum, p) => sum + p.couverts, 0);
  const pendingPRs = prCards.filter((p) => p.status === "En attente").length;

  const selected = selectedPR !== null ? prCards.find((p) => p.id === selectedPR) : null;
  const topPerformer = prCards.length > 0 ? [...prCards].sort((a, b) => b.caNum - a.caNum)[0] : null;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-manrope)]">
              Réseau RP
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Gérez vos relations publiques et concierges
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]"
          >
            <UserPlus size={16} strokeWidth={1.5} />
            Inviter un RP
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {isDemoVenue && (
        <div className="grid grid-cols-3 gap-4">
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">RP Actifs</p>
            <p className="text-xl font-bold text-white mt-1 font-[family-name:var(--font-manrope)]">{activePRs}</p>
          </div>
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Couverts ce mois</p>
            <p className="text-xl font-bold text-blue-400 mt-1 font-[family-name:var(--font-manrope)]">{totalCouverts}</p>
          </div>
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">En attente</p>
            <p className="text-xl font-bold text-amber-400 mt-1 font-[family-name:var(--font-manrope)]">{pendingPRs}</p>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Rechercher un RP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/40 transition-colors"
          />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-9 py-2.5 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-xl text-sm text-white/70 focus:outline-none focus:border-blue-400/40 transition-colors cursor-pointer">
            <option value="" className="bg-[#1a1a2e]">Tous les statuts</option>
            <option value="Actif" className="bg-[#1a1a2e]">Actif</option>
            <option value="En attente" className="bg-[#1a1a2e]">En attente</option>
            <option value="Inactif" className="bg-[#1a1a2e]">Inactif</option>
          </select>
          <ChevronDown size={13} strokeWidth={1.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
        <div className="relative">
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2.5 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-xl text-xs text-white/50 hover:text-white transition-colors"
          >
            <TrendingUp size={13} strokeWidth={1.5} />
            Trier: {sortBy === "ca" ? "CA" : sortBy === "couverts" ? "Couverts" : "Attendance"}
            <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform ${sortDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {sortDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1 shadow-xl min-w-[150px]">
                {([["ca", "CA"], ["couverts", "Couverts"], ["events", "Attendance"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setSortDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${sortBy === key ? "text-blue-400 bg-blue-400/10" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* ── PR cards list ── */}
        <div className="lg:col-span-7">
          {filteredPRs.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
              <Users size={36} strokeWidth={1} className="mx-auto text-white/15 mb-3" />
              <p className="text-sm text-white/30">Aucun RP trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPRs.map((pr) => (
                <div
                  key={pr.id}
                  onClick={() => setSelectedPR(selectedPR === pr.id ? null : pr.id)}
                  className={`backdrop-blur-xl bg-white/[0.07] border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:bg-white/[0.09] ${
                    selectedPR === pr.id ? "border-blue-400/30 shadow-[0_0_20px_rgba(96,165,250,0.1)]" : "border-white/[0.12]"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-blue-400/15 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-400">{pr.initials}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white font-[family-name:var(--font-manrope)]">{pr.name}</p>
                        <p className="text-[0.6875rem] text-white/35">{pr.agency}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${statusBadge(pr.status)}`}>
                        {pr.status}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === pr.id ? null : pr.id); }}
                          className="p-1 rounded-lg text-white/20 hover:text-white hover:bg-white/[0.08] transition-all"
                        >
                          <MoreVertical size={14} strokeWidth={1.5} />
                        </button>
                        {openMenu === pr.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} />
                            <div className="absolute right-0 top-full mt-1 z-40 backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl p-1 shadow-xl min-w-[140px]">
                              <button onClick={(e) => { e.stopPropagation(); setSelectedPR(pr.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all">
                                <Eye size={13} strokeWidth={1.5} /> Voir profil
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); router.push("/dashboard/messages"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all">
                                <Send size={13} strokeWidth={1.5} /> Message
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:bg-red-400/10 hover:text-red-400 transition-all">
                                <Trash2 size={13} strokeWidth={1.5} /> Retirer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location + quality */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-white/35">
                      <MapPin size={12} strokeWidth={1.5} />
                      {pr.location}
                    </div>
                    <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                      {[1, 2, 3, 4, 5].map((i) => {
                        const q = qualities[pr.name] ?? pr.quality;
                        return (
                          <button
                            key={i}
                            onClick={() => setQuality(pr.name, q === i ? i - 1 : i)}
                            className="hover:scale-125 transition-transform"
                          >
                            <Star size={12} strokeWidth={1.5} className={i <= q ? "text-amber-400 fill-amber-400" : "text-white/15 hover:text-white/30"} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                      <p className="text-[0.5625rem] text-white/25 uppercase tracking-wider">Couverts</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{pr.couverts}</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                      <p className="text-[0.5625rem] text-white/25 uppercase tracking-wider">CA</p>
                      <p className="text-[0.6875rem] font-semibold text-white mt-0.5">{pr.ca}</p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-2.5 text-center">
                      <p className="text-[0.5625rem] text-white/25 uppercase tracking-wider">Commission</p>
                      <p className="text-[0.6875rem] font-semibold text-white mt-0.5">{pr.commission}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Invite card */}
              <div
                onClick={() => setShowInviteModal(true)}
                className="backdrop-blur-xl bg-white/[0.03] border-2 border-dashed border-white/[0.1] rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.05] hover:border-blue-400/20 transition-all min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-3">
                  <UserPlus size={20} strokeWidth={1.5} className="text-white/25" />
                </div>
                <h3 className="text-sm font-semibold text-white/60 font-[family-name:var(--font-manrope)] mb-1">
                  Étendre votre réseau
                </h3>
                <p className="text-xs text-white/25 max-w-[180px]">
                  Invitez de nouveaux RP pour développer votre activité
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Selected PR detail */}
          {selected ? (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-5 space-y-5">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-400/15 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-400">{selected.initials}</span>
                </div>
                <h2 className="text-lg font-semibold text-white font-[family-name:var(--font-manrope)]">{selected.name}</h2>
                <p className="text-xs text-white/40 mt-0.5">{selected.agency}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`text-[0.625rem] font-semibold px-2.5 py-0.5 rounded-full ${statusBadge(selected.status)}`}>{selected.status}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const q = qualities[selected.name] ?? selected.quality;
                      return (
                        <button
                          key={i}
                          onClick={() => setQuality(selected.name, q === i ? i - 1 : i)}
                          className="hover:scale-125 transition-transform"
                        >
                          <Star size={13} strokeWidth={1.5} className={i <= q ? "text-amber-400 fill-amber-400" : "text-white/15 hover:text-white/30"} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-white/50">
                  <MapPin size={13} strokeWidth={1.5} className="text-white/25" />
                  {selected.location}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-white/50">
                  <Phone size={13} strokeWidth={1.5} className="text-white/25" />
                  {selected.phone}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-white/50">
                  <Mail size={13} strokeWidth={1.5} className="text-white/25" />
                  {selected.email}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[0.625rem] text-white/25 uppercase tracking-wider">Couverts</p>
                  <p className="text-lg font-bold text-white mt-0.5 font-[family-name:var(--font-manrope)]">{selected.couverts}</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[0.625rem] text-white/25 uppercase tracking-wider">Événements</p>
                  <p className="text-lg font-bold text-white mt-0.5 font-[family-name:var(--font-manrope)]">{selected.events}</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[0.625rem] text-white/25 uppercase tracking-wider">CA généré</p>
                  <p className="text-sm font-bold text-white mt-0.5 font-[family-name:var(--font-manrope)]">{selected.ca}</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[0.625rem] text-white/25 uppercase tracking-wider">Commission</p>
                  <p className="text-sm font-bold text-white mt-0.5 font-[family-name:var(--font-manrope)]">{selected.commission}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/dashboard/messages")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 rounded-xl text-xs font-medium text-blue-400 transition-all"
                >
                  <Send size={13} strokeWidth={1.5} /> Message
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all">
                  <Phone size={13} strokeWidth={1.5} /> Appeler
                </button>
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Users size={20} strokeWidth={1.5} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40">Sélectionnez un RP</p>
              <p className="text-xs text-white/20 mt-1">pour voir son profil détaillé</p>
            </div>
          )}

          {/* Top performer */}
          {topPerformer && isDemoVenue && (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Award size={16} strokeWidth={1.5} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">Meilleur performeur</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-amber-400/15 flex items-center justify-center">
                  <span className="text-sm font-semibold text-amber-400">{topPerformer.initials}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{topPerformer.name}</p>
                  <p className="text-[0.6875rem] text-white/35">{topPerformer.agency}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">CA ce mois</span>
                  <span className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">{topPerformer.ca}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">Couverts</span>
                  <span className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">{topPerformer.couverts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30">Événements</span>
                  <span className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">{topPerformer.events}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Star size={14} strokeWidth={1.5} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-white/30">Top performeur depuis 3 mois</span>
              </div>
            </div>
          )}

          {/* Monthly CA chart */}
          {isDemoVenue && (
            <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} strokeWidth={1.5} className="text-white/30" />
                <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">CA mensuel RP</h3>
              </div>
              <div className="flex items-end gap-2 h-28">
                {MONTHLY_CA.map((m) => {
                  const maxVal = Math.max(...MONTHLY_CA.map((x) => x.value));
                  const pct = (m.value / maxVal) * 100;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[0.5625rem] font-medium text-white/40">{m.value}k</span>
                      <div className="w-full rounded-t-lg bg-white/[0.04] relative overflow-hidden" style={{ height: `${pct}%` }}>
                        <div className="absolute inset-0 bg-blue-400/30 rounded-t-lg" />
                      </div>
                      <span className="text-[0.5rem] text-white/20">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 backdrop-blur-xl bg-[#0e0e1a]/95 border border-white/[0.12] rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)]">Inviter un RP</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowInviteModal(false);
                showToast("Invitation envoyée avec succès");
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Nom complet</label>
                <input type="text" required placeholder="Ex: Youssef Alaoui"
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors" />
              </div>
              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Email</label>
                <input type="email" required placeholder="ex@email.com"
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors" />
              </div>
              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Conciergerie / Agence</label>
                <input type="text" placeholder="Ex: Jota Conciergerie"
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors" />
              </div>
              <div>
                <label className="text-[0.625rem] text-white/30 uppercase tracking-wider block mb-1.5">Message (optionnel)</label>
                <textarea rows={2} placeholder="Un petit mot personnel..."
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all">
                  Annuler
                </button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)]">
                  <Send size={15} strokeWidth={1.5} />
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-xl">
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
