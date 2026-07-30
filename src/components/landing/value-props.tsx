"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Handshake, ArrowRight } from "lucide-react";

const audiences = [
  {
    id: "etablissements",
    icon: Building2,
    label: "Établissements",
    title: "Remplissez les bonnes tables.",
    accent: "Mesurez chaque apporteur.",
    description:
      "Centralisez les réservations que vous recevez déjà sur WhatsApp, sachez exactement qui génère du revenu et supprimez les litiges de commission.",
    points: [
      "Inventaire alloué au réseau — vous gardez le contrôle de vos tables",
      "Check-in QR : la preuve que l'apport a produit une visite",
      "Factures vérifiées et commissions calculées automatiquement",
      "Compatible avec vos outils existants, sans rien remplacer",
    ],
    cta: { label: "Rejoindre en tant qu'établissement", href: "/signup" },
  },
  {
    id: "concierges",
    icon: Handshake,
    label: "Concierges & RP",
    title: "Confirmez vos clients plus vite.",
    accent: "Suivez tout votre argent.",
    description:
      "Une seule application pour connaître les conditions, réserver, prouver votre apport et suivre chaque commission jusqu'au paiement.",
    points: [
      "Disponibilités et conditions à jour, sans allers-retours",
      "Contre-propositions instantanées quand le créneau est complet",
      "Lien client sécurisé : confirmation, acompte et demandes spéciales",
      "Commission tracée dès l'origine, payée selon un calendrier fixe",
    ],
    cta: { label: "Rejoindre en tant que concierge / RP", href: "/signup?role=concierge" },
  },
];

export function ValueProps() {
  return (
    <section
      id="solutions"
      className="bg-black px-8 py-24 md:px-28 md:py-32 font-[family-name:var(--font-inter)]"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center text-4xl font-medium leading-tight tracking-[-1px] text-white md:text-5xl"
        >
          Deux côtés du réseau.
          <br />
          Une seule{" "}
          <span className="font-[family-name:var(--font-instrument-serif)] font-normal italic">
            source de vérité
          </span>
          .
        </motion.h2>

        <div className="grid gap-6 md:grid-cols-2">
          {audiences.map((audience, i) => (
            <motion.div
              key={audience.id}
              id={audience.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="landing-glass flex flex-col rounded-2xl p-8 md:p-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <audience.icon size={20} strokeWidth={1.5} className="text-white" />
                </span>
                <span className="text-sm font-medium uppercase tracking-widest text-white/65">
                  {audience.label}
                </span>
              </div>

              <h3 className="mb-4 text-2xl font-medium leading-snug text-white md:text-3xl">
                {audience.title}{" "}
                <span className="font-[family-name:var(--font-instrument-serif)] font-normal italic">
                  {audience.accent}
                </span>
              </h3>

              <p className="mb-8 text-base leading-relaxed text-white/65">
                {audience.description}
              </p>

              <ul className="mb-10 flex flex-col gap-3">
                {audience.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-white/80">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/60" />
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href={audience.cta.href}
                className="group mt-auto inline-flex items-center gap-2 text-sm font-semibold text-white"
              >
                {audience.cta.label}
                <ArrowRight
                  size={16}
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
