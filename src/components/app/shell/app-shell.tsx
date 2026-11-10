"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Avatar } from "@/components/shared/avatar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ToastProvider } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { getShellNav, type NavGroup, type NavItem, type ShellRole } from "./nav-config";

/* Coque unique des quatre espaces connectés.

   Ordinateur : rail bleu nuit à gauche (navigation, compte), barre du haut
   (espace courant, langue), contenu sur fond papier.
   Téléphone : barre du haut, barre d'onglets en bas (les quatre écrans de
   tous les jours, sous le pouce) et un menu complet.
   Application mobile (.tc-app) : la coque native porte déjà logo, compte et
   onglets ; rail, barres et menu sont masqués.
   Impression : seul le contenu sort (.tc-shell-chrome est masqué). */

type Badges = Record<string, number>;

function isActive(item: NavItem, pathname: string, search: URLSearchParams | null) {
  const path = item.href.split("?")[0];
  if (item.query) {
    return pathname === path && (search?.get(item.query.key) ?? null) === item.query.value;
  }
  if (item.exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function Count({ n, className }: { n: number; className?: string }) {
  if (!n || n <= 0) return null;
  return (
    <span
      className={cn(
        "num flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ffcf70] px-1.5 text-[11px] font-bold text-[#13305c]",
        className
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

function NavLink({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
        active ? "bg-fill-2 font-bold text-ink" : "text-ink-3 hover:bg-fill hover:text-ink"
      )}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.75} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      <Count n={badge} />
    </Link>
  );
}

function NavGroups({
  groups,
  badges,
  onNavigate,
}: {
  groups: NavGroup[];
  badges: Badges;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-5">
      {groups.map((group, gi) => {
        const key = group.title ?? `g${gi}`;
        const hasActive = group.items.some((i) => isActive(i, pathname, search));
        const open = !group.collapsible || hasActive || opened[key];
        const links = (
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  active={isActive(item, pathname, search)}
                  badge={badges[item.href] ?? 0}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        );
        return (
          <div key={key}>
            {group.title &&
              (group.collapsible ? (
                <button
                  type="button"
                  aria-expanded={Boolean(open)}
                  onClick={() => setOpened((o) => ({ ...o, [key]: !open }))}
                  className="mb-1 flex h-9 w-full items-center justify-between rounded-lg px-3 text-xs font-bold text-ink-3 hover:text-ink"
                >
                  {group.title}
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    aria-hidden
                    className={cn("transition-transform", open && "rotate-180")}
                  />
                </button>
              ) : (
                <p className="mb-1 px-3 text-xs font-bold text-ink-3">{group.title}</p>
              ))}
            {open && links}
          </div>
        );
      })}
    </div>
  );
}

function Brand({ href, onNavigate }: { href: string; onNavigate?: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg">
      <Image
        src="/logo-header.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-auto brightness-0 invert"
      />
      <span className="font-[family-name:var(--font-nunito)] text-lg font-bold tracking-tight text-white">
        twocards<span className="text-[#8fb4ff]">.</span>
      </span>
    </Link>
  );
}

function SignOut({ className }: { className?: string }) {
  const t = useT();
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-ink-3 transition-colors hover:bg-fill hover:text-danger",
          className
        )}
      >
        <LogOut size={18} strokeWidth={1.75} aria-hidden />
        {t("Déconnexion", "Log out")}
      </button>
    </form>
  );
}

/* Barre d'onglets du téléphone : quatre écrans et le menu. */
function BottomTabs({
  tabs,
  badges,
  menuOpen,
  onMenu,
}: {
  tabs: NavItem[];
  badges: Badges;
  menuOpen: boolean;
  onMenu: () => void;
}) {
  const t = useT();
  const pathname = usePathname();
  const search = useSearchParams();
  const cell = "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]";
  return (
    <nav
      aria-label={t("Navigation principale", "Main navigation")}
      className="tc-shell-chrome tc-app-hide fixed inset-x-0 bottom-0 z-30 flex h-[calc(3.75rem+env(safe-area-inset-bottom))] border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map((item) => {
        const active = !menuOpen && isActive(item, pathname, search);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(cell, active ? "font-bold text-brand" : "text-ink-3")}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={active ? 2 : 1.75} aria-hidden />
              <Count n={badges[item.href] ?? 0} className="absolute -right-3 -top-1.5 h-4 min-w-4 px-1 text-[10px]" />
            </span>
            <span className="max-w-full truncate px-1">{item.short ?? item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        className={cn(cell, menuOpen ? "font-bold text-brand" : "text-ink-3")}
      >
        {menuOpen ? <X size={21} strokeWidth={2} aria-hidden /> : <Menu size={21} strokeWidth={1.75} aria-hidden />}
        <span>{t("Menu", "Menu")}</span>
      </button>
    </nav>
  );
}

export type Workspace = {
  /** Nom de l'établissement, de l'hôtel… affiché sous le logo. */
  name?: string | null;
  /** Ligne d'état courte : « 12 QR actifs · 3 sorties ce jour ». */
  meta?: ReactNode;
};

