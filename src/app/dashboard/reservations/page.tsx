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
  Globe,
  Phone,
  Plus,
  Search,
  LogIn,
  UserX,
  XCircle,
  RotateCcw,
  Minus,
} from "lucide-react";

const localISODate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

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
  /* Filtres : le tableau chargeait tout l'historique dans un seul bloc. */
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "today" | "upcoming" | "past">(
    "all"
  );
  /* Prise de réservation par l'établissement (téléphone, walk-in). */
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    phone: "",
    date: localISODate(),
    time: "",
    party: 2,
    tableId: "" as string,
    notes: "",
  });
  const [creating, setCreating] = useState(false);

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
  const isOut = (r: { status: string }) =>
    r.status === "annulée" || r.status === "no-show";
  const awaiting = rows.filter(
    (r) => r.amount_spent === null && !isOut(r)
  ).length;
  /* Même règle que l'accueil : une sortie annulée ou no-show ne compte ni
     dans le CA ni dans les commissions. */
  const revenue = rows
    .filter((r) => !isOut(r))
    .reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);
  const commissions = rows
    .filter((r) => !isOut(r))
    .reduce((sum, r) => sum + r.commission, 0);

  const todayIso = localISODate();
  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (scope === "today" && r.reservation_date !== todayIso) return false;
    if (scope === "upcoming" && r.reservation_date < todayIso) return false;
    if (scope === "past" && r.reservation_date >= todayIso) return false;
    if (query) {
      const q = query.trim().toLowerCase();
      if (
        !r.guest_name.toLowerCase().includes(q) &&
        !r.guest_phone.replace(/[\s.-]/g, "").includes(q.replace(/[\s.-]/g, ""))
      )
        return false;
    }
    return true;
  });
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
    /* Double réservation détectée : on n'interdit pas (le manager peut
       enchaîner deux services), mais on le dit. */
    const conflict =
      tableId !== null &&
      rows.some(
        (x) =>
          x.id !== r.id &&
          x.table_id === tableId &&
          x.reservation_date === r.reservation_date &&
          (x.reservation_time ?? "") === (r.reservation_time ?? "") &&
          !isOut(x)
      );
    showToast(
      !t
        ? "Table retirée"
        : conflict
          ? `Attention : la table ${t.label} a déjà une réservation à cette heure`
          : `Table ${t.label} assignée — visible sur le plan de salle`
    );
  };

  /* Changement de statut : optimiste, avec retour arrière si la base refuse. */
  const setStatus = async (
    r: VenueQrReservation,
    status: VenueQrReservation["status"]
  ) => {
    setOverrides((prev) => ({ ...prev, [r.id]: { ...prev[r.id], status } }));
    const { error } = await createClient()
      .from("qr_reservations")
      .update({ status })
      .eq("id", r.id);
    if (error) {
      setOverrides((prev) => ({
        ...prev,
        [r.id]: { ...prev[r.id], status: r.status },
      }));
      showToast("Impossible de changer le statut");
      return;
    }
    showToast(
      status === "annulée"
        ? "Réservation annulée"
        : status === "no-show"
          ? "No-show enregistré"
          : `Statut : ${status}`
    );
  };

  /* Check-in : l'heure d'arrivée est écrite en base, visible de tous les
     postes — plus un état local perdu au rechargement. */
  const checkIn = async (r: VenueQrReservation) => {
    const arrived_at = new Date().toISOString();
    setOverrides((prev) => ({ ...prev, [r.id]: { ...prev[r.id], arrived_at } }));
    const { error } = await createClient()
      .from("qr_reservations")
      .update({ arrived_at })
      .eq("id", r.id);
    if (error) {
      setOverrides((prev) => ({
        ...prev,
        [r.id]: { ...prev[r.id], arrived_at: null },
      }));
      showToast("Impossible d'enregistrer l'arrivée");
      return;
    }
    showToast(`${r.guest_name} — arrivée enregistrée`);
  };

  const createReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    const { error } = await createClient().rpc("venue_create_reservation", {
      p_guest_name: newForm.name,
      p_guest_phone: newForm.phone,
      p_date: newForm.date,
      p_time: newForm.time || null,
      p_party_size: newForm.party,
      p_notes: newForm.notes || null,
      p_table_id: newForm.tableId ? Number(newForm.tableId) : null,
    });
    setCreating(false);
    if (error) {
      showToast("Impossible de créer la réservation");
      return;
    }
    setShowNew(false);
    setNewForm({
      name: "",
      phone: "",
      date: localISODate(),
      time: "",
      party: 2,
      tableId: "",
      notes: "",
    });
    showToast("Réservation créée — visible sur le plan de salle");
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
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-white">
            Réservations
          </h1>
          <p className="font-ui text-sm text-white/60 mt-1.5">
            Tous vos canaux — QR hôtels, portail direct et prises au téléphone
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 px-4 py-2.5 text-sm font-medium text-white transition-colors shrink-0"
        >
          <Plus size={16} strokeWidth={2} />
          Nouvelle réservation
        </button>
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

      {/* Filtres : recherche, période, statut */}
      {rows.length > 0 && (
        <div className="px-4 sm:px-6 pb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou téléphone…"
              className="font-ui w-56 rounded-xl bg-white/[0.07] border border-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
            />
          </div>
          <div className="flex rounded-xl bg-white/[0.07] border border-white/10 p-0.5">
            {(
              [
                ["all", "Toutes"],
                ["today", "Aujourd'hui"],
                ["upcoming", "À venir"],
                ["past", "Passées"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className={`font-ui rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  scope === key
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrer par statut"
            className="font-ui rounded-xl bg-white/[0.07] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/40 [&>option]:bg-[#10131f]"
          >
            <option value="all">Tous les statuts</option>
            <option value="en attente">En attente</option>
            <option value="confirmée">Confirmée</option>
            <option value="annulée">Annulée</option>
            <option value="no-show">No-show</option>
          </select>
          {filtered.length !== rows.length && (
            <span className="font-ui text-xs text-white/40">
              {filtered.length} / {rows.length} réservations
            </span>
          )}
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
                  {["Client", "Date", "Pers.", "Note", "Table", "Statut", "Montant dépensé", "Commission", "Avis", ""].map(
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
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-sm text-white/40 font-ui"
                    >
                      Aucune réservation ne correspond aux filtres.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  /* La saisie ne s'ouvre plus toute seule : un montant
                     manquant affiche un bouton, pas un formulaire permanent. */
                  const isEditing = editing[r.id] !== undefined;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-ui">
                          {r.guest_name}
                          {/* Origine de la réservation : chaque ligne porte son badge */}
                          {r.source === "portal" ? (
                            <span
                              className="font-ui ml-2 inline-flex items-center gap-1 rounded-md bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-300 align-middle"
                              title="Réservation directe via le portail de l'établissement"
                            >
                              <Globe size={9} strokeWidth={2} />
                              direct
                            </span>
                          ) : r.source === "venue" ? (
                            <span
                              className="font-ui ml-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 align-middle"
                              title="Réservation prise par l'établissement (téléphone, walk-in)"
                            >
                              <Phone size={9} strokeWidth={2} />
                              maison
                            </span>
                          ) : (
                            <span
                              className="font-ui ml-2 inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300 align-middle"
                              title="Client envoyé par un hôtel partenaire via QR code"
                            >
                              <QrCode size={9} strokeWidth={2} />
                              QR hôtel
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
                        {r.arrived_at && !isOut(r) && (
                          <p className="font-ui mt-1 text-[10px] text-emerald-400/80">
                            arrivé à{" "}
                            {new Date(r.arrived_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
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
                        ) : r.amount_spent === null ? (
                          <button
                            onClick={() =>
                              setEditing((prev) => ({ ...prev, [r.id]: "" }))
                            }
                            className="font-ui inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-white/50 hover:border-white/40 hover:text-white transition-colors"
                          >
                            <Pencil size={12} strokeWidth={1.5} />
                            Saisir le montant
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-ui">
                              {r.amount_spent.toLocaleString()} MAD
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isOut(r) ? (
                            <button
                              onClick={() => setStatus(r, "confirmée")}
                              title="Rétablir la réservation"
                              aria-label={`Rétablir la réservation de ${r.guest_name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <RotateCcw size={13} strokeWidth={1.5} />
                            </button>
                          ) : (
                            <>
                              {r.status === "en attente" && (
                                <button
                                  onClick={() => setStatus(r, "confirmée")}
                                  title="Confirmer"
                                  aria-label={`Confirmer la réservation de ${r.guest_name}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-400/60 hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors"
                                >
                                  <Check size={14} strokeWidth={2} />
                                </button>
                              )}
                              {!r.arrived_at && (
                                <button
                                  onClick={() => checkIn(r)}
                                  title="Check-in — le client est arrivé"
                                  aria-label={`Check-in de ${r.guest_name}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-400/60 hover:bg-blue-500/15 hover:text-blue-400 transition-colors"
                                >
                                  <LogIn size={13} strokeWidth={1.5} />
                                </button>
                              )}
                              {!r.arrived_at && (
                                <button
                                  onClick={() => setStatus(r, "no-show")}
                                  title="No-show — le client n'est pas venu"
                                  aria-label={`No-show pour ${r.guest_name}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                  <UserX size={13} strokeWidth={1.5} />
                                </button>
                              )}
                              <button
                                onClick={() => setStatus(r, "annulée")}
                                title="Annuler la réservation"
                                aria-label={`Annuler la réservation de ${r.guest_name}`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                              >
                                <XCircle size={13} strokeWidth={1.5} />
                              </button>
                            </>
                          )}
                        </div>
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
          {Math.round(
            (rows.find((r) => r.commission_rate > 0)?.commission_rate ?? 0.1) *
              100
          )}
          &nbsp;% du montant pour les apports hôtel — les canaux direct et
          maison sont à 0&nbsp;%). Le montant reste modifiable en cas
          d&apos;erreur.
        </p>
      </div>

      {/* Nouvelle réservation — le téléphone sonne, le manager saisit. */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          />
          <form
            onSubmit={createReservation}
            className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-[#10131f]/95 backdrop-blur-2xl p-7 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Canal maison — 0 % commission
                </p>
                <h3 className="font-display mt-1 text-2xl font-light text-white">
                  Nouvelle réservation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                aria-label="Fermer"
                className="rounded-lg p-1 text-white/40 transition-colors hover:text-white"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={newForm.name}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom du client"
                required
                maxLength={120}
                className="font-ui w-full rounded-xl bg-white/[0.07] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              <input
                value={newForm.phone}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="Téléphone (facultatif pour un walk-in)"
                type="tel"
                maxLength={40}
                className="font-ui w-full rounded-xl bg-white/[0.07] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newForm.date}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, date: e.target.value }))
                  }
                  type="date"
                  required
                  aria-label="Date"
                  className="font-ui w-full rounded-xl bg-white/[0.07] border border-white/10 px-4 py-3 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-white/40"
                />
                <input
                  value={newForm.time}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, time: e.target.value }))
                  }
                  type="time"
                  aria-label="Heure"
                  className="font-ui w-full rounded-xl bg-white/[0.07] border border-white/10 px-4 py-3 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-white/40"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.07] border border-white/10 px-4 py-3">
                <span className="font-ui text-sm text-white/60">Couverts</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNewForm((f) => ({
                        ...f,
                        party: Math.max(1, f.party - 1),
                      }))
                    }
                    aria-label="Moins de couverts"
                    className="h-7 w-7 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 flex items-center justify-center"
                  >
                    <Minus size={13} strokeWidth={2} />
                  </button>
                  <span className="w-7 text-center text-sm font-medium text-white tabular-nums">
                    {newForm.party}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewForm((f) => ({
                        ...f,
                        party: Math.min(50, f.party + 1),
                      }))
                    }
                    aria-label="Plus de couverts"
                    className="h-7 w-7 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 flex items-center justify-center"
                  >
                    <Plus size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
              {venueTables.length > 0 && (
                <select
                  value={newForm.tableId}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, tableId: e.target.value }))
                  }
                  aria-label="Table"
                  className="font-ui w-full rounded-xl bg-white/[0.07] border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/40 [&>option]:bg-[#10131f]"
                >
                  <option value="">Table — à assigner plus tard</option>
                  {venueTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.vip ? "VIP " : "Table "}
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                value={newForm.notes}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Occasion, allergies, demande particulière… (facultatif)"
                maxLength={500}
                className="font-ui min-h-20 w-full resize-none rounded-xl bg-white/[0.07] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 py-3 text-sm font-bold text-white transition-colors disabled:opacity-60"
            >
              {creating ? (
                <Loader2 size={16} strokeWidth={2} className="animate-spin" />
              ) : (
                "Créer la réservation"
              )}
            </button>
          </form>
        </div>
      )}

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
