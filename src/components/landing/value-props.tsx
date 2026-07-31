"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const audiences = [
  {
    id: "etablissements",
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
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Salle de restaurant élégante",
    cta: { label: "Rejoindre en tant qu'établissement", href: "/signup" },
  },
  {
    id: "concierges",
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
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Cocktail servi au bar",
    cta: {
      label: "Rejoindre en tant que concierge / RP",
      href: "/signup?role=concierge",
    },
  },
];

export function ValueProps() {
  return (
    <section
      id="solutions"
      className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32 font-body"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Deux côtés du réseau
          </p>
          <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-5xl">
            Une seule <em className="italic">source de vérité</em>.
          </h2>
        </motion.div>

        <div className="grid gap-16 md:grid-cols-2 md:gap-12">
          {audiences.map((audience, i) => (
            <motion.article
              key={audience.id}
              id={audience.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="flex flex-col"
            >
              <div className="mb-8 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={audience.image}
                  alt={audience.imageAlt}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>

              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
                {audience.label}
              </p>

              <h3 className="mb-5 font-title text-2xl font-normal leading-snug text-[var(--landing-ink)] md:text-3xl">
                {audience.title} <em className="italic">{audience.accent}</em>
              </h3>

              <p className="mb-8 text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70">
                {audience.description}
              </p>

              <ul className="mb-10 flex flex-col">
                {audience.points.map((point) => (
                  <li
                    key={point}
                    className="border-t border-black/[0.08] py-3.5 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/80 last:border-b"
                  >
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href={audience.cta.href}
                className="group mt-auto inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]"
              >
                {audience.cta.label}
                <ArrowRight
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
