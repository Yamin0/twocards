"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { StatStrip } from "@/components/shared/stat-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/hooks/use-toast";
import {
  MiniBars,
  RatingStars,
  weeklySeries,
} from "@/components/shared/mini-charts";
import {
  QrCode,
  Users,
  Check,
  Pencil,
  Loader2,
  Info,
  Link2,
  X,
} from "lucide-react";

export default function VenueQrReservationsPage() {
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();
  const { toast, showToast } = useToast();
  /* Saisie locale du montant, par réservation. Les mises à jour confirmées
     sont fusionnées dans `overrides` : la liste reste juste même si le
     canal temps réel tarde à répercuter l'UPDATE. */
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<
    Record<string, Partial<VenueQrReservation>>
  >({});
  /* Avis ouvert en modale au clic sur les étoiles. */
  const [reviewOf, setReviewOf] = useState<VenueQrReservation | null>(null);
  /* Tables du plan de salle, pour assigner une réservation à une table. */
  const [venueTables, setVenueTables] = useState<
    { id: number; label: string; vip: boolean }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("venue_tables")
      .select("id, label, vip")
      .order("label", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setVenueTables(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || loadingData || reservations === null)
    return <TableSkeleton />;

  const rows = reservations.map((r) => ({ ...r, ...overrides[r.id] }));
  const awaiting = rows.filter(
    (r) => r.amount_spent === null && r.status !== "annulée"
  ).length;
  const revenue = rows.reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);
  const commissions = rows
    .filter((r) => r.status !== "annulée")
    .reduce((sum, r) => sum + r.commission, 0);
  const rated = rows.filter((r) => r.rating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : null;
  const lastComments = rated
    .filter((r) => r.rating_comment)
    .slice(0, 2);
  const weekly = weeklySeries(rows.map((r) => r.created_at));

  const assignTable = async (r: VenueQrReservation, tableId: number | null) => {
    setOverrides((prev) => ({ ...prev, [r.id]: { ...prev[r.id], table_id: tableId } }));
    const { error } = await createClient()
      .from("qr_reservations")
      .update({ table_id: tableId })
      .eq("id", r.id);
    if (error) {
      showToast("Impossible d'assigner la table");
      setOverrides((prev) => ({ ...prev, [r.id]: { ...prev[r.id], table_id: r.table_id } }));
      return;
    }
    const t = venueTables.find((x) => x.id === tableId);
    showToast(t ? `Table ${t.label} assignée — visible sur le plan de salle` : "Table retirée");
  };

  const copyRatingLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/avis/${id}`);
      showToast("Lien d'avis copié — envoyez-le au client");
    } catch {
      showToast("Impossible de copier le lien");
    }
  };

  const saveAmount = async (r: VenueQrReservation) => {
    const raw = (editing[r.id] ?? "").replace(",", ".").trim();
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount < 0) {
      showToast("Montant invalide");
      return;
    }
    setSavingId(r.id);
    /* Seules colonnes accordées à l'établissement : amount_spent et status.
       La commission est recalculée par le trigger, jamais envoyée. */
    const { data, error } = await createClient()
      .from("qr_reservations")
      .update({ amount_spent: amount, status: "confirmée" })
      .eq("id", r.id)
      .select("amount_spent, commission, status")
      .single();
    setSavingId(null);
    if (error || !data) {
      showToast("Impossible d'enregistrer le montant");
      return;
    }
    setOverrides((prev) => ({ ...prev, [r.id]: data }));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[r.id];
      return next;
    });
    showToast(`Montant enregistré — ${data.commission.toLocaleString()} MAD reversés`);
  };

  const stats = [
    { label: "Sorties reçues", value: rows.length },
    { label: "En attente de montant", value: awaiting },
    { label: "CA saisi", value: `${revenue.toLocaleString()} MAD` },
    {
      label: "Commissions reversées",
      value: `${commissions.toLocaleString()} MAD`,
    },
  ];

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="font-display text-3xl font-light text-white">
          Réservations
        </h1>
        <p className="font-ui text-sm text-white/60 mt-1.5">
          Clients envoyés par les hôtels partenaires — saisissez le montant en
          fin de sortie
        </p>
      </div>

      {/* Bandeau KPI */}
      <div className="px-4 sm:px-6 pb-6">
        <StatStrip stats={stats} />
      </div>

      {/* Analyses : demande et satisfaction, à la SevenRooms */}
      {rows.length > 0 && (
        <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white/[0.07] rounded-xl border border-white/10 p-5">
            <h2 className="font-display text-lg font-normal text-white mb-1">
              Sorties par semaine
            </h2>
            <p className="text-xs text-white/40 font-ui mb-4">
              8 dernières semaines
            </p>
            <MiniBars data={weekly} color="bg-purple-400/70" />
          </div>
          <div className="bg-white/[0.07] rounded-xl border border-white/10 p-5">
            <h2 className="font-display text-lg font-normal text-white mb-3">
              Satisfaction client
            </h2>
            {avgRating !== null ? (
              <>
                <div className="flex items-center gap-3">
                  <p className="font-display text-4xl font-light text-white">
                    {avgRating.toFixed(1).replace(".", ",")}
                    <span className="text-lg text-white/40">/5</span>
                  </p>
                  <div>
                    <RatingStars value={avgRating} />
                    <p className="text-[10px] text-white/40 font-ui mt-0.5">
                      {rated.length} avis client{rated.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {lastComments.map((r) => (
                  <p
                    key={r.id}
                    className="mt-3 text-xs italic text-white/50 font-ui border-l-2 border-white/15 pl-3"
                  >
                    « {r.rating_comment} » — {r.guest_name}
                  </p>
                ))}
              </>
            ) : (
              <p className="text-xs text-white/40 font-ui">
                Aucun avis pour le moment. Après la sortie, copiez le lien
                d&apos;avis depuis le tableau et envoyez-le au client par
                WhatsApp — sa note apparaîtra ici.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Table / empty state */}
      <div className="px-4 sm:px-6 pb-4">
        {rows.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Aucune réservation QR pour le moment
            </h2>
            <p className="text-sm text-white/50 font-ui max-w-md mx-auto">
              Quand un client d&apos;hôtel réserve chez vous via un QR code
              twocards, la réservation apparaît ici instantanément.
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Client", "Date", "Pers.", "Note", "Table", "Statut", "Montant dépensé", "Commission", "Avis"].map(
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
                {rows.map((r) => {
                  const isEditing =
                    editing[r.id] !== undefined || r.amount_spent === null;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-ui">
                          {r.guest_name}
                          {r.source === "portal" && (
                            <span className="font-ui ml-2 rounded-md bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-300 align-middle">
                              direct
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/40 font-ui">
                          {r.guest_phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70 font-ui whitespace-nowrap">
                        {new Date(
                          r.reservation_date + "T00:00:00"
                        ).toLocaleDateString("fr-FR")}
                        {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70 font-ui">
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} strokeWidth={1.5} />
                          {r.party_size}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50 font-ui max-w-[180px] truncate">
                        {r.notes ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "annulée" ? (
                          <span className="text-sm text-white/30">—</span>
                        ) : (
                          <select
                            value={r.table_id ?? ""}
                            onChange={(e) =>
                              assignTable(
                                r,
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            aria-label={`Table pour ${r.guest_name}`}
                            className="font-ui rounded-lg bg-white/[0.07] border border-white/10 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40 [&>option]:bg-[#10131f]"
                          >
                            <option value="">— aucune —</option>
                            {venueTables.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.vip ? "VIP " : "Table "}
                                {t.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.status === "annulée" ? (
                          <span className="text-sm text-white/40">—</span>
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={editing[r.id] ?? ""}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [r.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveAmount(r);
                              }}
                              className="w-24 px-3 py-1.5 bg-white/[0.07] rounded-lg text-sm text-white text-right font-ui placeholder:text-white/30 focus:ring-1 focus:ring-white/40 focus:outline-none"
                            />
                            <span className="text-xs text-white/40">MAD</span>
                            <button
                              onClick={() => saveAmount(r)}
                              disabled={savingId === r.id}
                              aria-label={`Valider le montant pour ${r.guest_name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                            >
                              {savingId === r.id ? (
                                <Loader2
                                  size={14}
                                  strokeWidth={2}
                                  className="animate-spin"
                                />
                              ) : (
                                <Check size={14} strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-ui">
                              {(r.amount_spent ?? 0).toLocaleString()} MAD
                            </span>
                            {r.amount_source === "pos" && (
                              <span className="font-ui rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300">
                                caisse
                              </span>
                            )}
                            <button
                              onClick={() =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [r.id]: String(r.amount_spent ?? ""),
                                }))
                              }
                              aria-label={`Modifier le montant pour ${r.guest_name}`}
                              className="p-1 text-white/30 hover:text-white/70 transition-colors"
                            >
                              <Pencil size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-purple-300 font-ui whitespace-nowrap">
                        {r.commission > 0
                          ? `${r.commission.toLocaleString()} MAD`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.rating !== null ? (
                          <button
                            onClick={() => setReviewOf(r)}
                            aria-label={`Lire l'avis de ${r.guest_name}`}
                            className="rounded-lg p-1 -m-1 transition-colors hover:bg-white/10"
                          >
                            <RatingStars value={r.rating} size={12} />
                          </button>
                        ) : r.status === "confirmée" ? (
                          <button
                            onClick={() => copyRatingLink(r.id)}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors font-ui"
                          >
                            <Link2 size={12} strokeWidth={1.5} />
                            Lien d&apos;avis
                          </button>
                        ) : (
                          <span className="text-sm text-white/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modèle énoncé */}
      <div className="px-4 sm:px-6 pb-8">
        <p className="flex items-start gap-2 text-xs text-white/40 font-ui max-w-2xl">
          <Info size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          Saisir le montant confirme la sortie et calcule automatiquement la
          commission reversée à l&apos;apporteur ({""}
          {rows[0] ? Math.round(rows[0].commission_rate * 100) : 10}&nbsp;% du
          montant). Le montant reste modifiable en cas d&apos;erreur.
        </p>
      </div>

      {/* Avis en modale */}
      {reviewOf && reviewOf.rating !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setReviewOf(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-[#10131f]/95 backdrop-blur-2xl p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Avis client
                </p>
                <h3 className="font-display mt-1 text-2xl font-light text-white">
                  {reviewOf.guest_name}
                </h3>
                <p className="font-ui text-xs text-white/40 mt-0.5">
                  Sortie du{" "}
                  {new Date(
                    reviewOf.reservation_date + "T00:00:00"
                  ).toLocaleDateString("fr-FR")}
                  {" · "}
                  {reviewOf.party_size} pers.
                </p>
              </div>
              <button
                onClick={() => setReviewOf(null)}
                aria-label="Fermer"
                className="rounded-lg p-1 text-white/40 transition-colors hover:text-white"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <p className="font-display text-4xl font-light text-white">
                {reviewOf.rating}
                <span className="text-lg text-white/40">/5</span>
              </p>
              <RatingStars value={reviewOf.rating} size={18} />
            </div>
            {reviewOf.rating_comment ? (
              <p className="font-ui mt-5 border-l-2 border-amber-400/40 pl-4 text-sm italic leading-relaxed text-white/75">
                « {reviewOf.rating_comment} »
              </p>
            ) : (
              <p className="font-ui mt-5 text-xs text-white/40">
                Le client n&apos;a pas laissé de commentaire.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/15 text-white px-4 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
