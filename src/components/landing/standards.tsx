"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

const getStandards = (t: Translate) => [
  {
    value: "< 10 min",
    label: t(
      "de réponse médiane exigée des établissements",
      "median response time required of venues"
    ),
  },
  {
    value: t("> 85 %", "> 85%"),
    label: t(
      "de présence constatée pour rester dans le réseau",
      "verified show-up rate to stay in the network"
    ),
  },
  {
    value: t("100 %", "100%"),
    label: t(
      "des commissions calculées sur facture vérifiée",
      "of commissions calculated on a verified bill"
    ),
  },
  {
    value: t("< 15 jours", "< 15 days"),
    label: t(
      "entre la facture validée et la commission payée",
      "from validated bill to commission paid"
    ),
  },
];

export function Standards() {
  const t = useT();
  const STANDARDS = getStandards(t);
  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-28 font-body">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            {t("Les standards du réseau", "Network standards")}
          </p>
          <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-4xl">
            {t(
              <>Ce que nous exigeons, <em className="italic">des deux côtés</em>.</>,
              <>What we expect, <em className="italic">on both sides</em>.</>
            )}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {STANDARDS.map((s, i) => (
            <motion.div
              key={s.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border-t border-black/[0.08] px-1 py-8 md:px-6"
            >
              <p className="font-title text-4xl font-normal tracking-tight text-[var(--landing-ink)] md:text-5xl">
                {s.value}
              </p>
              <p className="mt-3 max-w-[220px] text-[13px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-[12px] font-normal text-[var(--landing-mute)]">
          {t(
            "Objectifs contractuels du réseau, suivis en continu pendant le pilote Marrakech, pas des moyennes marketing.",
            "Contractual network targets, tracked continuously during the Marrakech pilot. Not marketing averages."
          )}
        </p>
      </div>
    </section>
  );
}
