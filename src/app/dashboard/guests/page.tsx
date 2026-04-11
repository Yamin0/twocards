"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  Search,
  Download,
  ChevronDown,
  Calendar,
  UserPlus,
  Crown,
  Users,
  TrendingUp,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";

const DEMO_GUESTS = [
  {
    id: "1",
    nom: "Hicham El Guerrouj",
    telephone: "+212 6 12 34 56 78",
    totalVisites: 23,
    depenses: "124 000 MAD",
    derniereVisite: "28 Mars 2026",
    vip: "VIP Platinum",
    recommande: "Youssef Alaoui",
  },
  {
    id: "2",
    nom: "Leila Hadioui",
    telephone: "+212 6 98 76 54 32",
    totalVisites: 15,
    depenses: "87 500 MAD",
    derniereVisite: "25 Mars 2026",
    vip: "VIP Gold",
    recommande: "Amira Benjelloun",
  },
  {
    id: "3",
    nom: "Enzo Rossi",
    telephone: "+212 6 55 44 33 22",
    totalVisites: 8,
    depenses: "32 000 MAD",
    derniereVisite: "20 Mars 2026",
    vip: null,
    recommande: "Direct",
  },
  {
    id: "4",
    nom: "Asmae Boutaleb",
    telephone: "+212 6 77 88 99 00",
    totalVisites: 31,
    depenses: "189 000 MAD",
    derniereVisite: "27 Mars 2026",
    vip: "VIP Black",
    recommande: "Omar Tazi",
  },
  {
    id: "5",
    nom: "Khalid Bousfiha",
    telephone: "+212 6 11 22 33 44",
    totalVisites: 5,
    depenses: "18 500 MAD",
    derniereVisite: "15 Mars 2026",
    vip: null,
    recommande: "Leila Hadioui",
  },
  {
    id: "6",
    nom: "Zineb Lyoubi",
    telephone: "+212 6 66 55 44 33",
    totalVisites: 19,
    depenses: "96 000 MAD",
    derniereVisite: "26 Mars 2026",
    vip: "VIP Blue",
    recommande: "Youssef Alaoui",
  },
];

function vipBadge(vip: string | null) {
  if (!vip) return null;
  const colorMap: Record<string, string> = {
    "VIP Platinum": "bg-white/10 text-white border border-white/20",
    "VIP Gold": "bg-amber-400/15 text-amber-400 border border-amber-400/20",
    "VIP Black": "bg-white/[0.06] text-white border border-white/15",
    "VIP Blue": "bg-blue-400/15 text-blue-400 border border-blue-400/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium ${colorMap[vip] ?? "bg-white/10 text-white/50 border border-white/10"}`}
    >
      <Crown className="h-3 w-3" strokeWidth={1.5} />
      {vip}
    </span>
  );
}

type SortField = "visites" | "derniereVisite" | "recommande" | null;

