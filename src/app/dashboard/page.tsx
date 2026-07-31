"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  UserPlus,
  Users,
  LayoutGrid,
  List,
  ChevronDown,
  Maximize2,
  QrCode,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";

/* ── palette niveaux de service ─────────────────────────── */

const LEVEL_STYLES: Record<string, string> = {
  VVIP: "bg-rose-500/15 text-rose-300",
  "High-spend": "bg-amber-500/15 text-amber-300",
  Priority: "bg-purple-500/15 text-purple-300",
  Standard: "bg-blue-500/15 text-blue-300",
};

/* ── données démo (réservations entrantes) ──────────────── */

const RESERVATIONS = [
  { name: "Yasmine Alaoui", detail: "6 couverts · Rooftop", level: "VVIP", apporteur: "Jota Conciergerie", minSpend: "12 000 MAD", arrivee: "22:30" },
  { name: "Karim Bennis", detail: "4 couverts · Salle", level: "VVIP", apporteur: "Liam Hamza", minSpend: "8 000 MAD", arrivee: "22:45" },
  { name: "Sofia Lambert", detail: "8 couverts · Terrasse", level: "Priority", apporteur: "Hôtel Anaïa", minSpend: "6 000 MAD", arrivee: "23:00" },
  { name: "James Whitmore", detail: "2 couverts · Salle", level: "Priority", apporteur: "Riad Dar Zina", minSpend: "3 500 MAD", arrivee: "23:15" },
  { name: "Nadia El Fassi", detail: "10 couverts · Rooftop", level: "High-spend", apporteur: "Selim RP", minSpend: "15 000 MAD", arrivee: "23:30" },
  { name: "Marco Rinaldi", detail: "5 couverts · Terrasse", level: "High-spend", apporteur: "Jota Conciergerie", minSpend: "9 000 MAD", arrivee: "23:45" },
  { name: "Lina Berrada", detail: "3 couverts · Salle", level: "Standard", apporteur: "Hôtel Anaïa", minSpend: "—", arrivee: "00:15" },
  { name: "Omar Chraibi", detail: "6 couverts · Rooftop", level: "Standard", apporteur: "Aya Influence", minSpend: "4 000 MAD", arrivee: "00:30" },
];

/* ── données démo (calendrier disponibilités) ───────────── */

const DAYS = [
  { num: "11", label: "Lundi" },
  { num: "12", label: "Mardi" },
  { num: "13", label: "Mercredi" },
  { num: "14", label: "Jeudi" },
  { num: "15", label: "Vendredi" },
  { num: "16", label: "Samedi" },
  { num: "17", label: "Dimanche" },
];

const HOURS = ["20:00", "21:00", "22:00", "23:00", "00:00"];
const HOUR_START = 20; // 20:00
const ROW_H = 46; // px par heure

type Block = {
  day: number; // index 0-6
  start: number; // heure décimale (20.5 = 20:30)
  duration: number; // heures
  title: string;
  time: string;
  status: "confirmee" | "attente" | "evenement";
};

const BLOCKS: Block[] = [
  { day: 0, start: 20.75, duration: 1, title: "Table 4 : Bennis", time: "20:45 – 21:45", status: "confirmee" },
  { day: 2, start: 20, duration: 2, title: "Groupe Whitmore", time: "20:00 – 22:00", status: "confirmee" },
  { day: 2, start: 22.5, duration: 1, title: "Table 9 : Rinaldi", time: "22:30 – 23:30", status: "attente" },
  { day: 3, start: 20, duration: 1, title: "Table 2 : Lambert", time: "20:00 – 21:00", status: "confirmee" },
  { day: 4, start: 20, duration: 1.5, title: "Privatisation partielle", time: "20:00 – 21:30", status: "evenement" },
  { day: 4, start: 21.75, duration: 2.25, title: "Soirée Jota — 3 tables", time: "21:45 – 00:00", status: "evenement" },
  { day: 3, start: 23, duration: 1.5, title: "Table 12 : El Fassi", time: "23:00 – 00:30", status: "attente" },
  { day: 5, start: 22.5, duration: 1, title: "Table 7 : Alaoui", time: "22:30 – 23:30", status: "confirmee" },
  { day: 6, start: 20.5, duration: 1, title: "Table 5 : Berrada", time: "20:30 – 21:30", status: "confirmee" },
];

const BLOCK_STYLES: Record<Block["status"], string> = {
  confirmee: "border-t-2 border-emerald-400 bg-emerald-400/10",
  attente: "border-t-2 border-amber-400 bg-amber-400/10",
  evenement: "border-t-2 border-blue-400 bg-blue-400/10",
};

/* ── composants ─────────────────────────────────────────── */

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const h = now ? String(now.getHours()).padStart(2, "0") : "--";
  const m = now ? String(now.getMinutes()).padStart(2, "0") : "--";
  return (
    <span className="tabular-nums text-xl font-medium text-white">
      {h}
      <span className="animate-pulse text-white/60">:</span>
      {m}
    </span>
  );
}

const panel =
  "backdrop-blur-2xl bg-black/45 border border-white/10 rounded-3xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]";

