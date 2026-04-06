"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Clock,
  Users,
  Ticket,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Check,
  X,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";

type EventStatus = "upcoming" | "past";

interface VenueEvent {
  id: number;
  venue: string;
  venueShort: string;
  name: string;
  day: string;
  date: number;
  month: string;
  time: string;
  ageRestriction: string;
  category: string;
  categoryColor: string;
  gradient: string;
  listes: number;
  entrees: number;
  reservations: number;
  listesMax: number;
  entreesMax: number;
  reservationsMax: number;
}

const DEMO_UPCOMING_EVENTS: VenueEvent[] = [
  {
    id: 1,
    venue: "Le Comptoir Darna",
    venueShort: "LCD",
    name: "OPENING NIGHT",
    day: "JEU.",
    date: 9,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "SEASON",
    categoryColor: "text-amber-600",
    gradient: "from-purple-900 via-purple-700 to-indigo-900",
    listes: 3,
    entrees: 12,
    reservations: 2,
    listesMax: 15,
    entreesMax: 45,
    reservationsMax: 8,
  },
  {
    id: 2,
    venue: "Sky Bar Casa",
    venueShort: "SBC",
    name: "SUNSET SESSION",
    day: "VEN.",
    date: 10,
    month: "AVR",
    time: "18:00 - 02:00",
    ageRestriction: "+21",
    category: "WEEKLY",
    categoryColor: "text-blue-600",
    gradient: "from-orange-800 via-rose-700 to-pink-900",
    listes: 0,
    entrees: 0,
    reservations: 1,
    listesMax: 20,
    entreesMax: 60,
    reservationsMax: 12,
  },
  {
    id: 3,
    venue: "Le Lotus Club",
    venueShort: "LLC",
    name: "LOTUS NIGHTS",
    day: "SAM.",
    date: 11,
    month: "AVR",
    time: "23:00 - 05:00",
    ageRestriction: "+21",
    category: "SEASON",
    categoryColor: "text-amber-600",
    gradient: "from-emerald-900 via-teal-800 to-cyan-900",
    listes: 5,
    entrees: 24,
    reservations: 4,
    listesMax: 25,
    entreesMax: 80,
    reservationsMax: 10,
  },
  {
    id: 4,
    venue: "Pacha Marrakech",
    venueShort: "PM",
    name: "HOUSE AFFAIR",
    day: "DIM.",
    date: 12,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "SPECIAL",
    categoryColor: "text-red-600",
    gradient: "from-red-900 via-rose-800 to-orange-900",
    listes: 1,
    entrees: 6,
    reservations: 0,
    listesMax: 10,
    entreesMax: 30,
    reservationsMax: 6,
  },
  {
    id: 5,
    venue: "Le Comptoir Darna",
    venueShort: "LCD",
    name: "LATIN VIBES",
    day: "JEU.",
    date: 16,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "WEEKLY",
    categoryColor: "text-blue-600",
    gradient: "from-yellow-800 via-amber-700 to-orange-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 15,
    entreesMax: 45,
    reservationsMax: 8,
  },
  {
    id: 6,
    venue: "Sky Bar Casa",
    venueShort: "SBC",
    name: "DEEP & CHILL",
    day: "VEN.",
    date: 17,
    month: "AVR",
    time: "19:00 - 02:00",
    ageRestriction: "+21",
    category: "WEEKLY",
    categoryColor: "text-blue-600",
    gradient: "from-slate-800 via-zinc-700 to-gray-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 20,
    entreesMax: 60,
    reservationsMax: 12,
  },
  {
    id: 7,
    venue: "Le Lotus Club",
    venueShort: "LLC",
    name: "AFRO HOUSE",
    day: "SAM.",
    date: 18,
    month: "AVR",
    time: "23:00 - 05:00",
    ageRestriction: "+21",
    category: "SEASON",
    categoryColor: "text-amber-600",
    gradient: "from-violet-900 via-fuchsia-800 to-pink-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 25,
    entreesMax: 80,
    reservationsMax: 10,
  },
  {
    id: 8,
    venue: "Pacha Marrakech",
    venueShort: "PM",
    name: "DISCO BALL",
    day: "DIM.",
    date: 19,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "SPECIAL",
    categoryColor: "text-red-600",
    gradient: "from-blue-900 via-indigo-800 to-violet-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 10,
    entreesMax: 30,
    reservationsMax: 6,
  },
  {
    id: 9,
    venue: "Le Comptoir Darna",
    venueShort: "LCD",
    name: "R&B CLASSICS",
    day: "JEU.",
    date: 23,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "WEEKLY",
    categoryColor: "text-blue-600",
    gradient: "from-cyan-900 via-sky-800 to-blue-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 15,
    entreesMax: 45,
    reservationsMax: 8,
  },
  {
    id: 10,
    venue: "Sky Bar Casa",
    venueShort: "SBC",
    name: "POOL PARTY",
    day: "VEN.",
    date: 24,
    month: "AVR",
    time: "14:00 - 22:00",
    ageRestriction: "+18",
    category: "SPECIAL",
    categoryColor: "text-red-600",
    gradient: "from-teal-800 via-emerald-700 to-green-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 30,
    entreesMax: 100,
    reservationsMax: 15,
  },
  {
    id: 11,
    venue: "Le Lotus Club",
    venueShort: "LLC",
    name: "TECHNO TEMPLE",
    day: "SAM.",
    date: 25,
    month: "AVR",
    time: "23:00 - 06:00",
    ageRestriction: "+21",
    category: "SEASON",
    categoryColor: "text-amber-600",
    gradient: "from-gray-900 via-zinc-800 to-neutral-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 25,
    entreesMax: 80,
    reservationsMax: 10,
  },
  {
    id: 12,
    venue: "Pacha Marrakech",
    venueShort: "PM",
    name: "IBIZA CALLING",
    day: "DIM.",
    date: 26,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "SPECIAL",
    categoryColor: "text-red-600",
    gradient: "from-rose-900 via-pink-800 to-fuchsia-900",
    listes: 0,
    entrees: 0,
    reservations: 0,
    listesMax: 10,
    entreesMax: 30,
    reservationsMax: 6,
  },
];

