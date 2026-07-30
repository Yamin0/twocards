"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const QUOTE =
  "Une réservation issue d'un concierge doit passer de WhatsApp à une transaction traçable, sans doublon, sans litige et avec un paiement certain. TwoCards gère la relation commerciale entre l'établissement et l'apporteur d'affaires, du premier message jusqu'à la commission payée.";

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
  const opacity = useTransform(progress, [start, end], [0.2, 1]);
  const color = useTransform(
    progress,
    [start, end],
    ["hsl(0 0% 35%)", "hsl(0 0% 100%)"]
  );

  return (
    <motion.span style={{ opacity, color }} className="mr-[0.3em]">
      {word}
    </motion.span>
  );
}

export function Testimonial() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"],
  });

  const words = QUOTE.split(" ");

  return (
    <section className="flex min-h-screen items-center bg-black px-8 py-24 md:px-28 md:py-32 font-[family-name:var(--font-inter)]">
      <div
        ref={containerRef}
        className="mx-auto flex max-w-3xl flex-col items-start gap-10"
      >
        <span className="font-[family-name:var(--font-instrument-serif)] text-7xl italic leading-none text-white/40">
          &ldquo;
        </span>

        <p className="flex flex-wrap text-4xl font-medium leading-[1.2] md:text-5xl">
          {words.map((word, i) => (
            <Word
              key={i}
              word={word}
              index={i}
              total={words.length}
              progress={scrollYProgress}
            />
          ))}
          <span className="ml-2 text-white/65">&rdquo;</span>
        </p>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-white/5">
            <Image
              src="/logo-cards-transp.png"
              alt="twocards."
              width={28}
              height={28}
              className="h-7 w-auto brightness-0 invert"
            />
          </div>
          <div>
            <p className="text-base font-semibold leading-7 text-white">
              La mission TwoCards
            </p>
            <p className="text-sm font-normal leading-5 text-white/65">
              L&apos;infrastructure de la recommandation hospitality
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
