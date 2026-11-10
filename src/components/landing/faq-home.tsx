"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { CONTAINER, SECTION, TITLE } from "@/components/landing/section-header";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

const getFaq = (t: Translate) => [
  {
    q: t("C'est quoi, TwoCards, en une phrase ?", "What is TwoCards, in one sentence?"),
    a: t(
      "Le channel manager B2B des concierges et RP : nous distribuons l'inventaire des établissements à un réseau d'apporteurs vérifiés, nous attribuons chaque client, nous vérifions le revenu généré et nous automatisons les commissions.",
      "The B2B channel manager for concierges and PRs: we distribute venue inventory to a network of verified referrers, attribute every guest, verify the revenue generated and automate commissions."
    ),
  },
  {
    q: t("Que se passe-t-il quand un client scanne le QR ?", "What happens when a guest scans the QR?"),
    a: t(
      "Il arrive sur la sélection de l'établissement qui a posé le QR (restaurants, rooftops, clubs, expériences), aux vraies disponibilités, et réserve seul en quelques secondes. La réservation porte le QR d'origine (chambre, lobby, table, carte) et apparaît aussitôt dans le tableau de bord de l'établissement, avec les scans, les arrivées et les commissions.",
      "They land on the curated selection of the property that placed the QR (restaurants, rooftops, clubs, experiences), with real availability, and book on their own in seconds. The reservation carries its original QR (room, lobby, table, menu) and appears instantly in the property's dashboard, alongside scans, arrivals and commissions."
    ),
  },
  {
    q: t(
      "TwoCards remplace-t-il mon logiciel de réservation ou ma caisse ?",
      "Does TwoCards replace my booking software or my POS?"
    ),
    a: t(
      "Non. Votre système reste la source de vérité opérationnelle. TwoCards gère la couche commerciale entre vous et vos apporteurs (attribution, check-in, facture vérifiée, commission), au-dessus de vos outils existants.",
      "No. Your system remains your operational source of truth. TwoCards runs the commercial layer between you and your referrers (attribution, check-in, verified bill, commission), on top of the tools you already use."
    ),
  },
  {
    q: t("Qui peut rejoindre le réseau ?", "Who can join the network?"),
    a: t(
      "Des établissements (restaurants, rooftops, clubs, beach clubs, hôtels et riads) et des apporteurs vérifiés (conciergeries, concierges d'hôtel, RP, influenceurs). Chaque compte passe une vérification avant d'accéder au réseau.",
      "Venues (restaurants, rooftops, clubs, beach clubs, hotels and riads) and verified referrers (concierge services, hotel concierges, PRs, influencers). Every account is verified before it can access the network."
    ),
  },
  {
    q: t("Combien ça coûte ?", "How much does it cost?"),
    a: t(
      "Rien pendant le pilote Founding Circle à Marrakech : installation gratuite, import de votre réseau existant, rapport hebdomadaire. Le modèle payant n'est activé qu'après la preuve du retour sur investissement.",
      "Nothing during the Founding Circle pilot in Marrakech: free setup, import of your existing network, a weekly report. Paid plans only kick in once the return on investment is proven."
    ),
  },
  {
    q: t("Où êtes-vous disponibles ?", "Where are you available?"),
    a: t(
      "Marrakech d'abord, Hivernage et Guéliz en priorité, puis Palmeraie et Agafay. Le réseau suivra ensuite les corridors de clientèle : Casablanca, Paris, Saint-Tropez, Dubaï.",
      "Marrakech first, starting with Hivernage and Guéliz, then the Palmeraie and Agafay. The network will then follow where guests travel: Casablanca, Paris, Saint-Tropez, Dubai."
    ),
  },
  {
    q: t("Comment évitez-vous les litiges de commission ?", "How do you prevent commission disputes?"),
    a: t(
      "Les règles sont acceptées avant la première réservation : montant ou pourcentage, base de calcul, dépenses exclues, délai de paiement. Le check-in QR prouve la visite, la facture est vérifiée, et chaque étape est horodatée et auditable.",
      "The rules are agreed before the first reservation: fixed amount or percentage, calculation basis, excluded spend, payment terms. The QR check-in proves the visit, the bill is verified, and every step is timestamped and auditable."
    ),
  },
];

export function FaqHome() {
  const t = useT();
  const FAQ = getFaq(t);
  return (
    <section className={SECTION}>
      <div
        className={`${CONTAINER} grid gap-12 md:grid-cols-[1fr_1.5fr] md:gap-20`}
      >
        {/* Le titre reste à l'écran pendant qu'on parcourt les questions. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="md:sticky md:top-28 md:self-start"
        >
          <h2 className={TITLE}>
            {t(
              <>
                Avant de nous
                <br />
                <em className="font-light italic">rejoindre</em>.
              </>,
              <>
                Before you
                <br />
                <em className="font-light italic">join us</em>.
              </>
            )}
          </h2>
          <p className="mt-6 max-w-xs text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
            {t("Une autre question ?", "Another question?")}{" "}
            <a
              href="#contact"
              className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4 hover:decoration-black/60"
            >
              {t("Parlons-en", "Let's talk")}
            </a>
            .
          </p>
        </motion.div>

        <div className="flex flex-col">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group border-t border-black/[0.1] last:border-b"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-medium text-[var(--landing-ink)] md:text-[18px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0 text-[var(--landing-mute)] transition-transform duration-300 group-open:rotate-45"
                />
              </summary>
              <p className="-mt-1 pb-7 pr-10 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