export default function GuestsPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const [vipOnly, setVipOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortField>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddModal(false);
    };
    if (showAddModal) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [showAddModal]);

  const guests = isDemoVenue ? DEMO_GUESTS : [];

  const filteredGuests = useMemo(() => {
    let result = guests.filter((g) => {
      if (vipOnly && !g.vip) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          g.nom.toLowerCase().includes(q) ||
          g.telephone.includes(q) ||
          (g.recommande && g.recommande.toLowerCase().includes(q))
        );
      }
      return true;
    });

    if (sortBy === "visites") {
      result = [...result].sort((a, b) => b.totalVisites - a.totalVisites);
    } else if (sortBy === "recommande") {
      result = [...result].sort((a, b) => a.recommande.localeCompare(b.recommande));
    }

    return result;
  }, [vipOnly, searchQuery, sortBy, guests]);

  const handleExportCSV = () => {
    const today = new Date().toISOString().split("T")[0];
    const headers = ["Nom", "Telephone", "Visites", "Depenses", "Derniere Visite", "VIP", "Recommande par"];
    const csv = [
      headers.join(","),
      ...filteredGuests.map((g) =>
        [g.nom, g.telephone, g.totalVisites, g.depenses, g.derniereVisite, g.vip || "-", g.recommande].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV telecharge");
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-[family-name:var(--font-manrope)] text-white">
              Clients
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Gérez votre base de clients et suivez leur fidélité.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Download className="h-4 w-4" strokeWidth={1.5} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Rechercher un client par nom, téléphone ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* VIP Toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="text-[0.625rem] text-white/30 uppercase tracking-wider">
            VIP
          </span>
          <button
            onClick={() => setVipOnly(!vipOnly)}
            className={`relative w-9 h-5 rounded-full transition-colors ${vipOnly ? "bg-blue-500" : "bg-white/[0.1]"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${vipOnly ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </label>

        {/* Nombre de visites */}
        <button
          onClick={() => setSortBy(sortBy === "visites" ? null : "visites")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${sortBy === "visites" ? "bg-blue-500 text-white" : "bg-white/[0.07] text-white/50 border border-white/[0.1] hover:bg-white/[0.1]"}`}
        >
          Nombre de visites
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Derniere visite */}
        <button
          onClick={() => setSortBy(sortBy === "derniereVisite" ? null : "derniereVisite")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${sortBy === "derniereVisite" ? "bg-blue-500 text-white" : "bg-white/[0.07] text-white/50 border border-white/[0.1] hover:bg-white/[0.1]"}`}
        >
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
          Derniere visite
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Recommande par */}
        <button
          onClick={() => setSortBy(sortBy === "recommande" ? null : "recommande")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${sortBy === "recommande" ? "bg-blue-500 text-white" : "bg-white/[0.07] text-white/50 border border-white/[0.1] hover:bg-white/[0.1]"}`}
        >
          Recommande par
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Table */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 px-5 py-3 bg-white/[0.04]">
          <span className="text-[0.625rem] text-white/30 uppercase tracking-wider">Nom</span>
          <span className="hidden sm:block text-[0.625rem] text-white/30 uppercase tracking-wider">Telephone</span>
          <span className="text-[0.625rem] text-white/30 uppercase tracking-wider">Total Visites</span>
          <span className="hidden sm:block text-[0.625rem] text-white/30 uppercase tracking-wider">Depenses Totales</span>
          <span className="text-[0.625rem] text-white/30 uppercase tracking-wider">Derniere Visite</span>
          <span className="text-[0.625rem] text-white/30 uppercase tracking-wider">Statut VIP</span>
          <span className="hidden sm:block text-[0.625rem] text-white/30 uppercase tracking-wider">Recommande par</span>
        </div>

        {/* Table Rows */}
        {filteredGuests.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-white/40">
            Aucun client trouve
          </div>
        ) : (
          filteredGuests.map((guest, i) => (
            <div
              key={guest.id}
              className={`grid grid-cols-4 sm:grid-cols-7 gap-4 px-5 py-3.5 items-center text-sm hover:bg-white/[0.06] transition-colors border-t border-white/[0.06] ${i % 2 === 1 ? "bg-white/[0.02]" : ""}`}
            >
              <span className="font-medium text-white truncate">
                {guest.nom}
              </span>
              <span className="hidden sm:block text-white/50">{guest.telephone}</span>
              <span className="text-white">{guest.totalVisites}</span>
              <span className="hidden sm:block text-white font-medium">{guest.depenses}</span>
              <span className="text-white/50">{guest.derniereVisite}</span>
              <span>{vipBadge(guest.vip)}</span>
              <span className="hidden sm:block text-white/50 truncate">
                {guest.recommande}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-8">
        <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/15 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[0.625rem] text-white/30 uppercase tracking-wider">
                  Total Clients
                </p>
                <p className="text-lg font-semibold text-white">
                  {isDemoVenue ? "2 842" : "0"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[0.625rem] text-white/30 uppercase tracking-wider">
                  Nouveaux ce mois
                </p>
                <p className="text-lg font-semibold text-white">
                  {isDemoVenue ? "+148" : "0"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/15 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[0.625rem] text-white/30 uppercase tracking-wider">
                  Retention VIP
                </p>
                <p className="text-lg font-semibold text-white">
                  {isDemoVenue ? "94%" : "0%"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-blue-500 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="h-4 w-4" strokeWidth={1.5} />
            Ajouter un Client
          </button>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                Nouveau Client
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddModal(false);
                showToast("Client ajoute avec succes");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[0.625rem] text-white/30 uppercase tracking-wider mb-1.5">Nom complet</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30" />
              </div>
              <div>
                <label className="block text-[0.625rem] text-white/30 uppercase tracking-wider mb-1.5">Telephone</label>
                <input type="tel" required className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30" />
              </div>
              <div>
                <label className="block text-[0.625rem] text-white/30 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30" />
              </div>
              <button type="submit" className="w-full bg-blue-500 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors">
                Ajouter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
