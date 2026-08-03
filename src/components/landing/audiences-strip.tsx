"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const AUDIENCES = [
  {
    href: "/restaurants",
    label: "Établissements",
    line: "Remplissez vos tables à vos conditions.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=900&auto=format&fit=crop",
  },
  {
    href: "/concierges",
    label: "Concierges / PR",
    line: "Chaque apport tracé, chaque commission payée.",
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=900&auto=format&fit=crop",
  },
  {
    href: "/hotels",
    label: "Hôtels & riads",
    line: "Le service que vos clients demandent le plus.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=900&auto=format&fit=crop",
  },
  {
    href: "/influenceurs",
    label: "Influenceurs",
    line: "Votre goût a déjà de la valeur.",
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=900&auto=format&fit=crop",
  },
];

export function AudiencesStrip({
  title = true,
  exclude,
}: {
  title?: boolean;
  exclude?: string;
}) {
  const items = AUDIENCES.filter((a) => a.href !== exclude);

  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32 font-body">
      <div className="mx-auto max-w-6xl">
        {title && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
              Un réseau, quatre métiers
            </p>
            <h2 className="font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-5xl">
              Qui êtes-<em className="italic">vous</em> ?
            </h2>
          </motion.div>
        )}

        <div
          className={`grid gap-5 sm:grid-cols-2 ${
            items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {items.map((a, i) => (
            <motion.div
              key={a.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <Link href={a.href} className="group block">
                <div className="relative mb-4 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.image}
                    alt={a.label}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-title text-lg font-normal text-[var(--landing-ink)]">
                      {a.label}
                    </h3>
                    <p className="mt-1 text-[13px] font-normal leading-snug text-[var(--landing-ink)]/60">
                      {a.line}
                    </p>
                  </div>
                  <span className="mt-1.5 shrink-0 text-[var(--landing-ink)]/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--landing-ink)]">
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
