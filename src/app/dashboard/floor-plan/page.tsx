"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  Plus,
  Minus,
  Pencil,
  PlusCircle,
  User,
  Users,
  Clock,
  Crown,
  LogIn,
  X,
  Music,
  Wine,
  DoorOpen,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

interface Table {
  id: number;
  x: number;
  y: number;
  shape: "round" | "rect";
  status: "available" | "occupied" | "blocked";
  vip: boolean;
  label: string;
  capacity: number;
}

const DEMO_TABLES: Table[] = [
  { id: 1, x: 80, y: 120, shape: "round", status: "available", vip: false, label: "1", capacity: 4 },
  { id: 2, x: 180, y: 120, shape: "round", status: "occupied", vip: false, label: "2", capacity: 4 },
  { id: 3, x: 280, y: 120, shape: "round", status: "available", vip: false, label: "3", capacity: 6 },
  { id: 4, x: 380, y: 120, shape: "round", status: "occupied", vip: false, label: "4", capacity: 4 },
  { id: 5, x: 80, y: 240, shape: "round", status: "available", vip: false, label: "5", capacity: 4 },
  { id: 6, x: 180, y: 240, shape: "round", status: "blocked", vip: false, label: "6", capacity: 6 },
  { id: 7, x: 280, y: 240, shape: "round", status: "available", vip: false, label: "7", capacity: 4 },
  { id: 8, x: 380, y: 240, shape: "round", status: "occupied", vip: false, label: "8", capacity: 6 },
  { id: 9, x: 80, y: 370, shape: "rect", status: "occupied", vip: true, label: "VIP 9", capacity: 8 },
  { id: 10, x: 220, y: 370, shape: "rect", status: "available", vip: true, label: "VIP 10", capacity: 10 },
  { id: 11, x: 360, y: 370, shape: "rect", status: "available", vip: true, label: "VIP 11", capacity: 8 },
  { id: 12, x: 220, y: 480, shape: "rect", status: "occupied", vip: true, label: "VIP 12", capacity: 12 },
];

const DEMO_SELECTED_RESERVATION = {
  client: "Hicham El Guerrouj",
  initials: "HE",
  pr: "Youssef Alaoui",
  partySize: 8,
  arrival: "23h30",
  status: "Confirmée",
  minSpend: "3 000 MAD",
  notes: "Anniversaire de sa femme. Gâteau prévu à 1h00. Champagne Ruinart en priorité.",
};

function tableColor(status: string, vip: boolean, selected: boolean) {
  if (selected) return "bg-primary text-white";
  if (status === "blocked") return "bg-surface-mid text-on-surface-variant bg-stripes";
  if (status === "occupied" && vip) return "bg-amber-100 text-amber-900";
  if (status === "occupied") return "bg-primary/15 text-primary";
  return "bg-surface-card text-on-surface-variant border border-outline-variant/30";
}

