"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useT } from "@/lib/i18n/client";

const QUOTE_FR =
  "Une réservation issue d'un concierge doit passer de WhatsApp à une transaction traçable, sans doublon, sans litige et avec un paiement certain. TwoCards gère la relation commerciale entre l'établissement et l'apporteur d'affaires, du premier message jusqu'à la commission payée.";
const QUOTE_EN =
  "A concierge booking should move from WhatsApp to a traceable transaction: no duplicates, no disputes, guaranteed payment. TwoCards manages the commercial relationship between venue and referrer, from the first message to the commission paid.";

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0.25, 1]);
  const color = useTransform(
    progress,
    [start, end],
    ["hsl(40 8% 78%)", "hsl(0 0% 5%)"]
  );

  return (
    <motion.span style={{ opacity, color }} className="mr-[0.28em]">
      {word}
    </motion.span>
  );
}

export function Testimonial() {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"],
  });

  const words = t(QUOTE_FR, QUOTE_EN).split(" ");

  return (
    <section className="flex min-h-screen items-center bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32">
      <div
        ref={containerRef}
        className="mx-auto flex max-w-3xl flex-col items-start gap-12"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)] font-body">
          {t("Notre conviction", "What we believe")}
        </p>

        <p className="flex flex-wrap font-title text-[26px] font-normal leading-[1.35] md:text-[36px]">
          {words.map((word, i) => (
            <Word
              key={i}
              word={word}
              index={i}
              total={words.length}
              progress={scrollYProgress}
            />
          ))}
        </p>

        <div className="flex items-center gap-5 font-body">
          <span className="h-px w-12 bg-black/20" />
          <div>
            <p className="text-sm font-medium text-[var(--landing-ink)]">
              {t("La mission TwoCards", "The TwoCards mission")}
            </p>
            <p className="text-[13px] font-normal text-[var(--landing-mute)]">
              {t(
                "L'infrastructure de la recommandation hospitality",
                "The infrastructure for hospitality referrals"
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
