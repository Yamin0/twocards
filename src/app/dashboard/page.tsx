"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  LayoutGrid,
  List,
  ChevronDown,
  QrCode,
  X,
  Check,
  CircleDollarSign,
  CalendarCheck,
  Percent,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

/* ── palette niveaux de service ─────────────────────────── */

const LEVEL_STYLES: Record<string, string> = {
  VVIP: "bg-rose-500/15 text-rose-300",
  "High-spend": "bg-amber-500/15 text-amber-300",
  Priority: "bg-purple-500/15 text-purple-300",
  Standard: "bg-blue-500/15 text-blue-300",
};

/* ── données démo (réservations entrantes) ──────────────── */

type Reservation = {
  name: string;
  couverts: number;
  zone: "Rooftop" | "Salle" | "Terrasse";
  level: keyof typeof LEVEL_STYLES;
  apporteur: string;
  minSpend: string;
  arrivee: string;
  acompte: string;
  telephone: string;
  note?: string;
  etat: "confirmee" | "acompte" | "arrivee";
};

const RESERVATIONS: Reservation[] = [
  { name: "Yasmine Alaoui", couverts: 6, zone: "Rooftop", level: "VVIP", apporteur: "Jota Conciergerie", minSpend: "12 000 MAD", arrivee: "22:30", acompte: "2 400 MAD payé", telephone: "+212 6•• ••• •41", note: "Table près de la vue, champagne à l'arrivée", etat: "acompte" },
  { name: "Karim Bennis", couverts: 4, zone: "Salle", level: "VVIP", apporteur: "Liam Hamza", minSpend: "8 000 MAD", arrivee: "22:45", acompte: "1 600 MAD payé", telephone: "+212 6•• ••• •87", etat: "confirmee" },
  { name: "Sofia Lambert", couverts: 8, zone: "Terrasse", level: "Priority", apporteur: "Hôtel Anaïa", minSpend: "6 000 MAD", arrivee: "23:00", acompte: "1 200 MAD payé", telephone: "+33 6 •• •• •• 12", note: "Anniversaire — dessert signature", etat: "acompte" },
  { name: "James Whitmore", couverts: 2, zone: "Salle", level: "Priority", apporteur: "Riad Dar Zina", minSpend: "3 500 MAD", arrivee: "23:15", acompte: "700 MAD payé", telephone: "+44 7• •• •• •• 03", etat: "confirmee" },
  { name: "Nadia El Fassi", couverts: 10, zone: "Rooftop", level: "High-spend", apporteur: "Selim RP", minSpend: "15 000 MAD", arrivee: "23:30", acompte: "3 000 MAD payé", telephone: "+212 6•• ••• •29", note: "Groupe corporate — facture unique", etat: "acompte" },
  { name: "Marco Rinaldi", couverts: 5, zone: "Terrasse", level: "High-spend", apporteur: "Jota Conciergerie", minSpend: "9 000 MAD", arrivee: "23:45", acompte: "1 800 MAD payé", telephone: "+39 3•• ••• ••55", etat: "confirmee" },
  { name: "Lina Berrada", couverts: 3, zone: "Salle", level: "Standard", apporteur: "Hôtel Anaïa", minSpend: "—", arrivee: "00:15", acompte: "—", telephone: "+212 6•• ••• •63", etat: "confirmee" },
  { name: "Omar Chraibi", couverts: 6, zone: "Rooftop", level: "Standard", apporteur: "Aya Influence", minSpend: "4 000 MAD", arrivee: "00:30", acompte: "800 MAD payé", telephone: "+212 6•• ••• •18", etat: "arrivee" },
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
const HOUR_START = 20;
const ROW_H = 46;

type Block = {
  day: number;
  start: number;
  duration: number;
  title: string;
  time: string;
  status: "confirmee" | "attente" | "evenement";
  zone: "Rooftop" | "Salle" | "Terrasse";
};

const BLOCKS: Block[] = [
  { day: 0, start: 20.75, duration: 1, title: "Table 4 : Bennis", time: "20:45 – 21:45", status: "confirmee", zone: "Salle" },
  { day: 2, start: 20, duration: 2, title: "Groupe Whitmore", time: "20:00 – 22:00", status: "confirmee", zone: "Salle" },
  { day: 2, start: 22.5, duration: 1, title: "Table 9 : Rinaldi", time: "22:30 – 23:30", status: "attente", zone: "Terrasse" },
  { day: 3, start: 20, duration: 1, title: "Table 2 : Lambert", time: "20:00 – 21:00", status: "confirmee", zone: "Terrasse" },
  { day: 3, start: 23, duration: 1.5, title: "Table 12 : El Fassi", time: "23:00 – 00:30", status: "attente", zone: "Rooftop" },
  { day: 4, start: 20, duration: 1.5, title: "Privatisation partielle", time: "20:00 – 21:30", status: "evenement", zone: "Rooftop" },
  { day: 4, start: 21.75, duration: 2.25, title: "Soirée Jota — 3 tables", time: "21:45 – 00:00", status: "evenement", zone: "Rooftop" },
  { day: 5, start: 22.5, duration: 1, title: "Table 7 : Alaoui", time: "22:30 – 23:30", status: "confirmee", zone: "Rooftop" },
  { day: 6, start: 20.5, duration: 1, title: "Table 5 : Berrada", time: "20:30 – 21:30", status: "confirmee", zone: "Salle" },
];

const BLOCK_STYLES: Record<Block["status"], string> = {
  confirmee: "border-t-2 border-emerald-400 bg-emerald-400/10",
  attente: "border-t-2 border-amber-400 bg-amber-400/10",
  evenement: "border-t-2 border-blue-400 bg-blue-400/10",
};

const ZONES = ["Toutes zones", "Rooftop", "Salle", "Terrasse"] as const;

/* ── timeline d'une réservation ─────────────────────────── */

const TIMELINE_STEPS = [
  "Demande reçue",
  "Confirmée",
  "Acompte payé",
  "Check-in",
  "Facture vérifiée",
  "Commission",
] as const;

function timelineIndex(etat: Reservation["etat"]) {
  if (etat === "arrivee") return 3;
  if (etat === "acompte") return 2;
  return 1;
}

/* ── composants ─────────────────────────────────────────── */

/* useSyncExternalStore plutôt qu'un setState dans un effet : le serveur rend
   « --:-- » (pas d'heure fiable côté serveur), le client affiche l'heure dès
   l'hydratation, et l'intervalle ne déclenche un rendu qu'au changement de
   minute. */
function clockSubscribe(onTick: () => void) {
  const id = setInterval(onTick, 30_000);
  return () => clearInterval(id);
}

function clockSnapshot() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function Clock() {
  const time = useSyncExternalStore(clockSubscribe, clockSnapshot, () => null);
  const [h, m] = time ? time.split(":") : ["--", "--"];
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

const DEMO_STATS = [
  { icon: Users, label: "Couverts ce soir", value: "44" },
  { icon: CircleDollarSign, label: "CA attendu", value: "57 500 MAD" },
  { icon: Percent, label: "Commissions en attente", value: "4 320 MAD" },
  { icon: UserCheck, label: "Présence sur 30 jours", value: "94 %" },
];

/* Compte réel sans historique : tout démarre à zéro. */
const EMPTY_STATS = [
  { icon: Users, label: "Couverts ce soir", value: "0" },
  { icon: CircleDollarSign, label: "CA attendu", value: "0 MAD" },
  { icon: Percent, label: "Commissions en attente", value: "0 MAD" },
  { icon: UserCheck, label: "Présence sur 30 jours", value: "—" },
];

export default function DashboardPage() {
  const { venueName, isDemoVenue, isLoading } = useAuthUser();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [calView, setCalView] = useState<"Jour" | "Semaine" | "Mois">("Semaine");
  const [calDay, setCalDay] = useState(4); // Vendredi
  const [zone, setZone] = useState<(typeof ZONES)[number]>("Toutes zones");
  const [zoneOpen, setZoneOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [checkedIn, setCheckedIn] = useState<Record<string, boolean>>({});

  /* Les données démo n'existent que pour le compte de démonstration ;
     un compte fraîchement créé démarre vierge. */
  const reservations = useMemo(
    () => (isDemoVenue ? RESERVATIONS : []),
    [isDemoVenue]
  );
  const stats = isDemoVenue ? DEMO_STATS : EMPTY_STATS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reservations;
    return reservations.filter((r) =>
      [r.name, r.apporteur, r.zone, r.level].join(" ").toLowerCase().includes(q)
    );
  }, [query, reservations]);

  const visibleBlocks = useMemo(
    () =>
      (isDemoVenue ? BLOCKS : []).filter(
        (b) => zone === "Toutes zones" || b.zone === zone
      ),
    [zone, isDemoVenue]
  );

  if (isLoading) return <DashboardSkeleton />;

  const dayCount = (d: number) => visibleBlocks.filter((b) => b.day === d).length;

  return (
    <div className="relative flex flex-col gap-5 pb-8 font-[family-name:var(--font-inter)]">
      {/* Barre pilule supérieure */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <div className={`${panel} flex flex-wrap items-center justify-center gap-3 rounded-full px-5 py-3 sm:gap-5 sm:px-6`}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
              t.
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">twocards</p>
              <p className="text-[11px] text-white/50">Établissement</p>
            </div>
          </div>
          <span className="hidden h-8 w-px bg-white/10 sm:block" />
          {/* Renvoie aux paramètres de l'établissement : un faux menu déroulant
              qui ne fait rien serait pire qu'un lien honnête. */}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[10px] font-semibold text-white">
              {(venueName || "Mon établissement").slice(0, 2).toUpperCase()}
            </span>
            <span className="max-w-[160px] truncate text-sm font-medium text-white">
              {venueName || "Mon établissement"}
            </span>
            <ChevronDown size={14} className="text-white/50" />
          </Link>
          <span className="hidden h-8 w-px bg-white/10 sm:block" />
          <Clock />
        </div>
      </motion.div>

      {/* Stats du soir */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {stats.map((s) => (
          <div key={s.label} className={`${panel} flex items-center gap-3.5 rounded-2xl px-4 py-3.5`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white/70">
              <s.icon size={16} strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] text-white/50">{s.label}</p>
              <p className="truncate text-[15px] font-semibold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Barre outils : titre + recherche + vues */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className={`${panel} shrink-0 rounded-full px-5 py-3`}>
          <span className="text-sm font-medium text-white">
            Prochaines réservations
          </span>
        </div>
        <div className={`${panel} flex min-w-[200px] flex-1 items-center gap-3 rounded-full px-5 py-3`}>
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un client, un apporteur, une zone…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Effacer" className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setView("grid")}
            aria-label="Vue grille"
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              view === "grid" ? "bg-blue-500 text-white" : `${panel} text-white/60 hover:text-white`
            }`}
          >
            <LayoutGrid size={17} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="Vue liste"
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              view === "list" ? "bg-blue-500 text-white" : `${panel} text-white/60 hover:text-white`
            }`}
          >
            <List size={17} strokeWidth={1.75} />
          </button>
        </div>
      </motion.div>

      {/* Réservations */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.16 }}
      >
        {reservations.length === 0 ? (
          <div className={`${panel} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
            <p className="text-sm font-medium text-white">Aucune réservation à venir</p>
            <p className="text-[13px] text-white/50">
              Les réservations envoyées par les concierges et apporteurs du
              réseau apparaîtront ici.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`${panel} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
            <p className="text-sm font-medium text-white">Aucune réservation ne correspond à « {query} »</p>
            <p className="text-[13px] text-white/50">Essayez un nom de client, d&apos;apporteur ou une zone.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((r) => (
              <div key={r.name} className={`${panel} flex flex-col p-5 transition-colors hover:border-white/20`}>
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-semibold text-white">{r.name}</p>
                    <p className="mt-0.5 text-xs text-white/50">
                      {r.couverts} couverts · {r.zone}
                    </p>
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

                <button
                  onClick={() => setSelected(r)}
                  className="rounded-xl bg-white/[0.07] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Voir la réservation
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${panel} overflow-hidden`}>
            <div className="hidden grid-cols-[1.6fr_1fr_1.4fr_1fr_0.8fr_auto] gap-3 border-b border-white/[0.08] px-5 py-3 text-[11px] uppercase tracking-wide text-white/40 md:grid">
              <span>Client</span>
              <span>Niveau</span>
              <span>Apporteur</span>
              <span>Min. spend</span>
              <span>Arrivée</span>
              <span />
            </div>
            {filtered.map((r) => (
              <button
                key={r.name}
                onClick={() => setSelected(r)}
                className="grid w-full grid-cols-2 items-center gap-3 border-b border-white/[0.05] px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-white/[0.04] md:grid-cols-[1.6fr_1fr_1.4fr_1fr_0.8fr_auto]"
              >
                <span>
                  <span className="block text-[14px] font-medium text-white">{r.name}</span>
                  <span className="text-[11px] text-white/45">{r.couverts} couverts · {r.zone}</span>
                </span>
                <span className={`w-fit rounded-md px-2 py-0.5 text-[11px] font-medium ${LEVEL_STYLES[r.level]}`}>
                  {r.level}
                </span>
                <span className="hidden truncate text-[13px] text-white/70 md:block">{r.apporteur}</span>
                <span className="hidden text-[13px] text-white/70 md:block">{r.minSpend}</span>
                <span className="text-[13px] font-medium tabular-nums text-white">{r.arrivee}</span>
                <span className="hidden text-[11px] text-white/40 md:block">Détails →</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Panneau disponibilités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24 }}
        className={`${panel} p-5 md:p-6`}
      >
        {/* En-tête du panneau */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex items-center gap-3">
            <span className="text-[15px] font-semibold text-white">
              Disponibilités :
            </span>
            <button
              onClick={() => setZoneOpen(!zoneOpen)}
              className="flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-white/15"
            >
              <Users size={13} className="text-white/50" />
              {zone}
              <ChevronDown size={13} className={`text-white/50 transition-transform ${zoneOpen ? "rotate-180" : ""}`} />
            </button>
            {zoneOpen && (
              <div className="absolute left-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl">
                {ZONES.map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      setZone(z);
                      setZoneOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-white/10 ${
                      z === zone ? "text-white" : "text-white/60"
                    }`}
                  >
                    {z}
                    {z === zone && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
          </div>
        </div>

        {/* Vue Semaine */}
        {calView === "Semaine" && (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-white/10 pb-2">
                <span className="text-[10px] font-medium text-white/40">GMT +1</span>
                {DAYS.map((d, i) => (
                  <button
                    key={d.num}
                    onClick={() => {
                      setCalDay(i);
                      setCalView("Jour");
                    }}
                    className="rounded-lg py-1 text-center transition-colors hover:bg-white/[0.06]"
                  >
                    <p className="text-[13px] font-semibold text-white">{d.num}</p>
                    <p className="text-[11px] text-white/45">{d.label}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-[56px_repeat(7,1fr)]">
                <div>
                  {HOURS.map((h) => (
                    <div key={h} style={{ height: ROW_H }} className="flex items-start pt-1 text-[11px] tabular-nums text-white/40">
                      {h}
                    </div>
                  ))}
                </div>
                {DAYS.map((d, dayIndex) => (
                  <div
                    key={d.num}
                    className="relative border-l border-dashed border-white/[0.07]"
                    style={{ height: ROW_H * HOURS.length }}
                  >
                    {visibleBlocks
                      .filter((b) => b.day === dayIndex)
                      .map((b) => (
                        <div
                          key={b.title}
                          className={`absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 backdrop-blur-sm ${BLOCK_STYLES[b.status]}`}
                          style={{
                            top: (b.start - HOUR_START) * ROW_H,
                            height: b.duration * ROW_H - 4,
                          }}
                        >
                          <p className="truncate text-[11px] font-semibold leading-tight text-white">{b.title}</p>
                          <p className="text-[10px] text-white/55">{b.time}</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vue Jour */}
        {calView === "Jour" && (
          <div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d.num}
                  onClick={() => setCalDay(i)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    calDay === i ? "bg-white text-black" : "bg-white/[0.06] text-white/60 hover:text-white"
                  }`}
                >
                  {d.label} {d.num}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[56px_1fr]">
              <div>
                {HOURS.map((h) => (
                  <div key={h} style={{ height: ROW_H + 14 }} className="flex items-start pt-1 text-[11px] tabular-nums text-white/40">
                    {h}
                  </div>
                ))}
              </div>
              <div className="relative border-l border-dashed border-white/[0.07]" style={{ height: (ROW_H + 14) * HOURS.length }}>
                {visibleBlocks
                  .filter((b) => b.day === calDay)
                  .map((b) => (
                    <div
                      key={b.title}
                      className={`absolute left-2 right-2 overflow-hidden rounded-lg px-3 py-2 backdrop-blur-sm ${BLOCK_STYLES[b.status]}`}
                      style={{
                        top: (b.start - HOUR_START) * (ROW_H + 14),
                        height: b.duration * (ROW_H + 14) - 6,
                      }}
                    >
                      <p className="text-[13px] font-semibold text-white">{b.title}</p>
                      <p className="text-[11px] text-white/55">{b.time} · {b.zone}</p>
                    </div>
                  ))}
                {visibleBlocks.filter((b) => b.day === calDay).length === 0 && (
                  <p className="p-4 text-[13px] text-white/40">
                    Aucune réservation sur cette zone ce jour-là.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vue Mois */}
        {calView === "Mois" && (
          <div className="grid grid-cols-7 gap-1.5">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <p key={i} className="pb-1 text-center text-[10px] font-medium uppercase text-white/40">{d}</p>
            ))}
            {Array.from({ length: 31 }, (_, i) => {
              const dayOfWeek = (i + 5) % 7; // le 1er août 2026 est un samedi
              const inWeek = i + 1 >= 11 && i + 1 <= 17;
              const count = inWeek ? dayCount(i + 1 - 11) : 0;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (inWeek) {
                      setCalDay(i + 1 - 11);
                      setCalView("Jour");
                    }
                  }}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl text-[12px] transition-colors sm:aspect-auto sm:py-3 ${
                    inWeek
                      ? "bg-white/[0.07] font-medium text-white hover:bg-white/15"
                      : "text-white/30"
                  }`}
                  style={i === 0 ? { gridColumnStart: dayOfWeek + 1 } : undefined}
                >
                  {i + 1}
                  {count > 0 && (
                    <span className="mt-1 flex gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                        <span key={j} className="h-1 w-1 rounded-full bg-emerald-400" />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Légende */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4">
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

      {/* Modal détail réservation */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-x-4 top-[8%] z-50 mx-auto max-h-[84vh] max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#101010]/95 p-6 backdrop-blur-2xl md:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <span className={`mb-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${LEVEL_STYLES[selected.level]}`}>
                    {selected.level}
                  </span>
                  <h2 className="text-xl font-semibold text-white">{selected.name}</h2>
                  <p className="text-[13px] text-white/50">
                    {selected.couverts} couverts · {selected.zone} · arrivée {selected.arrivee}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Fermer"
                  className="rounded-full bg-white/[0.07] p-2 text-white/60 transition-colors hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Timeline */}
              <div className="mb-5 rounded-2xl bg-white/[0.04] p-4">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i <= (checkedIn[selected.name] ? 3 : timelineIndex(selected.etat));
                  const isLast = i === TIMELINE_STEPS.length - 1;
                  return (
                    <div key={step} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                            done ? "bg-emerald-400 text-black" : "border border-white/20 text-white/30"
                          }`}
                        >
                          {done ? <Check size={11} strokeWidth={2.5} /> : i + 1}
                        </span>
                        {!isLast && <span className={`w-px flex-1 ${done ? "bg-emerald-400/50" : "bg-white/10"}`} />}
                      </div>
                      <p className={`pb-4 text-[13px] ${done ? "font-medium text-white" : "text-white/40"}`}>
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Détails */}
              <div className="mb-5 flex flex-col gap-2.5 rounded-2xl bg-white/[0.04] p-4 text-[13px]">
                {[
                  ["Apporteur", selected.apporteur],
                  ["Téléphone client", selected.telephone],
                  ["Minimum spend", selected.minSpend],
                  ["Acompte", selected.acompte],
                  ...(selected.note ? [["Demandes spéciales", selected.note]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="shrink-0 text-white/45">{label} :</span>
                    <span className="text-right font-medium text-white">{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() =>
                    setCheckedIn((c) => ({ ...c, [selected.name]: true }))
                  }
                  disabled={checkedIn[selected.name] || selected.etat === "arrivee"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-[13px] font-semibold text-black transition-colors hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/40"
                >
                  {checkedIn[selected.name] || selected.etat === "arrivee" ? (
                    <>
                      <Check size={15} /> Client arrivé
                    </>
                  ) : (
                    <>
                      <QrCode size={15} /> Valider le check-in
                    </>
                  )}
                </button>
                <Link
                  href="/dashboard/messages"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/[0.07] py-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
                >
                  <MessageSquare size={15} /> Contacter l&apos;apporteur
                </Link>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/35">
                <CalendarCheck size={11} />
                Chaque action est horodatée et versée au journal d&apos;audit
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
