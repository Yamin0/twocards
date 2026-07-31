"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Restaurants", href: "/restaurants" },
  { label: "Concierges", href: "/concierges" },
  { label: "Hôtels", href: "/hotels" },
  { label: "Influenceurs", href: "/influenceurs" },
];

export function LandingNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative z-20 font-body">
      <header className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5 md:px-16">
        <Link
          href="/"
          className="font-title text-[26px] font-medium leading-none tracking-tight"
        >
          twocards<span className="text-[var(--landing-mute)]">.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                  active
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
            className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/60 transition-colors hover:text-[var(--landing-ink)] sm:block"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-full bg-[var(--landing-ink)] px-5 py-2.5 text-[13px] font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-80 sm:block"
          >
            Demander un accès
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-[var(--landing-ink)]/70 transition-colors hover:text-[var(--landing-ink)] md:hidden"
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
        <nav className="absolute left-0 right-0 top-full z-30 flex flex-col border-b border-black/[0.08] bg-[var(--landing-ivory)] px-6 py-4 md:hidden">
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
