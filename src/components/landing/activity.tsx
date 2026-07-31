"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgePercent, QrCode, CalendarCheck } from "lucide-react";
import DisplayCards from "@/components/ui/display-cards";

const cardBase =
  "border-black/10 bg-white/80 text-[var(--landing-ink)] hover:border-black/25 hover:bg-white after:from-[var(--landing-ivory)] font-body";

const activityCards = [
  {
    icon: <CalendarCheck className="size-4 text-[var(--landing-ivory)]" />,
    title: "Réservation confirmée",
    description: "Sam. 23h · table de 4 · acompte payé",
    date: "hier, 18:42",
    iconClassName: "bg-[var(--landing-ink)]",
    titleClassName: "text-[var(--landing-ink)]",
    className: `[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 ${cardBase}`,
  },
  {
    icon: <QrCode className="size-4 text-[var(--landing-ivory)]" />,
    title: "Check-in validé",
    description: "8 invités arrivés · Rooftop, Hivernage",
    date: "ce soir, 23:17",
    iconClassName: "bg-[var(--landing-ink)]",
    titleClassName: "text-[var(--landing-ink)]",
    className: `[grid-area:stack] translate-x-10 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 ${cardBase}`,
  },
  {
    icon: <BadgePercent className="size-4 text-[var(--landing-ivory)]" />,
    title: "Commission validée",
    description: "+ 480 MAD · facture vérifiée",
    date: "à l'instant",
    iconClassName: "bg-[var(--landing-ink)]",
    titleClassName: "text-[var(--landing-ink)]",
    className: `[grid-area:stack] translate-x-20 translate-y-20 hover:translate-y-10 ${cardBase}`,
  },
];

export function Activity() {
  return (
    <section className="overflow-x-clip border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32 font-body">
      <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2 md:gap-12">
        {/* Moitié gauche — éditorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            En temps réel
          </p>
          <h2 className="mb-6 font-title text-3xl font-light leading-tight text-[var(--landing-ink)] md:text-4xl">
            Votre soirée se déroule.
            <br />
            <em className="italic">Vous êtes déjà au courant.</em>
          </h2>
          <p className="mb-8 max-w-md text-[15px] font-light leading-relaxed text-[var(--landing-ink)]/70">
            Chaque événement du parcours — confirmation, arrivée du client,
            validation de la facture, commission — vous est notifié à l&apos;instant
            où il se produit. Côté concierge comme côté établissement, plus
            personne ne relance personne : l&apos;information arrive d&apos;elle-même.
          </p>

          <ul className="mb-10 flex max-w-md flex-col">
            {[
              "Le concierge sait quand son client est arrivé — sans appeler la porte",
              "L'établissement voit qui a généré la table avant même le service",
              "La commission apparaît validée dès que la facture est vérifiée",
            ].map((point) => (
              <li
                key={point}
                className="border-t border-black/[0.08] py-3.5 text-[14px] font-light leading-relaxed text-[var(--landing-ink)]/80 last:border-b"
              >
                {point}
              </li>
            ))}
          </ul>

          <Link
            href="/signup?role=concierge"
            className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]"
          >
            Recevoir mes commissions dans TwoCards
            <ArrowRight
              size={14}
              strokeWidth={1.5}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.div>

        {/* Moitié droite — cartes empilées */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="flex justify-center pb-16 md:justify-end md:pr-8"
        >
          <div className="w-full max-w-[26rem]">
            <DisplayCards cards={activityCards} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
