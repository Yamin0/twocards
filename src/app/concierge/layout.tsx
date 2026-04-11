"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Users,
  CreditCard,
  BarChart3,
  MessageSquare,
  Building2,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";

const mainNav = [
  { icon: Home, label: "Accueil", href: "/concierge" },
  { icon: CalendarDays, label: "Calendrier", href: "/concierge/reservations" },
  { icon: Users, label: "CRM Clients", href: "/concierge/clients" },
  { icon: CreditCard, label: "Commissions", href: "/concierge/commissions" },
  { icon: BarChart3, label: "Statistiques", href: "/concierge/stats" },
];

const toolsNav = [
  { icon: MessageSquare, label: "Messages", href: "/concierge/messages" },
  { icon: Building2, label: "Établissements", href: "/concierge/venues" },
];

const adminNav = [
  { icon: Bell, label: "Notifications", href: "/concierge/notifications" },
  { icon: Settings, label: "Paramètres", href: "/concierge/settings" },
  { icon: User, label: "Profil", href: "/concierge/profile" },
];

const demoVenues = [
  "Tous les établissements",
  "L'Arc Casablanca",
  "Le Comptoir",
  "Raspoutine",
];

const defaultVenues = ["Tous les établissements"];

export default function ConciergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isDemoConcierge, fullName, initials, isLoading } = useAuthUser();
  const venues = isDemoConcierge ? demoVenues : defaultVenues;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(venues[0]);

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
    if (href === "/concierge") return pathname === "/concierge";
    return pathname.startsWith(href);
  };

  const NavSection = ({
    title,
    items,
  }: {
    title: string;
    items: typeof mainNav;
  }) => (
    <div>
      <h4 className="text-white/50 text-[0.6875rem] font-semibold uppercase tracking-wider mb-2 px-3">
        {title}
      </h4>
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
    </div>
  );

  return (
    <div className="h-screen relative overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-indigo-600/15 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-violet-500/8 blur-[100px] animate-pulse [animation-delay:2s]" />
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
          <Link href="/concierge" className="flex items-center gap-2">
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
              <NavSection title="Navigation" items={mainNav} />
              <NavSection title="Outils" items={toolsNav} />
              <NavSection title="Compte" items={adminNav} />
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
          <div className="text-center mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <Image src="/logo-header.png" alt="twocards." width={36} height={36} className="h-9 w-auto brightness-0 invert" />
              <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-nunito)] text-white">
                twocards<span className="text-blue-400">.</span>
              </span>
            </div>
            <p className="text-white/40 text-xs font-[family-name:var(--font-inter)]">Espace Concierge</p>
          </div>

          {/* Venue selector */}
          <div className="mb-4 relative">
            <button
              onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <span className="text-[0.5rem] font-bold text-white">{selectedVenue[0]}</span>
                </div>
                <span className="text-sm font-medium text-white truncate font-[family-name:var(--font-manrope)]">
                  {selectedVenue}
                </span>
              </div>
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={`text-white/40 transition-transform shrink-0 ${venueDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {venueDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setVenueDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-xl bg-white/10 border border-white/15 rounded-xl py-1 z-50">
                  {venues.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setSelectedVenue(v);
                        setVenueDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        v === selectedVenue
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto space-y-5 scrollbar-thin">
            <NavSection title="Navigation" items={mainNav} />
            <NavSection title="Outils" items={toolsNav} />
            <NavSection title="Compte" items={adminNav} />
          </div>

          {/* Bottom */}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
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
                    {fullName || "Concierge"}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/concierge/help"
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
  );
}
