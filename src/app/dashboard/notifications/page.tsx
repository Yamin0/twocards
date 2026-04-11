"use client";

import { useState, useCallback } from "react";
import {
  CalendarCheck,
  Coins,
  Users,
  Settings,
  Check,
  Trash2,
  BellOff,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

type NotificationType = "reservation" | "commission" | "network" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { color: string; bg: string; icon: typeof CalendarCheck }
> = {
  reservation: { color: "text-blue-400", bg: "bg-blue-500/20", icon: CalendarCheck },
  commission: { color: "text-emerald-400", bg: "bg-emerald-500/20", icon: Coins },
  network: { color: "text-purple-400", bg: "bg-purple-500/20", icon: Users },
  system: { color: "text-amber-400", bg: "bg-amber-500/20", icon: Settings },
};

const FILTER_TABS = [
  { key: "all", label: "Toutes" },
  { key: "unread", label: "Non lues" },
  { key: "reservation", label: "R\u00e9servations" },
  { key: "commission", label: "Commissions" },
  { key: "network", label: "R\u00e9seau" },
] as const;

type FilterKey = (typeof FILTER_TABS)[number]["key"];

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "reservation",
    title: "Nouvelle r\u00e9servation",
    description: "Liam Hamza a r\u00e9serv\u00e9 une table VIP pour vendredi soir (8 personnes).",
    timestamp: "il y a 5 min",
    read: false,
  },
  {
    id: "2",
    type: "commission",
    title: "Commission cr\u00e9dit\u00e9e",
    description: "Vous avez re\u00e7u 480 MAD de commission pour la r\u00e9servation de Karim Bennani.",
    timestamp: "il y a 23 min",
    read: false,
  },
  {
    id: "3",
    type: "network",
    title: "Nouveau RP rejoint",
    description: "Youssef El Idrissi a rejoint votre r\u00e9seau en tant que RP.",
    timestamp: "il y a 1h",
    read: false,
  },
  {
    id: "4",
    type: "reservation",
    title: "R\u00e9servation modifi\u00e9e",
    description: "Sofia Alaoui a modifi\u00e9 sa r\u00e9servation de samedi \u2014 passage de 4 \u00e0 6 personnes.",
    timestamp: "il y a 2h",
    read: true,
  },
  {
    id: "5",
    type: "commission",
    title: "Paiement en attente",
    description: "La commission de 1 220 MAD pour Hind Fassi est en cours de traitement.",
    timestamp: "il y a 3h",
    read: false,
  },
  {
    id: "6",
    type: "system",
    title: "Mise \u00e0 jour du syst\u00e8me",
    description: "Le tableau de bord a \u00e9t\u00e9 mis \u00e0 jour avec de nouvelles fonctionnalit\u00e9s analytics.",
    timestamp: "il y a 5h",
    read: true,
  },
  {
    id: "7",
    type: "reservation",
    title: "Annulation de r\u00e9servation",
    description: "Karim Bennani a annul\u00e9 sa r\u00e9servation pour dimanche midi.",
    timestamp: "il y a 1 jour",
    read: true,
  },
  {
    id: "8",
    type: "network",
    title: "Performance RP",
    description: "Liam Hamza a g\u00e9n\u00e9r\u00e9 12 r\u00e9servations ce mois \u2014 meilleur RP du r\u00e9seau.",
    timestamp: "il y a 1 jour",
    read: false,
  },
  {
    id: "9",
    type: "commission",
    title: "Commission valid\u00e9e",
    description: "La commission de 1 870 MAD pour Sofia Alaoui a \u00e9t\u00e9 valid\u00e9e et pay\u00e9e.",
    timestamp: "il y a 2 jours",
    read: true,
  },
  {
    id: "10",
    type: "system",
    title: "Rappel de configuration",
    description: "Ajoutez votre logo et personnalisez votre page de r\u00e9servation pour un meilleur taux de conversion.",
    timestamp: "il y a 3 jours",
    read: true,
  },
];

export default function NotificationsPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const items = isDemoVenue ? notifications : [];

  const filtered = items.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.read;
    return n.type === activeFilter;
  });

  const unreadCount = items.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("Toutes les notifications ont \u00e9t\u00e9 marqu\u00e9es comme lues");
  }, [showToast]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    showToast("Toutes les notifications ont \u00e9t\u00e9 supprim\u00e9es");
  }, [showToast]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-[family-name:var(--font-manrope)] text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-white/40 mt-1">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={14} strokeWidth={2} />
              Tout marquer comme lu
            </button>
            <button
              onClick={clearAll}
              disabled={items.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] text-white/60 rounded-xl text-xs font-semibold hover:bg-white/[0.12] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} strokeWidth={2} />
              Supprimer tout
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab.key
                ? "bg-blue-500 text-white"
                : "backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] text-white/50 hover:text-white hover:bg-white/[0.12]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
              <BellOff size={24} strokeWidth={1.5} className="text-white/30" />
            </div>
            <p className="text-sm font-semibold text-white/60 font-[family-name:var(--font-manrope)]">
              Aucune notification
            </p>
            <p className="text-xs text-white/30 mt-1 max-w-xs">
              {activeFilter === "all"
                ? "Vous n\u2019avez aucune notification pour le moment."
                : "Aucune notification ne correspond \u00e0 ce filtre."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((notif) => {
              const config = TYPE_CONFIG[notif.type];
              const Icon = config.icon;
              return (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`w-full flex items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.04] ${
                    !notif.read ? "bg-white/[0.03]" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon size={18} strokeWidth={1.5} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2">
                      {notif.description}
                    </p>
                    <span className="text-[11px] text-white/25 mt-2 block">
                      {notif.timestamp}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
