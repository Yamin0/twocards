"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Solutions", href: "#solutions", chevron: true },
  { label: "Établissements", href: "#etablissements" },
  { label: "Concierges & RP", href: "#concierges" },
  { label: "Contact", href: "#contact" },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -250]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-black text-white font-[family-name:var(--font-inter)]"
    >
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 md:px-28 py-4">
        <div className="flex items-center gap-12 md:gap-20">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-cards-transp.png"
              alt="twocards."
              width={28}
              height={28}
              className="h-7 w-auto brightness-0 invert"
              priority
            />
            <span className="text-xl font-bold tracking-tight">
              twocards<span className="text-white/60">.</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition-colors hover:text-white"
              >
                {link.label}
                {link.chevron && <ChevronDown size={14} strokeWidth={2} />}
              </Link>
            ))}
          </nav>
        </div>
        <Link
          href="/login"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-85"
        >
          Connexion
        </Link>
      </header>

      {/* Hero content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="mt-16 md:mt-20 flex flex-col items-center px-4 text-center"
      >
        {/* Tag pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="landing-glass mb-6 flex items-center gap-2 rounded-lg px-3 py-2"
        >
          <span className="rounded-md bg-white px-2 py-0.5 text-sm font-medium text-black">
            Nouveau
          </span>
          <span className="text-sm font-medium text-white/65">
            TwoCards passe aux réservations traçables
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-3 text-5xl font-medium leading-tight tracking-[-2px] md:text-7xl md:leading-[1.15] font-[family-name:var(--font-inter)]"
        >
          Chaque recommandation.
          <br />
          Une réservation{" "}
          <span className="font-[family-name:var(--font-instrument-serif)] font-normal italic">
            traçable
          </span>
          .
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-lg font-normal leading-6 opacity-90"
          style={{ color: "hsl(var(--hero-subtitle))" }}
        >
          TwoCards connecte les établissements aux concierges et RP vérifiés,
          <br className="hidden sm:block" /> synchronise les disponibilités et
          automatise l&apos;attribution, les acomptes et les commissions.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/signup"
              className="inline-block rounded-full bg-white px-8 py-3.5 text-base font-medium text-black"
            >
              Commencer gratuitement
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Dashboard + video area */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative mt-12 w-screen"
        style={{ marginLeft: "calc(-50vw + 50%)", aspectRatio: "16/9" }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
        />
        <motion.img
          src="/dashboard-preview-v2.png"
          alt="Dashboard TwoCards"
          style={{ y: dashboardY, mixBlendMode: "luminosity" }}
          className="absolute left-1/2 top-1/2 z-20 w-[90%] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl"
        />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-40 bg-gradient-to-t from-black to-transparent" />
      </motion.div>
    </section>
  );
}
