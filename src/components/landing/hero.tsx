"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck,
  QrCode,
  ReceiptText,
  Percent,
  Scale,
} from "lucide-react";
import { GlassEffect, GlassButton, GlassFilter } from "@/components/ui/liquid-glass";
import { WarpOverlay } from "@/components/ui/wrap-shader";

const modules = [
  { icon: CalendarCheck, label: "Réservations" },
  { icon: QrCode, label: "Check-in" },
  { icon: ReceiptText, label: "Factures" },
  { icon: Percent, label: "Commissions" },
  { icon: Scale, label: "Litiges" },
];

export function Hero() {
  return (
    <section className="relative bg-[var(--landing-ivory)] text-[var(--landing-ink)] font-body">
      <GlassFilter />

      {/* Photo band + liquid glass */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="relative flex min-h-[70vh] w-full flex-col items-center justify-center gap-8 overflow-hidden px-6 py-24"
        style={{
          background: `url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop") center center / cover`,
          animation: "moveBackground 120s linear infinite",
        }}
      >
        <WarpOverlay opacity={0.55} speed={0.4} />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/80">
            Une seule plateforme, de la demande au paiement
          </p>

          {/* Glass dock of modules */}
          <GlassEffect className="max-w-full rounded-3xl p-2">
            <div className="flex flex-wrap items-center justify-center gap-1 p-2 sm:gap-2">
              {modules.map((module) => (
                <div
                  key={module.label}
                  className="flex w-[86px] flex-col items-center gap-2 rounded-2xl px-1 py-3 transition-all duration-500 hover:scale-110 sm:w-24 sm:px-3"
                  style={{
                    transitionTimingFunction:
                      "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
                  }}
                >
                  <module.icon
                    size={26}
                    strokeWidth={1.25}
                    className="text-white"
                  />
                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/90 sm:text-[10px]">
                    {module.label}
                  </span>
                </div>
              ))}
            </div>
          </GlassEffect>

          <GlassButton href="/signup">
            <p className="text-base font-normal tracking-wide text-white">
              Découvrir TwoCards
            </p>
          </GlassButton>
        </div>
      </motion.div>

      {/* Product frame */}
      <div className="border-b border-black/[0.06] px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Le produit
          </p>
          <h2 className="mx-auto mb-12 max-w-2xl text-center font-title text-3xl font-normal leading-tight md:text-4xl">
            Qui remplit vos tables,
            <br />
            <em className="italic">noir sur blanc</em>.
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard-preview-v2.png"
            alt="Dashboard TwoCards"
            className="w-full rounded-lg border border-black/10 shadow-[0_30px_80px_-40px_rgba(13,13,13,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
