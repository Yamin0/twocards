"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Check,
  Undo2,
  Wallet,
  TrendingUp,
  Clock,
  CreditCard,
  CalendarCheck,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

/* ------------------------------------------------------------------ */
/*  Inline toast hook                                                  */
/* ------------------------------------------------------------------ */
function useInlineToast() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return { toast, showToast };
}

/* ------------------------------------------------------------------ */
/*  Inline status badge                                                */
/* ------------------------------------------------------------------ */
function InlineStatusBadge({
  status,
  variant,
}: {
  status: string;
  variant: "success" | "warning" | "default";
}) {
  const styles = {
    success:
      "bg-green-400/15 text-green-400 border border-green-400/20",
    warning:
      "bg-amber-400/15 text-amber-400 border border-amber-400/20",
    default:
      "bg-white/10 text-white/60 border border-white/15",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${styles[variant]}`}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */
type Commission = {
  id: number;
  date: string;
  rp: string;
  event: string;
  montant: string;
  statut: "Payé" | "En cours" | "En attente";
  variant: "success" | "warning" | "default";
};

const INITIAL_COMMISSIONS: Commission[] = [
  {
    id: 1,
    date: "28 Oct 2025",
    rp: "Liam Hamza",
    event: "Soirée VIP Vendredis",
    montant: "1 870 MAD",
    statut: "Payé",
    variant: "success",
  },
  {
    id: 2,
    date: "25 Oct 2025",
    rp: "Karim Bennani",
    event: "Nuit Blanche Spécial",
    montant: "1 530 MAD",
    statut: "Payé",
    variant: "success",
  },
  {
    id: 3,
    date: "22 Oct 2025",
    rp: "Youssef El Idrissi",
    event: "DJ Set International",
    montant: "1 480 MAD",
    statut: "En cours",
    variant: "warning",
  },
  {
    id: 4,
    date: "18 Oct 2025",
    rp: "Sofia Alaoui",
    event: "Soirée Privée Champagne",
    montant: "820 MAD",
    statut: "En attente",
    variant: "default",
  },
  {
    id: 5,
    date: "15 Oct 2025",
    rp: "Hind Fassi",
    event: "After Work Premium",
    montant: "480 MAD",
    statut: "En attente",
    variant: "default",
  },
  {
    id: 6,
    date: "12 Oct 2025",
    rp: "Nadia Chraibi",
    event: "Brunch Dimanche",
    montant: "1 420 MAD",
    statut: "Payé",
    variant: "success",
  },
];



const FILTER_OPTIONS = ["Tous", "Payé", "En cours", "En attente"] as const;

/* La pastille suit le statut : changer l'un sans l'autre afficherait un
   « Payé » en gris ou un « En attente » en vert. */
const VARIANTS: Record<Commission["statut"], Commission["variant"]> = {
  "Payé": "success",
  "En cours": "warning",
  "En attente": "default",
};

/* « 1 870 MAD » → 1870, et retour. Les montants sont stockés en texte
   formaté ; les totaliser suppose de les relire. */
const parseMAD = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;
const formatMAD = (n: number) =>
  `${n.toLocaleString("fr-FR").replace(/ | /g, " ")} MAD`;

/* Totaux recalculés à chaque rendu : marquer une commission payée déplace
   aussitôt le montant de « En attente » vers « Payées ». Auparavant les
   quatre cartes étaient des constantes, justes au premier affichage puis
   figées quoi que fasse l'utilisateur. */
function buildStats(rows: Commission[], isDemoVenue: boolean) {
  const sum = (filter: (c: Commission) => boolean) =>
    formatMAD(rows.filter(filter).reduce((t, c) => t + parseMAD(c.montant), 0));

  return [
    {
      label: "Total commissions",
      value: sum(() => true),
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "En attente",
      value: sum((c) => c.statut === "En attente"),
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      label: "Payées",
      value: sum((c) => c.statut === "Payé"),
      icon: CreditCard,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "Prochain paiement",
      value: isDemoVenue ? "01/05" : "—",
      icon: CalendarCheck,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function CommissionsPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const { toast, showToast } = useInlineToast();

  /* Données dérivées plutôt qu'un état synchronisé par effet : la liste de
     base découle du compte, et seules les corrections de statut faites par
     l'utilisateur sont retenues en état. Une table plutôt qu'un ensemble
     d'identifiants payés : le statut doit pouvoir repartir en arrière. */
  const [overrides, setOverrides] = useState<
    Record<number, Commission["statut"]>
  >({});
  const [filter, setFilter] = useState<(typeof FILTER_OPTIONS)[number]>("Tous");

  const commissions: Commission[] = (isDemoVenue ? INITIAL_COMMISSIONS : []).map(
    (c) => {
      const statut = overrides[c.id] ?? c.statut;
      return statut === c.statut ? c : { ...c, statut, variant: VARIANTS[statut] };
    },
  );

  const stats = buildStats(commissions, isDemoVenue);

  const filtered =
    filter === "Tous"
      ? commissions
      : commissions.filter((c) => c.statut === filter);

  /* ---- Changement de statut, réversible ---- */
  const handleMarkPaid = (id: number) => {
    setOverrides((prev) => ({ ...prev, [id]: "Payé" }));
    showToast("Commission marquée comme payée");
  };

  const handleSetPending = (id: number) => {
    setOverrides((prev) => ({ ...prev, [id]: "En attente" }));
    showToast("Commission remise en attente de paiement");
  };

  /* ---- CSV export ---- */
  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("Aucune donnée à exporter");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const headers = ["Date", "RP", "Événement", "Montant", "Statut"];
    const csv = [
      headers.join(","),
      ...filtered.map((c) =>
        [c.date, c.rp, c.event, c.montant, c.statut]
          .map((v) => `"${v}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commissions-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV téléchargé");
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 font-[family-name:var(--font-inter)]">
      {/* ---- Header ---- */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h1 className="text-2xl font-extrabold font-[family-name:var(--font-manrope)] text-white">
          Commissions
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Suivez et gérez les commissions de votre réseau RP.
        </p>
      </div>

      {/* ---- Stats strip ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-5"
            >
              <div
                className={`w-10 h-10 rounded-xl ${s.bgColor} flex items-center justify-center mb-3`}
              >
                <Icon size={20} strokeWidth={1.5} className={s.color} />
              </div>
              <p className="text-xl font-bold text-white font-[family-name:var(--font-manrope)]">
                {s.value}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ---- Commission table ---- */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08]">
          <h2 className="text-sm font-bold font-[family-name:var(--font-manrope)] text-white">
            Historique des commissions
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.1] rounded-xl p-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === opt
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "text-white/50 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              <Download size={14} strokeWidth={1.5} />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Date
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  RP
                </th>
                <th className="hidden sm:table-cell text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Événement
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Montant
                </th>
                <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Statut
                </th>
                <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4">
                        <Wallet
                          size={24}
                          strokeWidth={1.5}
                          className="text-white/30"
                        />
                      </div>
                      <p className="text-sm font-medium text-white/50">
                        Aucune commission enregistrée
                      </p>
                      <p className="text-xs text-white/30 mt-1">
                        Les commissions de votre réseau RP apparaîtront ici
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-6 py-3.5 text-white/40 text-xs">
                    {row.date}
                  </td>
                  <td className="px-6 py-3.5 text-white font-medium">
                    {row.rp}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-3.5 text-white/70">
                    {row.event}
                  </td>
                  <td className="px-6 py-3.5 text-white font-bold">
                    {row.montant}
                  </td>
                  <td className="px-6 py-3.5">
                    <InlineStatusBadge
                      status={row.statut}
                      variant={row.variant}
                    />
                  </td>
                  {/* Le paiement se rectifie dans les deux sens : marquer
                      payé par erreur ne doit pas être définitif. */}
                  <td className="px-6 py-3.5 text-right">
                    {row.statut === "Payé" ? (
                      <button
                        onClick={() => handleSetPending(row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.06] text-white/60 border border-white/15 hover:bg-white/[0.12] hover:text-white transition-colors"
                      >
                        <Undo2 size={12} strokeWidth={2} />
                        Remettre en attente
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkPaid(row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition-colors"
                      >
                        <Check size={12} strokeWidth={2} />
                        Marquer payé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Toast ---- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check size={16} strokeWidth={2} className="text-green-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