export default function FloorPlanPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const [selectedTable, setSelectedTable] = useState<number>(isDemoVenue ? 12 : 0);
  const [zoom, setZoom] = useState(1);
  const [checkedIn, setCheckedIn] = useState<Set<number>>(new Set());
  const { toast, showToast } = useToast();

  const tables = isDemoVenue ? DEMO_TABLES : [];
  const selectedReservation = isDemoVenue ? DEMO_SELECTED_RESERVATION : null;

  const selected = tables.find((t) => t.id === selectedTable);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
          Plan de Salle
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => showToast("Sélection d'événement bientôt disponible")} className="inline-flex items-center gap-1.5 bg-surface-mid rounded-sm px-3 py-2 text-sm text-on-surface-variant">
            Vendredi Signature - 05 Avr
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button onClick={() => showToast("Mode édition bientôt disponible")} className="inline-flex items-center gap-2 bg-surface-mid rounded-sm px-4 py-2 text-sm text-on-surface-variant hover:text-on-background transition-colors">
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            Modifier le Plan
          </button>
          <button onClick={() => showToast("Ajout de table bientôt disponible")} className="inline-flex items-center gap-2 bg-primary text-white rounded-sm px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors">
            <PlusCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ajouter une Table
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-4 flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-surface-card border border-outline-variant/30" />
          <span className="text-xs text-on-surface-variant">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary/15" />
          <span className="text-xs text-on-surface-variant">Occupée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-100" />
          <span className="text-xs text-on-surface-variant">VIP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-surface-mid" />
          <span className="text-xs text-on-surface-variant">Bloquée</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-primary" />
          <span className="text-xs text-on-surface-variant">Sélectionnée</span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left - Floor plan canvas */}
        <div className="lg:col-span-7">
          <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden relative">
            <div
              className="blueprint-grid relative"
              style={{
                height: 600,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              {/* Room walls */}
              <div className="absolute inset-3 border-2 border-surface-mid rounded-md" />

              {/* DJ Booth */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-surface-mid rounded-sm px-4 py-2 flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={1.5} />
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  DJ Booth
                </span>
              </div>

              {/* Bar */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-surface-mid rounded-sm px-2 py-8 flex flex-col items-center gap-1">
                <Wine className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={1.5} />
                <span className="text-[0.625rem] font-medium text-on-surface-variant uppercase tracking-wider [writing-mode:vertical-lr]">
                  Bar
                </span>
              </div>

              {/* Entrance */}
              <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-surface-low rounded-sm px-2 py-6 flex flex-col items-center gap-1">
                <DoorOpen className="h-3.5 w-3.5 text-on-surface-variant" strokeWidth={1.5} />
                <span className="text-[0.625rem] font-medium text-on-surface-variant uppercase tracking-wider [writing-mode:vertical-lr]">
                  Entrée
                </span>
              </div>

              {/* Tables */}
              {tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant">Aucune table configurée</p>
                </div>
              )}
              {tables.map((table) => {
                const isSelected = table.id === selectedTable;
                const color = tableColor(table.status, table.vip, isSelected);
                const size = table.shape === "round" ? "h-14 w-14 rounded-full" : "h-14 w-24 rounded-md";

                return (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table.id)}
                    className={`absolute flex flex-col items-center justify-center ${size} ${color} transition-all hover:scale-110 editorial-shadow ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""} ${table.status === "blocked" ? "opacity-60" : ""}`}
                    style={{ left: table.x, top: table.y }}
                  >
                    <span className="text-xs font-semibold leading-none">
                      {table.label}
                    </span>
                    <span className="text-[0.5625rem] opacity-70">{table.capacity}p</span>
                  </button>
                );
              })}
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
                className="h-8 w-8 bg-surface-card editorial-shadow rounded-sm flex items-center justify-center text-on-surface-variant hover:text-on-background transition-colors"
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))}
                className="h-8 w-8 bg-surface-card editorial-shadow rounded-sm flex items-center justify-center text-on-surface-variant hover:text-on-background transition-colors"
              >
                <Minus className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Right - Selected table details */}
        <div className="lg:col-span-3">
          {selected && selectedReservation ? (
            <div className="bg-surface-card rounded-md editorial-shadow p-5 space-y-5">
              {/* Table info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
                    Table {selected.label}
                  </h2>
                  {selected.vip && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.6875rem] font-medium text-amber-800">
                      <Crown className="h-3 w-3" strokeWidth={1.5} />
                      Zone VIP
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                      Capacité
                    </p>
                    <p className="text-sm font-medium text-on-background">
                      {selected.capacity} personnes
                    </p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                      Minimum Spend
                    </p>
                    <p className="text-sm font-medium text-on-background">
                      {selectedReservation.minSpend}
                    </p>
                  </div>
                </div>
              </div>

              {/* Separator via tonal shift */}
              <div className="bg-surface-low rounded-md p-4">
                <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant mb-3">
                  Réservation
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {selectedReservation.initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-background">
                      {selectedReservation.client}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      PR: {selectedReservation.pr}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>{selectedReservation.partySize} personnes</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>Arrivée prévue : {selectedReservation.arrival}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.6875rem] font-medium text-emerald-800">
                      {selectedReservation.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant mb-2">
                  Notes internes
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {selectedReservation.notes}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCheckedIn((prev) => new Set(prev).add(selectedTable));
                    showToast(`Table ${selected.label} — Check-in effectué`);
                  }}
                  disabled={checkedIn.has(selectedTable)}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors ${checkedIn.has(selectedTable) ? "bg-emerald-600 text-white cursor-default" : "bg-primary text-white hover:bg-primary-dark"}`}
                >
                  <LogIn className="h-4 w-4" strokeWidth={1.5} />
                  {checkedIn.has(selectedTable) ? "Arrivé ✓" : "Arrivée (Check In)"}
                </button>
                <button
                  onClick={() => {
                    showToast(`Réservation table ${selected.label} annulée`);
                    setSelectedTable(0);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm text-on-surface-variant hover:text-error transition-colors py-2"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Annuler la Réservation
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-card rounded-md editorial-shadow p-8 text-center">
              <p className="text-sm text-on-surface-variant">
                {tables.length === 0
                  ? "Aucune table configurée"
                  : "Sélectionnez une table pour voir les détails"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-md shadow-lg">
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Inline style for striped blocked tables */}
      <style jsx>{`
        .bg-stripes {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(0, 0, 0, 0.04) 4px,
            rgba(0, 0, 0, 0.04) 8px
          );
        }
      `}</style>
    </div>
  );
}
