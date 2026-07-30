"use client";

import { motion } from "framer-motion";

const steps = [
  {
    title: "Demande",
    description: "Le concierge envoie une demande structurée : date, couverts, budget, niveau de service.",
  },
  {
    title: "Disponibilité",
    description: "L'établissement accepte ou contre-propose : autre heure, autre zone, autre minimum spend.",
  },
  {
    title: "Acompte",
    description: "Le client confirme et paie l'acompte via un lien sécurisé, aux conditions préacceptées.",
  },
  {
    title: "Confirmation",
    description: "La réservation est verrouillée, horodatée et attribuée à son apporteur.",
  },
  {
    title: "Arrivée",
    description: "Check-in QR à la porte : la preuve que l'apport a produit une visite réelle.",
  },
  {
    title: "Facture vérifiée",
    description: "Le montant final est validé par API, OCR ou accord mutuel entre les deux parties.",
  },
  {
    title: "Commission",
    description: "Calculée automatiquement sur la base convenue dès l'origine. Zéro ambiguïté.",
  },
  {
    title: "Paiement",
    description: "Versée selon un calendrier fixe, avec un historique auditable de bout en bout.",
  },
];

export function Journey() {
  return (
    <section className="bg-black px-8 py-24 md:px-28 md:py-32 font-[family-name:var(--font-inter)]">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-medium leading-tight tracking-[-1px] text-white md:text-5xl">
            De WhatsApp à une transaction{" "}
            <span className="font-[family-name:var(--font-instrument-serif)] font-normal italic">
              certaine
            </span>
            .
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/65">
            Chaque étape est horodatée et attribuée à un utilisateur. Sans
            doublon, sans litige, avec un paiement certain.
          </p>
        </motion.div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="bg-black p-6 md:p-8"
            >
              <span className="font-[family-name:var(--font-instrument-serif)] text-3xl italic text-white/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
