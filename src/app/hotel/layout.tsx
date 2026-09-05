"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  CalendarDays,
  Users,
  Coins,
  BarChart3,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Hotel,
  Plus,
  Bell,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Avatar } from "@/components/shared/avatar";
import { useHotelQrCodes, useHotelReservations, useHotelProfile } from "@/lib/hotel/store";
import { todayIso } from "@/lib/hotel/format";
import { cn } from "@/lib/utils";

type NavItem = { icon: LucideIcon; label: string; href: string; badge?: number };

/* Au niveau module et non dans le layout : un composant recréé à chaque
   rendu perd son état et son DOM à chaque navigation. */
function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = (href: string) =>
    href === "/hotel" ? pathname === "/hotel" : pathname.startsWith(href);

  return (
    <div>
      <h4 className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
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
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200",
                active
                  ? "bg-white text-black shadow-[0_10px_30px_-12px_rgba(255,255,255,0.6)]"
                  : "text-white/60 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2 : 1.75}
                className={active ? "text-black" : "text-white/50 group-hover:text-white"}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span
                  className={cn(
                    "num rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                    active ? "bg-black/10 text-black" : "bg-amber-400 text-black"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* Alerte discrète quand une nouvelle demande arrive en temps réel, où que
   l'on soit dans l'espace. La première charge n'en déclenche aucune. */
function useNewReservationAlert() {
  const { reservations, isLoading } = useHotelReservations();
  const known = useRef<Set<string> | null>(null);
  const [alert, setAlert] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (known.current === null) {
      known.current = new Set(reservations.map((r) => r.id));
      return;
    }
    const fresh = reservations.filter((r) => !known.current!.has(r.id));
    for (const r of reservations) known.current.add(r.id);
    if (fresh.length > 0) {
      const r = fresh[0];
      setAlert({
        id: r.id,
        text:
          fresh.length === 1
            ? `${r.guest_name} · ${r.venue_name}${r.qr_label ? ` · ${r.qr_label}` : ""}`
            : `${fresh.length} nouvelles demandes`,
      });
      const t = setTimeout(() => setAlert(null), 6000);
      return () => clearTimeout(t);
    }
  }, [reservations, isLoading]);

  return { alert, dismiss: () => setAlert(null) };
}

export default function HotelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { fullName, venueName, initials, avatarUrl, isLoading } = useAuthUser();
  const { profile } = useHotelProfile();
  const { reservations, failed: resFailed } = useHotelReservations();
  const { qrCodes, failed: qrFailed } = useHotelQrCodes();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { alert, dismiss } = useNewReservationAlert();

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);
  const hotelName = profile.hotel_name || venueName || "Mon hôtel";
  const pending = reservations.filter((r) => r.status === "en attente").length;
  const today = todayIso();
  const todayCount = reservations.filter(
    (r) => r.reservation_date === today && r.status !== "annulée"
  ).length;

  const mainNav: NavItem[] = [
    { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/hotel" },
    { icon: QrCode, label: "Chambres & QR", href: "/hotel/chambres" },
    { icon: CalendarDays, label: "Réservations", href: "/hotel/reservations", badge: pending },
    { icon: Users, label: "Clients", href: "/hotel/clients" },
  ];
  const insightNav: NavItem[] = [
    { icon: Coins, label: "Commissions", href: "/hotel/commissions" },
    { icon: BarChart3, label: "Analyses", href: "/hotel/analyses" },
  ];
  const accountNav: NavItem[] = [
    { icon: Settings, label: "Paramètres", href: "/hotel/settings" },
    { icon: LifeBuoy, label: "Aide", href: "/hotel/aide" },
  ];

  const signOut = (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-white/45 transition-all hover:bg-white/[0.08] hover:text-red-300"
      >
        <LogOut size={17} strokeWidth={1.75} />
        Déconnexion
      </button>
    </form>
  );

  const brand = (
    <Link href="/hotel" className="flex items-center gap-2.5">
      <Image
        src="/logo-header.png"
        alt="twocards."
        width={32}
        height={32}
        className="h-8 w-auto brightness-0 invert"
      />
      <span className="text-lg font-black tracking-tight text-white">
        twocards<span className="text-sky-400">.</span>
      </span>
    </Link>
  );

  return (
    <div className="satoshi hotel-shell relative min-h-screen bg-[#0d0f12] lg:h-screen lg:overflow-hidden">
      {/* Fond photo : vue aérienne sable / océan (public/dashboard-bg-ocean.jpg).
         Photo claire sous du texte blanc : flou léger (4 px) pour garder l'image
         reconnaissable, voile à 55 % pour ramener la luminance sous le texte ;
         le scale compense les bords éclaircis par le flou. */}
      <div
        className="hotel-shell-bg fixed inset-0 scale-105 bg-cover bg-center blur-sm"
        style={{ backgroundImage: "url(/dashboard-bg-ocean.jpg)" }}
      />
      <div className="hotel-shell-bg fixed inset-0 bg-black/55" />
      <div className="hotel-shell-bg fixed inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60" />

      <div className="hotel-shell relative z-10 flex flex-col gap-4 p-4 lg:h-screen lg:flex-row lg:gap-5 lg:p-5">
        {/* Barre mobile */}
        <div className="hotel-shell-topbar flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-3 py-2.5 backdrop-blur-2xl lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-white/70 transition-colors hover:text-white"
            aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {sidebarOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
          </button>
          {brand}
          <Link href="/hotel/reservations" onClick={closeSidebar} className="relative rounded-lg p-2 text-white/70" aria-label="Réservations en attente">
            <Bell size={20} strokeWidth={1.75} />
            {pending > 0 && (
              <span className="num absolute -right-0.5 -top-0.5 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-black">
                {pending}
              </span>
            )}
          </Link>
        </div>

        {/* Menu mobile */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
            <div className="fixed inset-x-4 top-20 z-50 max-h-[75vh] space-y-5 overflow-y-auto rounded-3xl border border-white/12 bg-[#0e1116]/95 p-5 backdrop-blur-2xl lg:hidden">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Hotel size={14} strokeWidth={1.75} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{hotelName}</p>
                  <p className="text-[11px] text-white/45">Espace hôtel</p>
                </div>
              </div>
              <NavSection title="Activité" items={mainNav} pathname={pathname} onNavigate={closeSidebar} />
              <NavSection title="Performance" items={insightNav} pathname={pathname} onNavigate={closeSidebar} />
              <NavSection title="Compte" items={accountNav} pathname={pathname} onNavigate={closeSidebar} />
              <div className="border-t border-white/10 pt-3">{signOut}</div>
            </div>
          </>
        )}

        {/* Barre latérale */}
        <aside className="hotel-shell-aside hidden h-[calc(100vh-40px)] w-[248px] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl lg:flex">
          <div className="px-2 pb-4 pt-1">{brand}</div>

          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: profile.accent_color }}
            >
              <Hotel size={15} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-white">
                {isLoading ? "…" : hotelName}
              </p>
              <p className="truncate text-[11px] text-white/45">
                {qrCodes.filter((q) => q.active).length} QR actifs
                {todayCount > 0 ? ` · ${todayCount} sortie${todayCount > 1 ? "s" : ""} ce jour` : ""}
              </p>
            </div>
          </div>

          <Link
            href="/hotel/chambres?nouveau=1"
            className="mb-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 text-sm font-bold text-white transition-colors hover:bg-sky-400"
          >
            <Plus size={16} strokeWidth={2.25} />
            Nouveau QR code
          </Link>

          <div className="flex-1 space-y-5 overflow-y-auto scrollbar-thin">
            <NavSection title="Activité" items={mainNav} pathname={pathname} onNavigate={closeSidebar} />
            <NavSection title="Performance" items={insightNav} pathname={pathname} onNavigate={closeSidebar} />
            <NavSection title="Compte" items={accountNav} pathname={pathname} onNavigate={closeSidebar} />
          </div>

          <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
            <Link
              href="/hotel/settings?onglet=compte"
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.06]"
            >
              {isLoading ? (
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" />
              ) : (
                <Avatar
                  url={avatarUrl}
                  initials={initials || "H"}
                  size={36}
                  textClassName="text-sm font-bold text-white"
                />
              )}
              <div className="min-w-0">
                {isLoading ? (
                  <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                ) : (
                  <>
                    <p className="truncate text-[13px] font-bold text-white">{fullName || "Hôtelier"}</p>
                    <p className="truncate text-[11px] text-white/40">Voir mon compte</p>
                  </>
                )}
              </div>
            </Link>
            {signOut}
          </div>
        </aside>

        {/* Contenu */}
        <main className="hotel-shell-main min-w-0 flex-1 overflow-x-hidden lg:h-[calc(100vh-40px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
          <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-10">
            {(resFailed || qrFailed) && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <WifiOff size={16} strokeWidth={1.75} className="shrink-0 text-red-300" />
                <span>Impossible de charger vos données. Vérifiez votre connexion, puis rechargez la page.</span>
                <button type="button" onClick={() => window.location.reload()} className="ml-auto shrink-0 text-xs font-bold text-red-200 hover:text-white">
                  Recharger
                </button>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {alert && (
        <Link
          href="/hotel/reservations"
          onClick={dismiss}
          className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-center gap-3 rounded-2xl border border-amber-400/25 bg-black/85 px-4 py-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
            <Bell size={16} strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
              Nouvelle demande
            </span>
            <span className="block truncate text-sm text-white">{alert.text}</span>
          </span>
        </Link>
      )}
    </div>
  );
}
