"use client";

import Image from "next/image";
import { CtaLink, Reveal, type Cta } from "@/components/landing/section-header";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* Bandeau final pleine largeur, bord à bord : une terrasse de Marrakech la
   nuit, sous un plafond de lanternes, la Koutoubia au loin (photo Unsplash,
   licence libre). Un voile assombrit le centre, où se pose le texte, sans
   éteindre la lumière des lanternes. */
const BANNER =
  "https://images.unsplash.com/photo-1647878501041-1609141a7fb1?auto=format&fit=crop&w=2400&q=80";
type CtaBannerProps = {
  title?: React.ReactNode;
  text?: string;
  primary?: Cta;
  secondary?: Cta | null;
};

const getDefaults = (t: Translate) => ({
  title: t(
    <>
      Digitalisez les relations
      <br />
      qui existent déjà.
    </>,
    <>
      Digitise the relationships
      <br />
      you already have.
    </>
  ),
  text: t(
    "Installation gratuite pendant le pilote, import de votre réseau existant et rapport de performance hebdomadaire. Le payant ne commence qu'après la preuve du retour sur investissement.",
    "Free setup during the pilot, import of your existing network and a weekly performance report. You only start paying once the return on investment is proven."
  ),
  primary: { label: t("Demander un accès", "Request access"), href: "/signup" },
  secondary: {
    label: t("Je suis concierge / RP", "I'm a concierge / PR"),
    href: "/signup?role=concierge",
  },
});

export function CtaBanner(props: CtaBannerProps = {}) {
  const t = useT();
  const DEFAULTS = getDefaults(t);
  const {
    title = DEFAULTS.title,
    text = DEFAULTS.text,
    primary = DEFAULTS.primary,
    secondary = DEFAULTS.secondary,
  } = props;
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

      <Reveal className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        <h2 className="font-title text-[36px] font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-[46px] lg:text-[56px]">
          {title}
        </h2>

        <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-white/85 md:text-[17px]">
          {text}
        </p>

        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <CtaLink
            href={primary.href}
            className="rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-[var(--landing-ink)] transition-opacity hover:opacity-85"
          >
            {primary.label}
          </CtaLink>
          {secondary && (
            <CtaLink
              href={secondary.href}
              className="text-[15px] font-medium text-white/90 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white"
            >
              {secondary.label}
            </CtaLink>
          )}
        </div>
      </Reveal>
    </section>
  );
}
