"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

/* Les libellés suivent la langue : construits dans le composant. */
const getNavLinks = (t: ReturnType<typeof useT>) => [
  { label: t("Accueil", "Home"), href: "/" },
  { label: t("Hôtels", "Hotels"), href: "/hotels" },
  { label: t("Établissements", "Venues"), href: "/restaurants" },
  { label: t("Concierges / PR", "Concierges / PR"), href: "/concierges" },
  { label: t("Influenceurs", "Influencers"), href: "/influenceurs" },
];

/* Libellé à largeur fixe : les deux langues sont posées l'une sur l'autre,
   seule la langue courante est visible. La largeur réservée est celle du
   texte le plus long, si bien que rien ne bouge autour quand on change de
   langue (le sélecteur FR | EN reste à la même place). */
function StableLabel({ fr, en }: { fr: string; en: string }) {
  const locale = useLocale();
  return (
    <span className="inline-grid justify-items-center">
      <span className={`col-start-1 row-start-1 ${locale === "fr" ? "" : "invisible"}`} aria-hidden={locale !== "fr"}>
        {fr}
      </span>
      <span className={`col-start-1 row-start-1 ${locale === "en" ? "" : "invisible"}`} aria-hidden={locale !== "en"}>
        {en}
      </span>
    </span>
  );
}

export function LandingNavbar({
  variant = "light",
  fixed = false,
}: {
  variant?: "light" | "dark";
  fixed?: boolean;
}) {
  const pathname = usePathname();
  const t = useT();
  const navLinks = getNavLinks(t);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const onDark = variant === "dark";

  /* Barre qui revient quand on remonte (« headroom ») :
     - "top" : en haut de page, la barre est à sa place (dans le flux, ou
       épinglée transparente sur la vidéo en mode `fixed`) ;
     - "hidden" : on descend, elle sort de l'écran par le haut ;
     - "shown" : on remonte, elle redescend, épinglée, sur fond lisible.
     `animate` reste faux au passage "top" → "hidden" : la barre, déjà hors
     de l'écran, ne doit pas être vue glisser vers le haut. */
  const headerRef = useRef<HTMLElement>(null);
  const [bar, setBar] = useState<{ mode: "top" | "hidden" | "shown"; animate: boolean; height: number }>({
    mode: "top",
    animate: false,
    height: 0,
  });

  useEffect(() => {
    let lastY = window.scrollY;
    let mode: "top" | "hidden" | "shown" = "top";
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const height = headerRef.current?.offsetHeight ?? 80;
      let next = mode;
      if (y <= 0 || (mode === "top" && y <= (fixed ? 24 : height))) {
        next = "top";
        lastY = y;
      } else if (y > lastY + 6) {
        next = "hidden";
        lastY = y;
      } else if (y < lastY - 6) {
        next = "shown";
        lastY = y;
      }
      if (next !== mode) {
        const animate = mode !== "top";
        mode = next;
        setBar({ mode: next, animate, height });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fixed]);

  const pinned = fixed || bar.mode !== "top";
  const hidden = bar.mode === "hidden" && !mobileOpen;
  const solid = fixed ? scrolled : bar.mode !== "top";

  return (
    /* Hors mode `fixed`, l'enveloppe garde la hauteur de la barre quand
       celle-ci passe en position fixe : la page ne saute pas. */
    <div
      className={`font-body ${fixed ? "" : "relative z-20"}`}
      style={!fixed && pinned ? { height: bar.height } : undefined}
    >
      <div
        className={`${pinned ? "fixed inset-x-0 top-0 z-50" : "relative"} ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${bar.animate ? "transition-transform duration-300 ease-out" : ""}`}
      >
      <header
        ref={headerRef}
        className={`flex items-center justify-between gap-x-8 px-6 py-5 2xl:grid 2xl:grid-cols-[1fr_auto_1fr] transition-colors duration-300 md:px-16 ${
          onDark ? "border-b border-white/[0.08]" : "border-b border-black/[0.06]"
        } ${
          solid
            ? onDark
              ? "bg-black/60 backdrop-blur-md"
              : "bg-[var(--landing-ivory)]/85 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <Link
          href="/"
          className={`flex shrink-0 items-center gap-2.5 justify-self-start font-title text-[26px] font-medium leading-none tracking-tight ${
            onDark ? "text-white" : ""
          }`}
        >
          {/* Décoratif : le mot-symbole juste à côté porte déjà le nom */}
          <Image
            src="/logo-cards-transp.png"
            alt=""
            width={64}
            height={64}
            priority
            className="h-7 w-auto"
          />
          <span>
            twocards
            <span
              className={onDark ? "text-white/50" : "text-[var(--landing-mute)]"}
            >
              .
            </span>
          </span>
        </Link>

        {/* Menu complet à partir de xl (1280 px) : les cinq libellés, le
            sélecteur de langue et le bloc d'accès ne tiennent pas en dessous
            (le français déborde). En 2xl, grille à trois colonnes : le menu
            est centré sur la page. */}
        <nav className="hidden items-center gap-6 justify-self-center xl:flex 2xl:gap-8">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                  onDark
                    ? active
                      ? "text-white underline decoration-white/40 underline-offset-8"
                      : "text-white/60 hover:text-white"
                    : active
                      ? "text-[var(--landing-ink)] underline decoration-black/30 underline-offset-8"
                      : "text-[var(--landing-ink)]/60 hover:text-[var(--landing-ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-4 xl:gap-6">
          <LanguageSwitcher tone={onDark ? "dark" : "light"} />
          <Link
            href="/login"
            className={`hidden whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] transition-colors sm:block ${
              onDark
                ? "text-white/60 hover:text-white"
                : "text-[var(--landing-ink)]/60 hover:text-[var(--landing-ink)]"
            }`}
          >
            <StableLabel fr="Connexion" en="Log in" />
          </Link>
          <Link
            href="/signup"
            className={`hidden whitespace-nowrap rounded-full px-5 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-80 sm:block ${
              onDark
                ? "bg-white text-black"
                : "bg-[var(--landing-ink)] text-[var(--landing-ivory)]"
            }`}
          >
            <StableLabel fr="Demander un accès" en="Request access" />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`transition-colors xl:hidden ${
              onDark
                ? "text-white/70 hover:text-white"
                : "text-[var(--landing-ink)]/70 hover:text-[var(--landing-ink)]"
            }`}
            aria-label={t("Ouvrir le menu", "Open menu")}
          >
            {mobileOpen ? (
              <X size={22} strokeWidth={1.5} />
            ) : (
              <Menu size={22} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </header>

      {/* Menu mobile */}
      {mobileOpen && (
        <nav className="absolute left-0 right-0 top-full z-30 flex flex-col border-b border-black/[0.08] bg-[var(--landing-ivory)] px-6 py-4 xl:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="border-b border-black/[0.05] py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/70 last:border-b-0 hover:text-[var(--landing-ink)]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/signup"
            onClick={() => setMobileOpen(false)}
            className="mt-4 rounded-full bg-[var(--landing-ink)] px-5 py-3 text-center text-[13px] font-medium text-[var(--landing-ivory)]"
          >
            {t("Demander un accès", "Request access")}
          </Link>
        </nav>
      )}
      </div>
    </div>
  );
}