const DEMO_PAST_EVENTS: VenueEvent[] = [
  {
    id: 101,
    venue: "Le Comptoir Darna",
    venueShort: "LCD",
    name: "LADIES NIGHT",
    day: "JEU.",
    date: 2,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "WEEKLY",
    categoryColor: "text-blue-600",
    gradient: "from-pink-900 via-rose-800 to-red-900",
    listes: 8,
    entrees: 34,
    reservations: 5,
    listesMax: 15,
    entreesMax: 45,
    reservationsMax: 8,
  },
  {
    id: 102,
    venue: "Sky Bar Casa",
    venueShort: "SBC",
    name: "SKYLINE",
    day: "VEN.",
    date: 3,
    month: "AVR",
    time: "20:00 - 03:00",
    ageRestriction: "+21",
    category: "SEASON",
    categoryColor: "text-amber-600",
    gradient: "from-indigo-900 via-blue-800 to-cyan-900",
    listes: 12,
    entrees: 48,
    reservations: 7,
    listesMax: 20,
    entreesMax: 60,
    reservationsMax: 12,
  },
  {
    id: 103,
    venue: "Le Lotus Club",
    venueShort: "LLC",
    name: "GRAND OPENING",
    day: "SAM.",
    date: 4,
    month: "AVR",
    time: "23:00 - 06:00",
    ageRestriction: "+21",
    category: "SPECIAL",
    categoryColor: "text-red-600",
    gradient: "from-amber-900 via-yellow-800 to-orange-900",
    listes: 20,
    entrees: 72,
    reservations: 10,
    listesMax: 25,
    entreesMax: 80,
    reservationsMax: 10,
  },
  {
    id: 104,
    venue: "Pacha Marrakech",
    venueShort: "PM",
    name: "WARM UP",
    day: "DIM.",
    date: 5,
    month: "AVR",
    time: "22:00 - 04:00",
    ageRestriction: "+21",
    category: "SEASON",
    categoryColor: "text-amber-600",
    gradient: "from-stone-800 via-warmGray-700 to-neutral-900",
    listes: 6,
    entrees: 22,
    reservations: 3,
    listesMax: 10,
    entreesMax: 30,
    reservationsMax: 6,
  },
];

