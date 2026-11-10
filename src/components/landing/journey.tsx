"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

const getSteps = (t: Translate) => [
  {
    title: t("Demande", "Request"),
    description: t(
      "Le concierge envoie une demande structurée : date, couverts, budget, niveau de service.",
      "The concierge sends a structured request: date, covers, budget, level of service."
    ),
  },
  {
    title: t("Disponibilité", "Availability"),
    description: t(
      "L'établissement accepte ou contre-propose : autre heure, autre zone, autre minimum spend.",
      "The venue accepts or counter-offers: another time, another area, another minimum spend."
    ),
  },
  {
    title: t("Acompte", "Deposit"),
    description: t(
      "Le client confirme et paie l'acompte via un lien sécurisé, aux conditions préacceptées.",
      "The guest confirms and pays the deposit through a secure link, on pre-agreed terms."
    ),
  },
  {
    title: t("Confirmation", "Confirmation"),
    description: t(
      "La réservation est verrouillée, horodatée et attribuée à son apporteur.",
      "The reservation is locked in, timestamped and attributed to its referrer."
    ),
  },
  {
    title: t("Arrivée", "Arrival"),
    description: t(
      "Check-in QR à la porte : la preuve que l'apport a produit une visite réelle.",
      "QR check-in at the door: proof that the referral turned into a real visit."
    ),
  },
  {
    title: t("Facture vérifiée", "Verified bill"),
    description: t(
      "Le montant final est validé par API, OCR ou accord mutuel entre les deux parties.",
      "The final amount is validated by API, OCR or mutual agreement between both parties."
    ),
  },
  {
    title: t("Commission", "Commission"),
    description: t(
      "Calculée automatiquement sur la base convenue dès l'origine. Zéro ambiguïté.",
      "Calculated automatically on the basis agreed from the outset. Zero ambiguity."
    ),
  },
  {
    title: t("Paiement", "Payout"),
    description: t(
      "Versée selon un calendrier fixe, avec un historique auditable de bout en bout.",
      "Paid on a fixed schedule, with an end-to-end auditable history."
    ),
  },
];

export function Journey() {
  const t = useT();
  const steps = getSteps(t);
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
            {t("Le parcours", "The journey")}
          </p>
          <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-5xl">
            {t(
              <>
                De WhatsApp à une transaction{" "}
                <em className="italic">certaine</em>.
              </>,
              <>
                From WhatsApp to a transaction{" "}
                <em className="italic">you can trust</em>.
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70">
            {t(
              "Chaque étape est horodatée et attribuée à un utilisateur. Sans doublon, sans litige, avec un paiement certain.",
              "Every step is timestamped and attributed to a user. No duplicates, no disputes, guaranteed payment."
            )}
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
              <span className="font-title text-[26px] font-normal leading-none text-[var(--landing-mute)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-[15px] font-medium text-[var(--landing-ink)]">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
