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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

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
  reservation?: {
    /* id de la réservation QR rattachée — absent pour les données de démo */
    resId?: string;
    client: string;
    initials: string;
    rp?: string;
    conciergerie?: string;
    partySize: number;
    arrival: string;
    minSpend?: string;
    notes: string;
  };
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
  table_id: number;
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
  if (selected) return "bg-blue-500 text-white border-blue-400";
  if (status === "blocked") return "bg-white/[0.04] text-white/30 border-white/10";
  if (status === "occupied" && vip) return "bg-amber-400/15 text-amber-300 border-amber-400/30";
  if (status === "occupied") return "bg-blue-400/15 text-blue-300 border-blue-400/30";
  return "bg-white/[0.06] text-white/50 border-white/[0.12]";
}

/* ── component ──────────────────────────────────────────── */

export default function FloorPlanPage() {
  const { isLoading } = useAuthUser();
  const [tablesList, setTablesList] = useState<TableData[] | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

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

  /* Plan chargé depuis venue_tables — la RLS le limite au compte. */
  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("venue_tables")
      .select("id, label, x, y, shape, status, vip, capacity")
      .order("id", { ascending: true })
      .then(({ data }) => {
        if (!cancelled)
          setTablesList(((data as TableRow[] | null) ?? []).map(rowToTable));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Occupations réelles : la première réservation à venir assignée à
     chaque table. Le plan cesse d'être une maquette. */
  const [resByTable, setResByTable] = useState<
    Record<number, TableData["reservation"]>
  >({});

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    createClient()
      .from("qr_reservations")
      .select(
        "id, guest_name, party_size, reservation_date, reservation_time, notes, table_id"
      )
      .not("table_id", "is", null)
      .neq("status", "annulée")
      .gte("reservation_date", today)
      .order("reservation_date", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<number, TableData["reservation"]> = {};
        for (const r of (data as AssignedRow[] | null) ?? []) {
          if (map[r.table_id]) continue;
          map[r.table_id] = {
            resId: r.id,
            client: r.guest_name,
            initials: initialsOf(r.guest_name),
            partySize: r.party_size,
            arrival:
              new Date(r.reservation_date + "T00:00:00").toLocaleDateString(
                "fr-FR"
              ) + (r.reservation_time ? ` · ${r.reservation_time}` : ""),
            notes: r.notes ?? "",
          };
        }
        setResByTable(map);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || tablesList === null) return <DashboardSkeleton />;

  const currentTables = tablesList.map((t) => {
    const reservation = resByTable[t.id];
    return reservation
      ? {
          ...t,
          status: (t.status === "blocked" ? "blocked" : "occupied") as TableData["status"],
          reservation,
        }
      : t;
  });
  const selected = currentTables.find((t) => t.id === selectedTable);

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
      showToast("Échec de l'enregistrement");
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
    .reduce((sum, t) => sum + (t.reservation?.partySize ?? t.capacity), 0);

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
      showToast("Impossible d'ajouter la table");
      return;
    }
    setTablesList((prev) => [...(prev ?? []), rowToTable(data as TableRow)]);
    setSelectedTable((data as TableRow).id);
    showToast(`Table ${label} ajoutée`);
  };

  /* ── delete table (persistée) ── */
  const deleteTable = async (tableId: number) => {
    const table = currentTables.find((t) => t.id === tableId);
    if (!table) return;
    setTablesList((prev) => (prev ?? []).filter((t) => t.id !== tableId));
    if (selectedTable === tableId) setSelectedTable(null);
    const { error } = await createClient()
      .from("venue_tables")
      .delete()
      .eq("id", tableId);
    if (error) showToast("Échec de la suppression");
    else showToast(`Table ${table.label} supprimée`);
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
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 relative z-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-light text-white">
              Plan de salle
            </h1>
            <p className="font-ui text-white/50 text-sm mt-1">
              Votre salle, enregistrée automatiquement — chaque table, sa
              position et ses propriétés
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Edit mode toggle */}
            <button
              onClick={() => {
                setEditMode(!editMode);
                setContextMenu(null);
                if (editMode) setDragging(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                editMode
                  ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(96,165,250,0.3)]"
                  : "backdrop-blur-2xl bg-black/45 border border-white/[0.15] text-white/60 hover:bg-white/[0.1] hover:text-white"
              }`}
            >
              {editMode ? (
                <>
                  <Pencil size={16} strokeWidth={1.5} />
                  Mode édition
                </>
              ) : (
                <>
                  <Lock size={16} strokeWidth={1.5} />
                  Modifier
                </>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {currentTables.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Tables occupées</p>
            <p className="text-xl font-bold text-white mt-1 font-ui">
              {occupiedCount}/{currentTables.length}
            </p>
          </div>
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Disponibles</p>
            <p className="text-xl font-bold text-green-400 mt-1 font-ui">
              {availableCount}
            </p>
          </div>
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Couverts réservés</p>
            <p className="text-xl font-bold text-white mt-1 font-ui">
              {occupiedCapacity}
            </p>
          </div>
          <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-4">
            <p className="text-white/40 text-xs">Capacité totale</p>
            <p className="text-xl font-bold text-white mt-1 font-ui">
              {totalCapacity}
            </p>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-white/[0.06] border border-white/[0.12]" />
          <span className="text-xs text-white/40">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-400/15 border border-blue-400/30" />
          <span className="text-xs text-white/40">Occupée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-400/15 border border-amber-400/30" />
          <span className="text-xs text-white/40">VIP Occupée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-white/[0.04] border border-white/10" />
          <span className="text-xs text-white/40">Bloquée</span>
        </div>
        {editMode && (
          <div className="flex items-center gap-1.5">
            <GripVertical size={12} className="text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">Glisser pour déplacer · Clic droit pour options</span>
          </div>
        )}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* ── Floor plan canvas ── */}
        <div className="lg:col-span-7">
          <div className={`backdrop-blur-2xl bg-black/45 border rounded-3xl overflow-hidden relative ${
            editMode ? "border-blue-400/30 shadow-[0_0_30px_rgba(96,165,250,0.08)]" : "border-white/[0.12]"
          }`}>
            {/* Edit mode banner */}
            {editMode && (
              <div className="bg-blue-500/10 border-b border-blue-400/20 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil size={13} strokeWidth={1.5} className="text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Mode édition actif</span>
                  <span className="text-xs text-blue-400/50">— Déplacez les tables ou faites clic droit pour ajouter/supprimer</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const x = 250;
                      const y = 200;
                      addTable(x, y);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-xs font-medium text-blue-300 transition-all"
                  >
                    <Plus size={13} strokeWidth={2} />
                    Nouvelle table
                  </button>
                  {selectedTable !== null && (
                    <button
                      onClick={() => deleteTable(selectedTable)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 rounded-lg text-xs font-medium text-red-400 transition-all"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                      Supprimer
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
              <div className="absolute inset-4 border border-white/[0.08] rounded-2xl" />

              {/* DJ Booth */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2 flex items-center gap-2">
                <Music size={14} strokeWidth={1.5} className="text-white/30" />
                <span className="text-[0.625rem] font-medium text-white/30 uppercase tracking-wider">
                  DJ Booth
                </span>
              </div>

              {/* Bar */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/[0.06] border border-white/[0.1] rounded-xl px-2 py-8 flex flex-col items-center gap-1">
                <Wine size={14} strokeWidth={1.5} className="text-white/30" />
                <span className="text-[0.5rem] font-medium text-white/30 uppercase tracking-wider [writing-mode:vertical-lr]">
                  Bar
                </span>
              </div>

              {/* Entrance */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/[0.06] border border-white/[0.1] rounded-xl px-2 py-6 flex flex-col items-center gap-1">
                <DoorOpen size={14} strokeWidth={1.5} className="text-white/30" />
                <span className="text-[0.5rem] font-medium text-white/30 uppercase tracking-wider [writing-mode:vertical-lr]">
                  Entrée
                </span>
              </div>

              {/* Tables */}
              {currentTables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-white/30">
                    {editMode ? "Clic droit ou bouton + pour ajouter une table" : "Aucune table configurée"}
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
                      isSelected ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-[#0a0a0f] shadow-[0_0_20px_rgba(96,165,250,0.2)]" : ""
                    } ${isDragging ? "z-50 shadow-2xl scale-110" : "hover:scale-105"} ${
                      table.status === "blocked" ? "opacity-40" : ""
                    }`}
                    style={{ left: table.x, top: table.y }}
                  >
                    <span className="text-xs font-semibold leading-none">
                      {table.label}
                    </span>
                    <span className="text-[0.5rem] opacity-60">{table.capacity}p</span>
                    {table.vip && (
                      <Crown size={8} strokeWidth={2} className="absolute -top-1 -right-1 text-amber-400" />
                    )}
                  </div>
                );
              })}

              {/* Context menu */}
              {contextMenu && editMode && (
                <div
                  className="absolute z-[60] backdrop-blur-xl bg-[#1a1a2e] border border-white/15 rounded-xl shadow-2xl p-1 min-w-[180px]"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      addTable(contextMenu.canvasX, contextMenu.canvasY);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Plus size={15} strokeWidth={1.5} className="text-blue-400" />
                    Nouvelle table ici
                  </button>
                  {contextMenu.tableId !== null && (
                    <button
                      onClick={() => {
                        deleteTable(contextMenu.tableId!);
                        setContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400/80 hover:bg-red-400/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                      Supprimer table {currentTables.find((t) => t.id === contextMenu.tableId)?.label}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
                className="h-8 w-8 backdrop-blur-xl bg-white/10 border border-white/15 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
              >
                <Plus size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))}
                className="h-8 w-8 backdrop-blur-xl bg-white/10 border border-white/15 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all"
              >
                <Minus size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar: Selected table details ── */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-5 space-y-5">
              {/* Table info */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white font-ui">
                    Table {selected.label}
                  </h2>
                  {selected.vip && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 text-[0.6875rem] font-medium text-amber-400">
                      <Crown size={10} strokeWidth={2} />
                      VIP
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.04] rounded-xl p-3">
                    <p className="text-[0.625rem] text-white/30 uppercase tracking-wider">Capacité</p>
                    <p className="text-sm font-medium text-white mt-0.5">{selected.capacity} pers.</p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-3">
                    <p className="text-[0.625rem] text-white/30 uppercase tracking-wider">Statut</p>
                    <p className={`text-sm font-medium mt-0.5 ${
                      selected.status === "occupied" ? "text-blue-400" : selected.status === "available" ? "text-green-400" : "text-white/30"
                    }`}>
                      {selected.status === "occupied" ? "Occupée" : selected.status === "available" ? "Disponible" : "Bloquée"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reservation details */}
              {selected.reservation ? (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                  <p className="text-[0.625rem] text-white/30 uppercase tracking-wider font-semibold">
                    Réservation
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-400/15 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-400">
                        {selected.reservation.initials}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{selected.reservation.client}</p>
                      <p className="text-[0.6875rem] text-white/40">
                        {selected.reservation.rp
                          ? `${selected.reservation.rp} · ${selected.reservation.conciergerie}`
                          : "Réservation twocards"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Users size={14} strokeWidth={1.5} />
                      <span>{selected.reservation.partySize} personnes</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Clock size={14} strokeWidth={1.5} />
                      <span>Arrivée : {selected.reservation.arrival}</span>
                    </div>
                    {selected.reservation.minSpend && (
                      <div className="flex items-center gap-2 text-white/50 text-sm">
                        <span className="text-[0.6875rem] text-white/30">Min. spend:</span>
                        <span className="text-white/70 font-medium">{selected.reservation.minSpend}</span>
                      </div>
                    )}
                  </div>

                  {selected.reservation.notes && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <p className="text-[0.625rem] text-white/30 uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-xs text-white/50 leading-relaxed">{selected.reservation.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center">
                  <p className="text-xs text-white/30">Aucune réservation sur cette table</p>
                </div>
              )}

              {/* Actions */}
              {selected.reservation && !editMode && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const key = `t-${selected.id}`;
                      if (!checkedIn.has(key)) {
                        setCheckedIn((prev) => new Set(prev).add(key));
                        showToast(`Table ${selected.label} — Check-in effectué`);
                      }
                    }}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                      checkedIn.has(`t-${selected.id}`)
                        ? "bg-green-400/15 text-green-400 border border-green-400/20"
                        : "bg-blue-500 hover:bg-blue-400 text-white"
                    }`}
                  >
                    <LogIn size={16} strokeWidth={1.5} />
                    {checkedIn.has(`t-${selected.id}`) ? "Arrivé" : "Check In"}
                  </button>
                  <button
                    onClick={async () => {
                      const resId = selected.reservation?.resId;
                      if (resId) {
                        const { error } = await createClient()
                          .from("qr_reservations")
                          .update({ table_id: null })
                          .eq("id", resId);
                        if (error) {
                          showToast("Impossible de libérer la table");
                          return;
                        }
                      }
                      setResByTable((prev) => {
                        const next = { ...prev };
                        delete next[selected.id];
                        return next;
                      });
                      setSelectedTable(null);
                      showToast(`Table ${selected.label} libérée`);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm text-white/30 hover:text-red-400 transition-colors py-2 rounded-xl hover:bg-red-400/5"
                  >
                    <X size={14} strokeWidth={1.5} />
                    Libérer la table
                  </button>
                </div>
              )}

              {/* Edit mode : propriétés de la table, persistées à chaque clic */}
              {editMode && (
                <div className="space-y-2">
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Capacité</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            patchTable(selected.id, {
                              capacity: Math.max(1, selected.capacity - 1),
                            })
                          }
                          aria-label="Réduire la capacité"
                          className="h-7 w-7 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 flex items-center justify-center"
                        >
                          <Minus size={13} strokeWidth={2} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-white tabular-nums">
                          {selected.capacity}
                        </span>
                        <button
                          onClick={() =>
                            patchTable(selected.id, {
                              capacity: Math.min(50, selected.capacity + 1),
                            })
                          }
                          aria-label="Augmenter la capacité"
                          className="h-7 w-7 rounded-lg bg-white/10 text-white/70 hover:bg-white/15 flex items-center justify-center"
                        >
                          <Plus size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Table VIP</span>
                      <button
                        onClick={() =>
                          patchTable(selected.id, { vip: !selected.vip })
                        }
                        role="switch"
                        aria-checked={selected.vip}
                        aria-label="Table VIP"
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          selected.vip ? "bg-amber-400/80" : "bg-white/15"
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
                      <span className="text-xs text-white/50">Forme</span>
                      <div className="flex gap-1.5">
                        {(["round", "rect"] as const).map((sh) => (
                          <button
                            key={sh}
                            onClick={() => patchTable(selected.id, { shape: sh })}
                            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                              selected.shape === sh
                                ? "bg-white/20 text-white"
                                : "bg-white/[0.06] text-white/40 hover:text-white/70"
                            }`}
                          >
                            {sh === "round" ? "Ronde" : "Rectangle"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Statut</span>
                      <div className="flex gap-1.5">
                        {(
                          [
                            ["available", "Libre"],
                            ["occupied", "Occupée"],
                            ["blocked", "Bloquée"],
                          ] as const
                        ).map(([st, lab]) => (
                          <button
                            key={st}
                            onClick={() => patchTable(selected.id, { status: st })}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                              selected.status === st
                                ? "bg-white/20 text-white"
                                : "bg-white/[0.06] text-white/40 hover:text-white/70"
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
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 text-red-400 transition-all"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                    Supprimer cette table
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                {editMode ? (
                  <Pencil size={20} strokeWidth={1.5} className="text-blue-400/40" />
                ) : (
                  <GripVertical size={20} strokeWidth={1.5} className="text-white/20" />
                )}
              </div>
              <p className="text-sm text-white/40">
                {editMode
                  ? "Sélectionnez une table pour la modifier"
                  : "Sélectionnez une table pour voir les détails"}
              </p>
              <p className="text-xs text-white/20 mt-1">
                {editMode
                  ? "Clic droit sur le plan pour ajouter/supprimer"
                  : "Cliquez sur \"Modifier\" pour réorganiser le plan"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-xl">
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
