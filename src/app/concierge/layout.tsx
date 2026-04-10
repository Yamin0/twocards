"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  MessageSquare,
  ChevronDown,
  Menu,
  X,
  CalendarDays,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { GlowMenu } from "@/components/layout/glow-menu";
import type { GlowMenuItem } from "@/components/layout/glow-menu";

const glowTabs: GlowMenuItem[] = [
  {
    label: "Calendrier",
    href: "/concierge",
    icon: CalendarDays,
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-400",
  },
  {
    label: "CRM",
    href: "/concierge/clients",
    icon: Users,
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-400",
  },
  {
    label: "Commissions",
    href: "/concierge/commissions",
    icon: CreditCard,
    gradient: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.06) 50%, rgba(180,83,9,0) 100%)",
    iconColor: "text-amber-400",
  },
  {
    label: "Statistiques",
    href: "/concierge/stats",
    icon: BarChart3,
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-400",
  },
  {
    label: "Paramètres",
    href: "/concierge/settings",
    icon: Settings,
    gradient: "radial-gradient(circle, rgba(148,163,184,0.15) 0%, rgba(100,116,139,0.06) 50%, rgba(71,85,105,0) 100%)",
    iconColor: "text-slate-400",
  },
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
  const router = useRouter();
  const { isDemoConcierge } = useAuthUser();
  const venues = isDemoConcierge ? demoVenues : defaultVenues;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [venueDropdownOpen, setVenueDropdownOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);
  const [selectedVenue, setSelectedVenue] = useState(venues[0]);

  const isActive = (href: string) => {
    if (href === "/concierge") return pathname === "/concierge";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-outline-variant/15">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Left: Logo + Venue selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X size={22} strokeWidth={1.5} />
              ) : (
                <Menu size={22} strokeWidth={1.5} />
              )}
            </button>

            <Link href="/concierge" className="flex items-center gap-2.5">
              <Image
                src="/logo-header.png"
                alt="twocards."
                width={36}
                height={36}
                className="h-9 w-auto"
              />
              <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-nunito)] text-primary-dark hidden sm:inline">
                twocards<span className="text-primary">.</span>
              </span>
            </Link>

            <div className="hidden sm:block h-6 w-px bg-outline-variant/20 mx-1" />

            {/* Venue selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-low transition-colors group"
              >
                <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-xs font-bold text-on-primary-container font-[family-name:var(--font-manrope)]">
                    {selectedVenue[0]}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)] leading-tight">
                    {selectedVenue}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  className={`text-on-surface-variant group-hover:text-on-surface transition-all ${venueDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {venueDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setVenueDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md editorial-shadow border border-outline-variant/10 py-1 z-50">
                    {venues.map((v) => (
                      <button
                        key={v}
                        onClick={() => { setSelectedVenue(v); setVenueDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${v === selectedVenue ? "bg-primary/5 text-primary font-medium" : "text-on-background hover:bg-surface-low"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-1">
            <Link
              href="/concierge/messages"
              className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-low transition-colors"
              aria-label="Messages"
            >
              <MessageSquare size={20} strokeWidth={1.5} />
            </Link>
            <button
              onClick={() => router.push("/concierge")}
              className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-low transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </button>
            <div className="h-6 w-px bg-outline-variant/20 mx-1" />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-low transition-colors"
                aria-label="Déconnexion"
              >
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>

        {/* Glow Menu Tabs */}
        <div className="flex justify-center px-4 sm:px-6 py-2">
          <GlowMenu
            items={glowTabs}
            basePath="/concierge"
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 bg-primary-dark z-40 lg:hidden border-b border-white/[0.08] p-3 space-y-0.5 shadow-[0_4px_30px_rgba(0,27,64,0.3)]">
            {glowTabs.map((tab) => {
              const active = isActive(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    font-[family-name:var(--font-manrope)]
                    ${
                      active
                        ? `text-white ${tab.iconColor}`
                        : "text-white/50 hover:text-white/80"
                    }
                  `}
                  style={active ? { background: tab.gradient } : undefined}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Content */}
      <main>{children}</main>
    </div>
  );
}
