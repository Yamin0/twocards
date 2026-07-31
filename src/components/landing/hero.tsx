"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  QrCode,
  ReceiptText,
  Percent,
  Scale,
} from "lucide-react";
import { GlassEffect, GlassButton, GlassFilter } from "@/components/ui/liquid-glass";
import { WarpOverlay, WarpBackground } from "@/components/ui/wrap-shader";

const navLinks = [
  { label: "Solutions", href: "#solutions" },
  { label: "Établissements", href: "#etablissements" },
  { label: "Concierges & RP", href: "#concierges" },
  { label: "Contact", href: "#contact" },
];

const modules = [
  { icon: CalendarCheck, label: "Réservations" },
  { icon: QrCode, label: "Check-in" },
  { icon: ReceiptText, label: "Factures" },
  { icon: Percent, label: "Commissions" },
  { icon: Scale, label: "Litiges" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--landing-ivory)] text-[var(--landing-ink)] font-body">
      <GlassFilter />

      {/* Bloc haut : navbar + héros sur fond shader */}
      <div className="relative">
        <WarpBackground speed={0.3} />

        {/* Navbar */}
        <header className="relative z-10 flex items-center justify-between border-b border-black/[0.06] px-6 py-5 md:px-16">
        <Link
          href="/"
          className="font-title text-[26px] font-medium leading-none tracking-tight"
        >
          twocards<span className="text-[var(--landing-mute)]">.</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/60 transition-colors hover:text-[var(--landing-ink)]"
            >
              {link.label}
            </Link>
          ))}
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
            className="rounded-full bg-[var(--landing-ink)] px-5 py-2.5 text-[13px] font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-80"
          >
            Demander un accès
          </Link>
        </div>
      </header>

      {/* Hero editorial */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-20 text-center md:pb-28 md:pt-28">
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mb-8 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]"
        >
          Le channel manager des concierges &amp; RP
        </motion.p>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-8 font-title text-[38px] font-light leading-[1.12] tracking-[-0.02em] md:text-[64px]"
        >
          Chaque recommandation
          <br />
          devient une réservation{" "}
          <em className="italic">traçable</em>.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-10 max-w-xl text-[15px] font-light leading-relaxed text-[var(--landing-ink)]/70"
        >
          TwoCards connecte les établissements aux concierges et RP vérifiés,
          synchronise les disponibilités et automatise l&apos;attribution, les
          acomptes et les commissions.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col items-center gap-5 sm:flex-row"
        >
          <Link
            href="/signup"
            className="rounded-full bg-[var(--landing-ink)] px-8 py-3.5 text-[14px] font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-80"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/signup?role=concierge"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/60 underline decoration-black/20 underline-offset-4 transition-colors hover:text-[var(--landing-ink)]"
          >
            Je suis concierge / RP
          </Link>
        </motion.div>
      </div>
      </div>

      {/* Photo band + liquid glass */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="relative flex min-h-[70vh] w-full flex-col items-center justify-center gap-8 overflow-hidden px-6 py-24"
        style={{
          background: `url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop") center center / cover`,
          animation: "moveBackground 120s linear infinite",
        }}
      >
        <WarpOverlay opacity={0.55} speed={0.4} />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/80">
            Une seule plateforme, de la demande au paiement
          </p>

          {/* Glass dock of modules */}
          <GlassEffect className="rounded-3xl p-2">
            <div className="flex items-center gap-1 p-2 sm:gap-2">
              {modules.map((module) => (
                <div
                  key={module.label}
                  className="flex w-[72px] flex-col items-center gap-2 rounded-2xl px-1 py-3 transition-all duration-500 hover:scale-110 sm:w-24 sm:px-3"
                  style={{
                    transitionTimingFunction:
                      "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
                  }}
                >
                  <module.icon
                    size={26}
                    strokeWidth={1.25}
                    className="text-white"
                  />
                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/90 sm:text-[10px]">
                    {module.label}
                  </span>
                </div>
              ))}
            </div>
          </GlassEffect>

          <GlassButton href="/signup">
            <p className="text-base font-light tracking-wide text-white">
              Découvrir TwoCards
            </p>
          </GlassButton>
        </div>
      </motion.div>

      {/* Product frame */}
      <div className="border-b border-black/[0.06] px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Le produit
          </p>
          <h2 className="mx-auto mb-12 max-w-2xl text-center font-title text-3xl font-light leading-tight md:text-4xl">
            Qui remplit vos tables,
            <br />
            <em className="italic">noir sur blanc</em>.
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard-preview-v2.png"
            alt="Dashboard TwoCards"
            className="w-full rounded-lg border border-black/10 shadow-[0_30px_80px_-40px_rgba(13,13,13,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
