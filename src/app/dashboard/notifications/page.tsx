"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CalendarDays, Check, Receipt, Star, Trash2, type LucideIcon } from "lucide-react";
import { useVenueNotifications } from "@/hooks/use-venue-notifications";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, PageSkeleton, Segmented } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { intlLocale, type Locale } from "@/lib/i18n";
import { notificationText } from "./notification-text";

/* Un `kind` inconnu (ajouté plus tard en base) garde une icône neutre. */
const KIND_CONFIG: Record<string, { color: string; bg: string; icon: LucideIcon }> = {
  reservation: { color: "text-info", bg: "bg-info-soft", icon: CalendarDays },
  rating: { color: "text-warn", bg: "bg-warn-soft", icon: Star },
  pos: { color: "text-ok", bg: "bg-ok-soft", icon: Receipt },
};
const FALLBACK_KIND = { color: "text-ink-3", bg: "bg-fill-2", icon: Bell };

type FilterKey = "all" | "unread";

/* Horodatage relatif recalculé à chaque rendu — jamais de texte figé. */
function relativeTime(iso: string, locale: Locale): string {
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
  const [confirmClear, setConfirmClear] = useState(false);
  const t = useT();
  const locale = useLocale();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  /* Re-rendu chaque minute pour que « il y a X min » reste vrai. */
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) return <PageSkeleton kpis={0} />;

  const items = notifications ?? [];
  const filtered = activeFilter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmClear}
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          void clearAll();
        }}
        title={t("Effacer toutes les notifications ?", "Clear all notifications?")}
        description={t("Cette action est définitive.", "This cannot be undone.")}
        confirmLabel={t("Tout effacer", "Clear all")}
      />
      <PageHeader
        title={t("Notifications", "Notifications")}
        description={
          unreadCount > 0
            ? t(`${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`, `${unreadCount} unread`)
            : t("Tout est lu.", "You're all caught up.")
        }
        actions={
          <>
            <Button variant="primary" icon={Check} onClick={markAllRead} disabled={unreadCount === 0}>
              {t("Tout marquer lu", "Mark all read")}
            </Button>
            <Button icon={Trash2} onClick={() => setConfirmClear(true)} disabled={items.length === 0}>
              {t("Tout effacer", "Clear all")}
            </Button>
          </>
        }
      />

      <Segmented<FilterKey>
        label={t("Filtrer", "Filter")}
        value={activeFilter}
        onChange={setActiveFilter}
        options={[
          { value: "all", label: t("Toutes", "All") },
          {
            value: "unread",
            label: t("Non lues", "Unread"),
            count: unreadCount > 0 ? unreadCount : undefined,
          },
        ]}
      />

      <Card padded={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={
              activeFilter === "unread"
                ? t("Aucune notification non lue", "No unread notifications")
                : t("Aucune notification", "No notifications")
            }
            description={
              activeFilter === "unread"
                ? t("Rien ne vous attend.", "Nothing is waiting for you.")
                : t(
                    "Les nouvelles réservations, les avis et les alertes de caisse apparaîtront ici.",
                    "New reservations, reviews and till alerts will appear here."
                  )
            }
            action={
              activeFilter === "unread" && items.length > 0 ? (
                <Button onClick={() => setActiveFilter("all")}>
                  {t("Voir toutes les notifications", "View all notifications")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((notif) => {
              const config = KIND_CONFIG[notif.kind] ?? FALLBACK_KIND;
              const Icon = config.icon;
              /* Traduction à l'affichage ; la ligne en base reste française. */
              const text = notificationText(notif, locale);
              return (
                <li key={notif.id}>
                  <Link
                    href={notif.href || "/dashboard"}
                    onClick={() => markRead(notif.id)}
                    className={cn(
                      "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-fill sm:px-6",
                      !notif.read && "bg-link-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        config.bg
                      )}
                    >
                      <Icon size={18} strokeWidth={1.75} className={config.color} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn("truncate text-sm text-ink", !notif.read && "font-bold")}>
                          {text.title}
                        </span>
                        {!notif.read && (
                          <>
                            <span className="h-2 w-2 shrink-0 rounded-full bg-link" aria-hidden />
                            <span className="sr-only">{t("Non lue", "Unread")}</span>
                          </>
                        )}
                      </span>
                      {text.body && (
                        <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-ink-2">
                          {text.body}
                        </span>
                      )}
                      <span className="num mt-1.5 block text-xs text-ink-3">
                        {relativeTime(notif.created_at, locale)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