export function AppShell({
  role,
  children,
  badges = {},
  workspace,
  cta,
  banner,
}: {
  role: ShellRole;
  children: ReactNode;
  /** Pastilles de non-lus, par adresse de l'entrée de menu. */
  badges?: Badges;
  workspace?: Workspace;
  /** Action principale de l'espace, en tête du rail. */
  cta?: { href: string; label: string; icon: NavItem["icon"] };
  /** Bandeau au-dessus du contenu (erreur de chargement, alerte). */
  banner?: ReactNode;
}) {
  const t = useT();
  const { fullName, email, initials, avatarUrl, isLoading, isAdmin, isActivityVenue } = useAuthUser();
  const nav = getShellNav(role, t, { isAdmin, isActivityVenue });
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  /* Le menu se referme à chaque changement de page. */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);
  const CtaIcon = cta?.icon;
  const displayName = fullName || email || t("Mon compte", "My account");

  const account = (
    <Link
      href={nav.account.href}
      onClick={close}
      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-fill"
    >
      {isLoading ? (
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-fill-2" />
      ) : (
        <Avatar url={avatarUrl} initials={initials || "U"} size={36} className="bg-fill-3" textClassName="text-sm font-bold text-ink" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-ink">{isLoading ? "…" : displayName}</span>
        <span className="block truncate text-xs text-ink-3">{nav.space}</span>
      </span>
    </Link>
  );

  const ctaLink = cta && CtaIcon && (
    <Link
      href={cta.href}
      onClick={close}
      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-on-brand transition-colors hover:bg-brand-strong"
    >
      <CtaIcon size={17} strokeWidth={2} aria-hidden />
      {cta.label}
    </Link>
  );

  return (
    <ToastProvider>
      <div className="tc-shell min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-on-brand"
        >
          {t("Aller au contenu", "Skip to content")}
        </a>

        {/* Rail (ordinateur) */}
        <aside className="tc-shell-chrome tc-dark sticky top-0 hidden h-dvh flex-col bg-rail lg:flex">
          <div className="px-5 pb-4 pt-5">
            <Brand href={nav.home} />
          </div>
          {(workspace?.name || workspace?.meta) && (
            <div className="mx-3 mb-3 rounded-xl bg-fill px-3 py-2.5">
              <p className="truncate text-sm font-bold text-ink">{workspace.name ?? nav.space}</p>
              {workspace.meta && <p className="mt-0.5 truncate text-xs text-ink-3">{workspace.meta}</p>}
            </div>
          )}
          {ctaLink && <div className="mx-3 mb-4">{ctaLink}</div>}
          <nav
            aria-label={t("Navigation principale", "Main navigation")}
            className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4"
          >
            <Suspense fallback={null}>
              <NavGroups groups={nav.groups} badges={badges} />
            </Suspense>
          </nav>
          <div className="space-y-0.5 border-t border-line px-3 py-3">
            {account}
            {nav.help && (
              <Suspense fallback={null}>
                <NavGroups groups={[{ items: [nav.help] }]} badges={{}} />
              </Suspense>
            )}
            <SignOut />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Barre du haut */}
          <header className="tc-shell-chrome tc-app-topbar sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/95 px-4 backdrop-blur lg:h-16 lg:px-8">
            <div className="tc-dark lg:hidden">
              <Link href={nav.home} className="flex items-center gap-2 rounded-lg bg-rail px-2.5 py-1.5">
                <Image src="/logo-header.png" alt="" width={22} height={22} className="h-[22px] w-auto brightness-0 invert" />
                <span className="font-[family-name:var(--font-nunito)] text-[15px] font-bold tracking-tight text-white">
                  twocards<span className="text-[#8fb4ff]">.</span>
                </span>
              </Link>
            </div>
            <p className="hidden min-w-0 truncate text-sm text-ink-3 lg:block">
              {workspace?.name ? (
                <>
                  <span className="font-bold text-ink">{workspace.name}</span>
                  <span className="mx-2 text-ink-4" aria-hidden>
                    /
                  </span>
                  {nav.space}
                </>
              ) : (
                nav.space
              )}
            </p>
            <LanguageSwitcher tone="light" className="shrink-0" />
          </header>

          <main
            id="contenu"
            tabIndex={-1}
            className="tc-shell-main tc-app-scroll min-w-0 flex-1 px-4 pb-28 pt-5 outline-none lg:px-8 lg:pb-12 lg:pt-8"
          >
            <div className="mx-auto w-full max-w-[1320px] space-y-6">
              {banner}
              {children}
            </div>
          </main>
        </div>

        {/* Menu complet (téléphone) */}
        {menuOpen && (
          <div className="tc-shell-chrome fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-scrim" onClick={close} aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("Menu", "Menu")}
              className="absolute inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-t-3xl bg-panel p-4 shadow-pop animate-in slide-in-from-bottom-4"
            >
              {(workspace?.name || workspace?.meta) && (
                <div className="mb-3 rounded-xl bg-fill px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-ink">{workspace.name ?? nav.space}</p>
                  {workspace.meta && <p className="mt-0.5 truncate text-xs text-ink-3">{workspace.meta}</p>}
                </div>
              )}
              {ctaLink && <div className="mb-4">{ctaLink}</div>}
              <Suspense fallback={null}>
                <NavGroups
                  groups={nav.help ? [...nav.groups, { items: [nav.help] }] : nav.groups}
                  badges={badges}
                  onNavigate={close}
                />
              </Suspense>
              <div className="mt-4 space-y-0.5 border-t border-line pt-3">
                {account}
                <SignOut />
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={null}>
          <BottomTabs tabs={nav.tabs} badges={badges} menuOpen={menuOpen} onMenu={() => setMenuOpen((v) => !v)} />
        </Suspense>
      </div>
    </ToastProvider>
  );
}
