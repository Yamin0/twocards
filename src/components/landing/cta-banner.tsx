"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/liquid-glass";

export function CtaBanner() {
  return (
    <section
      id="contact"
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-28 font-[family-name:var(--font-grotesk)]"
      style={{
        background: `url("https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2000&auto=format&fit=crop") center center / cover`,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative z-10 flex max-w-3xl flex-col items-center text-center"
      >
        <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.28em] text-white/80">
          Founding Circle — Marrakech, places limitées
        </p>

        <h2 className="mb-6 font-[family-name:var(--font-display)] text-5xl font-normal leading-[1.1] text-white md:text-7xl">
          Digitalisez les relations qui{" "}
          <em className="italic">existent déjà</em>.
        </h2>

        <p className="mb-10 max-w-xl text-[15px] font-light leading-relaxed text-white/85">
          Installation gratuite pendant le pilote, import de votre réseau
          existant et rapport de performance hebdomadaire. Le payant ne
          commence qu&apos;après la preuve du ROI.
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <GlassButton href="/signup">
            <p className="text-base font-light tracking-wide text-white">
              Demander un accès
            </p>
          </GlassButton>
          <Link
            href="/signup?role=concierge"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
          >
            Je suis concierge / RP
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
