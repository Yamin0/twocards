"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { StatStrip } from "@/components/shared/stat-strip";
import { RatingStars } from "@/components/shared/mini-charts";
import {
  Building2,
  CalendarDays,
  Globe,
  Search,
  Send,
  Users,
} from "lucide-react";

/* Réseau apporteurs du Venue Manager — l'attribution réelle : quels hôtels
   partenaires envoient des clients à l'établissement, ce que ça rapporte
   (CA apporté) et ce que ça coûte (commissions reversées). Les agrégats
   viennent de la RPC venue_referrers() (canal QR uniquement, annulées et
   no-show exclues) — la page ne fait qu'afficher. */

type Referrer = {
  referrer_id: string;
  referrer_name: string;
  reservations: number;
  covers: number;
  revenue: number;
  commissions: number;
  last_reservation: string;
  avg_rating: number | null;
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

export default function NetworkPage() {
  const { isLoading } = useAuthUser();
  const router = useRouter();
  const [referrers, setReferrers] = useState<Referrer[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .rpc("venue_referrers")
      .then(({ data, error }: { data: Referrer[] | null; error: unknown }) => {
        if (cancelled) return;
        if (error) {
          console.error("venue_referrers:", error);
          setReferrers([]);
          return;
        }
        setReferrers(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!referrers) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return referrers;
    return referrers.filter((r) => r.referrer_name.toLowerCase().includes(q));
  }, [referrers, searchQuery]);

  if (isLoading || referrers === null) return <DashboardSkeleton />;

  const totalReservations = referrers.reduce(
    (sum, r) => sum + Number(r.reservations),
    0
  );
  const totalRevenue = referrers.reduce((sum, r) => sum + Number(r.revenue), 0);
  const totalCommissions = referrers.reduce(
    (sum, r) => sum + Number(r.commissions),
    0
  );

  const stats = [
    { label: "Apporteurs actifs", value: referrers.length },
    { label: "Sorties apportées", value: totalReservations },
    { label: "CA apporté", value: `${totalRevenue.toLocaleString()} MAD` },
    {
      label: "Commissions reversées",
      value: `${totalCommissions.toLocaleString()} MAD`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h1 className="font-display text-3xl font-light text-white">
          Réseau apporteurs
        </h1>
        <p className="font-ui text-sm text-white/60 mt-1.5">
          Les hôtels partenaires qui vous envoient des clients — ce que chacun
          apporte, ce que vous lui reversez
        </p>
      </div>

      {/* KPI */}
      <StatStrip stats={stats} />

      {/* Recherche (utile seulement quand le réseau grandit) */}
      {referrers.length > 5 && (
        <div className="relative max-w-sm">
          <Search
            size={15}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="Rechercher un hôtel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="font-ui w-full pl-9 pr-4 py-2.5 backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-400/40 transition-colors"
          />
        </div>
      )}

      {/* Cartes apporteurs / état vide */}
      {referrers.length === 0 ? (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
            <Building2 size={26} strokeWidth={1.5} className="text-blue-400" />
          </div>
          <h2 className="font-display text-xl font-normal text-white mb-2">
            Aucun hôtel ne vous a encore envoyé de client
          </h2>
          <p className="font-ui text-sm text-white/50 max-w-md mx-auto">
            Dès qu&apos;un client réserve chez vous en scannant le QR code
            d&apos;un hôtel partenaire, l&apos;apporteur apparaît ici avec ses
            sorties, le chiffre d&apos;affaires apporté et les commissions
            reversées.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <Users size={36} strokeWidth={1} className="mx-auto text-white/15 mb-3" />
          <p className="font-ui text-sm text-white/30">
            Aucun apporteur ne correspond à « {searchQuery} »
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div
              key={r.referrer_id}
              className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-5 transition-colors hover:bg-white/[0.07]"
            >
              {/* En-tête : identité + note moyenne */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-blue-400/15 flex items-center justify-center">
                    <span className="font-ui text-sm font-semibold text-blue-400">
                      {initialsOf(r.referrer_name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-ui text-sm font-medium text-white truncate">
                      {r.referrer_name}
                    </p>
                    <p className="font-ui text-[0.6875rem] text-white/35">
                      Hôtel partenaire
                    </p>
                  </div>
                </div>
                {r.avg_rating !== null && (
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    title="Note moyenne laissée par les clients envoyés"
                  >
                    <RatingStars value={Number(r.avg_rating)} size={12} />
                    <span className="font-ui text-xs text-white/50 tabular-nums">
                      {Number(r.avg_rating).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Chiffres */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="font-ui text-[0.5625rem] text-white/25 uppercase tracking-wider">
                    Sorties
                  </p>
                  <p className="font-display text-lg font-light text-white mt-0.5 tabular-nums">
                    {Number(r.reservations).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="font-ui text-[0.5625rem] text-white/25 uppercase tracking-wider">
                    Couverts
                  </p>
                  <p className="font-display text-lg font-light text-white mt-0.5 tabular-nums">
                    {Number(r.covers).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="font-ui text-[0.5625rem] text-white/25 uppercase tracking-wider">
                    CA apporté
                  </p>
                  <p className="font-display text-sm font-light text-white mt-1 tabular-nums whitespace-nowrap">
                    {Number(r.revenue).toLocaleString()} MAD
                  </p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3">
                  <p className="font-ui text-[0.5625rem] text-white/25 uppercase tracking-wider">
                    Commission reversée
                  </p>
                  <p className="font-display text-sm font-light text-amber-400 mt-1 tabular-nums whitespace-nowrap">
                    {Number(r.commissions).toLocaleString()} MAD
                  </p>
                </div>
              </div>

              {/* Pied : dernière sortie + contact */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 font-ui text-xs text-white/40">
                  <CalendarDays
                    size={13}
                    strokeWidth={1.5}
                    className="text-white/25"
                  />
                  Dernière sortie le{" "}
                  {new Date(
                    r.last_reservation + "T00:00:00"
                  ).toLocaleDateString("fr-FR")}
                </div>
                <button
                  onClick={() =>
                    router.push(`/dashboard/messages?with=${r.referrer_id}`)
                  }
                  className="font-ui flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/20 rounded-xl text-xs font-medium text-blue-400 transition-colors shrink-0"
                >
                  <Send size={13} strokeWidth={1.5} />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note de périmètre */}
      <p className="font-ui flex items-start gap-2 text-xs text-white/40 max-w-2xl">
        <Globe size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
        Seules les sorties apportées par le réseau (QR hôtel) figurent ici —
        annulations et no-show exclus. Les canaux direct (portail) et maison,
        sans commission, n&apos;y apparaissent pas.
      </p>
    </div>
  );
}
