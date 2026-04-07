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
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-[12px]">
      <div className="mx-auto flex h-[88px] max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
          <Image
            src="/logo-cards-transp.png"
            alt="twocards."
            width={56}
            height={56}
            className="h-14 w-auto"
            priority
          />
          <span className="font-[family-name:var(--font-nunito)] text-2xl font-extrabold text-primary-dark tracking-tight">
            twocards.
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-background"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login"
            className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-background"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-sm bg-primary px-6 py-3 font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            Demander une invitation
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-on-background lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X size={24} strokeWidth={1.5} />
          ) : (
            <Menu size={24} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="bg-surface/95 backdrop-blur-[12px] lg:hidden">
          <nav className="flex flex-col gap-6 px-6 py-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-background"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-background"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="w-fit rounded-sm bg-primary px-6 py-3 font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-white"
            >
              Demander une invitation
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
