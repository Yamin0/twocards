"use client";

import { motion } from "framer-motion";
import { SnapCarousel } from "@/components/landing/carousel";

const CATEGORIES = [
  {
    title: "Restaurants festifs",
    unit: "Tables allouées",
    note: "Les tables prime des soirs de pointe, allouées au réseau.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Rooftops",
    unit: "Créneaux sunset",
    note: "Coucher de soleil, minimum spend et zones à forte valeur.",
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Clubs & nightlife",
    unit: "Tables VIP & listes",
    note: "Tables VIP, listes et commissions dynamiques sur les soirées.",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Beach clubs & Agafay",
    unit: "Day passes",
    note: "Day passes et expériences journée, du transat au dîner.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Hôtels & riads",
    unit: "Desk concierge",
    note: "Le desk concierge équipé, l'attribution à l'établissement.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Expériences privées",
    unit: "Sur demande",
    note: "Privatisations, villas et moments confidentiels du réseau.",
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1200&auto=format&fit=crop",
  },
];

export function VenuesCarousel() {
  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32 font-body">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
              L&apos;inventaire de la nuit
            </p>
            <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-5xl">
              Tout ce qui se <em className="italic">réserve</em>.
            </h2>
          </div>
          <p className="max-w-sm text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
            Chaque catégorie du réseau publie un inventaire alloué, ses
            conditions et ses règles de commission — jamais tout son plan de
            salle.
          </p>
        </motion.div>

        <SnapCarousel ariaLabel="Catégories d'établissements">
          {CATEGORIES.map((c) => (
            <article
              key={c.title}
              className="group w-[270px] shrink-0 snap-start md:w-[340px]"
            >
              <div className="mb-5 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--landing-mute)]">
                {c.unit}
              </p>
              <h3 className="mt-1.5 font-title text-xl font-normal text-[var(--landing-ink)]">
                {c.title}
              </h3>
              <p className="mt-2 text-[13px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
                {c.note}
              </p>
            </article>
          ))}
        </SnapCarousel>
      </div>
    </section>
  );
}
