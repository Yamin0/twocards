"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  Minus,
  Users,
  Clock,
  Crown,
  LogIn,
  X,
  Music,
  Wine,
  DoorOpen,
  GripVertical,
  Pencil,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  QrCode,
  Globe,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useIntlLocale, useT } from "@/lib/i18n/client";

/* ── types ──────────────────────────────────────────────── */

interface TableData {
  id: number;
  x: number;
  y: number;
  shape: "round" | "rect";
  status: "available" | "occupied" | "blocked";
  vip: boolean;
  label: string;
  capacity: number;
  reservation?: TableReservation;
}

/* Une réservation assignée à une table, pour la date sélectionnée. */
interface TableReservation {
  /* id de la réservation QR rattachée — absent pour les données de démo */
  resId?: string;
  client: string;
  initials: string;
  rp?: string;
  conciergerie?: string;
  partySize: number;
  arrival: string;
  time: string | null;
  source: "qr" | "portal" | "venue";
  arrivedAt: string | null;
  minSpend?: string;
  notes: string;
}

interface ContextMenu {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  tableId: number | null;
}

/* Ligne venue_tables ↔ TableData : le plan est propriété du compte,
   une table = une ligne, la position persiste. */
type TableRow = {
  id: number;
  label: string;
  x: number;
  y: number;
  shape: "round" | "rect";
  status: "available" | "occupied" | "blocked";
  vip: boolean;
  capacity: number;
};

const rowToTable = (r: TableRow): TableData => ({ ...r });

type AssignedRow = {
  id: string;
  guest_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string | null;
  notes: string | null;
  source: "qr" | "portal" | "venue";
  arrived_at: string | null;
  table_id: number;
};

/* Date locale AAAA-MM-JJ — pas d'UTC, sinon le plan bascule au mauvais
   jour après minuit heure locale. */
const localISODate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const shiftISODate = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return localISODate(d);
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/* ── helpers ────────────────────────────────────────────── */

function tableColor(status: string, vip: boolean, selected: boolean) {
  if (selected) return "bg-link text-white border-info/25";
  if (status === "blocked") return "bg-fill text-ink-3 border-line";
  if (status === "occupied" && vip) return "bg-warn-soft text-warn border-warn/25";
  if (status === "occupied") return "bg-info-soft text-info border-info/25";
  return "bg-fill text-ink-3 border-line";
}

/* ── component ──────────────────────────────────────────── */

