"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { CONTAINER, SECTION, TITLE } from "@/components/landing/section-header";

const FAQ = [
  {
    q: "C'est quoi, TwoCards, en une phrase ?",
    a: "Le channel manager B2B des concierges et RP : nous distribuons l'inventaire des établissements à un réseau d'apporteurs vérifiés, nous attribuons chaque client, nous vérifions le revenu généré et nous automatisons les commissions.",
  },
  {
    q: "Que se passe-t-il quand un client scanne le QR ?",
    a: "Il arrive sur la sélection de l'établissement qui a posé le QR (restaurants, rooftops, clubs, expériences), aux vraies disponibilités, et réserve seul en quelques secondes. La réservation porte le QR d'origine (chambre, lobby, table, carte) et apparaît aussitôt dans le tableau de bord de l'établissement, avec les scans, les arrivées et les commissions.",
  },
  {
    q: "TwoCards remplace-t-il mon logiciel de réservation ou ma caisse ?",
    a: "Non. Votre système reste la source de vérité opérationnelle. TwoCards gère la couche commerciale entre vous et vos apporteurs (attribution, check-in, facture vérifiée, commission), au-dessus de vos outils existants.",
  },
  {
    q: "Qui peut rejoindre le réseau ?",
    a: "Des établissements (restaurants, rooftops, clubs, beach clubs, hôtels et riads) et des apporteurs vérifiés (conciergeries, concierges d'hôtel, RP, influenceurs). Chaque compte passe une vérification avant d'accéder au réseau.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Rien pendant le pilote Founding Circle à Marrakech : installation gratuite, import de votre réseau existant, rapport hebdomadaire. Le modèle payant n'est activé qu'après la preuve du retour sur investissement.",
  },
  {
    q: "Où êtes-vous disponibles ?",
    a: "Marrakech d'abord, Hivernage et Guéliz en priorité, puis Palmeraie et Agafay. Le réseau suivra ensuite les corridors de clientèle : Casablanca, Paris, Saint-Tropez, Dubaï.",
  },
  {
    q: "Comment évitez-vous les litiges de commission ?",
    a: "Les règles sont acceptées avant la première réservation : montant ou pourcentage, base de calcul, dépenses exclues, délai de paiement. Le check-in QR prouve la visite, la facture est vérifiée, et chaque étape est horodatée et auditable.",
  },
];

export function FaqHome() {
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
            Avant de nous
            <br />
            <em className="font-light italic">rejoindre</em>.
          </h2>
          <p className="mt-6 max-w-xs text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
            Une autre question ?{" "}
            <a
              href="#contact"
              className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4 hover:decoration-black/60"
            >
              Parlons-en
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
