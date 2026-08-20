"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { StatStrip } from "@/components/shared/stat-strip";
import { RatingStars } from "@/components/shared/mini-charts";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  Phone,
  StickyNote,
  UserX,
  Users,
} from "lucide-react";

/* Fiche client dérivée des réservations : l'identifiant de la route est le
   téléphone normalisé (encodeURIComponent), la fiche agrège toutes les
   réservations de ce numéro — la RLS limite déjà aux réservations de
   l'établissement connecté. Aucune donnée de démo. */

/* ---------- Dérivation (mêmes règles que la liste) ---------- */

const normalizePhone = (raw: string) => raw.replace(/[\s.\-]/g, "");

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isCancelled = (r: VenueQrReservation) =>
  r.status === "annulée" || (r.status as string) === "no-show";

const isVisit = (r: VenueQrReservation, today: string) =>
  !isCancelled(r) && (r.reservation_date < today || r.amount_spent !== null);

const isUpcoming = (r: VenueQrReservation, today: string) =>
  !isCancelled(r) && r.reservation_date >= today && r.amount_spent === null;

const DAY_MS = 86_400_000;

/* Segments du client, calculés sur l'ensemble des réservations de
   l'établissement (le seuil VIP est relatif au reste de la clientèle). */
function computeSegments(
  all: VenueQrReservation[],
  phone: string
): string[] {
  const today = localToday();
  const totals = new Map<string, number>();
  for (const r of all) {
    const key = normalizePhone(r.guest_phone ?? "");
    if (!key || isCancelled(r) || r.amount_spent === null) continue;
    totals.set(key, (totals.get(key) ?? 0) + r.amount_spent);
  }
  const sorted = [...totals.values()].filter((t) => t > 0).sort((a, b) => b - a);
  const vipThreshold =
    sorted.length > 0
      ? sorted[Math.max(0, Math.ceil(sorted.length * 0.1) - 1)]
      : Infinity;

  const rows = all.filter((r) => normalizePhone(r.guest_phone ?? "") === phone);
  const visits = rows.filter((r) => isVisit(r, today));
  const totalSpent = totals.get(phone) ?? 0;
  const lastVisit =
    visits.length > 0
      ? visits.reduce(
          (m, r) => (r.reservation_date > m ? r.reservation_date : m),
          visits[0].reservation_date
        )
      : null;

  const segments: string[] = [];
  if (totalSpent > 0 && totalSpent >= vipThreshold) segments.push("VIP");
  if (visits.length >= 3) {
    segments.push("Habitué");
    if (
      lastVisit &&
      Date.now() - new Date(lastVisit + "T00:00:00").getTime() >= 60 * DAY_MS
    )
      segments.push("À risque");
  } else if (visits.length === 1) {
    segments.push("Nouveau");
  }
  return segments;
}

/* ---------- Présentation ---------- */

const SEGMENT_STYLES: Record<string, string> = {
  VIP: "bg-amber-400/15 text-amber-400 border-amber-400/20",
  Habitué: "bg-emerald-500/15 text-emerald-400 border-emerald-400/20",
  Nouveau: "bg-blue-500/15 text-blue-300 border-blue-400/20",
  "À risque": "bg-red-500/15 text-red-400 border-red-400/20",
};

const sourceLabel = (source: string) => {
  if (source === "qr") return "Réseau QR";
  if (source === "portal") return "Portail";
  if (source === "venue") return "Sur place";
  return source;
};

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtTime = (t: string | null) => (t ? t.slice(0, 5).replace(":", "h") : "—");

