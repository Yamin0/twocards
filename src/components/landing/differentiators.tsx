"use client";

import { motion } from "framer-motion";
import {
  Zap,
  MessagesSquare,
  EyeOff,
  Stamp,
  Check,
} from "lucide-react";

/* Mini-visuels simulés, style verre sombre sur carte ivoire */

function DropVisual() {
  return (
    <div className="rounded-2xl bg-[#111] p-4 text-left shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
          Drop · H−6
        </span>
        <span className="text-[10px] text-white/40">ce soir</span>
      </div>
      <p className="text-[13px] font-medium text-white">
        Table de 6 · 23:00 · Rooftop
      </p>
      <p className="mt-0.5 text-[11px] text-white/50">
        Min. 8 000 MAD · acompte 20 % · commission 8 %
      </p>
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-lg bg-white py-1.5 text-center text-[11px] font-semibold text-black">
          Proposer à un client
        </span>
        <span className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] text-white/60">
          Passer
        </span>
      </div>
    </div>
  );
}

function ReverseVisual() {
  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-[#111] p-3 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.4)]">
        <p className="text-[11px] font-medium text-white">
          8 personnes · restaurant festif · 23:00
        </p>
        <p className="text-[10px] text-white/50">
          Budget 12 000 MAD · client Priority
        </p>
      </div>
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md border border-black/10 bg-white p-3">
        <p className="text-[11px] font-medium text-[var(--landing-ink)]">
          Disponible — terrasse, 23:15
        </p>
        <p className="text-[10px] text-[var(--landing-ink)]/50">
          2 offres reçues en 9 min
        </p>
      </div>
    </div>
  );
}

function PrivacyVisual() {
  return (
    <div className="rounded-2xl bg-[#111] p-4 text-left shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
      {[
        ["Client", "M. B•••••", true],
        ["Téléphone", "+212 6•• ••• •12", true],
        ["Couverts · heure", "6 · 23:00", false],
      ].map(([label, value, masked]) => (
        <div
          key={label as string}
          className="flex items-center justify-between border-b border-white/[0.06] py-2 last:border-b-0"
        >
          <span className="text-[10px] uppercase tracking-wide text-white/40">
            {label}
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-white">
            {masked && <EyeOff size={11} className="text-white/40" />}
            {value}
          </span>
        </div>
      ))}
      <p className="mt-2.5 text-[10px] text-white/40">
        Coordonnées révélées après confirmation uniquement
      </p>
    </div>
  );
}

function PassportVisual() {
  return (
    <div className="text-left">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["Casablanca", "Paris", "Saint-Tropez", "Dubaï", "Ibiza"].map(
          (city, i) => (
            <span
              key={city}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                i === 0
                  ? "bg-[var(--landing-ink)] text-[var(--landing-ivory)]"
                  : "border border-black/15 text-[var(--landing-ink)]/60"
              }`}
            >
              {city}
            </span>
          )
        )}
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-3.5">
        {[
          ["Taux de présence", "96 %"],
          ["Litiges", "0 sur 124 réservations"],
          ["Membre vérifié depuis", "2026"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-1.5 text-[12px]"
          >
            <span className="text-[var(--landing-ink)]/50">{label}</span>
            <span className="flex items-center gap-1 font-medium text-[var(--landing-ink)]">
              <Check size={11} className="text-emerald-600" />
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Zap,
    title: "Last-minute Drops",
    description:
      "Une table se libère à H−24, H−6 ou H−2 ? L'établissement la propose en un geste aux apporteurs les plus adaptés — commission bonifiée si besoin.",
    visual: DropVisual,
  },
  {
    icon: MessagesSquare,
    title: "Reverse Request",
    description:
      "Le premier choix est complet ? Le concierge publie une demande anonymisée, et les établissements disponibles répondent avec une offre.",
    visual: ReverseVisual,
  },
  {
    icon: EyeOff,
    title: "Client Privacy Relay",
    description:
      "Le portefeuille client d'un concierge est son fonds de commerce. Coordonnées masquées, numéro relais, divulgation après confirmation seulement.",
    visual: PrivacyVisual,
  },
  {
    icon: Stamp,
    title: "Performance Passport",
    description:
      "Présence, fiabilité, litiges : une réputation transactionnelle qui suit chaque membre de ville en ville — et remplace les notes à l'emporte-pièce.",
    visual: PassportVisual,
  },
];

export function Differentiators() {
  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32 font-body">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Ce que personne d&apos;autre ne fait
          </p>
          <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-5xl">
            Pensé pour la <em className="italic">vraie</em> nuit.
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
              className="flex flex-col justify-between gap-8 rounded-2xl border border-black/[0.08] bg-white/50 p-7 md:p-9"
            >
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--landing-ink)] text-[var(--landing-ivory)]">
                    <f.icon size={16} strokeWidth={1.5} />
                  </span>
                  <h3 className="font-title text-xl font-normal text-[var(--landing-ink)]">
                    {f.title}
                  </h3>
                </div>
                <p className="text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {f.description}
                </p>
              </div>
              <div className="mx-auto w-full max-w-xs">
                <f.visual />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
