"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

/* Grille commune des sections de la page d'accueil, calée sur le cadre du
   film du héros : même largeur (max-w-6xl) et mêmes gouttières, pour que
   tout s'aligne sur un seul axe vertical du haut en bas de la page. */
export const SECTION =
  "bg-[var(--landing-ivory)] px-5 py-24 font-body sm:px-6 md:px-10 md:py-36";
export const CONTAINER = "mx-auto max-w-6xl";
export const TITLE =
  "font-title text-[38px] font-bold leading-[1.04] tracking-[-0.035em] text-[var(--landing-ink)] sm:text-[48px] lg:text-[60px]";
/* La teinte sable des scènes : la lumière chaude du film, en aplat. */
export const STAGE = "rounded-3xl bg-[#f3eee5]";

/* En-tête de section : le titre à gauche, à l'échelle du titre du héros
   (60 px contre 76 px), et le texte d'introduction posé en bas à droite. */
export function SectionHeader({
  title,
  intro,
}: {
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mb-14 grid gap-6 md:mb-20 md:grid-cols-[1.35fr_1fr] md:items-end md:gap-16"
    >
      <h2 className={TITLE}>{title}</h2>
      {intro && (
        <p className="max-w-md text-[16px] leading-relaxed text-[var(--landing-ink)]/65 md:justify-self-end md:pb-2 md:text-[17px]">
          {intro}
        </p>
      )}
    </motion.div>
  );
}