export default function GuestProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const phone = normalizePhone(decodeURIComponent(id));

  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();

  const rows = useMemo(
    () =>
      (reservations ?? []).filter(
        (r) => normalizePhone(r.guest_phone ?? "") === phone
      ),
    [reservations, phone]
  );
  const segments = useMemo(
    () => computeSegments(reservations ?? [], phone),
    [reservations, phone]
  );

  if (isLoading || loadingData || reservations === null)
    return <DashboardSkeleton />;

  /* Client introuvable : aucune réservation ne porte ce numéro. */
  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/guests"
          className="font-ui inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour aux clients
        </Link>
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.07] border border-white/[0.12] flex items-center justify-center mx-auto mb-5">
            <UserX size={26} strokeWidth={1.5} className="text-white/50" />
          </div>
          <h1 className="font-display text-xl font-normal text-white mb-2">
            Client introuvable
          </h1>
          <p className="font-ui text-sm text-white/50 max-w-md mx-auto">
            Aucune réservation ne correspond à ce numéro pour votre
            établissement. La fiche a peut-être été ouverte depuis un ancien
            lien.
          </p>
        </div>
      </div>
    );
  }

  const today = localToday();
  const name = rows.reduce((a, b) =>
    a.created_at >= b.created_at ? a : b
  ).guest_name;
  const visits = rows.filter((r) => isVisit(r, today));
  const spentRows = rows.filter(
    (r) => !isCancelled(r) && r.amount_spent !== null
  );
  const totalSpent = spentRows.reduce((s, r) => s + (r.amount_spent ?? 0), 0);
  const rated = rows.filter((r) => r.rating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : null;

  const upcoming = rows
    .filter((r) => isUpcoming(r, today))
    .sort((a, b) => (a.reservation_date < b.reservation_date ? -1 : 1));
  const history = rows
    .filter((r) => !isUpcoming(r, today))
    .sort((a, b) =>
      a.reservation_date === b.reservation_date
        ? a.created_at < b.created_at
          ? 1
          : -1
        : a.reservation_date < b.reservation_date
          ? 1
          : -1
    );
  const clientNotes = rows
    .filter((r) => r.notes && r.notes.trim().length > 0)
    .sort((a, b) => (a.reservation_date < b.reservation_date ? 1 : -1));

  const initials = name
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    { label: "Visites", value: visits.length },
    {
      label: "Total dépensé",
      value: totalSpent > 0 ? `${totalSpent.toLocaleString()} MAD` : "—",
    },
    {
      label: "Panier moyen",
      value:
        spentRows.length > 0
          ? `${Math.round(totalSpent / spentRows.length).toLocaleString()} MAD`
          : "—",
    },
    {
      label: "Note moyenne",
      value: avgRating !== null ? avgRating.toFixed(1).replace(".", ",") : "—",
      hint: rated.length > 0 ? `${rated.length} avis` : "aucun avis",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Link
        href="/dashboard/guests"
        className="font-ui inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={1.5} />
        Retour aux clients
      </Link>

      {/* En-tête */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 flex flex-wrap items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-white/10 border border-white/[0.12] flex items-center justify-center shrink-0">
          <span className="font-ui text-xl font-semibold text-white">
            {initials || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-light text-white">
              {name}
            </h1>
            {segments.map((s) => (
              <span
                key={s}
                className={`font-ui inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEGMENT_STYLES[s] ?? "bg-white/10 text-white/50 border-white/10"}`}
              >
                {s}
              </span>
            ))}
          </div>
          <p className="font-ui mt-1 inline-flex items-center gap-1.5 text-sm text-white/50">
            <Phone size={13} strokeWidth={1.5} />
            {phone}
          </p>
        </div>
        <a
          href={`https://wa.me/${phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-ui inline-flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/20 text-emerald-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <MessageCircle size={16} strokeWidth={1.5} />
          Contacter sur WhatsApp
        </a>
      </div>

      {/* KPI */}
      <StatStrip stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Historique des visites */}
        <div className="xl:col-span-2 backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-ui text-base font-semibold text-white">
              Historique des visites
            </h2>
          </div>
          {history.length === 0 ? (
            <p className="font-ui px-5 pb-6 text-sm text-white/40">
              Pas encore de visite passée — la première réservation de ce
              client est à venir.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-y border-white/10 bg-white/[0.04]">
                    {["Date", "Heure", "Couverts", "Montant", "Statut", "Canal", "Avis"].map(
                      (h) => (
                        <th
                          key={h}
                          className="font-ui px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/50 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="font-ui px-4 py-3 text-sm text-white whitespace-nowrap">
                        {fmtDate(r.reservation_date)}
                      </td>
                      <td className="font-ui px-4 py-3 text-sm text-white/70 whitespace-nowrap">
                        {fmtTime(r.reservation_time)}
                      </td>
                      <td className="font-ui px-4 py-3 text-sm text-white/70 tabular-nums">
                        {r.party_size}
                      </td>
                      <td className="font-ui px-4 py-3 text-sm text-white tabular-nums whitespace-nowrap">
                        {r.amount_spent !== null
                          ? `${r.amount_spent.toLocaleString()} MAD`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-ui rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50 whitespace-nowrap">
                          {sourceLabel(r.source)}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[9rem]">
                        {r.rating !== null ? (
                          <div>
                            <RatingStars value={r.rating} size={12} />
                            {r.rating_comment && (
                              <p className="font-ui mt-1 text-xs text-white/50 leading-snug max-w-[16rem]">
                                « {r.rating_comment} »
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Réservations à venir */}
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-5">
            <h2 className="font-ui text-base font-semibold text-white mb-4">
              Réservations à venir
            </h2>
            {upcoming.length === 0 ? (
              <p className="font-ui text-sm text-white/40">
                Aucune réservation à venir pour ce client.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-ui text-sm font-medium text-white">
                        {fmtDate(r.reservation_date)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50 font-ui">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} strokeWidth={1.5} />
                          {fmtTime(r.reservation_time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} strokeWidth={1.5} />
                          {r.party_size} pers.
                        </span>
                        <span>{sourceLabel(r.source)}</span>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes laissées par le client */}
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-5">
            <h2 className="font-ui text-base font-semibold text-white mb-4 inline-flex items-center gap-2">
              <StickyNote size={15} strokeWidth={1.5} className="text-white/50" />
              Notes du client
            </h2>
            {clientNotes.length === 0 ? (
              <p className="font-ui text-sm text-white/40">
                Ce client n&apos;a laissé aucune note avec ses réservations.
              </p>
            ) : (
              <div className="space-y-3">
                {clientNotes.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white/[0.05] rounded-xl p-3"
                  >
                    <p className="font-ui text-xs text-white/40 mb-1">
                      {fmtDate(r.reservation_date)}
                    </p>
                    <p className="font-ui text-sm text-white/70 leading-relaxed">
                      {r.notes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
