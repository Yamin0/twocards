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
import { useIntlLocale, useT } from "@/lib/i18n/client";
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

/* Boutons d'action d'une réservation : lisibles au pouce, en salle, sans
   avoir à deviner une icône. La couleur dit le sens — vert on accepte, rouge
   on refuse, bleu le client est là. */
const ACTION = {
  confirm:
    "font-ui inline-flex h-9 items-center gap-1.5 rounded-full bg-ok px-3.5 text-xs font-bold text-ink transition-colors hover:brightness-95",
  refuse:
    "font-ui inline-flex h-9 items-center gap-1.5 rounded-full border border-danger/25 bg-danger-soft px-3.5 text-xs font-bold text-danger transition-colors hover:bg-danger-soft",
  arrive:
    "font-ui inline-flex h-9 items-center gap-1.5 rounded-full bg-link px-3.5 text-xs font-bold text-white transition-colors hover:bg-link-strong",
  ghost:
    "font-ui inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 px-3 text-xs font-medium text-ink-2 transition-colors hover:bg-fill-2 hover:text-ink",
  icon:
    "flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger",
};

const localISODate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

/* Libellé affiché d'un statut (la valeur en base reste en français). */
const STATUS_EN: Record<string, string> = {
  "en attente": "pending",
  "confirmée": "confirmed",
  "annulée": "cancelled",
  "no-show": "no-show",
};