const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function ConciergeDashboard() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const [activeTab, setActiveTab] = useState<EventStatus>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [monthIndex, setMonthIndex] = useState(3); // Avril = index 3
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const { toast, showToast } = useToast();

  if (isLoading) return <ConciergeSkeleton />;

  const upcomingEvents = isDemoConcierge ? DEMO_UPCOMING_EVENTS : [];
  const pastEvents = isDemoConcierge ? DEMO_PAST_EVENTS : [];
  const events = activeTab === "upcoming" ? upcomingEvents : pastEvents;
  const filtered = searchQuery
    ? events.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.venue.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events;

  return (
    <div className="bg-surface min-h-screen">
      {/* Sub-header with tabs and search */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Event tabs */}
          <div className="flex items-center gap-0">
            <button
              onClick={() => setActiveTab("past")}
              className={`px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors border-b-2 ${
                activeTab === "past"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Événements passés
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 text-sm font-medium font-[family-name:var(--font-inter)] transition-colors border-b-2 ${
                activeTab === "upcoming"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Prochains événements
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
              />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white border border-outline-variant/20 rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:border-primary/30 focus:outline-none w-64 transition-colors"
              />
            </div>
            <button
              onClick={() => showToast("Filtres avancés bientôt disponibles")}
              className="p-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-low transition-colors"
            >
              <Filter size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="px-4 sm:px-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => setMonthIndex(Math.max(0, monthIndex - 1))}
          className="p-1.5 rounded-lg hover:bg-surface-low transition-colors text-on-surface-variant"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <h2 className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)]">
          {months[monthIndex]} 2026
        </h2>
        <button
          onClick={() => setMonthIndex(Math.min(11, monthIndex + 1))}
          className="p-1.5 rounded-lg hover:bg-surface-low transition-colors text-on-surface-variant"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Event Grid */}
      <div className="px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isPast={activeTab === "past"}
              onNewClient={() => { setSelectedEventId(event.id); setShowNewClientModal(true); }}
              onMenu={() => showToast(`Options pour ${event.name}`)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CalendarDays
              size={48}
              strokeWidth={1}
              className="mx-auto text-on-surface-variant/30 mb-4"
            />
            <p className="text-on-surface-variant text-sm font-[family-name:var(--font-inter)]">
              Aucun événement trouvé
            </p>
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)]">
                Nouveau client
              </h2>
              <button onClick={() => setShowNewClientModal(false)} className="text-on-surface-variant hover:text-on-background">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowNewClientModal(false);
                showToast("Client ajouté à la liste");
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Nom complet</label>
                <input type="text" required className="w-full px-4 py-2.5 bg-surface-low border-none rounded-lg text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Téléphone</label>
                <input type="tel" required className="w-full px-4 py-2.5 bg-surface-low border-none rounded-lg text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Nombre de personnes</label>
                <input type="number" defaultValue={2} min={1} className="w-full px-4 py-2.5 bg-surface-low border-none rounded-lg text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button type="submit" className="w-full bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
                Ajouter à la liste
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  isPast,
  onNewClient,
  onMenu,
}: {
  event: VenueEvent;
  isPast: boolean;
  onNewClient: () => void;
  onMenu: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border border-outline-variant/10 hover:shadow-lg transition-all duration-200 group ${
        isPast ? "opacity-75 hover:opacity-100" : ""
      }`}
    >
      {/* Flyer / Image area */}
      <div className="relative">
        <div
          className={`h-40 bg-gradient-to-br ${event.gradient} flex items-center justify-center relative overflow-hidden`}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-white/30" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full border border-white/20" />
          </div>

          {/* Event name overlay */}
          <h3 className="text-white text-2xl font-extrabold font-[family-name:var(--font-manrope)] tracking-wide relative z-10 text-center px-4 drop-shadow-lg">
            {event.name}
          </h3>

          {/* Date badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-primary text-white rounded-lg px-2.5 py-1.5 text-center min-w-[52px]">
              <p className="text-[10px] font-bold font-[family-name:var(--font-inter)] uppercase leading-none">
                {event.day}
              </p>
              <p className="text-xl font-extrabold font-[family-name:var(--font-manrope)] leading-none mt-0.5">
                {event.date}
              </p>
              <p className="text-[10px] font-bold font-[family-name:var(--font-inter)] uppercase leading-none mt-0.5">
                {event.month}
              </p>
            </div>
          </div>

          {/* Three dot menu */}
          <button onClick={onMenu} className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
        </div>

        {/* Time + age bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-outline-variant/10">
          <Clock size={13} strokeWidth={1.5} className="text-on-surface-variant/60" />
          <span className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)]">
            {event.time}
          </span>
          <span className="text-xs text-on-surface-variant/40">
            {event.ageRestriction}
          </span>
        </div>
      </div>

      {/* Event details */}
      <div className="p-3">
        {/* Category tag */}
        <div className="mb-3">
          <span
            className={`text-xs font-bold font-[family-name:var(--font-inter)] ${event.categoryColor}`}
          >
            {event.category}
          </span>
          <span className="text-xs text-on-surface-variant/40 font-[family-name:var(--font-inter)]">
            {" "}
            | {event.venue}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
              Listes
            </span>
            <div className="flex items-center gap-0.5 ml-1">
              <Users size={12} strokeWidth={1.5} className="text-emerald-500" />
              <span className="text-xs font-bold text-on-background font-[family-name:var(--font-manrope)]">
                {event.listes}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
              Entrées
            </span>
            <div className="flex items-center gap-0.5 ml-1">
              <Ticket size={12} strokeWidth={1.5} className="text-blue-500" />
              <span className="text-xs font-bold text-on-background font-[family-name:var(--font-manrope)]">
                {event.entrees}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
              Réserv.
            </span>
            <div className="flex items-center gap-0.5 ml-1">
              <CalendarDays
                size={12}
                strokeWidth={1.5}
                className="text-red-400"
              />
              <span className="text-xs font-bold text-on-background font-[family-name:var(--font-manrope)]">
                {event.reservations}
              </span>
            </div>
          </div>
        </div>

        {/* Add client button */}
        <button onClick={onNewClient} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-low hover:bg-surface-mid text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors font-[family-name:var(--font-inter)] cursor-pointer">
          <UserPlus size={16} strokeWidth={1.5} />
          Nouveau client
        </button>
      </div>
    </div>
  );
}
