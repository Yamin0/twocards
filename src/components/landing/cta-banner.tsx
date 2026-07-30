"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section
      id="contact"
      className="bg-black px-8 py-24 md:px-28 md:py-32 font-[family-name:var(--font-inter)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <div className="landing-glass mb-6 flex items-center gap-2 rounded-lg px-3 py-2">
          <span className="rounded-md bg-white px-2 py-0.5 text-sm font-medium text-black">
            Founding Circle
          </span>
          <span className="text-sm font-medium text-white/65">
            Marrakech — places limitées
          </span>
        </div>

        <h2 className="mb-4 text-4xl font-medium leading-tight tracking-[-1px] text-white md:text-6xl">
          Digitalisez les relations qui{" "}
          <span className="font-[family-name:var(--font-instrument-serif)] font-normal italic">
            existent déjà
          </span>
          .
        </h2>

        <p
          className="mb-8 max-w-xl text-lg leading-relaxed opacity-90"
          style={{ color: "hsl(var(--hero-subtitle))" }}
        >
          Installation gratuite pendant le pilote, import de votre réseau
          existant et rapport de performance hebdomadaire. Le payant ne commence
          qu&apos;après la preuve du ROI.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/signup"
              className="inline-block rounded-full bg-white px-8 py-3.5 text-base font-medium text-black"
            >
              Demander un accès
            </Link>
          </motion.div>
          <Link
            href="/signup?role=concierge"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition-colors hover:text-white"
          >
            Je suis concierge / RP
            <ArrowRight
              size={16}
              strokeWidth={2}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
