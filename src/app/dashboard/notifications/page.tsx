"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Star, Receipt, Check, Trash2, BellOff } from "lucide-react";
import {
  useVenueNotifications,
  type VenueNotificationKind,
} from "@/hooks/use-venue-notifications";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const KIND_CONFIG: Record<
  VenueNotificationKind,
  { color: string; bg: string; icon: typeof CalendarDays }
> = {
  reservation: { color: "text-blue-400", bg: "bg-blue-500/20", icon: CalendarDays },
  rating: { color: "text-amber-400", bg: "bg-amber-500/20", icon: Star },
  pos: { color: "text-emerald-400", bg: "bg-emerald-500/20", icon: Receipt },
};

const FILTER_TABS = [
  { key: "all", label: "Toutes" },
  { key: "unread", label: "Non lues" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

/* Horodatage relatif recalculé à chaque rendu — jamais de texte figé. */
function relativeTime(iso: string): string {
  const elapsedMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (elapsedMin < 1) return "à l’instant";
  if (elapsedMin < 60) return `il y a ${elapsedMin} min`;
  const hours = Math.floor(elapsedMin / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, clearAll } =
    useVenueNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  /* Re-rendu chaque minute pour que « il y a X min » reste vrai. */
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const items = notifications ?? [];
  const filtered =
    activeFilter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white font-display">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-white/40 mt-1 font-ui">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              aria-label="Tout marquer lu"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-ui"
            >
              <Check size={14} strokeWidth={2} />
              Tout marquer lu
            </button>
            <button
              onClick={clearAll}
              disabled={items.length === 0}
              aria-label="Tout effacer"
              className="flex items-center gap-2 px-4 py-2.5 backdrop-blur-2xl bg-black/45 border border-white/[0.12] text-white/60 rounded-xl text-xs font-semibold hover:bg-white/[0.12] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-ui"
            >
              <Trash2 size={14} strokeWidth={2} />
              Tout effacer
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all font-ui ${
              activeFilter === tab.key
                ? "bg-blue-500 text-white"
                : "backdrop-blur-2xl bg-black/45 border border-white/[0.12] text-white/50 hover:text-white hover:bg-white/[0.12]"
            }`}
          >
            {tab.label}
            {tab.key === "unread" && unreadCount > 0 && ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
              <BellOff size={24} strokeWidth={1.5} className="text-white/30" />
            </div>
            <p className="text-sm font-semibold text-white/60 font-ui">
              {activeFilter === "unread"
                ? "Aucune notification non lue"
                : "Aucune notification"}
            </p>
            <p className="text-xs text-white/30 mt-1 max-w-xs font-ui">
              {activeFilter === "unread"
                ? "Tout est lu — rien ne vous attend."
                : "Les nouvelles réservations, avis clients et alertes caisse apparaîtront ici."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((notif) => {
              const config = KIND_CONFIG[notif.kind];
              const Icon = config.icon;
              return (
                <Link
                  key={notif.id}
                  href={notif.href || "/dashboard"}
                  onClick={() => markRead(notif.id)}
                  className={`flex items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.04] ${
                    !notif.read ? "bg-white/[0.03]" : ""
                  }`}
                >
                  {/* Icône */}
                  <div
                    className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon size={18} strokeWidth={1.5} className={config.color} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate font-ui">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span
                          className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
                          aria-label="Non lue"
                        />
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2 font-ui">
                        {notif.body}
                      </p>
                    )}
                    <span className="text-[11px] text-white/25 mt-2 block font-ui">
                      {relativeTime(notif.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
