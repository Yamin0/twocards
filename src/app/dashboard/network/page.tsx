"use client";

import { useState, useMemo } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ChevronDown,
  UserPlus,
  MapPin,
  Users,
  TrendingUp,
  Percent,
  DollarSign,
  ArrowRight,
  Star,
  Check,
  X,
} from "lucide-react";

const DEMO_STATS = [
  { label: "RP Actifs", value: "34", icon: Users },
  { label: "Couverts mois", value: "127", icon: Users },
  { label: "CA généré via RP", value: "89 300 MAD", icon: DollarSign },
  { label: "Taux Com. Moyen", value: "10%", icon: Percent },
];

const EMPTY_STATS = [
  { label: "RP Actifs", value: "0", icon: Users },
  { label: "Couverts mois", value: "0", icon: Users },
  { label: "CA généré via RP", value: "0 MAD", icon: DollarSign },
  { label: "Taux Com. Moyen", value: "10%", icon: Percent },
];

const DEMO_PR_CARDS = [
  {
    initials: "YA",
    name: "Youssef Alaoui",
    agency: "Nuit Blanche Agency",
    status: "Actif",
    location: "Casablanca",
    couverts: 48,
    ca: "24 800 MAD",
    caNum: 24800,
    commission: "2 480 MAD",
    color: "bg-primary",
  },
  {
    initials: "AB",
    name: "Amira Benjelloun",
    agency: "Prestige Connect",
    status: "Actif",
    location: "Casablanca",
    couverts: 36,
    ca: "19 200 MAD",
    caNum: 19200,
    commission: "1 920 MAD",
    color: "bg-emerald-600",
  },
  {
    initials: "OT",
    name: "Omar Tazi",
    agency: "Independent",
    status: "Actif",
    location: "Marrakech",
    couverts: 24,
    ca: "14 500 MAD",
    caNum: 14500,
    commission: "1 450 MAD",
    color: "bg-violet-600",
  },
  {
    initials: "SC",
    name: "Salma Chraibi",
    agency: "VIP Casablanca",
    status: "En attente",
    location: "Tanger",
    couverts: 12,
    ca: "8 300 MAD",
    caNum: 8300,
    commission: "830 MAD",
    color: "bg-amber-600",
  },
  {
    initials: "MF",
    name: "Mehdi Fassi-Fihri",
    agency: "Nuit Blanche Agency",
    status: "Inactif",
    location: "Casablanca",
    couverts: 7,
    ca: "3 200 MAD",
    caNum: 3200,
    commission: "320 MAD",
    color: "bg-rose-600",
  },
];

