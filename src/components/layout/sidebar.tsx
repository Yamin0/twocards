"use client";

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
  X,
} from "lucide-react";
import { GlowMenuVertical } from "@/components/layout/glow-menu";
import type { GlowMenuItem } from "@/components/layout/glow-menu";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems: GlowMenuItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-400",
  },
  {
    label: "Réservations",
    href: "/dashboard/reservations",
    icon: CalendarDays,
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-400",
  },
  {
    label: "Événements",
    href: "/dashboard/events",
    icon: Ticket,
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-400",
  },
  {
    label: "Clients",
    href: "/dashboard/guests",
    icon: Users,
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-400",
  },
  {
    label: "Plan de salle",
    href: "/dashboard/floor-plan",
    icon: Grid3X3,
    gradient: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%, rgba(190,24,93,0) 100%)",
    iconColor: "text-pink-400",
  },
  {
    label: "Réseau RP",
    href: "/dashboard/network",
    icon: Network,
    gradient: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(2,132,199,0.06) 50%, rgba(3,105,161,0) 100%)",
    iconColor: "text-sky-400",
  },
  {
    label: "Commissions",
    href: "/dashboard/commissions",
    icon: CreditCard,
    gradient: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.06) 50%, rgba(180,83,9,0) 100%)",
    iconColor: "text-amber-400",
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    gradient: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.06) 50%, rgba(67,56,202,0) 100%)",
    iconColor: "text-indigo-400",
  },
  {
    label: "Analyses",
    href: "/dashboard/analytics",
    icon: BarChart3,
    gradient: "radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(13,148,136,0.06) 50%, rgba(15,118,110,0) 100%)",
    iconColor: "text-teal-400",
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
    gradient: "radial-gradient(circle, rgba(148,163,184,0.15) 0%, rgba(100,116,139,0.06) 50%, rgba(71,85,105,0) 100%)",
    iconColor: "text-slate-400",
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-primary-dark
          flex flex-col h-screen
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-header.png"
              alt="twocards. logo"
              width={96}
              height={96}
              className="h-[96px] w-auto brightness-0 invert"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-nunito)] text-white">
                twocards.
              </h1>
              <p className="text-xs font-[family-name:var(--font-inter)] text-white/40 mt-0.5">
                Venue Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-white/40 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Glow Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <GlowMenuVertical
            items={navItems}
            basePath="/dashboard"
            onNavigate={onClose}
          />
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-6 space-y-0.5">
          <Link
            href="/dashboard/help"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
              font-[family-name:var(--font-manrope)]
              text-white/40 hover:text-white/70 transition-colors"
          >
            <HelpCircle size={20} strokeWidth={1.5} />
            <span>Aide</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm w-full
                font-[family-name:var(--font-manrope)]
                text-red-400/70 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} strokeWidth={1.5} />
              <span>Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