export default function FloorPlanPage() {
  const { isLoading } = useAuthUser();
  const t = useT();
  const intl = useIntlLocale();
  const [tablesList, setTablesList] = useState<TableData[] | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  /* Walk-in : nombre de couverts à installer sur une table libre. */
  const [walkInParty, setWalkInParty] = useState(2);
  const [seating, setSeating] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);

  // Drag state (only in edit mode)
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Close context menu on click anywhere
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* Plan chargé depuis venue_tables — la RLS le limite au compte.
     Temps réel : une table créée ou déplacée sur un autre poste apparaît
     ici sans recharger. On ne recharge pas pendant un drag local. */
  const draggingRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const load = () => {
      supabase
        .from("venue_tables")
        .select("id, label, x, y, shape, status, vip, capacity")
        .order("id", { ascending: true })
        .then(({ data }) => {
          if (!cancelled && !draggingRef.current)
            setTablesList(((data as TableRow[] | null) ?? []).map(rowToTable));
        });
    };
    load();
    const channel = supabase
      .channel("floor-plan-tables")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venue_tables" },
        load
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  /* Date affichée sur le plan — le plan montre l'occupation de CE jour-là,
     pas un état figé « aujourd'hui ». */
  const [selectedDate, setSelectedDate] = useState(() => localISODate());
  const today = localISODate();

  /* Occupations réelles : toutes les réservations assignées aux tables pour
     la date sélectionnée, triées par heure. Le plan cesse d'être une maquette. */
  const [resByTable, setResByTable] = useState<
    Record<number, TableReservation[]>
  >({});

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const load = () => {
      supabase
        .from("qr_reservations")
        .select(
          "id, guest_name, party_size, reservation_date, reservation_time, notes, source, arrived_at, table_id"
        )
        .not("table_id", "is", null)
        .not("status", "in", '("annulée","no-show")')
        .eq("reservation_date", selectedDate)
        .order("reservation_time", { ascending: true, nullsFirst: false })
        .then(({ data }) => {
          if (cancelled) return;
          const map: Record<number, TableReservation[]> = {};
          for (const r of (data as AssignedRow[] | null) ?? []) {
            (map[r.table_id] ??= []).push({
              resId: r.id,
              client: r.guest_name,
              initials: initialsOf(r.guest_name),
              partySize: r.party_size,
              arrival:
                new Date(r.reservation_date + "T00:00:00").toLocaleDateString(
                  intl
                ) + (r.reservation_time ? ` · ${r.reservation_time}` : ""),
              time: r.reservation_time,
              source: r.source,
              arrivedAt: r.arrived_at,
              notes: r.notes ?? "",
            });
          }
          setResByTable(map);
        });
    };
    load();
    /* L'écran de salle reflète l'instant : toute réservation assignée,
       déplacée ou annulée depuis un autre poste arrive ici en direct. */
    const channel = supabase
      .channel("floor-plan-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qr_reservations" },
        load
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [selectedDate, intl]);

  if (isLoading || tablesList === null) return <DashboardSkeleton />;

  const currentTables = tablesList.map((t) => {
    const dayReservations = resByTable[t.id];
    return dayReservations?.length
      ? {
          ...t,
          status: (t.status === "blocked" ? "blocked" : "occupied") as TableData["status"],
          reservation: dayReservations[0],
        }
      : t;
  });
  const selected = currentTables.find((t) => t.id === selectedTable);
  const selectedReservations = selected ? resByTable[selected.id] ?? [] : [];

  /* Écriture partielle d'une table : optimiste en local, persistée en base.
     En cas d'échec, on recharge l'état réel plutôt que de mentir. */
  const patchTable = async (tableId: number, patch: Partial<TableRow>) => {
    setTablesList((prev) =>
      (prev ?? []).map((t) => (t.id === tableId ? { ...t, ...patch } : t))
    );
    const { error } = await createClient()
      .from("venue_tables")
      .update(patch)
      .eq("id", tableId);
    if (error) {
      showToast(t("Échec de l'enregistrement", "Couldn't save"));
      const { data } = await createClient()
        .from("venue_tables")
        .select("id, label, x, y, shape, status, vip, capacity")
        .order("id", { ascending: true });
      setTablesList(((data as TableRow[] | null) ?? []).map(rowToTable));
    }
  };

  const occupiedCount = currentTables.filter((t) => t.status === "occupied").length;
  const availableCount = currentTables.filter((t) => t.status === "available").length;
  const totalCapacity = currentTables.reduce((sum, t) => sum + t.capacity, 0);
  const occupiedCapacity = currentTables
    .filter((t) => t.status === "occupied")
    .reduce((sum, t) => {
      const list = resByTable[t.id];
      return (
        sum +
        (list?.length ? list.reduce((s, r) => s + r.partySize, 0) : t.capacity)
      );
    }, 0);

  /* ── add table (persistée, l'id vient de la base) ── */
  const addTable = async (x: number, y: number) => {
    const label = String(
      currentTables.reduce((m, t) => Math.max(m, Number(t.label) || 0), 0) + 1
    );
    const { data, error } = await createClient()
      .from("venue_tables")
      .insert({ label, x: Math.round(x), y: Math.round(y) })
      .select("id, label, x, y, shape, status, vip, capacity")
      .single();
    if (error || !data) {
      showToast(t("Impossible d'ajouter la table", "Couldn't add the table"));
      return;
    }
    setTablesList((prev) => [...(prev ?? []), rowToTable(data as TableRow)]);
    setSelectedTable((data as TableRow).id);
    showToast(t(`Table ${label} ajoutée`, `Table ${label} added`));
  };

  /* ── delete table (persistée, avec garde-fou) ── */
  const deleteTable = async (tableId: number) => {
    const table = currentTables.find((t) => t.id === tableId);
    if (!table) return;
    const hasRes = (resByTable[tableId] ?? []).length > 0;
    if (
      !window.confirm(
        hasRes
          ? t(
              `Supprimer la table ${table.label} ? Ses réservations du jour perdront leur assignation.`,
              `Delete table ${table.label}? Today's reservations on it will lose their table.`,
            )
          : t(`Supprimer la table ${table.label} ?`, `Delete table ${table.label}?`)
      )
    )
      return;
    setTablesList((prev) => (prev ?? []).filter((t) => t.id !== tableId));
    if (selectedTable === tableId) setSelectedTable(null);
    const { error } = await createClient()
      .from("venue_tables")
      .delete()
      .eq("id", tableId);
    if (error) showToast(t("Échec de la suppression", "Couldn't delete"));
    else showToast(t(`Table ${table.label} supprimée`, `Table ${table.label} deleted`));
  };

  /* Check-in persisté : l'heure d'arrivée est en base, partagée entre
     postes — le temps réel rafraîchit la carte. */
  const resCheckIn = async (res: TableReservation) => {
    if (!res.resId) return;
    const arrived_at = new Date().toISOString();
    setResByTable((prev) => {
      const next: typeof prev = {};
      for (const [k, list] of Object.entries(prev))
        next[Number(k)] = list.map((x) =>
          x.resId === res.resId ? { ...x, arrivedAt: arrived_at } : x
        );
      return next;
    });
    const { error } = await createClient()
      .from("qr_reservations")
      .update({ arrived_at })
      .eq("id", res.resId);
    if (error) showToast(t("Impossible d'enregistrer l'arrivée", "Couldn't record the arrival"));
    else showToast(t(`${res.client}, arrivée enregistrée`, `${res.client}, arrival recorded`));
  };

  /* Walk-in : un client se présente, on l'installe sur une table libre.
     Réservation « maison » créée à l'instant, check-in immédiat. */
  const seatWalkIn = async () => {
    if (!selected || seating) return;
    setSeating(true);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const supabase = createClient();
    const { data, error } = await supabase.rpc("venue_create_reservation", {
      p_guest_name: "Walk-in",
      p_guest_phone: null,
      p_date: selectedDate,
      p_time: time,
      p_party_size: walkInParty,
      p_notes: null,
      p_table_id: selected.id,
    });
    if (error || !data) {
      setSeating(false);
      showToast(t("Impossible d'installer le client", "Couldn't seat the guest"));
      return;
    }
    await supabase
      .from("qr_reservations")
      .update({ arrived_at: now.toISOString() })
      .eq("id", data as string);
    setSeating(false);
    showToast(
      t(
        `${walkInParty} couvert${walkInParty > 1 ? "s" : ""} installés, table ${selected.label}`,
        `${walkInParty} cover${walkInParty === 1 ? "" : "s"} seated, table ${selected.label}`,
      )
    );
  };

  /* ── drag handlers (edit mode only) ── */

  const handleMouseDown = (e: React.MouseEvent, tableId: number) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const table = currentTables.find((t) => t.id === tableId);
    if (!table || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDragging(tableId);
    draggingRef.current = true;
    setDragOffset({
      x: e.clientX / zoom - rect.left / zoom - table.x,
      y: e.clientY / zoom - rect.top / zoom - table.y,
    });
    setSelectedTable(tableId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!editMode || dragging === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(530, e.clientX / zoom - rect.left / zoom - dragOffset.x));
    const newY = Math.max(20, Math.min(470, e.clientY / zoom - rect.top / zoom - dragOffset.y));

    setTablesList((prev) =>
      (prev ?? []).map((t) =>
        t.id === dragging ? { ...t, x: Math.round(newX), y: Math.round(newY) } : t
      )
    );
  };

  const handleMouseUp = () => {
    if (dragging !== null) {
      const t = currentTables.find((x) => x.id === dragging);
      if (t) patchTable(t.id, { x: t.x, y: t.y });
    }
    setDragging(null);
    draggingRef.current = false;
  };

  /* ── context menu handler ── */
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;

    // Check if right-clicking on a table
    let clickedTableId: number | null = null;
    for (const table of currentTables) {
      const hw = table.shape === "round" ? 28 : 48;
      const hh = 28;
      if (
        canvasX >= table.x - 5 &&
        canvasX <= table.x + hw * 2 + 5 &&
        canvasY >= table.y - 5 &&
        canvasY <= table.y + hh * 2 + 5
      ) {
        clickedTableId = table.id;
        break;
      }
    }

    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasX,
      canvasY,
      tableId: clickedTableId,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className=" bg-panel border border-line rounded-3xl p-6 relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-light text-ink">
              {t("Plan de salle", "Floor plan")}
            </h1>
            <p className="font-ui text-ink-3 text-sm mt-1">
              {selectedDate === today
                ? t(
                    "Occupation d'aujourd'hui, choisissez une date pour voir un autre service",
                    "Today's occupancy; pick a date to see another service",
                  )
                : `${t("Occupation du", "Occupancy for")} ${new Date(
                    selectedDate + "T00:00:00"
                  ).toLocaleDateString(intl, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}`}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sélecteur de date : le plan reflète les réservations du jour choisi */}
            <div className="flex items-center gap-1 bg-panel border border-line-2 rounded-xl px-1.5 py-1">
              <button
                onClick={() => setSelectedDate((d) => shiftISODate(d, -1))}
                aria-label={t("Jour précédent", "Previous day")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-fill-2 transition-all"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2 px-1">
                <CalendarDays size={14} strokeWidth={1.5} className="text-ink-3" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  aria-label={t("Date du plan de salle", "Floor plan date")}
                  className="bg-transparent text-sm text-ink font-ui focus:outline-none"
                />
              </div>
              <button
                onClick={() => setSelectedDate((d) => shiftISODate(d, 1))}
                aria-label={t("Jour suivant", "Next day")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-fill-2 transition-all"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            </div>
            {selectedDate !== today && (
              <button
                onClick={() => setSelectedDate(today)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium bg-panel border border-line-2 text-ink-2 hover:bg-fill-2 hover:text-ink transition-all"
              >
                {t("Aujourd'hui", "Today")}
              </button>
            )}
            {/* Edit mode toggle */}
            <button
              onClick={() => {
                setEditMode(!editMode);
                setContextMenu(null);
                if (editMode) setDragging(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                editMode
                  ? "bg-link text-white shadow-[0_0_20px_rgba(96,165,250,0.3)]"
                  : " bg-panel border border-line-2 text-ink-2 hover:bg-fill-2 hover:text-ink"
              }`}
            >
              {editMode ? (
                <>
                  <Pencil size={16} strokeWidth={1.5} />
                  {t("Mode édition", "Edit mode")}
                </>
              ) : (
                <>
                  <Lock size={16} strokeWidth={1.5} />
                  {t("Modifier", "Edit")}
                </>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {currentTables.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className=" bg-panel border border-line rounded-2xl p-4">
            <p className="text-ink-3 text-xs">{t("Tables occupées", "Tables occupied")}</p>
            <p className="text-xl font-bold text-ink mt-1 font-ui">
              {occupiedCount}/{currentTables.length}
            </p>
          </div>
          <div className=" bg-panel border border-line rounded-2xl p-4">
            <p className="text-ink-3 text-xs">{t("Disponibles", "Available")}</p>
            <p className="text-xl font-bold text-ok mt-1 font-ui">
              {availableCount}
            </p>
          </div>
          <div className=" bg-panel border border-line rounded-2xl p-4">
            <p className="text-ink-3 text-xs">{t("Couverts réservés", "Covers booked")}</p>
            <p className="text-xl font-bold text-ink mt-1 font-ui">
              {occupiedCapacity}
            </p>
          </div>
          <div className=" bg-panel border border-line rounded-2xl p-4">
            <p className="text-ink-3 text-xs">{t("Capacité totale", "Total capacity")}</p>
            <p className="text-xl font-bold text-ink mt-1 font-ui">
              {totalCapacity}
            </p>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-fill border border-line" />
          <span className="text-xs text-ink-3">{t("Disponible", "Available")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-info-soft border border-info/25" />
          <span className="text-xs text-ink-3">{t("Occupée", "Occupied")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-warn-soft border border-warn/25" />
          <span className="text-xs text-ink-3">{t("VIP Occupée", "VIP occupied")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-fill border border-line" />
          <span className="text-xs text-ink-3">{t("Bloquée", "Blocked")}</span>
        </div>
        {editMode && (
          <div className="flex items-center gap-1.5">
            <GripVertical size={12} className="text-info" />
            <span className="text-xs text-info font-medium">{t("Glisser pour déplacer · Clic droit pour options", "Drag to move · Right-click for options")}</span>
          </div>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* ── Floor plan canvas ── */}
        <div className="lg:col-span-7">
          <div className={` bg-panel border rounded-3xl overflow-hidden relative ${
            editMode ? "border-info/25 shadow-[0_0_30px_rgba(96,165,250,0.08)]" : "border-line"
          }`}>
            {/* Edit mode banner */}
            {editMode && (
              <div className="bg-info-soft border-b border-info/25 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil size={13} strokeWidth={1.5} className="text-info" />
                  <span className="text-xs font-medium text-info">{t("Mode édition actif", "Edit mode on")}</span>
                  <span className="text-xs text-info">{t("Déplacez les tables ou faites clic droit pour ajouter/supprimer", "Move tables, or right-click to add/delete")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const x = 250;
                      const y = 200;
                      addTable(x, y);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-info-soft hover:bg-info-soft border border-info/25 rounded-lg text-xs font-medium text-info transition-all"
                  >
                    <Plus size={13} strokeWidth={2} />
                    {t("Nouvelle table", "New table")}
                  </button>
                  {selectedTable !== null && (
                    <button
                      onClick={() => deleteTable(selectedTable)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-soft hover:bg-danger-soft border border-danger/25 rounded-lg text-xs font-medium text-danger transition-all"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                      {t("Supprimer", "Delete")}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              ref={canvasRef}
              className={`relative h-[450px] md:h-[520px] select-none ${editMode ? "cursor-crosshair" : ""}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={handleContextMenu}
            >
              {/* Room walls */}
              <div className="absolute inset-4 border border-line rounded-2xl" />

              {/* DJ Booth */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-fill border border-line rounded-xl px-4 py-2 flex items-center gap-2">
                <Music size={14} strokeWidth={1.5} className="text-ink-3" />
                <span className="text-xs font-medium text-ink-3">
                  DJ Booth
                </span>
              </div>

              {/* Bar */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-fill border border-line rounded-xl px-2 py-8 flex flex-col items-center gap-1">
                <Wine size={14} strokeWidth={1.5} className="text-ink-3" />
                <span className="text-xs font-medium text-ink-3 [writing-mode:vertical-lr]">
                  Bar
                </span>
              </div>

              {/* Entrance */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-fill border border-line rounded-xl px-2 py-6 flex flex-col items-center gap-1">
                <DoorOpen size={14} strokeWidth={1.5} className="text-ink-3" />
                <span className="text-xs font-medium text-ink-3 [writing-mode:vertical-lr]">
                  {t("Entrée", "Entrance")}
                </span>
              </div>

              {/* Tables */}
              {currentTables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-ink-3">
                    {editMode
                      ? t("Clic droit ou bouton + pour ajouter une table", "Right-click or use the + button to add a table")
                      : t("Aucune table configurée", "No tables set up")}
                  </p>
                </div>
              )}
              {currentTables.map((table) => {
                const isSelected = table.id === selectedTable;
                const isDragging = table.id === dragging;
                const color = tableColor(table.status, table.vip, isSelected);
                const size = table.shape === "round"
                  ? "h-14 w-14 rounded-full"
                  : "h-14 w-24 rounded-xl";

                return (
                  <div
                    key={table.id}
                    onMouseDown={(e) => handleMouseDown(e, table.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTable(table.id);
                    }}
                    className={`absolute flex flex-col items-center justify-center border ${size} ${color} transition-shadow ${
                      editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                    } ${
                      isSelected ? "ring-2 ring-info/25 ring-offset-1 ring-offset-[#0a0a0f] shadow-[0_0_20px_rgba(96,165,250,0.2)]" : ""
                    } ${isDragging ? "z-50 shadow-2xl scale-110" : "hover:scale-105"} ${
                      table.status === "blocked" ? "opacity-40" : ""
                    }`}
                    style={{ left: table.x, top: table.y }}
                  >
                    <span className="text-xs font-semibold leading-none">
                      {table.label}
                    </span>
                    <span className="text-xs opacity-60">
                      {table.reservation?.time
                        ? table.reservation.time.slice(0, 5)
                        : `${table.capacity}p`}
                    </span>
                    {table.vip && (
                      <Crown size={8} strokeWidth={2} className="absolute -top-1 -right-1 text-warn" />
                    )}
                    {/* Client arrivé : pastille verte visible de loin */}
                    {table.reservation?.arrivedAt && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-ok border-2 border-[#0a0a0f]" />
                    )}
                  </div>
                );
              })}

              {/* Context menu */}
              {contextMenu && editMode && (
                <div
                  className="absolute z-[60] bg-[#1a1a2e] border border-line-2 rounded-xl shadow-2xl p-1 min-w-[180px]"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      addTable(contextMenu.canvasX, contextMenu.canvasY);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-fill-2 hover:text-ink transition-all"
                  >
                    <Plus size={15} strokeWidth={1.5} className="text-info" />
                    {t("Nouvelle table ici", "New table here")}
                  </button>
                  {contextMenu.tableId !== null && (
                    <button
                      onClick={() => {
                        deleteTable(contextMenu.tableId!);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger-soft hover:text-danger transition-all"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                      {t("Supprimer table", "Delete table")}{" "}
                      {currentTables.find((x) => x.id === contextMenu.tableId)?.label}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
                className="h-8 w-8 bg-fill-2 border border-line-2 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-fill-3 transition-all"
              >
                <Plus size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))}
                className="h-8 w-8 bg-fill-2 border border-line-2 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-fill-3 transition-all"
              >
                <Minus size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar: Selected table details ── */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className=" bg-panel border border-line rounded-3xl p-5 space-y-5">
              {/* Table info */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-ink">
                    Table {selected.label}
                  </h2>
                  {selected.vip && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft border border-warn/25 px-2.5 py-0.5 text-xs font-medium text-warn">
                      <Crown size={10} strokeWidth={2} />
                      VIP
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-fill rounded-xl p-3">
                    <p className="text-xs text-ink-3">{t("Capacité", "Capacity")}</p>
                    <p className="text-sm font-medium text-ink mt-0.5">
                      {selected.capacity} {t("pers.", selected.capacity === 1 ? "guest" : "guests")}
                    </p>
                  </div>
                  <div className="bg-fill rounded-xl p-3">
                    <p className="text-xs text-ink-3">{t("Statut", "Status")}</p>
                    <p className={`text-sm font-medium mt-0.5 ${
                      selected.status === "occupied" ? "text-info" : selected.status === "available" ? "text-ok" : "text-ink-3"
                    }`}>
                      {selected.status === "occupied"
                        ? t("Occupée", "Occupied")
                        : selected.status === "available"
                          ? t("Disponible", "Available")
                          : t("Bloquée", "Blocked")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reservation details — toutes les réservations du jour sélectionné */}
              {selectedReservations.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-ink-3 font-semibold">
                    {selectedReservations.length > 1
                      ? t(
                          `${selectedReservations.length} réservations ce jour`,
                          `${selectedReservations.length} reservations this day`,
                        )
                      : t("Réservation", "Reservation")}
                  </p>
                  {selectedReservations.map((res) => (
                    <div
                      key={res.resId ?? res.client}
                      className="bg-fill border border-line rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-info-soft flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-info">
                            {res.initials}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">
                            {res.client}
                          </p>
                          {res.source === "portal" ? (
                            <span className="inline-flex items-center gap-1 mt-0.5 rounded-md bg-plum-soft px-1.5 py-0.5 text-xs font-bold text-plum">
                              <Globe size={9} strokeWidth={2} />
                              {t("Direct", "direct")}
                            </span>
                          ) : res.source === "venue" ? (
                            <span className="inline-flex items-center gap-1 mt-0.5 rounded-md bg-ok-soft px-1.5 py-0.5 text-xs font-bold text-ok">
                              <Phone size={9} strokeWidth={2} />
                              {t("Maison", "in-house")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 mt-0.5 rounded-md bg-info-soft px-1.5 py-0.5 text-xs font-bold text-info">
                              <QrCode size={9} strokeWidth={2} />
                              {t("QR hôtel", "hotel QR")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-ink-3 text-sm">
                          <Users size={14} strokeWidth={1.5} />
                          <span>
                            {t(
                              `${res.partySize} personne${res.partySize > 1 ? "s" : ""}`,
                              `${res.partySize} guest${res.partySize === 1 ? "" : "s"}`,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-ink-3 text-sm">
                          <Clock size={14} strokeWidth={1.5} />
                          <span>
                            {res.time
                              ? t(`Arrivée : ${res.time.slice(0, 5)}`, `Arrival: ${res.time.slice(0, 5)}`)
                              : t("Heure non précisée", "No time given")}
                          </span>
                        </div>
                      </div>

                      {/* Check-in réel : écrit en base, partagé entre postes */}
                      {res.resId &&
                        (res.arrivedAt ? (
                          <div className="flex items-center gap-2 rounded-xl bg-ok-soft border border-ok/25 px-3 py-2 text-xs font-medium text-ok">
                            <LogIn size={13} strokeWidth={1.5} />
                            {t("Arrivé à", "Arrived at")}{" "}
                            {new Date(res.arrivedAt).toLocaleTimeString(
                              intl,
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </div>
                        ) : (
                          !editMode && (
                            <button
                              onClick={() => resCheckIn(res)}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-link hover:bg-link-strong px-3 py-2 text-xs font-medium text-white transition-colors"
                            >
                              <LogIn size={13} strokeWidth={1.5} />
                              {t("Check-in", "Check in")}
                            </button>
                          )
                        ))}

                      {res.notes && (
                        <div className="pt-2 border-t border-line">
                          <p className="text-xs text-ink-3 mb-1">{t("Notes", "Notes")}</p>
                          <p className="text-xs text-ink-3 leading-relaxed">{res.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-fill border border-line rounded-2xl p-5 space-y-4">
                  <p className="text-xs text-ink-3 text-center">
                    {t("Aucune réservation sur cette table le", "No reservations on this table on")}{" "}
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(intl)}
                  </p>
                  {/* Walk-in : installer immédiatement un client qui se présente */}
                  {!editMode &&
                    selected.status !== "blocked" &&
                    selectedDate === today && (
                      <div className="space-y-3 pt-1 border-t border-line">
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-ink-3">{t("Couverts", "Covers")}</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setWalkInParty((p) => Math.max(1, p - 1))
                              }
                              aria-label={t("Moins de couverts", "Fewer covers")}
                              className="h-7 w-7 rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3 flex items-center justify-center"
                            >
                              <Minus size={13} strokeWidth={2} />
                            </button>
                            <span className="w-7 text-center text-sm font-medium text-ink tabular-nums">
                              {walkInParty}
                            </span>
                            <button
                              onClick={() =>
                                setWalkInParty((p) => Math.min(50, p + 1))
                              }
                              aria-label={t("Plus de couverts", "More covers")}
                              className="h-7 w-7 rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3 flex items-center justify-center"
                            >
                              <Plus size={13} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={seatWalkIn}
                          disabled={seating}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-link hover:bg-link-strong px-3 py-2.5 text-xs font-medium text-white transition-colors disabled:opacity-60"
                        >
                          <LogIn size={13} strokeWidth={1.5} />
                          {seating ? t("Installation…", "Seating…") : t("Installer un walk-in", "Seat a walk-in")}
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* Actions */}
              {selected.reservation && !editMode && (
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      const ids = selectedReservations
                        .map((r) => r.resId)
                        .filter((id): id is string => Boolean(id));
                      if (ids.length > 0) {
                        const { error } = await createClient()
                          .from("qr_reservations")
                          .update({ table_id: null })
                          .in("id", ids);
                        if (error) {
                          showToast(t("Impossible de libérer la table", "Couldn't free up the table"));
                          return;
                        }
                      }
                      setResByTable((prev) => {
                        const next = { ...prev };
                        delete next[selected.id];
                        return next;
                      });
                      setSelectedTable(null);
                      showToast(t(`Table ${selected.label} libérée`, `Table ${selected.label} freed up`));
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm text-ink-3 hover:text-danger transition-colors py-2 rounded-xl hover:bg-danger-soft"
                  >
                    <X size={14} strokeWidth={1.5} />
                    {t("Libérer la table", "Free up table")}
                  </button>
                </div>
              )}

              {/* Edit mode : propriétés de la table, persistées à chaque clic */}
              {editMode && (
                <div className="space-y-2">
                  <div className="bg-fill border border-line rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-3">{t("Capacité", "Capacity")}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            patchTable(selected.id, {
                              capacity: Math.max(1, selected.capacity - 1),
                            })
                          }
                          aria-label={t("Réduire la capacité", "Decrease capacity")}
                          className="h-7 w-7 rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3 flex items-center justify-center"
                        >
                          <Minus size={13} strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-ink tabular-nums">
                          {selected.capacity}
                        </span>
                        <button
                          onClick={() =>
                            patchTable(selected.id, {
                              capacity: Math.min(50, selected.capacity + 1),
                            })
                          }
                          aria-label={t("Augmenter la capacité", "Increase capacity")}
                          className="h-7 w-7 rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3 flex items-center justify-center"
                        >
                          <Plus size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-3">{t("Table VIP", "VIP table")}</span>
                      <button
                        onClick={() =>
                          patchTable(selected.id, { vip: !selected.vip })
                        }
                        role="switch"
                        aria-checked={selected.vip}
                        aria-label={t("Table VIP", "VIP table")}
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          selected.vip ? "bg-warn-soft" : "bg-fill-3"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                            selected.vip ? "left-[18px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-3">{t("Forme", "Shape")}</span>
                      <div className="flex gap-1.5">
                        {(["round", "rect"] as const).map((sh) => (
                          <button
                            key={sh}
                            onClick={() => patchTable(selected.id, { shape: sh })}
                            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                              selected.shape === sh
                                ? "bg-fill-3 text-ink"
                                : "bg-fill text-ink-3 hover:text-ink-2"
                            }`}
                          >
                            {sh === "round" ? t("Ronde", "Round") : t("Rectangle", "Rectangle")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-3">{t("Statut", "Status")}</span>
                      <div className="flex gap-1.5">
                        {(
                          [
                            ["available", t("Libre", "Free")],
                            ["occupied", t("Occupée", "Occupied")],
                            ["blocked", t("Bloquée", "Blocked")],
                          ] as const
                        ).map(([st, lab]) => (
                          <button
                            key={st}
                            onClick={() => patchTable(selected.id, { status: st })}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                              selected.status === st
                                ? "bg-fill-3 text-ink"
                                : "bg-fill text-ink-3 hover:text-ink-2"
                            }`}
                          >
                            {lab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTable(selected.id)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-danger-soft hover:bg-danger-soft border border-danger/25 text-danger transition-all"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                    {t("Supprimer cette table", "Delete this table")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className=" bg-panel border border-line rounded-3xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-fill flex items-center justify-center mx-auto mb-3">
                {editMode ? (
                  <Pencil size={20} strokeWidth={1.5} className="text-info" />
                ) : (
                  <GripVertical size={20} strokeWidth={1.5} className="text-ink-4" />
                )}
              </div>
              <p className="text-sm text-ink-3">
                {editMode
                  ? t("Sélectionnez une table pour la modifier", "Select a table to edit it")
                  : t("Sélectionnez une table pour voir les détails", "Select a table to see its details")}
              </p>
              <p className="text-xs text-ink-4 mt-1">
                {editMode
                  ? t("Clic droit sur le plan pour ajouter/supprimer", "Right-click the plan to add/delete")
                  : t("Cliquez sur \"Modifier\" pour réorganiser le plan", "Click \"Edit\" to rearrange the plan")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-fill-3 border border-line-2 text-ink px-5 py-3 rounded-xl shadow-xl">
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
