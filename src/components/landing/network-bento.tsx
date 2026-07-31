"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkle } from "lucide-react";

/* Adaptation TwoCards de la section bento portfolio : mêmes gabarits,
   contenu crédible — feuille de route, promesse, objectif pilote,
   connecteurs prévus et contact. Vidéos produit locales en fond. */

function SectionLabel({
  children,
  align = "center",
}: {
  children: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        align === "center" ? "justify-center" : "justify-start"
      }`}
    >
      <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
      <span className="text-[11px] uppercase tracking-[0.22em] text-white/70">
        {children}
      </span>
      <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
    </div>
  );
}

const ROADMAP = [
  { year: "Été 2026", step: "Founding Circle", place: "Marrakech" },
  { year: "T4 2026", step: "Pilote en conditions réelles", place: "Hivernage · Guéliz" },
  { year: "2027", step: "Connecteurs & multi-villes", place: "Casablanca →" },
];

const TOOLS_ROW_1 = [
  "SevenRooms",
  "CoverManager",
  "Zenchef",
  "TheFork",
  "Fourvenues",
  "OpenTable",
];

const TOOLS_ROW_2 = [
  "WhatsApp Business",
  "Oracle Micros",
  "Lightspeed",
  "Opera PMS",
  "CMI",
  "Payzone",
];

function MarqueeRow({
  items,
  direction,
}: {
  items: string[];
  direction: "left" | "right";
}) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`flex w-max gap-3 ${
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        }`}
      >
        {doubled.map((tool, i) => (
          <span
            key={`${tool}-${i}`}
            className="landing-glass flex h-14 shrink-0 items-center rounded-xl px-5 text-[12px] font-medium text-white/85 md:h-16"
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}

export function NetworkBento() {
  return (
    <section className="border-t border-black/[0.06] bg-[#0a0a0a] px-4 py-16 text-white antialiased sm:px-6 md:px-10 md:py-20 lg:px-14 font-body">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between"
      >
        <div className="max-w-3xl">
          <h2 className="font-title text-[28px] font-normal leading-[1.15] tracking-tight sm:text-3xl md:text-4xl lg:text-[44px]">
            Le réseau, <em className="italic">en actes</em>.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-[1.6] text-white/60 md:text-[15px]">
            TwoCards démarre là où les recommandations circulent déjà :
            Marrakech. Feuille de route, promesse contractuelle, outils
            compatibles et objectifs du pilote — tout est posé, noir sur
            blanc, avant la première réservation.
          </p>
        </div>
        <Link
          href="/signup"
          className="landing-glass shrink-0 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] sm:px-6 sm:py-3"
        >
          Rejoindre le Founding Circle
        </Link>
      </motion.div>

      {/* Grille bento */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3"
      >
        {/* Colonne 1 — Feuille de route sur vidéo */}
        <div className="relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-2xl bg-black p-5 md:p-6">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            src="/videos/reseau-rp.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75" />
          <div className="relative">
            <SectionLabel>La feuille de route</SectionLabel>
          </div>
          <div className="relative grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 gap-y-3 text-[12.5px]">
            {ROADMAP.map((r) => (
              <div key={r.year} className="contents">
                <span className="tabular-nums text-white/85">{r.year}</span>
                <Sparkle className="h-3 w-3 text-white/60" strokeWidth={1.5} />
                <span className="font-medium text-white">{r.step}</span>
                <span className="text-white/55">{r.place}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 2 — promesse + objectif pilote */}
        <div className="grid gap-4 md:grid-rows-[auto_1fr] md:gap-5">
          <div className="noise-overlay relative overflow-hidden rounded-2xl bg-[#2e2b25] p-5 md:p-6">
            <SectionLabel align="start">La promesse</SectionLabel>
            <p className="mt-4 text-[13px] leading-[1.6] text-white/85 sm:text-[13.5px]">
              « Une recommandation qui part sur WhatsApp doit revenir en
              transaction traçable — sans doublon, sans litige, avec un
              paiement certain. C&apos;est le contrat que chaque membre du
              réseau signe, des deux côtés. »
            </p>
            <p className="mt-4 text-[12.5px] text-white/60">
              <strong className="font-semibold text-white">
                L&apos;engagement TwoCards
              </strong>{" "}
              — Pilote Marrakech 2026
            </p>
          </div>

          <div className="relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-black p-5">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-50"
              src="/videos/commissions.mp4"
            />
            <div className="absolute inset-0 bg-black/45" />
            <p className="relative text-5xl font-light tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-6xl md:text-7xl lg:text-[88px]">
              60+
            </p>
            <p className="relative mt-2 text-center text-[13px] text-white/85">
              concierges &amp; RP vérifiés — objectif du pilote Marrakech
            </p>
          </div>
        </div>

        {/* Colonne 3 — connecteurs + contact */}
        <div className="grid gap-4 md:gap-5">
          <div className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-2xl bg-black py-5 md:py-6">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              src="/videos/dashboard.mp4"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
            <div className="relative">
              <SectionLabel>Compatible avec vos outils</SectionLabel>
            </div>
            <div className="relative flex flex-col gap-3">
              <MarqueeRow items={TOOLS_ROW_1} direction="left" />
              <MarqueeRow items={TOOLS_ROW_2} direction="right" />
              <p className="px-5 text-center text-[10px] uppercase tracking-[0.18em] text-white/40">
                Programme connecteurs — V1
              </p>
            </div>
          </div>

          <div className="noise-overlay relative overflow-hidden rounded-2xl bg-[#2e2b25] p-5 md:p-6">
            <div className="flex items-start justify-between">
              <SectionLabel align="start">Nous joindre</SectionLabel>
              <Link
                href="/#contact"
                aria-label="Nous contacter"
                className="landing-glass flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
              >
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
            <div className="mt-5 flex flex-col gap-1.5">
              <a
                href="mailto:contact@twocardspro.com"
                className="text-[15px] font-medium text-white transition-colors hover:text-white/70"
              >
                contact@twocardspro.com
              </a>
              <p className="text-[13px] text-white/60">
                Marrakech — Hivernage &amp; Guéliz
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
