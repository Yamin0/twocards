"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgePercent, QrCode, CalendarCheck } from "lucide-react";
import DisplayCards from "@/components/ui/display-cards";

type Variant = "light" | "overlay";

/* Les cartes gardent exactement la même teinte dans les deux variantes.
   Seul le dégradé de fondu (after:from-*) change : conçu pour se fondre
   dans l'ivoire de la page, il peindrait un coin ivoire sur la vidéo. */
function buildCards(variant: Variant) {
  const cardBase = [
    "border-black/10 bg-white/80 text-[var(--landing-ink)]",
    "hover:border-black/25 hover:bg-white font-body",
    variant === "overlay"
      ? "after:from-transparent"
      : "after:from-[var(--landing-ivory)]",
  ].join(" ");

  const washed =
    "before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0";

  return [
    {
      icon: <CalendarCheck className="size-4 text-[var(--landing-ivory)]" />,
      title: "Réservation confirmée",
      description: "Sam. 23h · table de 4 · acompte payé",
      date: "hier, 18:42",
      iconClassName: "bg-[var(--landing-ink)]",
      titleClassName: "text-[var(--landing-ink)]",
      className: `[grid-area:stack] hover:-translate-y-10 ${washed} ${cardBase}`,
    },
    {
      icon: <QrCode className="size-4 text-[var(--landing-ivory)]" />,
      title: "Check-in validé",
      description: "8 invités arrivés · Rooftop",
      date: "ce soir, 23:17",
      iconClassName: "bg-[var(--landing-ink)]",
      titleClassName: "text-[var(--landing-ink)]",
      className: `[grid-area:stack] translate-x-10 translate-y-10 hover:-translate-y-1 ${washed} ${cardBase}`,
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
}

const POINTS = [
  "Le concierge sait quand son client est arrivé — sans appeler la porte",
  "L'établissement voit qui a généré la table avant même le service",
  "La commission apparaît validée dès que la facture est vérifiée",
];

export function Activity({ variant = "light" }: { variant?: Variant }) {
  const onVideo = variant === "overlay";

  return (
    <section
      className={`relative overflow-x-clip px-6 font-body ${
        onVideo
          ? "bg-transparent py-28 md:px-16 md:py-36"
          : "border-t border-black/[0.06] bg-[var(--landing-ivory)] py-24 md:px-16 md:py-32"
      }`}
    >
      {/* Voile solidaire de la section : il assombrit la vidéo juste derrière
          le texte, laisse l'image respirer côté cartes, et se fond en haut et
          en bas pour ne créer aucune bande visible. */}
      {onVideo && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -inset-y-24 bg-black/60 [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] md:bg-[linear-gradient(to_right,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.72)_42%,rgba(0,0,0,0.34)_70%,rgba(0,0,0,0.12)_100%)]"
        />
      )}

      {/* grid-cols-1 explicite : sans lui la colonne se dimensionne sur le
          min-content des cartes (352 px en dur) et rogne le texte en mobile. */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-12">
        {/* Moitié gauche — éditorial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <p
            className={`mb-4 text-[11px] font-medium uppercase tracking-[0.28em] ${
              onVideo ? "text-white/60" : "text-[var(--landing-mute)]"
            }`}
          >
            En temps réel
          </p>
          <h2
            className={`mb-6 font-title text-3xl font-normal leading-tight md:text-4xl ${
              onVideo
                ? "text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.45)]"
                : "text-[var(--landing-ink)]"
            }`}
          >
            Votre soirée se déroule.
            <br />
            <em className="italic">Vous êtes déjà au courant.</em>
          </h2>
          <p
            className={`mb-8 max-w-md text-[15px] font-normal leading-relaxed ${
              onVideo ? "text-white/80" : "text-[var(--landing-ink)]/70"
            }`}
          >
            Chaque événement du parcours — confirmation, arrivée du client,
            validation de la facture, commission — vous est notifié à
            l&apos;instant où il se produit. Côté concierge comme côté
            établissement, plus personne ne relance personne :
            l&apos;information arrive d&apos;elle-même.
          </p>

          <ul className="mb-10 flex max-w-md flex-col">
            {POINTS.map((point) => (
              <li
                key={point}
                className={`py-3.5 text-[14px] font-normal leading-relaxed last:border-b ${
                  onVideo
                    ? "border-t border-white/20 text-white/85"
                    : "border-t border-black/[0.08] text-[var(--landing-ink)]/80"
                }`}
              >
                {point}
              </li>
            ))}
          </ul>

          <Link
            href="/signup?role=concierge"
            className={`group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] ${
              onVideo ? "text-white" : "text-[var(--landing-ink)]"
            }`}
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
            <DisplayCards cards={buildCards(variant)} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
