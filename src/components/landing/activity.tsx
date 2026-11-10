"use client";

import { motion } from "framer-motion";
import { BadgePercent, QrCode, CalendarCheck } from "lucide-react";
import DisplayCards from "@/components/ui/display-cards";
import {
  CONTAINER,
  SECTION,
  SectionHeader,
} from "@/components/landing/section-header";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* Les trois cartes empilées du parcours (réservation, check-in,
   commission), reprises telles quelles de la version précédente. Le
   dégradé de fondu (after:from-*) se fond dans l'ivoire de la page. */
const cardBase =
  "border-black/10 bg-white/80 text-[var(--landing-ink)] hover:border-black/25 hover:bg-white font-body after:from-[var(--landing-ivory)]";

/* Effet « grisé jusqu'au survol » réservé au desktop : sur mobile il n'y a
   pas de hover, les cartes arrivent donc directement en pleine couleur. */
const washed =
  "md:before:absolute md:before:w-[100%] md:before:outline-1 md:before:rounded-xl md:before:outline-border md:before:h-[100%] md:before:content-[''] md:before:bg-blend-overlay md:before:bg-background/50 md:grayscale-[100%] md:hover:before:opacity-0 md:before:transition-opacity md:before:duration-700 md:hover:grayscale-0 md:before:left-0 md:before:top-0";

const getCards = (t: Translate) => [
  {
    icon: <CalendarCheck className="size-4 text-[var(--landing-ivory)]" />,
    title: t("Réservation confirmée", "Reservation confirmed"),
    description: t("Sam. 23h · table de 4 · acompte payé", "Sat 11 pm · table for 4 · deposit paid"),
    date: t("hier, 18:42", "yesterday, 18:42"),
    iconClassName: "bg-[var(--landing-ink)]",
    titleClassName: "text-[var(--landing-ink)]",
    className: `[grid-area:stack] hover:-translate-y-10 ${washed} ${cardBase}`,
  },
  {
    icon: <QrCode className="size-4 text-[var(--landing-ivory)]" />,
    title: t("Check-in validé", "Check-in confirmed"),
    description: t("8 invités arrivés · Rooftop", "8 guests arrived · Rooftop"),
    date: t("ce soir, 23:17", "tonight, 23:17"),
    iconClassName: "bg-[var(--landing-ink)]",
    titleClassName: "text-[var(--landing-ink)]",
    className: `[grid-area:stack] translate-x-10 translate-y-10 hover:-translate-y-1 ${washed} ${cardBase}`,
  },
  {
    icon: <BadgePercent className="size-4 text-[var(--landing-ivory)]" />,
    title: t("Commission validée", "Commission validated"),
    description: t("+ 480 MAD · facture vérifiée", "+ 480 MAD · bill verified"),
    date: t("à l'instant", "just now"),
    iconClassName: "bg-[var(--landing-ink)]",
    titleClassName: "text-[var(--landing-ink)]",
    className: `[grid-area:stack] translate-x-20 translate-y-20 hover:translate-y-10 ${cardBase}`,
  },
];

const getPoints = (t: Translate) => [
  t(
    "Le concierge sait quand son client est arrivé, sans appeler la porte",
    "The concierge knows the guest has arrived, without calling the door"
  ),
  t(
    "L'établissement voit qui a généré la table avant même le service",
    "The venue sees who brought the table in before service even starts"
  ),
  t(
    "La commission apparaît validée dès que la facture est vérifiée",
    "Commission shows as validated the moment the bill is verified"
  ),
];

export function Activity() {
  const t = useT();
  const CARDS = getCards(t);
  const POINTS = getPoints(t);
  return (
    <section className={`${SECTION} overflow-x-clip`}>
      <div className={CONTAINER}>
        <SectionHeader
          title={t(
            <>
              Votre soirée se déroule.
              <br />
              <em className="font-light italic">
                Vous êtes déjà au courant.
              </em>
            </>,
            <>
              The night unfolds.
              <br />
              <em className="font-light italic">
                You already know.
              </em>
            </>
          )}
          intro={t(
            "Confirmation, arrivée du client, validation de la facture : chaque étape vous est notifiée à l'instant où elle se produit. Côté concierge comme côté établissement, plus personne ne relance personne.",
            "Confirmation, guest arrival, bill verified: you're notified of every step the moment it happens. Concierges and venues alike, nobody has to chase anybody any more."
          )}
        />
      </div>

      {/* grid-cols-1 explicite : sans lui la colonne se dimensionne sur le
          min-content des cartes (352 px en dur) et rogne le texte en mobile. */}
      <div
        className={`${CONTAINER} grid grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-12`}
      >
        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="order-2 max-w-md md:order-1"
        >
          {POINTS.map((point) => (
            <li
              key={point}
              className="border-t border-black/[0.1] py-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/80 last:border-b"
            >
              {point}
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="order-1 flex justify-center pb-16 md:order-2 md:justify-end md:pr-8"
        >
          <div className="w-full max-w-[26rem]">
            <DisplayCards cards={CARDS} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
