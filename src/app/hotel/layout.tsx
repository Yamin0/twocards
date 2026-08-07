"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  QrCode,
  CalendarDays,
  CreditCard,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Hotel,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Avatar } from "@/components/shared/avatar";

const mainNav = [
  { icon: Home, label: "Accueil", href: "/hotel" },
  { icon: QrCode, label: "QR codes", href: "/hotel/qr-codes" },
  { icon: CalendarDays, label: "Réservations", href: "/hotel/reservations" },
  { icon: CreditCard, label: "Commissions", href: "/hotel/commissions" },
];

const adminNav = [
  { icon: Settings, label: "Paramètres", href: "/hotel/settings" },
];

/* Au niveau module et non dans le layout : un composant recréé à chaque
   rendu perd son état et son DOM à chaque navigation. */
function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: typeof mainNav;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = (href: string) =>
    href === "/hotel" ? pathname === "/hotel" : pathname.startsWith(href);

  return (
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
              onClick={onNavigate}
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
}

export default function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { fullName, venueName, initials, avatarUrl, isLoading } = useAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen lg:h-screen relative lg:overflow-hidden bg-[#141210]">
      {/* Fond photo neutre (remplacer public/dashboard-bg.jpg par votre photo) */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/dashboard-bg.jpg)" }}
      />
      <div className="fixed inset-0 bg-black/35" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      <div className="relative z-10 p-4 lg:p-6 grid grid-cols-12 gap-4 lg:gap-6 lg:h-screen">
        {/* Mobile top bar */}
        <div className="col-span-12 lg:hidden flex items-center justify-between backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {sidebarOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
          <Link href="/hotel" className="flex items-center gap-2">
            <Image src="/logo-header.png" alt="twocards." width={28} height={28} className="h-7 w-auto brightness-0 invert" />
            <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-nunito)] text-white">
              twocards<span className="text-blue-400">.</span>
            </span>
          </Link>
          <Avatar
            url={avatarUrl}
            initials={initials || "H"}
            size={32}
            textClassName="text-xs font-semibold text-white font-[family-name:var(--font-manrope)]"
          />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={closeSidebar}
            />
            <div className="fixed top-20 left-4 right-4 z-50 lg:hidden backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <NavSection title="Navigation" items={mainNav} pathname={pathname} onNavigate={closeSidebar} />
              <NavSection title="Compte" items={adminNav} pathname={pathname} onNavigate={closeSidebar} />
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
        <aside className="hidden lg:flex col-span-2 backdrop-blur-2xl bg-black/45 border border-white/10 rounded-3xl p-5 flex-col h-[calc(100vh-48px)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Logo */}
          <div className="text-center mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center justify-center gap-2.5 mb-1">
              <Image src="/logo-header.png" alt="twocards." width={36} height={36} className="h-9 w-auto brightness-0 invert" />
              <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-nunito)] text-white">
                twocards<span className="text-blue-400">.</span>
              </span>
            </div>
            <p className="text-white/40 text-xs font-[family-name:var(--font-inter)]">Espace Hôtel</p>
          </div>

          {/* Hotel identity */}
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Hotel size={12} strokeWidth={1.5} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white truncate font-[family-name:var(--font-manrope)]">
              {isLoading ? "…" : venueName || "Mon hôtel"}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto space-y-5 scrollbar-thin">
            <NavSection title="Navigation" items={mainNav} pathname={pathname} onNavigate={closeSidebar} />
            <NavSection title="Compte" items={adminNav} pathname={pathname} onNavigate={closeSidebar} />
          </div>

          {/* Bottom */}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              {isLoading ? (
                <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse shrink-0" />
              ) : (
                <Avatar
                  url={avatarUrl}
                  initials={initials || "H"}
                  size={36}
                  textClassName="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]"
                />
              )}
              <div className="min-w-0">
                {isLoading ? (
                  <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                ) : (
                  <p className="text-sm font-medium text-white truncate font-[family-name:var(--font-manrope)]">
                    {fullName || "Hôtelier"}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/hotel/settings"
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
        <main className="col-span-12 lg:col-span-10 lg:h-[calc(100vh-48px)] lg:overflow-y-auto overflow-x-hidden scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
