"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Solutions", href: "#features" },
  { label: "Le Registre", href: "/signup" },
  { label: "Tarifs", href: "/signup" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex h-14 items-center justify-between px-6 liquid-glass-header rounded-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-cards-transp.png"
              alt="twocards."
              width={32}
              height={32}
              className="h-8 w-auto brightness-0 invert"
              priority
            />
            <span className="font-[family-name:var(--font-nunito)] text-lg font-bold text-white tracking-tight">
              twocards<span className="text-blue-400">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            {navLinks.map((link, i) => (
              <Link
                key={`nav-${i}`}
                href={link.href}
                className="hover:text-white transition-colors font-[family-name:var(--font-manrope)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors font-[family-name:var(--font-manrope)]"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-lg px-5 py-2 text-sm transition-all hover:scale-[1.02] font-[family-name:var(--font-manrope)]"
            >
              Commencer
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white/80 hover:text-white md:hidden transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X size={22} strokeWidth={1.5} />
            ) : (
              <Menu size={22} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mt-2 mx-auto max-w-4xl liquid-glass rounded-2xl p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <Link
                key={`mob-${i}`}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all font-[family-name:var(--font-manrope)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all font-[family-name:var(--font-manrope)]"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="mt-2 bg-blue-500 text-white font-medium rounded-xl px-4 py-3 text-sm text-center transition-all hover:bg-blue-400 font-[family-name:var(--font-manrope)]"
            >
              Commencer
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
