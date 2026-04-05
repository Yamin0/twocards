"use client";

import Link from "next/link";
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
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Reservations", href: "/dashboard/reservations", icon: CalendarDays },
  { label: "Evenements", href: "/dashboard/events", icon: Ticket },
  { label: "Clients", href: "/dashboard/guests", icon: Users },
  { label: "Plan de salle", href: "/dashboard/floor-plan", icon: Grid3X3 },
  { label: "Reseau RP", href: "/dashboard/network", icon: Network },
  { label: "Commissions", href: "/dashboard/commissions", icon: CreditCard },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Analyses", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Parametres", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-surface-low backdrop-blur
          flex flex-col h-screen
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between px-6 pt-8 pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-nunito)] text-on-surface">
              twocards.
            </h1>
            <p className="text-xs font-[family-name:var(--font-inter)] text-on-surface-variant mt-0.5">
              Venue Manager
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-l-lg text-sm transition-all
                      font-[family-name:var(--font-manrope)]
                      ${
                        active
                          ? "text-primary-container font-bold border-r-4 border-primary-container bg-white/50"
                          : "text-on-primary-container hover:text-primary-container"
                      }
                    `}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-6 space-y-1">
          <Link
            href="/dashboard/help"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              font-[family-name:var(--font-manrope)]
              text-on-primary-container hover:text-primary-container transition-colors"
          >
            <HelpCircle size={20} strokeWidth={1.5} />
            <span>Aide</span>
          </Link>
          <button
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full
              font-[family-name:var(--font-manrope)]
              text-error hover:text-error/80 transition-colors"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span>Deconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
