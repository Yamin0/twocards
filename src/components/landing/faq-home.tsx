"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const FAQ = [
  {
    q: "C'est quoi, TwoCards, en une phrase ?",
    a: "Le channel manager B2B des concierges et RP : nous distribuons l'inventaire des établissements à un réseau d'apporteurs vérifiés, nous attribuons chaque client, nous vérifions le revenu généré et nous automatisons les commissions.",
  },
  {
    q: "TwoCards remplace-t-il mon logiciel de réservation ou ma caisse ?",
    a: "Non. Votre système reste la source de vérité opérationnelle. TwoCards gère la couche commerciale entre vous et vos apporteurs — attribution, check-in, facture vérifiée, commission — au-dessus de vos outils existants.",
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
    a: "Marrakech d'abord — Hivernage et Guéliz en priorité, puis Palmeraie et Agafay. Le réseau suivra ensuite les corridors de clientèle : Casablanca, Paris, Saint-Tropez, Dubaï.",
  },
  {
    q: "Comment évitez-vous les litiges de commission ?",
    a: "Les règles sont acceptées avant la première réservation : montant ou pourcentage, base de calcul, dépenses exclues, délai de paiement. Le check-in QR prouve la visite, la facture est vérifiée, et chaque étape est horodatée et auditable.",
  },
];

export function FaqHome() {
  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32 font-body">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Questions fréquentes
          </p>
          <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-4xl">
            Avant de nous <em className="italic">rejoindre</em>.
          </h2>
        </motion.div>

        <div className="flex flex-col">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group border-t border-black/[0.08] last:border-b"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15px] font-medium text-[var(--landing-ink)] [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  size={16}
                  strokeWidth={1.5}
                  className="shrink-0 text-[var(--landing-mute)] transition-transform duration-300 group-open:rotate-45"
                />
              </summary>
              <p className="pb-6 pr-10 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