export default function VenueQrReservationsPage() {
  const { isLoading, isActivityVenue } = useAuthUser();
  const t = useT();
  const intl = useIntlLocale();
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
      showToast(t("Impossible d'assigner la table", "Couldn't assign the table"));
      setOverrides((prev) => ({ ...prev, [r.id]: { ...prev[r.id], table_id: r.table_id } }));
      return;
    }
    const table = venueTables.find((x) => x.id === tableId);
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
      !table
        ? t("Table retirée", "Table removed")
        : conflict
          ? t(
              `Attention : la table ${table.label} a déjà une réservation à cette heure`,
              `Heads up: table ${table.label} already has a reservation at this time`,
            )
          : t(
              `Table ${table.label} assignée, visible sur le plan de salle`,
              `Table ${table.label} assigned, shown on the floor plan`,
            )
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
      showToast(t("Impossible de changer le statut", "Couldn't change the status"));
      return;
    }
    showToast(
      status === "annulée"
        ? t("Réservation annulée", "Reservation cancelled")
        : status === "no-show"
          ? t("No-show enregistré", "No-show recorded")
          : t(`Statut : ${status}`, `Status: ${STATUS_EN[status] ?? status}`)
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
      showToast(t("Impossible d'enregistrer l'arrivée", "Couldn't record the arrival"));
      return;
    }
    showToast(t(`${r.guest_name}, arrivée enregistrée`, `${r.guest_name}, arrival recorded`));
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
      showToast(t("Impossible de créer la réservation", "Couldn't create the reservation"));
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
    showToast(t("Réservation créée, visible sur le plan de salle", "Reservation created, shown on the floor plan"));
  };

  const copyRatingLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/avis/${id}`);
      showToast(t("Lien d'avis copié, envoyez-le au client", "Review link copied, send it to the guest"));
    } catch {
      showToast(t("Impossible de copier le lien", "Couldn't copy the link"));
    }
  };

  const saveAmount = async (r: VenueQrReservation) => {
    const raw = (editing[r.id] ?? "").replace(",", ".").trim();
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount < 0) {
      showToast(t("Montant invalide", "Invalid amount"));
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
      showToast(t("Impossible d'enregistrer le montant", "Couldn't save the amount"));
      return;
    }
    setOverrides((prev) => ({ ...prev, [r.id]: data }));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[r.id];
      return next;
    });
    showToast(
      t(
        `Montant enregistré · ${data.commission.toLocaleString(intl)} MAD reversés`,
        `Amount saved · ${data.commission.toLocaleString(intl)} MAD paid out`,
      ),
    );
  };

  const stats = [
    { label: t("Sorties reçues", "Outings received"), value: rows.length },
    { label: t("En attente de montant", "Awaiting amount"), value: awaiting },
    { label: t("CA saisi", "Revenue entered"), value: `${revenue.toLocaleString(intl)} MAD` },
    {
      label: t("Commissions reversées", "Commissions paid out"),
      value: `${commissions.toLocaleString(intl)} MAD`,
    },
  ];

  /* En-têtes du tableau : la clé reste fixe, seul le libellé change. */
  const headLabels: Record<string, string> = {
    Client: t("Client", "Guest"),
    Date: t("Date", "Date"),
    "Pers.": t("Pers.", "Party"),
    Note: t("Note", "Note"),
    Table: t("Table", "Table"),
    Statut: t("Statut", "Status"),
    "Montant dépensé": t("Montant dépensé", "Amount spent"),
    Commission: t("Commission", "Commission"),
    Avis: t("Avis", "Review"),
  };
  const commissionPct = Math.round(
    (rows.find((r) => r.commission_rate > 0)?.commission_rate ?? 0.1) * 100
  );

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-ink">
            {t("Réservations", "Reservations")}
          </h1>
          <p className="font-ui text-sm text-ink-2 mt-1.5">
            {t(
              "Tous vos canaux : QR hôtels, portail direct et prises au téléphone",
              "All your channels: hotel QR codes, direct portal and phone bookings",
            )}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-link hover:bg-link-strong px-4 py-2.5 text-sm font-medium text-white transition-colors shrink-0"
        >
          <Plus size={16} strokeWidth={2} />
          {t("Nouvelle réservation", "New reservation")}
        </button>
      </div>

      {/* Bandeau KPI */}
      <div className="px-4 sm:px-6 pb-6">
        <StatStrip stats={stats} />
      </div>

      {/* Analyses : demande et satisfaction, à la SevenRooms */}
      {rows.length > 0 && (
        <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-fill-2 rounded-xl border border-line p-5">
            <h2 className="font-display text-lg font-normal text-ink mb-1">
              {t("Sorties par semaine", "Outings per week")}
            </h2>
            <p className="text-xs text-ink-3 font-ui mb-4">
              {t("8 dernières semaines", "Last 8 weeks")}
            </p>
            <MiniBars data={weekly} color="bg-plum-soft" />
          </div>
          <div className="bg-fill-2 rounded-xl border border-line p-5">
            <h2 className="font-display text-lg font-normal text-ink mb-3">
              {t("Satisfaction client", "Guest satisfaction")}
            </h2>
            {avgRating !== null ? (
              <>
                <div className="flex items-center gap-3">
                  <p className="font-display text-4xl font-light text-ink">
                    {t(avgRating.toFixed(1).replace(".", ","), avgRating.toFixed(1))}
                    <span className="text-lg text-ink-3">/5</span>
                  </p>
                  <div>
                    <RatingStars value={avgRating} />
                    <p className="text-xs text-ink-3 font-ui mt-0.5">
                      {t(
                        `${rated.length} avis client${rated.length > 1 ? "s" : ""}`,
                        `${rated.length} guest review${rated.length === 1 ? "" : "s"}`,
                      )}
                    </p>
                  </div>
                </div>
                {lastComments.map((r) => (
                  <p
                    key={r.id}
                    className="mt-3 text-xs italic text-ink-3 font-ui border-l-2 border-line-2 pl-3"
                  >
                    {t(<>« {r.rating_comment} »</>, <>“{r.rating_comment}”</>)} · {r.guest_name}
                  </p>
                ))}
              </>
            ) : (
              <p className="text-xs text-ink-3 font-ui">
                {t(
                  "Aucun avis pour le moment. Après la sortie, copiez le lien d'avis depuis le tableau et envoyez-le au client par WhatsApp, sa note apparaîtra ici.",
                  "No reviews yet. After the visit, copy the review link from the table and send it to the guest on WhatsApp; their rating will appear here.",
                )}
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Nom ou téléphone…", "Name or phone…")}
              className="font-ui w-56 rounded-xl bg-fill-2 border border-line py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-line-2"
            />
          </div>
          <div className="flex rounded-xl bg-fill-2 border border-line p-0.5">
            {(
              [
                ["all", t("Toutes", "All")],
                ["today", t("Aujourd'hui", "Today")],
                ["upcoming", t("À venir", "Upcoming")],
                ["past", t("Passées", "Past")],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className={`font-ui rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  scope === key
                    ? "bg-fill-3 text-ink"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t("Filtrer par statut", "Filter by status")}
            className="font-ui rounded-xl bg-fill-2 border border-line px-3 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-line-2 [&>option]:bg-panel"
          >
            <option value="all">{t("Tous les statuts", "All statuses")}</option>
            <option value="en attente">{t("En attente", "Pending")}</option>
            <option value="confirmée">{t("Confirmée", "Confirmed")}</option>
            <option value="annulée">{t("Annulée", "Cancelled")}</option>
            <option value="no-show">{t("No-show", "No-show")}</option>
          </select>
          {filtered.length !== rows.length && (
            <span className="font-ui text-xs text-ink-3">
              {filtered.length} / {rows.length} {t("réservations", "reservations")}
            </span>
          )}
        </div>
      )}

      {/* Table / empty state */}
      <div className="px-4 sm:px-6 pb-4">
        {rows.length === 0 ? (
          <div className=" bg-fill-2 border border-line rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-info-soft border border-info/25 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-info" />
            </div>
            <h2 className="text-lg font-bold text-ink mb-2">
              {t("Aucune réservation QR pour le moment", "No QR reservations yet")}
            </h2>
            <p className="text-sm text-ink-3 font-ui max-w-md mx-auto">
              {t(
                "Quand un client d'hôtel réserve chez vous via un QR code twocards, la réservation apparaît ici instantanément.",
                "When a hotel guest books with you through a twocards QR code, the reservation shows up here instantly.",
              )}
            </p>
          </div>
        ) : (
          <div className="tc-stack bg-fill-2 border border-line rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  {["Client", "Date", "Pers.", "Note", "Table", "Statut", "Montant dépensé", "Commission", "Avis", ""]
                    /* Une activité n'a pas de plan de salle. */
                    .filter((h) => h !== "Table" || !isActivityVenue)
                    .map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-bold text-ink-3 font-ui"
                      >
                        {headLabels[h] ?? h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={isActivityVenue ? 9 : 10}
                      className="px-4 py-10 text-center text-sm text-ink-3 font-ui"
                    >
                      {t("Aucune réservation ne correspond aux filtres.", "No reservations match these filters.")}
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
                      className="border-b border-line last:border-0"
                    >
                      <td data-head className="px-4 py-3">
                        <p className="text-sm text-ink font-ui">
                          {r.guest_name}
                          {/* Origine de la réservation : chaque ligne porte son badge */}
                          {r.source === "portal" ? (
                            <span
                              className="font-ui ml-2 inline-flex items-center gap-1 rounded-md bg-plum-soft px-1.5 py-0.5 text-xs font-bold text-plum align-middle"
                              title={t("Réservation directe via le portail de l'établissement", "Direct booking through the venue's portal")}
                            >
                              <Globe size={9} strokeWidth={2} />
                              {t("direct", "direct")}
                            </span>
                          ) : r.source === "venue" ? (
                            <span
                              className="font-ui ml-2 inline-flex items-center gap-1 rounded-md bg-ok-soft px-1.5 py-0.5 text-xs font-bold text-ok align-middle"
                              title={t("Réservation prise par l'établissement (téléphone, walk-in)", "Booking taken by the venue (phone, walk-in)")}
                            >
                              <Phone size={9} strokeWidth={2} />
                              {t("maison", "in-house")}
                            </span>
                          ) : (
                            <span
                              className="font-ui ml-2 inline-flex items-center gap-1 rounded-md bg-info-soft px-1.5 py-0.5 text-xs font-bold text-info align-middle"
                              title={t("Client envoyé par un hôtel partenaire via QR code", "Guest sent by a partner hotel via QR code")}
                            >
                              <QrCode size={9} strokeWidth={2} />
                              {t("QR hôtel", "hotel QR")}
                            </span>
                          )}
                          {r.source === "qr" && r.referrer_name && (
                            <span className="font-ui ml-2 text-xs font-normal text-ink-3">
                              via {r.referrer_name}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink-3 font-ui">
                          {r.guest_phone}
                        </p>
                        {r.service_name && (
                          <p className="font-ui mt-0.5 text-xs font-medium text-info">
                            {r.service_name}
                          </p>
                        )}
                      </td>
                      <td data-label={headLabels.Date} className="px-4 py-3 text-sm text-ink-2 font-ui whitespace-nowrap">
                        {new Date(
                          r.reservation_date + "T00:00:00"
                        ).toLocaleDateString(intl)}
                        {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                      </td>
                      <td data-label={headLabels["Pers."]} className="px-4 py-3 text-sm text-ink-2 font-ui">
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} strokeWidth={1.5} />
                          {r.party_size}
                        </span>
                      </td>
                      <td data-label={headLabels.Note} className="px-4 py-3 text-xs text-ink-3 font-ui max-w-[180px] truncate">
                        {r.notes ?? "—"}
                      </td>
                      {!isActivityVenue && (
                        <td data-label={headLabels.Table} className="px-4 py-3">
                        {r.status === "annulée" ? (
                          <span className="text-sm text-ink-3">—</span>
                        ) : (
                          <select
                            value={r.table_id ?? ""}
                            onChange={(e) =>
                              assignTable(
                                r,
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            aria-label={t(`Table pour ${r.guest_name}`, `Table for ${r.guest_name}`)}
                            className="font-ui rounded-lg bg-fill-2 border border-line px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-line-2 [&>option]:bg-panel"
                          >
                            <option value="">{t("Aucune", "None")}</option>
                            {venueTables.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.vip ? "VIP " : "Table "}
                                {t.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      )}
                      <td data-label={headLabels.Statut} className="px-4 py-3">
                        <StatusBadge status={r.status} />
                        {r.arrived_at && !isOut(r) && (
                          <p className="font-ui mt-1 text-xs text-ok">
                            {t("arrivé à", "arrived at")}{" "}
                            {new Date(r.arrived_at).toLocaleTimeString(intl, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </td>
                      <td data-label={t("Montant", "Amount")} className="px-4 py-3 whitespace-nowrap">
                        {r.status === "annulée" ? (
                          <span className="text-sm text-ink-3">—</span>
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
                              className="w-24 px-3 py-1.5 bg-fill-2 rounded-lg text-sm text-ink text-right font-ui placeholder:text-ink-4 focus:ring-1 focus:ring-line-2 focus:outline-none"
                            />
                            <span className="text-xs text-ink-3">MAD</span>
                            <button
                              onClick={() => saveAmount(r)}
                              disabled={savingId === r.id}
                              aria-label={t(`Valider le montant pour ${r.guest_name}`, `Save amount for ${r.guest_name}`)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-ok-soft text-ok hover:bg-ok-soft transition-colors disabled:opacity-50"
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
                            className="font-ui inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line-2 px-3 py-1.5 text-xs font-medium text-ink-3 hover:border-line-2 hover:text-ink transition-colors"
                          >
                            <Pencil size={12} strokeWidth={1.5} />
                            {t("Saisir le montant", "Enter amount")}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-ink font-ui">
                              {r.amount_spent.toLocaleString(intl)} MAD
                            </span>
                            {r.amount_source === "pos" && (
                              <span className="font-ui rounded-md bg-info-soft px-1.5 py-0.5 text-xs font-bold text-info">
                                {t("caisse", "till")}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [r.id]: String(r.amount_spent ?? ""),
                                }))
                              }
                              aria-label={t(`Modifier le montant pour ${r.guest_name}`, `Edit amount for ${r.guest_name}`)}
                              className="p-1 text-ink-3 hover:text-ink-2 transition-colors"
                            >
                              <Pencil size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td data-label={headLabels.Commission} className="px-4 py-3 text-sm font-bold text-plum font-ui whitespace-nowrap">
                        {r.commission > 0
                          ? `${r.commission.toLocaleString(intl)} MAD`
                          : "—"}
                      </td>
                      <td data-label={headLabels.Avis} className="px-4 py-3 whitespace-nowrap">
                        {r.rating !== null ? (
                          <button
                            onClick={() => setReviewOf(r)}
                            aria-label={t(`Lire l'avis de ${r.guest_name}`, `Read ${r.guest_name}'s review`)}
                            className="rounded-lg p-1 -m-1 transition-colors hover:bg-fill-2"
                          >
                            <RatingStars value={r.rating} size={12} />
                          </button>
                        ) : r.status === "confirmée" ? (
                          <button
                            onClick={() => copyRatingLink(r.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-info hover:text-info transition-colors font-ui"
                          >
                            <Link2 size={12} strokeWidth={1.5} />
                            {t("Lien d'avis", "Review link")}
                          </button>
                        ) : (
                          <span className="text-sm text-ink-3">—</span>
                        )}
                      </td>
                      <td data-actions className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {isOut(r) ? (
                            <button
                              onClick={() => setStatus(r, "confirmée")}
                              aria-label={t(`Rétablir la réservation de ${r.guest_name}`, `Restore ${r.guest_name}'s reservation`)}
                              className={ACTION.ghost}
                            >
                              <RotateCcw size={13} strokeWidth={1.75} />
                              {t("Rétablir", "Restore")}
                            </button>
                          ) : r.status === "en attente" ? (
                            <>
                              <button
                                onClick={() => setStatus(r, "confirmée")}
                                aria-label={t(`Confirmer la réservation de ${r.guest_name}`, `Confirm ${r.guest_name}'s reservation`)}
                                className={ACTION.confirm}
                              >
                                <Check size={14} strokeWidth={2.5} />
                                {t("Confirmer", "Confirm")}
                              </button>
                              <button
                                onClick={() => setStatus(r, "annulée")}
                                aria-label={t(`Refuser la réservation de ${r.guest_name}`, `Decline ${r.guest_name}'s reservation`)}
                                className={ACTION.refuse}
                              >
                                <XCircle size={14} strokeWidth={2} />
                                {t("Refuser", "Decline")}
                              </button>
                            </>
                          ) : (
                            <>
                              {!r.arrived_at && (
                                <button
                                  onClick={() => checkIn(r)}
                                  aria-label={t(`Check-in de ${r.guest_name}`, `Check in ${r.guest_name}`)}
                                  className={ACTION.arrive}
                                >
                                  <LogIn size={14} strokeWidth={2} />
                                  {t("Client arrivé", "Guest arrived")}
                                </button>
                              )}
                              {!r.arrived_at && (
                                <button
                                  onClick={() => setStatus(r, "no-show")}
                                  aria-label={t(`No-show pour ${r.guest_name}`, `No-show for ${r.guest_name}`)}
                                  className={ACTION.ghost}
                                >
                                  <UserX size={13} strokeWidth={1.75} />
                                  No-show
                                </button>
                              )}
                              <button
                                onClick={() => setStatus(r, "annulée")}
                                title={t("Annuler la réservation", "Cancel reservation")}
                                aria-label={t(`Annuler la réservation de ${r.guest_name}`, `Cancel ${r.guest_name}'s reservation`)}
                                className={ACTION.icon}
                              >
                                <XCircle size={15} strokeWidth={1.75} />
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
        <p className="flex items-start gap-2 text-xs text-ink-3 font-ui max-w-2xl">
          <Info size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          {t(
            <>
              Saisir le montant confirme la sortie et calcule automatiquement la
              commission reversée à l&apos;apporteur ({commissionPct}
              &nbsp;% du montant pour les apports hôtel, les canaux direct et
              maison sont à 0&nbsp;%). Le montant reste modifiable en cas
              d&apos;erreur.
            </>,
            <>
              Entering the amount confirms the visit and automatically works out
              the commission paid to the referrer ({commissionPct}% of the amount
              for hotel referrals; direct and in-house channels are at 0%). You
              can still edit the amount if you make a mistake.
            </>,
          )}
        </p>
      </div>

      {/* Nouvelle réservation — le téléphone sonne, le manager saisit. */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-scrim"
            onClick={() => setShowNew(false)}
          />
          <form
            onSubmit={createReservation}
            className="relative z-10 w-full max-w-md rounded-3xl border border-line-2 bg-panel p-7 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="font-ui text-xs font-bold text-ink-3">
                  {t("Canal maison · 0 % commission", "In-house channel · 0% commission")}
                </p>
                <h3 className="font-display mt-1 text-2xl font-light text-ink">
                  {t("Nouvelle réservation", "New reservation")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                aria-label={t("Fermer", "Close")}
                className="rounded-lg p-1 text-ink-3 transition-colors hover:text-ink"
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
                placeholder={t("Nom du client", "Guest name")}
                required
                maxLength={120}
                className="font-ui w-full rounded-xl bg-fill-2 border border-line px-4 py-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-line-2"
              />
              <input
                value={newForm.phone}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder={t("Téléphone (facultatif pour un walk-in)", "Phone (optional for a walk-in)")}
                type="tel"
                maxLength={40}
                className="font-ui w-full rounded-xl bg-fill-2 border border-line px-4 py-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-line-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newForm.date}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, date: e.target.value }))
                  }
                  type="date"
                  required
                  aria-label={t("Date", "Date")}
                  className="font-ui w-full rounded-xl bg-fill-2 border border-line px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-line-2"
                />
                <input
                  value={newForm.time}
                  onChange={(e) =>
                    setNewForm((f) => ({ ...f, time: e.target.value }))
                  }
                  type="time"
                  aria-label={t("Heure", "Time")}
                  className="font-ui w-full rounded-xl bg-fill-2 border border-line px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-line-2"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-fill-2 border border-line px-4 py-3">
                <span className="font-ui text-sm text-ink-2">{t("Couverts", "Covers")}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNewForm((f) => ({
                        ...f,
                        party: Math.max(1, f.party - 1),
                      }))
                    }
                    aria-label={t("Moins de couverts", "Fewer covers")}
                    className="h-7 w-7 rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3 flex items-center justify-center"
                  >
                    <Minus size={13} strokeWidth={2} />
                  </button>
                  <span className="w-7 text-center text-sm font-medium text-ink tabular-nums">
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
                    aria-label={t("Plus de couverts", "More covers")}
                    className="h-7 w-7 rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3 flex items-center justify-center"
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
                  className="font-ui w-full rounded-xl bg-fill-2 border border-line px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-line-2 [&>option]:bg-panel"
                >
                  <option value="">{t("Table : à assigner plus tard", "Table: assign later")}</option>
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
                placeholder={t("Occasion, allergies, demande particulière… (facultatif)", "Occasion, allergies, special request… (optional)")}
                maxLength={500}
                className="font-ui min-h-20 w-full resize-none rounded-xl bg-fill-2 border border-line px-4 py-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-line-2"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-link hover:bg-link-strong py-3 text-sm font-bold text-white transition-colors disabled:opacity-60"
            >
              {creating ? (
                <Loader2 size={16} strokeWidth={2} className="animate-spin" />
              ) : (
                t("Créer la réservation", "Create reservation")
              )}
            </button>
          </form>
        </div>
      )}

      {/* Avis en modale */}
      {reviewOf && reviewOf.rating !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-scrim"
            onClick={() => setReviewOf(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-line-2 bg-panel p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-ui text-xs font-bold text-ink-3">
                  {t("Avis client", "Guest review")}
                </p>
                <h3 className="font-display mt-1 text-2xl font-light text-ink">
                  {reviewOf.guest_name}
                </h3>
                <p className="font-ui text-xs text-ink-3 mt-0.5">
                  {t("Sortie du", "Visit on")}{" "}
                  {new Date(
                    reviewOf.reservation_date + "T00:00:00"
                  ).toLocaleDateString(intl)}
                  {" · "}
                  {reviewOf.party_size} {t("pers.", reviewOf.party_size === 1 ? "guest" : "guests")}
                </p>
              </div>
              <button
                onClick={() => setReviewOf(null)}
                aria-label={t("Fermer", "Close")}
                className="rounded-lg p-1 text-ink-3 transition-colors hover:text-ink"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <p className="font-display text-4xl font-light text-ink">
                {reviewOf.rating}
                <span className="text-lg text-ink-3">/5</span>
              </p>
              <RatingStars value={reviewOf.rating} size={18} />
            </div>
            {reviewOf.rating_comment ? (
              <p className="font-ui mt-5 border-l-2 border-warn/25 pl-4 text-sm italic leading-relaxed text-ink-2">
                {t(<>« {reviewOf.rating_comment} »</>, <>“{reviewOf.rating_comment}”</>)}
              </p>
            ) : (
              <p className="font-ui mt-5 text-xs text-ink-3">
                {t("Le client n'a pas laissé de commentaire.", "The guest didn't leave a comment.")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-ink border border-line-2 text-white px-4 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
