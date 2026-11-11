"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Star, Receipt, Check, Trash2, BellOff } from "lucide-react";
import {
  useVenueNotifications,
  type VenueNotificationKind,
} from "@/hooks/use-venue-notifications";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, type Locale, type Translate } from "@/lib/i18n";

const KIND_CONFIG: Record<
  VenueNotificationKind,
  { color: string; bg: string; icon: typeof CalendarDays }
> = {
  reservation: { color: "text-info", bg: "bg-info-soft", icon: CalendarDays },
  rating: { color: "text-warn", bg: "bg-warn-soft", icon: Star },
  pos: { color: "text-ok", bg: "bg-ok-soft", icon: Receipt },
};

const getFilterTabs = (t: Translate) =>
  [
    { key: "all", label: t("Toutes", "All") },
    { key: "unread", label: t("Non lues", "Unread") },
  ] as const;

type FilterKey = ReturnType<typeof getFilterTabs>[number]["key"];

/* Horodatage relatif recalculé à chaque rendu — jamais de texte figé. */
function relativeTime(iso: string, locale: Locale = "fr"): string {
  const en = locale === "en";
  const elapsedMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (elapsedMin < 1) return en ? "just now" : "à l’instant";
  if (elapsedMin < 60) return en ? `${elapsedMin} min ago` : `il y a ${elapsedMin} min`;
  const hours = Math.floor(elapsedMin / 60);
  if (hours < 24) return en ? `${hours} h ago` : `il y a ${hours} h`;
  return new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead, clearAll } =
    useVenueNotifications();
  const t = useT();
  const locale = useLocale();
  const FILTER_TABS = getFilterTabs(t);
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
      <div className=" bg-panel border border-line rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink font-display">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-ink-3 mt-1 font-ui">
                {t(`${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`, `${unreadCount} unread`)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              aria-label={t("Tout marquer lu", "Mark all as read")}
              className="flex items-center gap-2 px-4 py-2.5 bg-link text-white rounded-xl text-xs font-semibold hover:bg-link-strong transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-ui"
            >
              <Check size={14} strokeWidth={2} />
              {t("Tout marquer lu", "Mark all as read")}
            </button>
            <button
              onClick={clearAll}
              disabled={items.length === 0}
              aria-label={t("Tout effacer", "Clear all")}
              className="flex items-center gap-2 px-4 py-2.5 bg-panel border border-line text-ink-2 rounded-xl text-xs font-semibold hover:bg-fill-2 hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-ui"
            >
              <Trash2 size={14} strokeWidth={2} />
              {t("Tout effacer", "Clear all")}
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
                ? "bg-link text-white"
                : " bg-panel border border-line text-ink-3 hover:text-ink hover:bg-fill-2"
            }`}
          >
            {tab.label}
            {tab.key === "unread" && unreadCount > 0 && ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className=" bg-panel border border-line rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-fill flex items-center justify-center mb-4">
              <BellOff size={24} strokeWidth={1.5} className="text-ink-3" />
            </div>
            <p className="text-sm font-semibold text-ink-2 font-ui">
              {activeFilter === "unread"
                ? t("Aucune notification non lue", "No unread notifications")
                : t("Aucune notification", "No notifications")}
            </p>
            <p className="text-xs text-ink-3 mt-1 max-w-xs font-ui">
              {activeFilter === "unread"
                ? t("Tout est lu, rien ne vous attend.", "You're all caught up.")
                : t(
                    "Les nouvelles réservations, avis clients et alertes caisse apparaîtront ici.",
                    "New reservations, guest reviews and till alerts will appear here.",
                  )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((notif) => {
              const config = KIND_CONFIG[notif.kind];
              const Icon = config.icon;
              return (
                <Link
                  key={notif.id}
                  href={notif.href || "/dashboard"}
                  onClick={() => markRead(notif.id)}
                  className={`flex items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-fill ${
                    !notif.read ? "bg-fill" : ""
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
                      <span className="text-sm font-semibold text-ink truncate font-ui">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span
                          className="w-2 h-2 rounded-full bg-link shrink-0"
                          aria-label={t("Non lue", "Unread")}
                        />
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-xs text-ink-3 mt-1 leading-relaxed line-clamp-2 font-ui">
                        {notif.body}
                      </p>
                    )}
                    <span className="text-xs text-ink-3 mt-2 block font-ui">
                      {relativeTime(notif.created_at, locale)}
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
