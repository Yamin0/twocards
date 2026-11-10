"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

/* Bandeau final pleine largeur, bord à bord : une terrasse de Marrakech la
   nuit, sous un plafond de lanternes, la Koutoubia au loin (photo Unsplash,
   licence libre). Un voile assombrit le centre, où se pose le texte, sans
   éteindre la lumière des lanternes. */
const BANNER =
  "https://images.unsplash.com/photo-1647878501041-1609141a7fb1?auto=format&fit=crop&w=2400&q=80";
type CtaBannerProps = {
  title?: React.ReactNode;
  text?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string } | null;
};

const DEFAULTS = {
  title: (
    <>
      Digitalisez les relations
      <br />
      qui <em className="font-light italic">existent déjà</em>.
    </>
  ),
  text: "Installation gratuite pendant le pilote, import de votre réseau existant et rapport de performance hebdomadaire. Le payant ne commence qu'après la preuve du retour sur investissement.",
  primary: { label: "Demander un accès", href: "/signup" },
  secondary: { label: "Je suis concierge / RP", href: "/signup?role=concierge" },
};

export function CtaBanner({
  title = DEFAULTS.title,
  text = DEFAULTS.text,
  primary = DEFAULTS.primary,
  secondary = DEFAULTS.secondary,
}: CtaBannerProps = {}) {
  return (
    <section
      id="contact"
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 py-28 font-body"
    >
      <Image
        src={BANNER}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.7),rgba(0,0,0,0.45))]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative z-10 flex max-w-3xl flex-col items-center text-center"
      >
        <h2 className="font-title text-[38px] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-[52px] lg:text-[64px]">
          {title}
        </h2>

        <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/80 md:text-[17px]">
          {text}
        </p>

        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <Link
            href={primary.href}
            className="rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-[var(--landing-ink)] transition-opacity hover:opacity-85"
          >
            {primary.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="text-[14px] font-medium text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </motion.div>
    </section>
  );
}
