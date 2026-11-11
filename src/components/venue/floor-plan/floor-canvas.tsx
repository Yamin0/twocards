"use client";

import { useEffect, useRef, useState } from "react";
import { DoorOpen, LayoutGrid, Minus, Music, Pencil, Plus, Trash2, Wine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Button, EmptyState, IconButton, cardClass } from "@/components/app/ui";
import { TableNode, type FloorTable } from "./table-node";

/* Canevas du plan de salle. En lecture : un clic (ou Entrée) sélectionne
   une table. En édition : glisser pour déplacer (souris ou doigt), flèches
   du clavier pour déplacer de 10 px, Suppr pour supprimer, clic droit pour
   le menu « nouvelle table ici / supprimer ». */

/* Bornes de position d'une table, identiques à l'ancien plan. */
const MIN_X = 20;
const MAX_X = 530;
const MIN_Y = 20;
const MAX_Y = 470;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.5;

type Menu = { x: number; y: number; tableId: number | null };
type Drag = { id: number; offX: number; offY: number; x: number; y: number; moved: boolean };

export function FloorCanvas({
  tables,
  selectedId,
  onSelect,
  editMode,
  onEnterEdit,
  onMove,
  onMoveEnd,
  onDragChange,
  onAdd,
  onRequestDelete,
}: {
  tables: FloorTable[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  editMode: boolean;
  onEnterEdit: () => void;
  /** Déplacement à l'écran pendant le glisser. */
  onMove: (id: number, x: number, y: number) => void;
  /** Position finale à enregistrer. */
  onMoveEnd: (id: number, x: number, y: number) => void;
  onDragChange: (dragging: boolean) => void;
  onAdd: (x: number, y: number) => void;
  onRequestDelete: (id: number) => void;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [menu, setMenu] = useState<Menu | null>(null);
  const menuOpen = menu !== null && editMode;

  /* Le menu contextuel se ferme au clic ailleurs et à Échap ; à
     l'ouverture, le focus va sur sa première entrée. */
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("button")?.focus();
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  /* Position du pointeur dans le repère du canevas (zoom compris). */
  const toCanvas = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  };

  const startDrag = (e: React.PointerEvent, table: FloorTable) => {
    if (!editMode || e.button !== 0) return;
    const p = toCanvas(e.clientX, e.clientY);
    if (!p) return;
    drag.current = {
      id: table.id,
      offX: p.x - table.x,
      offY: p.y - table.y,
      x: table.x,
      y: table.y,
      moved: false,
    };
    setDraggingId(table.id);
    onDragChange(true);
    onSelect(table.id);
  };

  const moveDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!editMode || !d) return;
    const p = toCanvas(e.clientX, e.clientY);
    if (!p) return;
    const x = Math.round(clamp(p.x - d.offX, MIN_X, MAX_X));
    const y = Math.round(clamp(p.y - d.offY, MIN_Y, MAX_Y));
    if (x === d.x && y === d.y) return;
    d.x = x;
    d.y = y;
    d.moved = true;
    onMove(d.id, x, y);
  };

  const endDrag = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDraggingId(null);
    onDragChange(false);
    if (d.moved) onMoveEnd(d.id, d.x, d.y);
  };

  /* Clavier, en édition : les flèches déplacent, Suppr supprime. */
  const onTableKey = (e: React.KeyboardEvent, table: FloorTable) => {
    if (!editMode) return;
    if (e.key === "Delete") {
      e.preventDefault();
      onRequestDelete(table.id);
      return;
    }
    const step = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[
      e.key
    ];
    if (!step) return;
    e.preventDefault();
    const x = clamp(table.x + step[0], MIN_X, MAX_X);
    const y = clamp(table.y + step[1], MIN_Y, MAX_Y);
    if (x === table.x && y === table.y) return;
    onMove(table.id, x, y);
    onMoveEnd(table.id, x, y);
  };

  const openMenu = (e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const p = toCanvas(e.clientX, e.clientY);
    if (!p) return;
    const hit = (e.target as HTMLElement).closest<HTMLElement>("[data-table-id]");
    setMenu({ x: p.x, y: p.y, tableId: hit ? Number(hit.dataset.tableId) : null });
  };

  const menuTable = menu?.tableId != null ? tables.find((x) => x.id === menu.tableId) : null;

  return (
    <div
      className={cn(
        cardClass,
        "relative overflow-hidden",
        editMode && "border-info/40 ring-2 ring-info/15"
      )}
    >
      {editMode && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-info/20 bg-info-soft px-4 py-2.5">
          <p className="flex min-w-0 items-center gap-2 text-[13px] text-ink-2">
            <Pencil size={14} strokeWidth={1.75} className="shrink-0 text-info" aria-hidden />
            <span>
              <span className="font-bold text-info">{t("Mode édition.", "Edit mode.")}</span>{" "}
              {t(
                "Déplacez les tables, ajoutez-en ou supprimez-en.",
                "Move, add or delete tables."
              )}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" icon={Plus} onClick={() => onAdd(250, 200)}>
              {t("Nouvelle table", "New table")}
            </Button>
            {selectedId !== null && (
              <Button
                size="sm"
                variant="danger"
                icon={Trash2}
                onClick={() => onRequestDelete(selectedId)}
              >
                {t("Supprimer", "Delete")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Le plan mesure au moins 640 px : sur téléphone, il défile. */}
      <div className="overflow-auto scrollbar-thin">
        <div
          ref={canvasRef}
          className={cn(
            "relative h-[450px] min-w-[640px] select-none md:h-[520px]",
            editMode && "cursor-crosshair"
          )}
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          onContextMenu={openMenu}
        >
          {/* Murs de la salle */}
          <div className="absolute inset-4 rounded-2xl border-2 border-line-2 bg-fill" aria-hidden />

          {/* Repères fixes : cabine DJ, bar, entrée */}
          <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-line-2 bg-panel px-4 py-2 text-xs font-bold text-ink-2">
            <Music size={14} strokeWidth={1.75} aria-hidden />
            {t("Cabine DJ", "DJ booth")}
          </div>
          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-line-2 bg-panel px-2 py-8 text-xs font-bold text-ink-2">
            <Wine size={14} strokeWidth={1.75} aria-hidden />
            <span className="[writing-mode:vertical-lr]">{t("Bar", "Bar")}</span>
          </div>
          <div className="absolute left-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 rounded-xl border border-line-2 bg-panel px-2 py-6 text-xs font-bold text-ink-2">
            <DoorOpen size={14} strokeWidth={1.75} aria-hidden />
            <span className="[writing-mode:vertical-lr]">{t("Entrée", "Entrance")}</span>
          </div>

          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {editMode ? (
                <p className="max-w-xs text-center text-sm text-ink-2">
                  {t(
                    "Ajoutez votre première table avec « Nouvelle table », ou par un clic droit sur le plan.",
                    "Add your first table with “New table”, or by right-clicking the plan."
                  )}
                </p>
              ) : (
                <EmptyState
                  compact
                  icon={LayoutGrid}
                  title={t("Aucune table configurée", "No tables set up")}
                  description={t(
                    "Dessinez votre salle pour placer les réservations.",
                    "Draw your room to seat reservations."
                  )}
                  action={
                    <Button variant="primary" icon={Pencil} onClick={onEnterEdit}>
                      {t("Modifier le plan", "Edit the plan")}
                    </Button>
                  }
                />
              )}
            </div>
          )}

          {tables.map((table) => (
            <TableNode
              key={table.id}
              table={table}
              selected={table.id === selectedId}
              dragging={table.id === draggingId}
              editMode={editMode}
              onSelect={() => onSelect(table.id)}
              onPointerDown={(e) => startDrag(e, table)}
              onKeyDown={(e) => onTableKey(e, table)}
            />
          ))}

          {menuOpen && menu && (
            <div
              ref={menuRef}
              role="menu"
              aria-label={t("Options du plan", "Plan options")}
              className="absolute z-[60] min-w-[200px] rounded-xl border border-line-2 bg-panel p-1 shadow-pop"
              style={{ left: Math.min(menu.x, MAX_X - 100), top: menu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onAdd(menu.x, menu.y);
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-fill-2"
              >
                <Plus size={15} strokeWidth={1.75} className="text-info" aria-hidden />
                {t("Nouvelle table ici", "New table here")}
              </button>
              {menuTable && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onRequestDelete(menuTable.id);
                    setMenu(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
                >
                  <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                  {t(`Supprimer la table ${menuTable.label}`, `Delete table ${menuTable.label}`)}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zoom */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <IconButton
          icon={Plus}
          label={t("Zoomer", "Zoom in")}
          disabled={zoom >= ZOOM_MAX - 0.001}
          onClick={() => setZoom((z) => Math.min(z + 0.1, ZOOM_MAX))}
          className="border border-line-2 bg-panel text-ink-2 shadow-card"
        />
        <IconButton
          icon={Minus}
          label={t("Dézoomer", "Zoom out")}
          disabled={zoom <= ZOOM_MIN + 0.001}
          onClick={() => setZoom((z) => Math.max(z - 0.1, ZOOM_MIN))}
          className="border border-line-2 bg-panel text-ink-2 shadow-card"
        />
      </div>
    </div>
  );
}