export default function DashboardPage() {
  const { venueName } = useAuthUser();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [calView, setCalView] = useState<"Jour" | "Semaine" | "Mois">("Semaine");

  return (
    <div className="relative flex flex-col gap-5 pb-8 font-[family-name:var(--font-inter)]">
      {/* Barre pilule supérieure */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <div className={`${panel} flex items-center gap-5 rounded-full px-6 py-3`}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
              t.
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">twocards</p>
              <p className="text-[11px] text-white/50">Établissement</p>
            </div>
          </div>
          <span className="h-8 w-px bg-white/10" />
          <button className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[10px] font-semibold text-white">
              {(venueName || "Mon établissement").slice(0, 2).toUpperCase()}
            </span>
            <span className="max-w-[160px] truncate text-sm font-medium text-white">
              {venueName || "Mon établissement"}
            </span>
            <ChevronDown size={14} className="text-white/50" />
          </button>
          <span className="h-8 w-px bg-white/10" />
          <Clock />
        </div>
      </motion.div>

      {/* Barre outils : titre + recherche + vues */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="flex items-center gap-3"
      >
        <div className={`${panel} shrink-0 rounded-full px-5 py-3`}>
          <span className="text-sm font-medium text-white">
            Prochaines réservations
          </span>
        </div>
        <div className={`${panel} flex flex-1 items-center gap-3 rounded-full px-5 py-3`}>
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            type="text"
            placeholder="Rechercher un client, un apporteur, une table…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-white transition-transform hover:scale-105">
            <Users size={17} strokeWidth={1.75} />
          </button>
          <button className={`${panel} flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white`}>
            <UserPlus size={17} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              view === "grid" ? "bg-blue-500 text-white" : `${panel} text-white/60 hover:text-white`
            }`}
          >
            <LayoutGrid size={17} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              view === "list" ? "bg-blue-500 text-white" : `${panel} text-white/60 hover:text-white`
            }`}
          >
            <List size={17} strokeWidth={1.75} />
          </button>
        </div>
      </motion.div>

      {/* Grille des réservations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16 }}
        className={
          view === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            : "flex flex-col gap-3"
        }
      >
        {RESERVATIONS.map((r) => (
          <div key={r.name} className={`${panel} flex flex-col p-5 transition-colors hover:border-white/20`}>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold text-white">{r.name}</p>
                <p className="mt-0.5 text-xs text-white/50">{r.detail}</p>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${LEVEL_STYLES[r.level]}`}>
                {r.level}
              </span>
            </div>

            <div className="mb-4 flex flex-1 flex-col gap-2 rounded-2xl bg-white/[0.04] p-3.5">
              {[
                ["Apporteur", r.apporteur],
                ["Min. spend", r.minSpend],
                ["Arrivée", r.arrivee],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-white/45">{label} :</span>
                  <span className="truncate font-medium text-white">{value}</span>
                </div>
              ))}
            </div>

            <button className="rounded-xl bg-white/[0.07] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/15">
              Voir la réservation
            </button>
          </div>
        ))}
      </motion.div>

      {/* Points de pagination */}
      <div className="flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        <span className="h-1.5 w-16 rounded-full bg-white/80" />
      </div>

      {/* Panneau disponibilités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24 }}
        className={`${panel} p-5 md:p-6`}
      >
        {/* En-tête du panneau */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-semibold text-white">
              Disponibilités :
            </span>
            <button className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-white/15">
              <Users size={13} className="text-white/50" />
              Rooftop
              <ChevronDown size={13} className="text-white/50" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[15px] font-medium text-white/80">
              Août 2026
            </span>
            <div className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1">
              {(["Jour", "Semaine", "Mois"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    calView === v
                      ? "bg-blue-500 text-white"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/60 transition-colors hover:text-white">
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Grille semaine */}
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {/* En-têtes jours */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-white/10 pb-2">
              <span className="text-[10px] font-medium text-white/40">
                GMT +1
              </span>
              {DAYS.map((d) => (
                <div key={d.num} className="text-center">
                  <p className="text-[13px] font-semibold text-white">{d.num}</p>
                  <p className="text-[11px] text-white/45">{d.label}</p>
                </div>
              ))}
            </div>

            {/* Corps : heures + colonnes */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)]">
              {/* Colonne heures */}
              <div>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: ROW_H }}
                    className="flex items-start pt-1 text-[11px] tabular-nums text-white/40"
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Colonnes jours */}
              {DAYS.map((d, dayIndex) => (
                <div
                  key={d.num}
                  className="relative border-l border-dashed border-white/[0.07]"
                  style={{ height: ROW_H * HOURS.length }}
                >
                  {BLOCKS.filter((b) => b.day === dayIndex).map((b) => (
                    <div
                      key={b.title}
                      className={`absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 backdrop-blur-sm ${BLOCK_STYLES[b.status]}`}
                      style={{
                        top: (b.start - HOUR_START) * ROW_H,
                        height: b.duration * ROW_H - 4,
                      }}
                    >
                      <p className="truncate text-[11px] font-semibold leading-tight text-white">
                        {b.title}
                      </p>
                      <p className="text-[10px] text-white/55">{b.time}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center gap-5 border-t border-white/10 pt-4">
          {[
            ["bg-emerald-400", "Confirmée"],
            ["bg-amber-400", "En attente"],
            ["bg-blue-400", "Événement / privatisation"],
          ].map(([dot, label]) => (
            <span key={label} className="flex items-center gap-2 text-[11px] text-white/55">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Widget flottant : prochaine arrivée */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="pointer-events-none fixed right-6 top-1/3 z-30 hidden 2xl:block"
      >
        <div className="pointer-events-auto w-60 rounded-2xl bg-blue-500/90 p-4 shadow-[0_20px_50px_-15px_rgba(59,130,246,0.5)] backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/80">
              Prochaine arrivée
            </span>
            <QrCode size={15} className="text-white/80" />
          </div>
          <p className="text-sm font-semibold text-white">Yasmine Alaoui</p>
          <p className="mb-2 text-[11px] text-white/75">Table 7 · Rooftop</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tabular-nums text-white">
              22:30
            </span>
            <span className="rounded-md bg-white/20 px-2 py-1 text-[10px] font-medium text-white">
              Jota Conciergerie
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
