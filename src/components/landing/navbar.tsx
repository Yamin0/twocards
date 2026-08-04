"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Hôtels", href: "/hotels" },
  { label: "Établissements", href: "/restaurants" },
  { label: "Concierges / PR", href: "/concierges" },
  { label: "Influenceurs", href: "/influenceurs" },
];

export function LandingNavbar({
  variant = "light",
  fixed = false,
}: {
  variant?: "light" | "dark";
  fixed?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const onDark = variant === "dark";

  /* En mode épinglé, le fond n'apparaît qu'une fois la page défilée :
     transparent posé sur la vidéo en haut, verre sombre lisible sur les
     sections claires ensuite. */
  useEffect(() => {
    if (!fixed) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fixed]);

  return (
    <div
      className={`font-body ${
        fixed ? "fixed inset-x-0 top-0 z-50" : "relative z-20"
      }`}
    >
      <header
        className={`flex items-center justify-between px-6 py-5 transition-colors duration-300 md:px-16 ${
          onDark ? "border-b border-white/[0.08]" : "border-b border-black/[0.06]"
        } ${
          fixed && scrolled
            ? onDark
              ? "bg-black/60 backdrop-blur-md"
              : "bg-[var(--landing-ivory)]/85 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2.5 font-title text-[26px] font-medium leading-none tracking-tight ${
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

        {/* Bascule à lg et non md : les cinq libellés plus le bloc d'accès
            réclament ~960 px, le menu débordait entre 768 et 1024. */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
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

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className={`hidden text-[11px] font-medium uppercase tracking-[0.18em] transition-colors sm:block ${
              onDark
                ? "text-white/60 hover:text-white"
                : "text-[var(--landing-ink)]/60 hover:text-[var(--landing-ink)]"
            }`}
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className={`hidden rounded-full px-5 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-80 sm:block ${
              onDark
                ? "bg-white text-black"
                : "bg-[var(--landing-ink)] text-[var(--landing-ivory)]"
            }`}
          >
            Demander un accès
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`transition-colors lg:hidden ${
              onDark
                ? "text-white/70 hover:text-white"
                : "text-[var(--landing-ink)]/70 hover:text-[var(--landing-ink)]"
            }`}
            aria-label="Ouvrir le menu"
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
        <nav className="absolute left-0 right-0 top-full z-30 flex flex-col border-b border-black/[0.08] bg-[var(--landing-ivory)] px-6 py-4 lg:hidden">
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
            Demander un accès
          </Link>
        </nav>
      )}
    </div>
  );
}
