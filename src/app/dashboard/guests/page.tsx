"use client";

import { useState, useMemo } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
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
import Link from "next/link";

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
    "VIP Platinum": "bg-on-surface/10 text-on-surface",
    "VIP Gold": "bg-amber-100 text-amber-800",
    "VIP Black": "bg-on-background text-white",
    "VIP Blue": "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium ${colorMap[vip] ?? "bg-surface-mid text-on-surface-variant"}`}
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
  const { toast, showToast } = useToast();

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
    const headers = ["Nom", "Téléphone", "Visites", "Dépenses", "Dernière Visite", "VIP", "Recommandé par"];
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
    a.download = "clients-twocards.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV téléchargé");
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
          Clients
        </h1>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-background transition-colors"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Exporter CSV
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
            placeholder="Rechercher un client par nom, téléphone ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-low border-none rounded-sm py-3 pl-11 pr-4 text-sm text-on-background placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
        {/* VIP Toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
            VIP
          </span>
          <button
            onClick={() => setVipOnly(!vipOnly)}
            className={`relative w-9 h-5 rounded-full transition-colors ${vipOnly ? "bg-primary" : "bg-surface-mid"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${vipOnly ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </label>

        {/* Nombre de visites */}
        <button
          onClick={() => setSortBy(sortBy === "visites" ? null : "visites")}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm ${sortBy === "visites" ? "bg-primary text-white" : "bg-surface-mid text-on-surface-variant"}`}
        >
          Nombre de visites
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Derniere visite */}
        <button
          onClick={() => setSortBy(sortBy === "derniereVisite" ? null : "derniereVisite")}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm ${sortBy === "derniereVisite" ? "bg-primary text-white" : "bg-surface-mid text-on-surface-variant"}`}
        >
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
          Dernière visite
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>

        {/* Recommandé par */}
        <button
          onClick={() => setSortBy(sortBy === "recommande" ? null : "recommande")}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm ${sortBy === "recommande" ? "bg-primary text-white" : "bg-surface-mid text-on-surface-variant"}`}
        >
          Recommandé par
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Table */}
      <div className="px-6">
        <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 px-5 py-3 bg-surface-low">
            {["Nom", "Téléphone", "Total Visites", "Dépenses Totales", "Dernière Visite", "Statut VIP", "Recommandé par"].map(
              (header) => (
                <span
                  key={header}
                  className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant"
                >
                  {header}
                </span>
              )
            )}
          </div>

          {/* Table Rows */}
          {filteredGuests.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-on-surface-variant">
              Aucun client trouvé
            </div>
          ) : (
            filteredGuests.map((guest, i) => (
              <Link
                key={guest.id}
                href={`/dashboard/guests/${guest.id}`}
                className={`grid grid-cols-7 gap-4 px-5 py-3.5 items-center text-sm hover:bg-surface-low/60 transition-colors ${i % 2 === 1 ? "bg-surface" : "bg-surface-card"}`}
              >
                <span className="font-medium text-on-background truncate">
                  {guest.nom}
                </span>
                <span className="text-on-surface-variant">{guest.telephone}</span>
                <span className="text-on-background">{guest.totalVisites}</span>
                <span className="text-on-background font-medium">{guest.depenses}</span>
                <span className="text-on-surface-variant">{guest.derniereVisite}</span>
                <span>{vipBadge(guest.vip)}</span>
                <span className="text-on-surface-variant truncate">
                  {guest.recommande}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-6 pt-8 pb-6">
        <div className="bg-surface-card rounded-md editorial-shadow p-5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                  Total Clients
                </p>
                <p className="text-lg font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                  {isDemoVenue ? "2 842" : "0"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                  Nouveaux ce mois
                </p>
                <p className="text-lg font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                  {isDemoVenue ? "+148" : "0"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                  Rétention VIP
                </p>
                <p className="text-lg font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                  {isDemoVenue ? "94%" : "0%"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <UserPlus className="h-4 w-4" strokeWidth={1.5} />
            Ajouter un Client
          </button>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-card rounded-md editorial-shadow p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-primary-dark font-[family-name:var(--font-manrope)]">
                Nouveau Client
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-on-background">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddModal(false);
                showToast("Client ajouté avec succès");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Nom complet</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Téléphone</label>
                <input type="tel" required className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Email</label>
                <input type="email" className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button type="submit" className="w-full bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors">
                Ajouter
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
