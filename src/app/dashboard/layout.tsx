"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Users,
  Grid3X3,
  Plug,
  Network,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { PRQualityProvider } from "@/contexts/pr-quality-context";
import { Avatar } from "@/components/shared/avatar";

const mainNav = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
  { icon: CalendarDays, label: "Réservations", href: "/dashboard/reservations" },
  { icon: Ticket, label: "Événements", href: "/dashboard/events" },
  { icon: Grid3X3, label: "Plan de salle", href: "/dashboard/floor-plan" },
  { icon: Plug, label: "Caisse (POS)", href: "/dashboard/integrations" },
  { icon: Users, label: "Clients", href: "/dashboard/guests" },
];

const toolsNav = [
  { icon: Network, label: "Réseau RP", href: "/dashboard/network" },
  { icon: CreditCard, label: "Commissions", href: "/dashboard/commissions" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: BarChart3, label: "Analyses", href: "/dashboard/analytics" },
];

const adminNav = [
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
];

/* Au niveau module et non dans le layout : un composant recréé à chaque
   rendu perd son état et son DOM à chaque frappe ou navigation. */
function NavSection({
  items,
  pathname,
  onNavigate,
  badges,
}: {
  items: typeof mainNav;
  pathname: string;
  onNavigate: () => void;
  /* Pastilles par lien (ex. messages non lus), masquees a zero. */
  badges?: Record<string, number>;
}) {
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.01] font-ui ${
              active
                ? "bg-white/20 text-white border border-white/20"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={1.5} />
            {item.label}
            {(badges?.[item.href] ?? 0) > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
                {(badges?.[item.href] ?? 0) > 99 ? "99+" : badges?.[item.href]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, initials, avatarUrl, isLoading, isAdmin } = useAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const closeSidebar = () => setSidebarOpen(false);
  const unreadMessages = useUnreadMessages();
  const badges = { "/dashboard/messages": unreadMessages };
  /* L'entrée Administration n'existe que pour le compte porteur du drapeau
     admin ; la garde réelle est en base, ceci n'est que de l'affichage. */
  const adminItems = isAdmin
    ? [...adminNav, { icon: Shield, label: "Administration", href: "/admin" }]
    : adminNav;

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <PRQualityProvider>
      <div className="min-h-screen lg:h-screen relative lg:overflow-hidden bg-[#141210]">
        {/* Fond photo neutre (remplacer public/dashboard-bg.jpg par votre photo) */}
        <div
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/dashboard-bg.jpg)" }}
        />
        {/* Voile de lisibilité */}
        <div className="fixed inset-0 bg-black/35" />
        <div className="fixed inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        <div className="relative z-10 p-4 lg:p-6 grid grid-cols-12 gap-4 lg:gap-6 lg:h-screen">
          {/* Mobile top bar */}
          <div className="col-span-12 lg:hidden flex items-center justify-between backdrop-blur-2xl bg-black/45 border border-white/10 rounded-2xl px-4 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {sidebarOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo-header.png" alt="twocards." width={28} height={28} className="h-7 w-auto brightness-0 invert" />
              <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-nunito)] text-white">
                twocards<span className="text-blue-400">.</span>
              </span>
            </Link>
            <Avatar
              url={avatarUrl}
              initials={initials || "U"}
              size={32}
              textClassName="text-xs font-semibold text-white font-ui"
            />
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed top-20 left-4 right-4 z-50 lg:hidden backdrop-blur-2xl bg-black/60 border border-white/10 rounded-3xl p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <NavSection items={mainNav} pathname={pathname} onNavigate={closeSidebar} badges={badges} />
                <NavSection items={toolsNav} pathname={pathname} onNavigate={closeSidebar} badges={badges} />
                <NavSection items={adminItems} pathname={pathname} onNavigate={closeSidebar} badges={badges} />
                <div className="pt-3 border-t border-white/10">
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-white/10 transition-all w-full font-ui"
                    >
                      <LogOut size={18} strokeWidth={1.5} />
                      Déconnexion
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Desktop sidebar */}
          <aside className="hidden lg:flex col-span-2 backdrop-blur-2xl bg-black/45 border border-white/10 rounded-3xl p-5 flex-col h-[calc(100vh-48px)] overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            {/* Logo */}
            <div className="text-center mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center justify-center gap-2.5 mb-1">
                <Image src="/logo-header.png" alt="twocards." width={36} height={36} className="h-9 w-auto brightness-0 invert" />
                <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-nunito)] text-white">
                  twocards<span className="text-blue-400">.</span>
                </span>
              </div>
              <p className="text-white/40 text-xs font-ui">Venue Manager</p>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto space-y-5 scrollbar-thin">
              <NavSection items={mainNav} pathname={pathname} onNavigate={closeSidebar} badges={badges} />
              <NavSection items={toolsNav} pathname={pathname} onNavigate={closeSidebar} badges={badges} />
              <NavSection items={adminItems} pathname={pathname} onNavigate={closeSidebar} badges={badges} />
            </div>

            {/* Bottom */}
            <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-2">
                {isLoading ? (
                  <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse shrink-0" />
                ) : (
                  <Avatar
                    url={avatarUrl}
                    initials={initials || "U"}
                    size={36}
                    textClassName="text-sm font-semibold text-white font-ui"
                  />
                )}
                <div className="min-w-0">
                  {isLoading ? (
                    <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                  ) : (
                    <p className="text-sm font-medium text-white truncate font-ui">
                      {fullName || "Utilisateur"}
                    </p>
                  )}
                </div>
              </div>

              <Link
                href="/dashboard/help"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/10 transition-all font-ui"
              >
                <HelpCircle size={18} strokeWidth={1.5} />
                Aide
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-white/10 transition-all w-full font-ui"
                >
                  <LogOut size={18} strokeWidth={1.5} />
                  Déconnexion
                </button>
              </form>
            </div>
          </aside>

          {/* Main content */}
          <main className="col-span-12 lg:col-span-10 lg:h-[calc(100vh-48px)] lg:overflow-y-auto overflow-x-hidden scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </PRQualityProvider>
  );
}
