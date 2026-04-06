"use client";

import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  LayoutGrid,
  List,
  Calendar,
  ChevronDown,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ViewMode = "grid" | "list" | "calendar";

const DEMO_EVENTS = [
  {
    id: 1,
    title: "Gala de Minuit",
    venue: "Maison Dorée",
    date: "Sam 29 Oct",
    time: "22:00 - 05:00",
    status: "Ouvert",
    statusColor: "bg-green-100 text-green-800",
    genre: ["Electro", "House"],
    image: "bg-gradient-to-br from-primary-dark to-primary",
    spots: 113,
    closed: false,
  },
  {
    id: 2,
    title: "Nuit Blanche",
    venue: "Le Phantom Club",
    date: "Ven 28 Oct",
    time: "23:00 - 06:00",
    status: "Ouvert",
    statusColor: "bg-green-100 text-green-800",
    genre: ["Techno", "Minimal"],
    image: "bg-gradient-to-br from-indigo-900 to-indigo-700",
    spots: 42,
    closed: false,
  },
  {
    id: 3,
    title: "Soirée Tropicale",
    venue: "Jardin Perché",
    date: "Jeu 3 Nov",
    time: "20:00 - 02:00",
    status: "Ouvert",
    statusColor: "bg-green-100 text-green-800",
    genre: ["Afro", "Dancehall"],
    image: "bg-gradient-to-br from-emerald-900 to-teal-700",
    spots: 67,
    closed: false,
  },
  {
    id: 4,
    title: "After Dark Sessions",
    venue: "Le Phantom Club",
    date: "Ven 4 Nov",
    time: "00:00 - 07:00",
    status: "Bientôt complet",
    statusColor: "bg-amber-100 text-amber-800",
    genre: ["Deep House"],
    image: "bg-gradient-to-br from-slate-900 to-slate-700",
    spots: 8,
    closed: false,
  },
  {
    id: 5,
    title: "Classique en Noir",
    venue: "Opera Lounge",
    date: "Sam 5 Nov",
    time: "21:00 - 03:00",
    status: "Ouvert",
    statusColor: "bg-green-100 text-green-800",
    genre: ["Jazz", "Soul"],
    image: "bg-gradient-to-br from-amber-900 to-orange-800",
    spots: 54,
    closed: false,
  },
  {
    id: 6,
    title: "Dîner Spectacle",
    venue: "Maison Dorée",
    date: "Mer 26 Oct",
    time: "20:00 - 01:00",
    status: "Fermé",
    statusColor: "bg-surface-mid text-on-surface-variant",
    genre: ["Cabaret", "Live"],
    image: "bg-gradient-to-br from-gray-400 to-gray-500",
    spots: 0,
    closed: true,
  },
];

export default function EventsPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterVille, setFilterVille] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const events = isDemoVenue ? DEMO_EVENTS : [];

  const filteredEvents = events.filter((e) => {
    if (filterStatus && filterStatus !== "Statut") {
      if (filterStatus === "Ouvert" && e.status !== "Ouvert" && e.status !== "Bientôt complet") return false;
      if (filterStatus === "Fermé" && e.status !== "Fermé") return false;
    }
    return true;
  });

  const viewButtons: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: "grid", icon: LayoutGrid, label: "Grille" },
    { mode: "list", icon: List, label: "Liste" },
    { mode: "calendar", icon: Calendar, label: "Calendrier" },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-3xl font-extrabold">
            Événements
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Parcourez et gérez les événements à venir.
          </p>
        </div>
        <div className="flex rounded-sm overflow-hidden">
          {viewButtons.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 transition-colors ${
                viewMode === mode
                  ? "bg-primary text-white"
                  : "bg-surface-mid text-on-background hover:bg-surface-high"
              }`}
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-8 pb-6">
        <div className="bg-surface-low rounded-md p-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-surface-card border-none text-sm pl-4 pr-8 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none cursor-pointer text-on-background"
            >
              <option value="">Statut</option>
              <option value="Ouvert">Ouvert</option>
              <option value="Fermé">Fermé</option>
            </select>
            <ChevronDown size={13} strokeWidth={1.5} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          </div>
          {["Ville", "Date", "Établissement"].map((filter) => (
            <div key={filter} className="relative">
              <select className="bg-surface-card border-none text-sm pl-4 pr-8 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none cursor-pointer text-on-background">
                <option>{filter}</option>
              </select>
              <ChevronDown size={13} strokeWidth={1.5} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Event Grid */}
      <div className="px-8 pb-8">
        {filteredEvents.length === 0 ? (
          <div className="bg-surface-card rounded-md editorial-shadow p-8 text-center text-on-surface-variant text-sm">
            Aucun événement trouvé
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`group bg-surface-card rounded-md editorial-shadow overflow-hidden hover:-translate-y-1 transition-transform duration-200 ${
                  event.closed ? "opacity-60 grayscale" : ""
                }`}
              >
                {/* Image Placeholder */}
                <div className="relative aspect-video overflow-hidden">
                  <div
                    className={`w-full h-full ${event.image} group-hover:scale-105 transition-transform duration-300`}
                  />
                  {/* Status Badge */}
                  <span
                    className={`absolute top-3 right-3 text-[0.6875rem] font-semibold px-2.5 py-1 rounded-full ${event.statusColor}`}
                  >
                    {event.status}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-base mb-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1 mb-3">
                    <MapPin size={13} strokeWidth={1.5} />
                    {event.venue}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} strokeWidth={1.5} />
                      {event.date} &middot; {event.time}
                    </span>
                    {!event.closed && (
                      <span className="flex items-center gap-1">
                        <Users size={12} strokeWidth={1.5} />
                        {event.spots} places
                      </span>
                    )}
                  </div>

                  {/* Genre Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {event.genre.map((g) => (
                      <span
                        key={g}
                        className="text-[0.625rem] font-medium bg-surface-low text-on-surface-variant px-2 py-0.5 rounded-full"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredEvents.length > 0 && (
        <div className="px-8 pb-10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              Affichage de <strong className="text-on-background">{filteredEvents.length}</strong> sur{" "}
              <strong className="text-on-background">{events.length}</strong> événements
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-sm bg-surface-mid text-on-background hover:bg-surface-high transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </button>
              {[1].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-sm text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-primary text-white"
                      : "bg-surface-mid text-on-background hover:bg-surface-high"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(1, currentPage + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-sm bg-surface-mid text-on-background hover:bg-surface-high transition-colors"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
