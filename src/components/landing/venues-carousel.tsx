"use client";

import { motion } from "framer-motion";
import { SnapCarousel } from "@/components/landing/carousel";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

const getCategories = (t: Translate) => [
  {
    title: t("Restaurants festifs", "Party restaurants"),
    unit: t("Tables allouées", "Allocated tables"),
    note: t(
      "Les tables prime des soirs de pointe, allouées au réseau.",
      "Prime tables on peak nights, allocated to the network."
    ),
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Rooftops",
    unit: t("Créneaux sunset", "Sunset slots"),
    note: t(
      "Coucher de soleil, minimum spend et zones à forte valeur.",
      "Sunset sessions, minimum spend and high-value areas."
    ),
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Clubs & nightlife",
    unit: t("Tables VIP & listes", "VIP tables & lists"),
    note: t(
      "Tables VIP, listes et commissions dynamiques sur les soirées.",
      "VIP tables, guest lists and dynamic commissions on event nights."
    ),
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Beach clubs & Agafay",
    unit: t("Day passes", "Day passes"),
    note: t(
      "Day passes et expériences journée, du transat au dîner.",
      "Day passes and daytime experiences, from sun lounger to dinner."
    ),
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: t("Hôtels & riads", "Hotels & riads"),
    unit: t("Desk concierge", "Concierge desk"),
    note: t(
      "Le desk concierge équipé, l'attribution à l'établissement.",
      "A fully equipped concierge desk, with attribution to the property."
    ),
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: t("Expériences privées", "Private experiences"),
    unit: t("Sur demande", "On request"),
    note: t(
      "Privatisations, villas et moments confidentiels du réseau.",
      "Private hire, villas and the network's most discreet moments."
    ),
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1200&auto=format&fit=crop",
  },
];

export function VenuesCarousel() {
  const t = useT();
  const CATEGORIES = getCategories(t);
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
              {t("L'inventaire de la nuit", "Night-time inventory")}
            </p>
            <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-5xl">
              {t(
                <>Tout ce qui se <em className="italic">réserve</em>.</>,
                <>Everything you can <em className="italic">book</em>.</>
              )}
            </h2>
          </div>
          <p className="max-w-sm text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
            {t(
              "Chaque catégorie du réseau publie un inventaire alloué, ses conditions et ses règles de commission, jamais tout son plan de salle.",
              "Each category in the network publishes an allocated inventory, its terms and its commission rules, never its entire floor plan."
            )}
          </p>
        </motion.div>

        <SnapCarousel ariaLabel={t("Catégories d'établissements", "Venue categories")}>
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
