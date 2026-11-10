"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { EyeOff, Check } from "lucide-react";
import {
  CONTAINER,
  SECTION,
  STAGE,
  SectionHeader,
} from "@/components/landing/section-header";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* Les quatre outils propres au réseau. Même écriture que le parcours QR :
   le texte, puis une scène sable qui porte un mini-écran simulé. */

const panel =
  "w-full rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-30px_rgba(60,40,10,0.35)]";

function DropVisual() {
  const t = useT();
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-md bg-amber-400/20 px-2 py-1 text-[11px] font-medium text-amber-700">
          {t("Dernière minute", "Last minute")}
        </span>
        <span className="text-[12px] text-[var(--landing-ink)]/40">
          {t("ce soir", "tonight")}
        </span>
      </div>
      <p className="text-[15px] font-medium text-[var(--landing-ink)]">
        {t("Table de 6 · 23:00 · Rooftop", "Table for 6 · 23:00 · Rooftop")}
      </p>
      <p className="mt-1 text-[12px] text-[var(--landing-ink)]/55">
        {t(
          "Min. 8 000 MAD · acompte 20 % · commission 8 %",
          "Min. 8,000 MAD · 20% deposit · 8% commission"
        )}
      </p>
      <div className="mt-4 flex gap-2">
        <span className="flex-1 rounded-lg bg-[var(--landing-ink)] py-2 text-center text-[12px] font-semibold text-[var(--landing-ivory)]">
          {t("Proposer à un client", "Offer to a guest")}
        </span>
        <span className="rounded-lg bg-black/[0.06] px-3.5 py-2 text-[12px] text-[var(--landing-ink)]/60">
          {t("Passer", "Skip")}
        </span>
      </div>
    </div>
  );
}

function ReverseVisual() {
  const t = useT();
  return (
    <div className="flex flex-col gap-2.5 text-left">
      <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-[#111] p-3.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
        <p className="text-[13px] font-medium text-white">
          {t("8 personnes · restaurant festif · 23:00", "8 people · party restaurant · 23:00")}
        </p>
        <p className="mt-0.5 text-[12px] text-white/50">
          {t("Budget 12 000 MAD · client Priority", "Budget 12,000 MAD · Priority guest")}
        </p>
      </div>
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md border border-black/10 bg-white p-3.5">
        <p className="text-[13px] font-medium text-[var(--landing-ink)]">
          {t("Disponible · terrasse, 23:15", "Available · terrace, 23:15")}
        </p>
        <p className="mt-0.5 text-[12px] text-[var(--landing-ink)]/50">
          {t("2 offres reçues en 9 min", "2 offers received in 9 min")}
        </p>
      </div>
    </div>
  );
}

function PrivacyVisual() {
  const t = useT();
  return (
    <div className={`${panel} p-5 text-left`}>
      {[
        [t("Client", "Guest"), t("M. B•••••", "Mr B•••••"), true],
        [t("Téléphone", "Phone"), "+212 6•• ••• •12", true],
        [t("Couverts · heure", "Covers · time"), "6 · 23:00", false],
      ].map(([label, value, masked]) => (
        <div
          key={label as string}
          className="flex items-center justify-between border-b border-black/[0.07] py-2.5 last:border-b-0"
        >
          <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--landing-ink)]/45">
            {label}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--landing-ink)]">
            {masked && (
              <EyeOff size={12} className="text-[var(--landing-ink)]/40" />
            )}
            {value}
          </span>
        </div>
      ))}
      <p className="mt-3 text-[12px] text-[var(--landing-ink)]/45">
        {t(
          "Coordonnées révélées après confirmation uniquement",
          "Contact details revealed only after confirmation"
        )}
      </p>
    </div>
  );
}

function PassportVisual() {
  const t = useT();
  return (
    <div className="text-left">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["Marrakech", "Paris", "Saint-Tropez", t("Dubaï", "Dubai"), "Ibiza"].map(
          (city, i) => (
            <span
              key={city}
              className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                i === 0
                  ? "bg-[var(--landing-ink)] text-[var(--landing-ivory)]"
                  : "border border-black/15 bg-white text-[var(--landing-ink)]/60"
              }`}
            >
              {city}
            </span>
          )
        )}
      </div>
      <div className={`${panel} p-4`}>
        {[
          [t("Taux de présence", "Show-up rate"), t("96 %", "96%")],
          [t("Litiges", "Disputes"), t("0 sur 124 réservations", "0 in 124 reservations")],
          [t("Membre vérifié depuis", "Verified member since"), "2026"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 text-[13px]"
          >
            <span className="text-[var(--landing-ink)]/50">{label}</span>
            <span className="flex items-center gap-1.5 font-medium text-[var(--landing-ink)]">
              <Check size={12} className="text-emerald-600" />
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const getFeatures = (t: Translate): {
  title: string;
  description: string;
  visual: () => ReactElement;
}[] => [
  {
    title: t("Dernière minute", "Last minute"),
    description: t(
      "L'établissement propose la table libérée en un geste aux apporteurs les plus adaptés, avec une commission bonifiée si besoin.",
      "In one tap, the venue offers a freed-up table to the best-placed referrers, with a commission boost if needed."
    ),
    visual: DropVisual,
  },
  {
    title: t("Appel d'offres", "Open requests"),
    description: t(
      "Le premier choix est complet ? Le concierge publie une demande anonymisée, et les établissements disponibles répondent avec une offre.",
      "First choice fully booked? The concierge posts an anonymised request, and venues with availability reply with an offer."
    ),
    visual: ReverseVisual,
  },
  {
    title: t("Confidentialité client", "Guest privacy"),
    description: t(
      "Le portefeuille client d'un concierge est son fonds de commerce. Coordonnées masquées, numéro relais, divulgation après confirmation seulement.",
      "A concierge's client book is their livelihood. Masked contact details, a relay number, and disclosure only after confirmation."
    ),
    visual: PrivacyVisual,
  },
  {
    title: t("Passeport de performance", "Performance passport"),
    description: t(
      "Présence, fiabilité, litiges : une réputation transactionnelle qui suit chaque membre de ville en ville, et remplace les notes à l'emporte-pièce.",
      "Show-ups, reliability, disputes: a reputation built on real transactions that follows every member from city to city, in place of throwaway star ratings."
    ),
    visual: PassportVisual,
  },
];

export function Differentiators() {
  const t = useT();
  const FEATURES = getFeatures(t);
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <SectionHeader
          title={t(
            <>
              Pensé pour
              <br />
              <em className="font-light italic">le terrain</em>.
            </>,
            <>
              Built for
              <br />
              <em className="font-light italic">the real world</em>.
            </>
          )}
          intro={t(
            "Les outils qui manquaient entre établissements et apporteurs : la table libérée au dernier moment, l'appel d'offres, la confidentialité du client, la réputation.",
            "The tools venues and referrers were missing: last-minute tables, open requests, guest privacy and reputation."
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
              className="flex flex-col rounded-3xl border border-black/[0.08] bg-white p-3"
            >
              <div className="px-5 pb-7 pt-6 md:px-7 md:pt-8">
                <h3 className="text-[22px] font-semibold leading-snug tracking-[-0.015em] text-[var(--landing-ink)] md:text-[24px]">
                  {f.title}
                </h3>
                <p className="mt-3 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                  {f.description}
                </p>
              </div>
              <div
                className={`${STAGE} mt-auto flex h-[260px] items-center justify-center rounded-[20px] px-6 sm:h-[280px] sm:px-12`}
              >
                <div className="w-full max-w-[21rem]">
                  <f.visual />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
