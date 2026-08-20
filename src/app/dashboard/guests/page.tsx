"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { StatStrip } from "@/components/shared/stat-strip";
import { RatingStars } from "@/components/shared/mini-charts";
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  Download,
  Search,
  Users,
} from "lucide-react";

/* CRM clients dérivé des réservations : pas de table clients à part, un
   client = un numéro de téléphone vu dans qr_reservations (la RLS limite
   déjà aux réservations de l'établissement connecté). Tout est recalculé
   à partir des lignes réelles — aucune donnée de démo. */

/* ---------- Dérivation ---------- */

/* Clé d'identité d'un client : téléphone sans espaces/points/tirets,
   le + initial conservé. */
function normalizePhone(raw: string) {
  return raw.replace(/[\s.\-]/g, "");
}

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isCancelled = (r: VenueQrReservation) =>
  r.status === "annulée" || (r.status as string) === "no-show";

/* Une visite : réservation non annulée déjà passée, ou dont le montant
   dépensé est connu (le client est bien venu). */
const isVisit = (r: VenueQrReservation, today: string) =>
  !isCancelled(r) && (r.reservation_date < today || r.amount_spent !== null);

const isUpcoming = (r: VenueQrReservation, today: string) =>
  !isCancelled(r) && r.reservation_date >= today && r.amount_spent === null;

type GuestProfile = {
  id: string;
  name: string;
  phone: string;
  visits: number;
  totalSpent: number;
  avgBasket: number | null;
  lastVisit: string | null;
  nextReservation: VenueQrReservation | null;
  avgRating: number | null;
  sources: string[];
  firstSeen: string;
  segments: string[];
};

function sourceLabel(source: string) {
  if (source === "qr") return "Réseau QR";
  if (source === "portal") return "Portail";
  if (source === "venue") return "Sur place";
  return source;
}

const DAY_MS = 86_400_000;

function buildGuests(reservations: VenueQrReservation[]): GuestProfile[] {
  const today = localToday();
  const byPhone = new Map<string, VenueQrReservation[]>();
  for (const r of reservations) {
    const key = normalizePhone(r.guest_phone ?? "");
    if (!key) continue;
    const list = byPhone.get(key);
    if (list) list.push(r);
    else byPhone.set(key, [r]);
  }

  const guests: GuestProfile[] = [];
  for (const [phone, rows] of byPhone) {
    const latest = rows.reduce((a, b) => (a.created_at >= b.created_at ? a : b));
    const visits = rows.filter((r) => isVisit(r, today));
    const spentRows = rows.filter(
      (r) => !isCancelled(r) && r.amount_spent !== null
    );
    const totalSpent = spentRows.reduce((s, r) => s + (r.amount_spent ?? 0), 0);
    const rated = rows.filter((r) => r.rating !== null);
    const upcoming = rows
      .filter((r) => isUpcoming(r, today))
      .sort((a, b) => (a.reservation_date < b.reservation_date ? -1 : 1));
    const lastVisit =
      visits.length > 0
        ? visits.reduce((m, r) => (r.reservation_date > m ? r.reservation_date : m), visits[0].reservation_date)
        : null;

    guests.push({
      id: phone,
      name: latest.guest_name,
      phone,
      visits: visits.length,
      totalSpent,
      avgBasket: spentRows.length > 0 ? totalSpent / spentRows.length : null,
      lastVisit,
      nextReservation: upcoming[0] ?? null,
      avgRating:
        rated.length > 0
          ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
          : null,
      sources: [...new Set(rows.map((r) => r.source as string))],
      firstSeen: rows.reduce(
        (m, r) => (r.created_at < m ? r.created_at : m),
        rows[0].created_at
      ),
      segments: [],
    });
  }

  /* Seuil VIP : le top 10 % des totaux dépensés (au moins un client dès
     qu'un montant existe) — calculé, pas décrété. */
  const totals = guests
    .map((g) => g.totalSpent)
    .filter((t) => t > 0)
    .sort((a, b) => b - a);
  const vipThreshold =
    totals.length > 0
      ? totals[Math.max(0, Math.ceil(totals.length * 0.1) - 1)]
      : Infinity;

  const now = Date.now();
  for (const g of guests) {
    if (g.totalSpent > 0 && g.totalSpent >= vipThreshold)
      g.segments.push("VIP");
    if (g.visits >= 3) {
      g.segments.push("Habitué");
      if (
        g.lastVisit &&
        now - new Date(g.lastVisit + "T00:00:00").getTime() >= 60 * DAY_MS
      )
        g.segments.push("À risque");
    } else if (g.visits === 1) {
      g.segments.push("Nouveau");
    }
  }
  return guests;
}

/* ---------- Présentation ---------- */