const DEMO_MONTHLY_CA = [
  { month: "Oct", value: 62 },
  { month: "Nov", value: 71 },
  { month: "Dec", value: 89 },
  { month: "Jan", value: 58 },
  { month: "Fév", value: 74 },
  { month: "Mar", value: 85 },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Actif: "bg-emerald-100 text-emerald-800",
    "En attente": "bg-amber-100 text-amber-800",
    Inactif: "bg-surface-mid text-on-surface-variant",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium ${map[status] ?? "bg-surface-mid text-on-surface-variant"}`}
    >
      {status}
    </span>
  );
}

export default function NetworkPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterVille, setFilterVille] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"ca" | "couverts">("ca");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const stats = isDemoVenue ? DEMO_STATS : EMPTY_STATS;
  const prCards = isDemoVenue ? DEMO_PR_CARDS : [];
  const monthlyCA = isDemoVenue ? DEMO_MONTHLY_CA : [];

  const filteredPRs = useMemo(() => {
    let result = prCards.filter((pr) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!pr.name.toLowerCase().includes(q) && !pr.agency.toLowerCase().includes(q) && !pr.location.toLowerCase().includes(q)) return false;
      }
      if (filterStatus && pr.status !== filterStatus) return false;
      if (filterVille && pr.location !== filterVille) return false;
      return true;
    });
    if (sortBy === "ca") result = [...result].sort((a, b) => b.caNum - a.caNum);
    else result = [...result].sort((a, b) => b.couverts - a.couverts);
    return result;
  }, [searchQuery, filterStatus, filterVille, sortBy, prCards]);

  const villes = [...new Set(prCards.map((p) => p.location))];
  const statuts = ["Actif", "En attente", "Inactif"];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
          Votre Réseau de RP
        </h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <UserPlus className="h-4 w-4" strokeWidth={1.5} />
          Inviter un RP
        </button>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Rechercher un RP par nom, agence ou ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-low border-none rounded-sm py-3 pl-11 pr-4 text-sm text-on-background placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 pb-6">
        <div className="bg-primary-container rounded-md p-5 grid grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-primary-container">
                {s.label}
              </p>
              <p className="text-xl font-semibold text-white font-[family-name:var(--font-manrope)] mt-1">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFilterStatus(filterStatus ? null : "Actif")}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm ${filterStatus ? "bg-primary text-white" : "bg-surface-mid text-on-surface-variant"}`}
        >
          {filterStatus || "Statut"}
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        {filterStatus && (
          <div className="flex gap-1">
            {statuts.map((s) => (
              <button key={s} onClick={() => setFilterStatus(s === filterStatus ? null : s)} className={`px-2 py-1 text-xs rounded-sm ${s === filterStatus ? "bg-primary text-white" : "bg-surface-low text-on-surface-variant"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setFilterVille(filterVille ? null : villes[0] || null)}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm ${filterVille ? "bg-primary text-white" : "bg-surface-mid text-on-surface-variant"}`}
        >
          {filterVille || "Ville"}
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        {filterVille && (
          <div className="flex gap-1">
            {villes.map((v) => (
              <button key={v} onClick={() => setFilterVille(v === filterVille ? null : v)} className={`px-2 py-1 text-xs rounded-sm ${v === filterVille ? "bg-primary text-white" : "bg-surface-low text-on-surface-variant"}`}>
                {v}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto">
          <button
            onClick={() => setSortBy(sortBy === "ca" ? "couverts" : "ca")}
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-background transition-colors"
          >
            Trier par: {sortBy === "ca" ? "CA" : "Couverts"}
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* PR Cards Grid */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPRs.map((pr) => (
            <div
              key={pr.name}
              className="bg-surface-card rounded-md editorial-shadow p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-full ${pr.color} flex items-center justify-center`}
                  >
                    <span className="text-sm font-semibold text-white">
                      {pr.initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-background">
                      {pr.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">{pr.agency}</p>
                  </div>
                </div>
                {statusBadge(pr.status)}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                {pr.location}
              </div>

              <div className="bg-surface-low rounded-md p-3 grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Couverts
                  </p>
                  <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    {pr.couverts}
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    CA
                  </p>
                  <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    {pr.ca}
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Commission due
                  </p>
                  <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    {pr.commission}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPR(selectedPR === pr.name ? null : pr.name)}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary-dark transition-colors"
              >
                {selectedPR === pr.name ? "Masquer" : "Voir le Profil"}
                <ArrowRight className={`h-3.5 w-3.5 transition-transform ${selectedPR === pr.name ? "rotate-90" : ""}`} strokeWidth={1.5} />
              </button>

              {selectedPR === pr.name && (
                <div className="mt-3 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant space-y-1">
                  <p>Agence: {pr.agency}</p>
                  <p>Ville: {pr.location}</p>
                  <p>Statut: {pr.status}</p>
                  <p>Commission due: {pr.commission}</p>
                </div>
              )}
            </div>
          ))}

          {/* Invitation Card */}
          <div className="rounded-md border-2 border-dashed border-outline-variant/40 p-5 flex flex-col items-center justify-center text-center min-h-[280px]">
            <div className="h-12 w-12 rounded-full bg-surface-low flex items-center justify-center mb-3">
              <UserPlus className="h-5 w-5 text-on-surface-variant" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-1">
              Étendre votre réseau
            </h3>
            <p className="text-xs text-on-surface-variant mb-4 max-w-[200px]">
              Invitez de nouveaux RP pour développer votre activité
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 bg-primary text-white rounded-sm px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Envoyer une invitation
            </button>
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-surface-card rounded-md editorial-shadow p-5">
          <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-5">
            Progression CA mensuel
          </h2>
          {monthlyCA.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-on-surface-variant">
              Aucune donnée disponible
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlyCA.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-on-background">
                    {m.value}k
                  </span>
                  <div
                    className="w-full bg-primary/20 rounded-t-sm relative overflow-hidden"
                    style={{ height: `${(m.value / 100) * 100}%` }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm"
                      style={{ height: `${(m.value / 89) * 100}%` }}
                    />
                  </div>
                  <span className="text-[0.625rem] text-on-surface-variant">
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-surface-card rounded-md editorial-shadow p-5">
          <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-5">
            Meilleur performeur
          </h2>
          {isDemoVenue ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">YA</span>
                </div>
                <div>
                  <p className="text-base font-medium text-on-background">
                    Youssef Alaoui
                  </p>
                  <p className="text-sm text-on-surface-variant">Nuit Blanche Agency</p>
                </div>
              </div>

              <div className="bg-surface-low rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">CA ce mois</span>
                  <span className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    24 800 MAD
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Couverts</span>
                  <span className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    48
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Taux conversion</span>
                  <span className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    87%
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                <span className="text-xs text-on-surface-variant">
                  Top performeur depuis 3 mois consécutifs
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-on-surface-variant">
              Aucun RP actif
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-card rounded-md editorial-shadow p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-primary-dark font-[family-name:var(--font-manrope)]">
                Inviter un RP
              </h2>
              <button onClick={() => setShowInviteModal(false)} className="text-on-surface-variant hover:text-on-background">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowInviteModal(false);
                showToast("Invitation envoyée");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Nom</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Email</label>
                <input type="email" required className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Message (optionnel)</label>
                <textarea rows={2} className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button type="submit" className="w-full bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors">
                Envoyer l&apos;invitation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
