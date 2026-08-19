"use client";

import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useHotelReservations,
  type HotelReservation,
} from "@/hooks/use-hotel-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { StatStripThree } from "@/components/shared/stat-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, QrCode, Info } from "lucide-react";

const FILTERS = ["toutes", "confirmée", "en attente", "annulée"] as const;

const formatDate = (r: HotelReservation) =>
  new Date(r.reservation_date + "T00:00:00").toLocaleDateString("fr-FR") +
  (r.reservation_time ? ` · ${r.reservation_time}` : "");

export default function HotelReservationsPage() {
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useHotelReservations();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("toutes");
  const [search, setSearch] = useState("");

  if (isLoading || loadingData || reservations === null)
    return <TableSkeleton />;

  const searchLower = search.toLowerCase();
  const filtered = reservations.filter((r) => {
    const matchesFilter = filter === "toutes" || r.status === filter;
    const matchesSearch =
      !search ||
      r.guest_name.toLowerCase().includes(searchLower) ||
      r.venue_name.toLowerCase().includes(searchLower) ||
      (r.qr_label ?? "").toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const confirmed = reservations.filter((r) => r.status === "confirmée").length;
  const pending = reservations.filter((r) => r.status === "en attente").length;

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-white">
            Réservations
          </h1>
          <p className="font-ui text-sm text-white/60 mt-1.5">
            Sorties réservées par vos clients après un scan — mise à jour en
            temps réel
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
            placeholder="Client, sortie, chambre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/[0.05] rounded-full text-sm text-white font-ui placeholder:text-white/30 focus:ring-1 focus:ring-white/30 focus:outline-none w-56"
          />
        </div>
      </div>

      {/* Bandeau KPI */}
      <div className="px-4 sm:px-6 pb-6">
        <StatStripThree
          stats={[
            { label: "Total", value: reservations.length },
            { label: "Confirmées", value: confirmed },
            { label: "En attente", value: pending },
          ]}
        />
      </div>

      {/* Filtres */}
      <div className="px-4 sm:px-6 pb-4">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as (typeof FILTERS)[number])}
        >
          <TabsList className="bg-black/30 border border-white/10 backdrop-blur-xl">
            {FILTERS.map((f) => (
              <TabsTrigger
                key={f}
                value={f}
                className="font-ui capitalize text-white/55 data-[selected]:bg-white/15 data-[selected]:text-white"
              >
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table / empty state */}
      <div className="px-4 sm:px-6 pb-4">
        {filtered.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-ui mb-2">
              {reservations.length === 0
                ? "Aucune réservation pour le moment"
                : "Aucune réservation ne correspond"}
            </h2>
            <p className="text-sm text-white/50 font-ui max-w-md mx-auto">
              {reservations.length === 0
                ? "Dès qu'un client scanne l'un de vos QR codes et réserve une sortie, elle apparaît ici instantanément avec la chambre d'origine."
                : "Essayez un autre filtre ou une autre recherche."}
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Client", "Chambre", "Sortie", "Date", "Pers.", "Statut", "Commission"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 font-ui"
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
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-ui">
                        {r.guest_name}
                      </p>
                      <p className="text-xs text-white/40 font-ui">
                        {r.guest_phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-ui">
                      {r.qr_label ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white/80 font-ui">
                        {r.venue_name}
                      </p>
                      <p className="text-xs text-white/40 font-ui">
                        {r.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-ui whitespace-nowrap">
                      {formatDate(r)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-ui">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} strokeWidth={1.5} />
                        {r.party_size}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-ui whitespace-nowrap">
                      {r.commission > 0
                        ? `${r.commission.toLocaleString()} MAD`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modèle en lecture seule, assumé */}
      <div className="px-4 sm:px-6 pb-8">
        <p className="flex items-start gap-2 text-xs text-white/40 font-ui max-w-2xl">
          <Info size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          La confirmation se fait directement entre le client et
          l&apos;établissement. Statut et montant dépensé sont mis à jour par
          twocards — votre commission (10&nbsp;% du montant dépensé) se calcule
          automatiquement dès que le montant est renseigné.
        </p>
      </div>
    </div>
  );
}
