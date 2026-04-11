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
  Search,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { PRQualityProvider } from "@/contexts/pr-quality-context";

const mainNav = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard" },
  { icon: CalendarDays, label: "Réservations", href: "/dashboard/reservations" },
  { icon: Ticket, label: "Événements", href: "/dashboard/events" },
  { icon: Grid3X3, label: "Plan de salle", href: "/dashboard/floor-plan" },
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, initials, isLoading } = useAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const NavSection = ({
    items,
  }: {
    title?: string;
    items: typeof mainNav;
  }) => (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.01] font-[family-name:var(--font-manrope)] ${
              active
                ? "bg-white/20 text-white border border-white/20"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <PRQualityProvider>
      <div className="h-screen relative overflow-hidden bg-[#0a0a0f]">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-600/15 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse [animation-delay:1s]" />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/8 blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative z-10 p-4 lg:p-6 grid grid-cols-12 gap-4 lg:gap-6 h-screen">
          {/* Mobile top bar */}
          <div className="col-span-12 lg:hidden flex items-center justify-between backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
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
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <span className="text-xs font-semibold text-white font-[family-name:var(--font-manrope)]">
                {initials || "U"}
              </span>
            </div>
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed top-20 left-4 right-4 z-50 lg:hidden backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <NavSection title="Menu principal" items={mainNav} />
                <NavSection title="Outils" items={toolsNav} />
                <NavSection title="Administration" items={adminNav} />
                <div className="pt-3 border-t border-white/10">
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-white/10 transition-all w-full font-[family-name:var(--font-manrope)]"
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
          <aside className="hidden lg:flex col-span-2 backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-5 flex-col h-[calc(100vh-48px)] overflow-hidden">
            {/* Logo */}
            <div className="text-center mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center justify-center gap-2.5 mb-1">
                <Image src="/logo-header.png" alt="twocards." width={36} height={36} className="h-9 w-auto brightness-0 invert" />
                <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-nunito)] text-white">
                  twocards<span className="text-blue-400">.</span>
                </span>
              </div>
              <p className="text-white/40 text-xs font-[family-name:var(--font-inter)]">Venue Manager</p>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto space-y-5 scrollbar-thin">
              <NavSection title="Menu principal" items={mainNav} />
              <NavSection title="Outils" items={toolsNav} />
              <NavSection title="Administration" items={adminNav} />
            </div>

            {/* Bottom */}
            <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  {isLoading ? (
                    <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
                  ) : (
                    <span className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                      {initials || "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  {isLoading ? (
                    <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                  ) : (
                    <p className="text-sm font-medium text-white truncate font-[family-name:var(--font-manrope)]">
                      {fullName || "Utilisateur"}
                    </p>
                  )}
                </div>
              </div>

              <Link
                href="/dashboard/help"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/10 transition-all font-[family-name:var(--font-manrope)]"
              >
                <HelpCircle size={18} strokeWidth={1.5} />
                Aide
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-white/10 transition-all w-full font-[family-name:var(--font-manrope)]"
                >
                  <LogOut size={18} strokeWidth={1.5} />
                  Déconnexion
                </button>
              </form>
            </div>
          </aside>

          {/* Main content */}
          <main className="col-span-12 lg:col-span-10 h-[calc(100vh-48px)] lg:h-[calc(100vh-48px)] overflow-y-auto overflow-x-hidden scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </PRQualityProvider>
  );
}
