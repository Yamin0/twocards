"use client";

import { motion } from "framer-motion";

const steps = [
  {
    title: "Demande",
    description:
      "Le concierge envoie une demande structurée : date, couverts, budget, niveau de service.",
  },
  {
    title: "Disponibilité",
    description:
      "L'établissement accepte ou contre-propose : autre heure, autre zone, autre minimum spend.",
  },
  {
    title: "Acompte",
    description:
      "Le client confirme et paie l'acompte via un lien sécurisé, aux conditions préacceptées.",
  },
  {
    title: "Confirmation",
    description:
      "La réservation est verrouillée, horodatée et attribuée à son apporteur.",
  },
  {
    title: "Arrivée",
    description:
      "Check-in QR à la porte : la preuve que l'apport a produit une visite réelle.",
  },
  {
    title: "Facture vérifiée",
    description:
      "Le montant final est validé par API, OCR ou accord mutuel entre les deux parties.",
  },
  {
    title: "Commission",
    description:
      "Calculée automatiquement sur la base convenue dès l'origine. Zéro ambiguïté.",
  },
  {
    title: "Paiement",
    description:
      "Versée selon un calendrier fixe, avec un historique auditable de bout en bout.",
  },
];

export function Journey() {
  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32 font-body">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Le parcours
          </p>
          <h2 className="font-title text-3xl font-light leading-tight text-[var(--landing-ink)] md:text-5xl">
            De WhatsApp à une transaction{" "}
            <em className="italic">certaine</em>.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] font-light leading-relaxed text-[var(--landing-ink)]/70">
            Chaque étape est horodatée et attribuée à un utilisateur. Sans
            doublon, sans litige, avec un paiement certain.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="border-t border-black/[0.08] px-1 py-8 md:px-4"
            >
              <span className="font-title text-[26px] font-light leading-none text-[var(--landing-mute)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[15px] font-medium text-[var(--landing-ink)]">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] font-light leading-relaxed text-[var(--landing-ink)]/65">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
