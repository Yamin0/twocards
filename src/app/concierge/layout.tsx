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
import { useState } from "react";

const tabs = [
  { label: "Calendrier", href: "/concierge", icon: CalendarDays },
  { label: "CRM", href: "/concierge/clients", icon: Users },
  { label: "Commissions", href: "/concierge/commissions", icon: CreditCard },
  { label: "Statistiques", href: "/concierge/stats", icon: BarChart3 },
  { label: "Paramètres", href: "/concierge/settings", icon: Settings },
];

export default function ConciergeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

            {/* Venue selector (concierge works with multiple venues) */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-low transition-colors group">
              <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center">
                <span className="text-xs font-bold text-on-primary-container font-[family-name:var(--font-manrope)]">
                  C
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)] leading-tight">
                  Tous les établissements
                </p>
              </div>
              <ChevronDown
                size={16}
                strokeWidth={1.5}
                className="text-on-surface-variant group-hover:text-on-surface transition-colors"
              />
            </button>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-1">
            <button
              className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-low transition-colors"
              aria-label="Messages"
            >
              <MessageSquare size={20} strokeWidth={1.5} />
            </button>
            <button
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

        {/* Tabs */}
        <nav className="flex items-center gap-0 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  font-[family-name:var(--font-inter)]
                  ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30"
                  }
                `}
              >
                <Icon size={18} strokeWidth={1.5} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 bg-white z-40 lg:hidden border-b border-outline-variant/15 p-4 space-y-1 editorial-shadow">
            {tabs.map((tab) => {
              const active = isActive(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-primary/5 text-primary"
                        : "text-on-surface-variant hover:bg-surface-low"
                    }
                  `}
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