const SEGMENT_STYLES: Record<string, string> = {
  VIP: "bg-amber-400/15 text-amber-400 border-amber-400/20",
  Habitué: "bg-emerald-500/15 text-emerald-400 border-emerald-400/20",
  Nouveau: "bg-blue-500/15 text-blue-300 border-blue-400/20",
  "À risque": "bg-red-500/15 text-red-400 border-red-400/20",
};

function SegmentBadges({ segments }: { segments: string[] }) {
  if (segments.length === 0) return <span className="text-white/25">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {segments.map((s) => (
        <span
          key={s}
          className={`font-ui inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEGMENT_STYLES[s] ?? "bg-white/10 text-white/50 border-white/10"}`}
        >
          {s}
        </span>
      ))}
    </span>
  );
}

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function exportCsv(guests: GuestProfile[]) {
  const header = [
    "Nom",
    "Téléphone",
    "Visites",
    "Total dépensé (MAD)",
    "Panier moyen (MAD)",
    "Dernière visite",
    "Prochaine réservation",
    "Note moyenne",
    "Segments",
    "Canaux",
  ];
  const lines = guests.map((g) =>
    [
      g.name,
      g.phone,
      g.visits,
      g.totalSpent,
      g.avgBasket !== null ? Math.round(g.avgBasket) : "",
      g.lastVisit ?? "",
      g.nextReservation?.reservation_date ?? "",
      g.avgRating !== null ? g.avgRating.toFixed(1) : "",
      g.segments.join(", "),
      g.sources.map(sourceLabel).join(", "),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type SortField = "visites" | "depense" | "derniereVisite";
const SEGMENT_FILTERS = ["VIP", "Habitué", "Nouveau", "À risque"] as const;

export default function GuestsPage() {
  const router = useRouter();
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("derniereVisite");
  const [sortAsc, setSortAsc] = useState(false);

  const guests = useMemo(
    () => buildGuests(reservations ?? []),
    [reservations]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qPhone = normalizePhone(searchQuery.trim());
    let result = guests.filter((g) => {
      if (segmentFilter && !g.segments.includes(segmentFilter)) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        (qPhone.length > 0 && g.phone.includes(qPhone))
      );
    });
    const dir = sortAsc ? 1 : -1;
    result = [...result].sort((a, b) => {
      if (sortField === "visites") return (a.visits - b.visits) * dir;
      if (sortField === "depense") return (a.totalSpent - b.totalSpent) * dir;
      /* Dernière visite : les clients sans visite passent toujours en fin. */
      if (a.lastVisit === null && b.lastVisit === null) return 0;
      if (a.lastVisit === null) return 1;
      if (b.lastVisit === null) return -1;
      return a.lastVisit < b.lastVisit ? -dir : a.lastVisit > b.lastVisit ? dir : 0;
    });
    return result;
  }, [guests, searchQuery, segmentFilter, sortField, sortAsc]);

  if (isLoading || loadingData || reservations === null)
    return <TableSkeleton cols={7} />;

  /* KPI réels */
  const now = new Date();
  const newThisMonth = guests.filter((g) => {
    const d = new Date(g.firstSeen);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;
  const allRated = reservations.filter((r) => r.rating !== null);
  const globalRating =
    allRated.length > 0
      ? allRated.reduce((s, r) => s + (r.rating ?? 0), 0) / allRated.length
      : null;
  const visited = guests.filter((g) => g.visits >= 1);
  const returning = guests.filter((g) => g.visits >= 2);
  const returnRate =
    visited.length > 0
      ? Math.round((returning.length / visited.length) * 100)
      : null;

  const stats = [
    { label: "Clients uniques", value: guests.length },
    { label: "Nouveaux ce mois", value: newThisMonth },
    {
      label: "Note moyenne",
      value: globalRating !== null ? globalRating.toFixed(1).replace(".", ",") : "—",
      hint:
        allRated.length > 0
          ? `${allRated.length} avis`
          : "aucun avis pour le moment",
    },
    {
      label: "Clients qui reviennent",
      value: returnRate !== null ? `${returnRate}%` : "—",
      hint:
        visited.length > 0
          ? `${returning.length} sur ${visited.length} clients venus`
          : undefined,
    },
  ];

  const sortButton = (field: SortField, label: string) => {
    const active = sortField === field;
    return (
      <button
        key={field}
        onClick={() => {
          if (active) setSortAsc(!sortAsc);
          else {
            setSortField(field);
            setSortAsc(false);
          }
        }}
        className={`font-ui inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${active ? "bg-blue-500 text-white" : "bg-white/[0.07] text-white/50 border border-white/[0.1] hover:bg-white/[0.1]"}`}
      >
        {label}
        {active &&
          (sortAsc ? (
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          ))}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-white">
            Clients
          </h1>
          <p className="font-ui text-sm text-white/60 mt-1.5">
            Votre base clients, construite automatiquement à partir des
            réservations — un client naît d&apos;une réservation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/reservations"
            className="font-ui flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <CalendarPlus size={16} strokeWidth={1.5} />
            Réservations
          </Link>
          {filtered.length > 0 && (
            <button
              onClick={() => exportCsv(filtered)}
              className="font-ui flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              <Download size={16} strokeWidth={1.5} />
              Exporter CSV
            </button>
          )}
        </div>
      </div>

      {/* KPI */}
      <StatStrip stats={stats} />

      {/* Recherche */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="Rechercher un client par nom ou téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="font-ui w-full bg-white/[0.05] border border-white/[0.1] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors"
        />
      </div>

      {/* Segments + tris */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSegmentFilter(null)}
            className={`font-ui rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${segmentFilter === null ? "bg-white text-black" : "bg-white/[0.07] text-white/50 border border-white/[0.1] hover:bg-white/[0.1]"}`}
          >
            Tous · {guests.length}
          </button>
          {SEGMENT_FILTERS.map((s) => {
            const count = guests.filter((g) => g.segments.includes(s)).length;
            return (
              <button
                key={s}
                onClick={() =>
                  setSegmentFilter(segmentFilter === s ? null : s)
                }
                className={`font-ui rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${segmentFilter === s ? "bg-white text-black" : "bg-white/[0.07] text-white/50 border border-white/[0.1] hover:bg-white/[0.1]"}`}
              >
                {s} · {count}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="font-ui text-[10px] uppercase tracking-wider text-white/30">
            Trier
          </span>
          {sortButton("derniereVisite", "Dernière visite")}
          {sortButton("visites", "Visites")}
          {sortButton("depense", "Dépense totale")}
        </div>
      </div>

      {/* Table / état vide */}
      {guests.length === 0 ? (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
            <Users size={26} strokeWidth={1.5} className="text-blue-400" />
          </div>
          <h2 className="font-display text-xl font-normal text-white mb-2">
            Aucun client pour le moment
          </h2>
          <p className="font-ui text-sm text-white/50 max-w-md mx-auto">
            Votre base clients se construit toute seule : dès qu&apos;une
            réservation arrive — QR du réseau ou portail direct — le client
            apparaît ici avec ses visites, ses dépenses et ses avis.
          </p>
          <Link
            href="/dashboard/reservations"
            className="font-ui inline-flex items-center gap-2 mt-6 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <CalendarPlus size={16} strokeWidth={1.5} />
            Voir les réservations
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-10 text-center">
          <p className="font-ui text-sm text-white/50">
            Aucun client ne correspond à cette recherche.
          </p>
        </div>
      ) : (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  "Client",
                  "Visites",
                  "Total dépensé",
                  "Panier moyen",
                  "Dernière visite",
                  "Prochaine résa",
                  "Note",
                  "Canaux",
                  "Segment",
                ].map((h) => (
                  <th
                    key={h}
                    className="font-ui px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr
                  key={g.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/guests/${encodeURIComponent(g.id)}`
                    )
                  }
                  className="border-b border-white/[0.06] last:border-0 cursor-pointer hover:bg-white/[0.06] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-ui text-sm font-medium text-white">
                      {g.name}
                    </p>
                    <p className="font-ui text-xs text-white/40">{g.phone}</p>
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white tabular-nums">
                    {g.visits}
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white tabular-nums whitespace-nowrap">
                    {g.totalSpent > 0
                      ? `${g.totalSpent.toLocaleString()} MAD`
                      : "—"}
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white/70 tabular-nums whitespace-nowrap">
                    {g.avgBasket !== null
                      ? `${Math.round(g.avgBasket).toLocaleString()} MAD`
                      : "—"}
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                    {g.lastVisit ? fmtDate(g.lastVisit) : "—"}
                  </td>
                  <td className="font-ui px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                    {g.nextReservation
                      ? fmtDate(g.nextReservation.reservation_date)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {g.avgRating !== null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <RatingStars value={g.avgRating} size={12} />
                        <span className="font-ui text-xs text-white/60 tabular-nums">
                          {g.avgRating.toFixed(1)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {g.sources.map((s) => (
                        <span
                          key={s}
                          className="font-ui rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50 whitespace-nowrap"
                        >
                          {sourceLabel(s)}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SegmentBadges segments={g.segments} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lecture des segments */}
      {guests.length > 0 && (
        <p className="font-ui text-xs text-white/40 max-w-3xl">
          Segments calculés sur vos réservations réelles : « Nouveau » = 1
          visite, « Habitué » = 3 visites ou plus, « À risque » = habitué sans
          visite depuis 60 jours, « VIP » = top 10 % des dépenses totales.
        </p>
      )}
    </div>
  );
}
