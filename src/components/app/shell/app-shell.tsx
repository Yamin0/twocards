"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Avatar } from "@/components/shared/avatar";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ToastProvider } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { getShellNav, type NavGroup, type NavItem, type ShellRole } from "./nav-config";

/* Coque unique des quatre espaces connectés, en verre twocards.

   Ordinateur : sur la vue aérienne sable/océan floutée, un rail marine
   réduit à ses icônes, qui s'ouvre par-dessus la page au survol ou au
   clavier (le contenu ne bouge pas), et un grand panneau ivoire givré qui
   porte la page.
   Téléphone : barre du haut, barre d'onglets marine flottante en bas (les
   quatre écrans de tous les jours, sous le pouce) et un menu complet.
   Application mobile (.tc-app) : la coque native porte déjà logo, compte et
   onglets ; rail, barres et menu sont masqués.
   Impression : seul le contenu sort (.tc-shell-chrome est masqué). */

type Badges = Record<string, number>;

const RAIL_CLOSED = 80;
const RAIL_OPEN = 264;

function isActive(item: NavItem, pathname: string, search: URLSearchParams | null) {
  const path = item.href.split("?")[0];
  if (item.query) {
    return pathname === path && (search?.get(item.query.key) ?? null) === item.query.value;
  }
  if (item.exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

/* Compteur de non-lus : blanc sur le marine du rail, marine sur le papier. */
function Count({ n, onLight, className }: { n: number; onLight?: boolean; className?: string }) {
  if (!n || n <= 0) return null;
  return (
    <span
      className={cn(
        "num flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
        onLight ? "bg-[#13305c] text-white" : "bg-white text-[#13305c]",
        className
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

/* Lien du rail. Le libellé est toujours rendu (lecteurs d'écran, survol)
   et ne fait que s'effacer quand le rail est réduit. */
function RailLink({
  item,
  active,
  badge,
  open,
}: {
  item: NavItem;
  active: boolean;
  badge: number;
  open: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={open ? undefined : item.label}
      className={cn(
        "relative flex h-11 items-center gap-3.5 rounded-[14px] pl-[19px] pr-3 text-[14px] transition-colors duration-200",
        active
          ? "bg-white font-bold text-[#13305c]"
          : "font-medium text-white/70 hover:bg-white/[0.07] hover:text-white"
      )}
    >
      <span className="relative shrink-0">
        <Icon size={18} strokeWidth={active ? 2.2 : 1.9} aria-hidden />
        {badge > 0 && (
          <span
            aria-hidden
            className={cn(
              "absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-[#13305c] transition-opacity duration-200",
              open ? "opacity-0" : "opacity-100"
            )}
          />
        )}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate whitespace-nowrap transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      >
        {item.label}
      </span>
      <Count
        n={badge}
        onLight={active}
        className={cn("transition-opacity duration-200", open ? "opacity-100" : "opacity-0")}
      />
    </Link>
  );
}

function RailGroups({ groups, badges, open }: { groups: NavGroup[]; badges: Badges; open: boolean }) {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <div className="space-y-3">
      {groups.map((group, gi) => (
        <div key={group.title ?? `g${gi}`}>
          {group.title && (
            <div className="relative mb-1 flex h-6 items-center px-[19px]">
              <span
                className={cn(
                  "tc-eyebrow whitespace-nowrap text-white/50 transition-opacity duration-200",
                  open ? "opacity-100" : "opacity-0"
                )}
              >
                {group.title}
              </span>
              <span
                aria-hidden
                className={cn(
                  "absolute left-[22px] top-1/2 h-px w-3 bg-white/30 transition-opacity duration-200",
                  open ? "opacity-0" : "opacity-100"
                )}
              />
            </div>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.href}>
                <RailLink
                  item={item}
                  active={isActive(item, pathname, search)}
                  badge={badges[item.href] ?? 0}
                  open={open}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* Navigation du menu téléphone, sur fond ivoire. */
function SheetGroups({
  groups,
  badges,
  onNavigate,
}: {
  groups: NavGroup[];
  badges: Badges;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={group.title ?? `g${gi}`}>
          {group.title && <p className="tc-eyebrow mb-1.5 px-3 text-ink-3">{group.title}</p>}
          <ul className="grid grid-cols-2 gap-1.5">
            {group.items.map((item) => {
              const active = isActive(item, pathname, search);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-12 items-center gap-2.5 rounded-[14px] px-3 text-[14px] transition-colors",
                      active ? "bg-[#13305c] font-bold text-white" : "border border-line font-medium text-ink hover:border-line-2"
                    )}
                  >
                    <Icon size={17} strokeWidth={active ? 2.2 : 1.9} aria-hidden className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <Count n={badges[item.href] ?? 0} onLight={!active} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* Les deux cartes du logo et le wordmark « twocards. », comme la navbar
   du site. */
function Wordmark({
  dark = true,
  size = "md",
  textClassName,
}: {
  dark?: boolean;
  size?: "md" | "sm";
  /** Rail réduit : le mot s'efface, les cartes restent. */
  textClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/logo-header.png"
        alt=""
        width={36}
        height={36}
        className={cn(size === "md" ? "h-9 w-9" : "h-7 w-7", "shrink-0 object-contain", dark && "brightness-0 invert")}
      />
      <span
        className={cn(
          "whitespace-nowrap font-bold tracking-[-0.03em]",
          size === "md" ? "text-[19px]" : "text-[16px]",
          dark ? "text-white" : "text-[#13305c]",
          textClassName
        )}
      >
        twocards.
      </span>
    </span>
  );
}

/* Barre d'onglets du téléphone : quatre écrans et le menu, en verre marine
   flottant. */
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
  const cell =
    "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] text-[10.5px] transition-colors";
  return (
    <nav
      aria-label={t("Navigation principale", "Main navigation")}
      className="tc-shell-chrome tc-app-hide tc-dark tc-rail fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 flex h-16 gap-1 rounded-[24px] p-1.5 lg:hidden"
    >
      {tabs.map((item) => {
        const active = !menuOpen && isActive(item, pathname, search);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(cell, active ? "bg-white font-bold text-[#13305c]" : "text-white/85")}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={active ? 2.2 : 1.9} aria-hidden />
              <Count
                n={badges[item.href] ?? 0}
                onLight={active}
                className="absolute -right-3 -top-1.5 h-4 min-w-4 px-1 text-[10px]"
              />
            </span>
            <span className="max-w-full truncate px-1">{item.short ?? item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        className={cn(cell, menuOpen ? "bg-white font-bold text-[#13305c]" : "text-white/85")}
      >
        {menuOpen ? <X size={20} strokeWidth={2.2} aria-hidden /> : <Menu size={20} strokeWidth={1.9} aria-hidden />}
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

const initialsOf = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

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

  /* Rail : réduit, ouvert au survol ou quand le focus clavier y entre.
     Un court délai à la sortie évite qu'il se referme quand la souris
     frôle son bord. */
  const [railOpen, setRailOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRail = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setRailOpen(true);
  };
  const closeRail = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setRailOpen(false), 120);
  };
  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);

  /* Le menu se referme à chaque changement de page ; le rail suit la
     souris. */
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
  const fade = cn("whitespace-nowrap transition-opacity duration-200", railOpen ? "opacity-100" : "opacity-0");
  const spaceName = workspace?.name ?? nav.space;

  return (
    <ToastProvider>
      <div data-space={role} className="tc-shell min-h-dvh lg:flex lg:gap-4 lg:p-4">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-on-brand"
        >
          {t("Aller au contenu", "Skip to content")}
        </a>

        {/* Rail (ordinateur) : la place réservée reste à 80 px, le panneau
            s'élargit par-dessus la page. */}
        <div
          className="tc-shell-chrome sticky top-4 z-40 hidden h-[calc(100dvh-2rem)] shrink-0 lg:block"
          style={{ width: RAIL_CLOSED }}
        >
          <aside
            onMouseEnter={openRail}
            onMouseLeave={closeRail}
            onFocus={openRail}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeRail();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setRailOpen(false);
                (document.activeElement as HTMLElement | null)?.blur();
              }
            }}
            className={cn(
              "tc-dark tc-rail absolute inset-y-0 left-0 isolate flex flex-col overflow-hidden rounded-[24px] transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              railOpen && "shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)]"
            )}
            style={{ width: railOpen ? RAIL_OPEN : RAIL_CLOSED }}
          >
            {/* Les deux as en filigrane, comme sur la carte de visite. */}
            <Image
              src="/logo-header.png"
              alt=""
              width={220}
              height={220}
              className="tc-aces absolute -bottom-10 -right-16 -z-10 h-[220px] w-[220px] -rotate-6"
            />
            {/* Marque */}
            <Link href={nav.home} className="flex h-[72px] shrink-0 items-center pl-[22px]" aria-label="twocards.">
              <Wordmark textClassName={fade} />
            </Link>

            {/* Espace courant */}
            <div className="shrink-0 px-3 pb-3">
              <div
                title={railOpen ? undefined : spaceName}
                className="flex h-14 items-center gap-3 rounded-[14px] border border-white/10 pl-[9px] pr-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[12px] font-bold text-[#13305c]">
                  {initialsOf(spaceName) || "•"}
                </span>
                <span className={cn("min-w-0", fade)}>
                  <span className="block truncate text-[13.5px] font-bold text-white">{spaceName}</span>
                  <span className="tc-eyebrow block truncate text-[9.5px] text-white/50">{nav.space}</span>
                </span>
              </div>
            </div>

            {/* Action principale */}
            {cta && CtaIcon && (
              <div className="shrink-0 px-3 pb-4">
                <Link
                  href={cta.href}
                  title={railOpen ? undefined : cta.label}
                  className="flex h-11 items-center gap-3 rounded-full bg-white pl-[19px] pr-4 text-[13.5px] font-bold text-[#0d0d0d] transition-colors hover:bg-white/90"
                >
                  <CtaIcon size={18} strokeWidth={2.3} aria-hidden className="shrink-0" />
                  <span className={fade}>{cta.label}</span>
                </Link>
              </div>
            )}

            <nav
              aria-label={t("Navigation principale", "Main navigation")}
              className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3"
            >
              <Suspense fallback={null}>
                <RailGroups groups={nav.groups} badges={badges} open={railOpen} />
              </Suspense>
            </nav>

            <div className="shrink-0 space-y-1 border-t border-white/10 px-3 pb-3 pt-3">
              {nav.help && (
                <Suspense fallback={null}>
                  <RailGroups groups={[{ items: [nav.help] }]} badges={{}} open={railOpen} />
                </Suspense>
              )}
              <div className={cn("flex h-9 items-center justify-between pl-[19px] pr-1", fade)}>
                <span className="tc-eyebrow text-white/50">{t("Langue", "Language")}</span>
                <LanguageSwitcher tone="dark" />
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={nav.account.href}
                  title={railOpen ? undefined : displayName}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] py-1.5 pl-[13px] transition-colors hover:bg-white/10"
                >
                  <span className="relative shrink-0">
                    {isLoading ? (
                      <span className="block h-[30px] w-[30px] animate-pulse rounded-full bg-white/25" />
                    ) : (
                      <Avatar
                        url={avatarUrl}
                        initials={initials || "U"}
                        size={30}
                        className="bg-white ring-2 ring-white/25"
                        textClassName="text-[12px] font-bold text-[#13305c]"
                      />
                    )}
                  </span>
                  <span className={cn("min-w-0", fade)}>
                    <span className="block truncate text-[13px] font-bold text-white">{isLoading ? "…" : displayName}</span>
                    <span className="block truncate text-[11px] text-white/60">{t("Mon compte", "My account")}</span>
                  </span>
                </Link>
                <form action="/auth/signout" method="post" className={fade}>
                  <button
                    type="submit"
                    title={t("Déconnexion", "Log out")}
                    aria-label={t("Déconnexion", "Log out")}
                    tabIndex={railOpen ? 0 : -1}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-[#fca5a5]"
                  >
                    <LogOut size={16} strokeWidth={2} aria-hidden />
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barre du haut (téléphone) */}
          <header className="tc-shell-chrome tc-app-topbar sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-3 lg:hidden">
            <Link
              href={nav.home}
              className="flex items-center rounded-full bg-[#13305c] py-1.5 pl-2 pr-3.5"
              aria-label="twocards."
            >
              <Wordmark size="sm" />
            </Link>
            <span className="rounded-full bg-[rgba(255,253,249,0.92)] p-0.5">
              <LanguageSwitcher tone="light" className="ring-0" />
            </span>
          </header>

          <main
            id="contenu"
            tabIndex={-1}
            className="tc-paper tc-shell-main tc-app-scroll mx-2 mb-[calc(6rem+env(safe-area-inset-bottom))] min-h-[calc(100dvh-4.5rem)] min-w-0 flex-1 rounded-[24px] px-4 pb-8 pt-6 outline-none sm:px-6 lg:m-0 lg:min-h-[calc(100dvh-2rem)] lg:rounded-[24px] lg:px-12 lg:pb-12 lg:pt-10"
          >
            <div className="mx-auto w-full max-w-[1280px] space-y-8">
              {banner}
              {children}
            </div>
          </main>
        </div>

        {/* Menu complet (téléphone) */}
        {menuOpen && (
          <div className="tc-shell-chrome fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={close} aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("Menu", "Menu")}
              className="absolute inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-[24px] bg-[#fffdf9] p-4 shadow-pop animate-in slide-in-from-bottom-4"
            >
              <div className="mb-4 flex items-center gap-3 rounded-[14px] border border-line px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#13305c] text-[12px] font-bold text-white">
                  {initialsOf(spaceName) || "•"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{spaceName}</span>
                  {workspace?.meta && <span className="block truncate text-xs text-ink-3">{workspace.meta}</span>}
                </span>
              </div>
              {cta && CtaIcon && (
                <Link
                  href={cta.href}
                  onClick={close}
                  className="mb-4 flex h-11 items-center justify-center gap-2 rounded-full bg-brand text-[14px] font-bold text-on-brand"
                >
                  <CtaIcon size={17} strokeWidth={2.2} aria-hidden />
                  {cta.label}
                </Link>
              )}
              <Suspense fallback={null}>
                <SheetGroups
                  groups={nav.help ? [...nav.groups, { items: [nav.help] }] : nav.groups}
                  badges={badges}
                  onNavigate={close}
                />
              </Suspense>
              <div className="mt-4 flex items-center gap-3 border-t border-line-2 pt-3">
                <Link href={nav.account.href} onClick={close} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar
                    url={avatarUrl}
                    initials={initials || "U"}
                    size={36}
                    className="bg-white"
                    textClassName="text-sm font-bold text-[#13305c]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{isLoading ? "…" : displayName}</span>
                    <span className="block truncate text-xs text-ink-3">{t("Mon compte", "My account")}</span>
                  </span>
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-bold text-danger hover:bg-danger-soft"
                  >
                    <LogOut size={16} strokeWidth={2} aria-hidden />
                    {t("Déconnexion", "Log out")}
                  </button>
                </form>
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
