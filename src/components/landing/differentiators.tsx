"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { EyeOff, Check } from "lucide-react";

/* Mini-visuels simulés, style écran sombre.
   Posés sur une carte en verre sombre (onDark), ils reçoivent un liseré
   clair : sans lui les panneaux noirs se confondraient avec la carte. */

type VisualProps = { onDark?: boolean };

const darkPanel = (onDark: boolean) =>
  `rounded-2xl bg-[#111] ${
    onDark
      ? "border border-white/15"
      : "shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]"
  }`;

const lightPanel = "rounded-2xl border border-black/10 bg-white";

function DropVisual() {
  return (
    <div className={`${lightPanel} p-4 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          Dernière minute
        </span>
        <span className="text-[10px] text-[var(--landing-ink)]/40">
          ce soir
        </span>
      </div>
      <p className="text-[13px] font-medium text-[var(--landing-ink)]">
        Table de 6 · 23:00 · Rooftop
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--landing-ink)]/55">
        Min. 8 000 MAD · acompte 20 % · commission 8 %
      </p>
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-lg bg-[var(--landing-ink)] py-1.5 text-center text-[11px] font-semibold text-[var(--landing-ivory)]">
          Proposer à un client
        </span>
        <span className="rounded-lg bg-black/[0.06] px-3 py-1.5 text-[11px] text-[var(--landing-ink)]/60">
          Passer
        </span>
      </div>
    </div>
  );
}

function ReverseVisual({ onDark = false }: VisualProps) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <div
        className={`max-w-[85%] self-start rounded-bl-md p-3 ${darkPanel(onDark)}`}
      >
        <p className="text-[11px] font-medium text-white">
          8 personnes · restaurant festif · 23:00
        </p>
        <p className="text-[10px] text-white/50">
          Budget 12 000 MAD · client Priority
        </p>
      </div>
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md border border-black/10 bg-white p-3">
        <p className="text-[11px] font-medium text-[var(--landing-ink)]">
          Disponible · terrasse, 23:15
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
    <div className={`${lightPanel} p-4 text-left`}>
      {[
        ["Client", "M. B•••••", true],
        ["Téléphone", "+212 6•• ••• •12", true],
        ["Couverts · heure", "6 · 23:00", false],
      ].map(([label, value, masked]) => (
        <div
          key={label as string}
          className="flex items-center justify-between border-b border-black/[0.07] py-2 last:border-b-0"
        >
          <span className="text-[10px] uppercase tracking-wide text-[var(--landing-ink)]/45">
            {label}
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--landing-ink)]">
            {masked && (
              <EyeOff size={11} className="text-[var(--landing-ink)]/40" />
            )}
            {value}
          </span>
        </div>
      ))}
      <p className="mt-2.5 text-[10px] text-[var(--landing-ink)]/45">
        Coordonnées révélées après confirmation uniquement
      </p>
    </div>
  );
}

function PassportVisual({ onDark = false }: VisualProps) {
  return (
    <div className="text-left">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {["Marrakech", "Paris", "Saint-Tropez", "Dubaï", "Ibiza"].map(
          (city, i) => (
            <span
              key={city}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                i === 0
                  ? onDark
                    ? "bg-white text-black"
                    : "bg-[var(--landing-ink)] text-[var(--landing-ivory)]"
                  : onDark
                    ? "border border-white/30 text-white"
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

/* Type explicite : les visuels clairs n'ont pas besoin de onDark, mais le
   point d'appel le transmet uniformément aux quatre. */
const FEATURES: {
  title: string;
  description: string;
  visual: (props: VisualProps) => ReactElement;
}[] = [
  {
    title: "Dernière minute",
    description:
      "L'établissement propose la table libérée en un geste aux apporteurs les plus adaptés, avec une commission bonifiée si besoin.",
    visual: DropVisual,
  },
  {
    title: "Appel d'offres",
    description:
      "Le premier choix est complet ? Le concierge publie une demande anonymisée, et les établissements disponibles répondent avec une offre.",
    visual: ReverseVisual,
  },
  {
    title: "Confidentialité client",
    description:
      "Le portefeuille client d'un concierge est son fonds de commerce. Coordonnées masquées, numéro relais, divulgation après confirmation seulement.",
    visual: PrivacyVisual,
  },
  {
    title: "Passeport de performance",
    description:
      "Présence, fiabilité, litiges : une réputation transactionnelle qui suit chaque membre de ville en ville, et remplace les notes à l'emporte-pièce.",
    visual: PassportVisual,
  },
];

export function Differentiators({
  variant = "light",
}: {
  variant?: "light" | "overlay";
}) {
  const onVideo = variant === "overlay";

  return (
    <section
      className={`px-6 font-body ${
        onVideo
          ? "bg-transparent py-16 md:px-16 md:py-20"
          : "border-t border-black/[0.06] bg-[var(--landing-ivory)] py-24 md:px-16 md:py-32"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        {/* Sans carte, ce sont les gouttières qui séparent les blocs */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            onVideo ? "gap-14 md:gap-x-16 md:gap-y-20" : "gap-5"
          }`}
        >
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
              /* Sur la vidéo : aucun habillage. Ni fond, ni bordure, ni flou —
                 le contenu est posé à même l'image. Seule l'ombre portée du
                 texte (.text-on-video) assure la lisibilité, faute de carte. */
              className={`flex flex-col justify-between gap-8 ${
                onVideo
                  ? ""
                  : "rounded-2xl border border-black/[0.08] bg-white/50 p-7 md:p-9"
              }`}
            >
              <div>
                <h3
                  className={`mb-4 font-title text-xl font-normal ${
                    onVideo
                      ? "text-on-video text-white"
                      : "text-[var(--landing-ink)]"
                  }`}
                >
                  {f.title}
                </h3>
                <p
                  className={`text-[14px] font-normal leading-relaxed ${
                    onVideo
                      ? "text-on-video text-white"
                      : "text-[var(--landing-ink)]/70"
                  }`}
                >
                  {f.description}
                </p>
              </div>
              <div className="mx-auto w-full max-w-xs">
                <f.visual onDark={onVideo} />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
