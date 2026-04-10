"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { GlowMenu } from "@/components/layout/glow-menu";
import type { GlowMenuItem } from "@/components/layout/glow-menu";

const menuItems: GlowMenuItem[] = [
  {
    label: "Accueil",
    href: "/dashboard",
    icon: Home,
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-400",
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-400",
  },
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
    gradient:
      "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-400",
  },
  {
    label: "Profil",
    href: "/dashboard/profile",
    icon: User,
    gradient:
      "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-400",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fullName, initials, isLoading } = useAuthUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X size={22} strokeWidth={1.5} />
              ) : (
                <Menu size={22} strokeWidth={1.5} />
              )}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/logo-header.png"
                alt="twocards."
                width={36}
                height={36}
                className="h-9 w-auto"
              />
              <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-nunito)] text-primary-dark">
                twocards<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* Center: Glow Menu */}
          <div className="hidden md:flex">
            <GlowMenu
              items={menuItems}
              basePath="/dashboard"
            />
          </div>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              {isLoading ? (
                <div className="h-3 w-20 bg-surface-low rounded animate-pulse" />
              ) : (
                <p className="text-sm font-medium font-[family-name:var(--font-manrope)] text-on-surface">
                  {fullName || "Utilisateur"}
                </p>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
              {isLoading ? (
                <div className="w-9 h-9 rounded-full bg-surface-low animate-pulse" />
              ) : (
                <span className="text-sm font-semibold font-[family-name:var(--font-manrope)] text-on-primary-container">
                  {initials || "U"}
                </span>
              )}
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="p-2 rounded-lg text-on-surface-variant hover:text-error transition-colors"
                aria-label="Déconnexion"
              >
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-primary-dark z-40 md:hidden p-3 space-y-0.5 shadow-[0_4px_30px_rgba(0,27,64,0.3)]">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                    font-[family-name:var(--font-manrope)]
                    ${active ? "text-white" : "text-white/50 hover:text-white/80"}
                  `}
                  style={active ? { background: item.gradient } : undefined}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
