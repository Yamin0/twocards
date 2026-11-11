"use client";

import type { ReactElement, ReactNode } from "react";
import Image from "next/image";
import { LandingNavbar } from "@/components/landing/navbar";
import { CtaBanner } from "@/components/landing/cta-banner";
import { HeroMedia, type HeroMediaProps } from "@/components/landing/hero-media";
import {
  BODY,
  CONTAINER,
  FaqSection,
  HeroCopy,
  PANEL,
  Reveal,
  SECTION,
  STAGE,
  SectionHeader,
  StepGrid,
  TITLE,
  type Cta,
  type Step,
} from "@/components/landing/section-header";
import { WarpOverlay } from "@/components/ui/wrap-shader";
import { Footer } from "@/components/layout/footer";
import { useT } from "@/lib/i18n/client";

/* Gabarit unique des quatre pages métiers (hôtels, établissements,
   concierges, influenceurs), avec les pièces de la page d'accueil :

     héros (média plein cadre + HeroCopy) → comment ça marche (StepGrid) →
     bande photo + phrase → mise en avant facultative (mini-écran à gauche,
     texte à droite) → ce que vous y gagnez → FAQ → bandeau final.

   Une phrase par idée. Les mini-écrans sont des composants : chaque page
   est donc un composant client qui définit ses données et rend ce
   gabarit (une fonction ne traverse pas la frontière serveur → client). */

export const panel = PANEL;

export type ShortAudienceData = {
  hero: {
    media: HeroMediaProps;
    title: ReactNode;
    intro: string;
    primary: Cta;
    secondary?: Cta;
  };
  how: {
    title: ReactNode;
    intro: string;
    items: Step[];
  };
  statement: { image: string; text: ReactNode };
  /* Optionnel : une capacité mise en avant entre la bande photo et les
     gains, mini-écran à gauche, texte à droite (l'inverse des gains). */
  spotlight?: {
    title: ReactNode;
    intro: string;
    note?: string;
    points?: { title: string; text: string }[];
    visual: () => ReactElement;
  };
  gains: {
    title: ReactNode;
    items: { title: string; text: string }[];
    /* Sans mini-écran, les gains occupent toute la largeur. */
    visual?: () => ReactElement;
  };
  faq: { q: string; a: string }[];
  cta: { title: ReactNode; text: string; primary: Cta };
};

export function ShortAudiencePage({ data }: { data: ShortAudienceData }) {
  const t = useT();
  const { hero, how, statement, spotlight, gains, faq, cta } = data;

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)]">
      {/* Héros : le média en fond, un voile, puis l'accroche. */}
      <header className="relative overflow-hidden bg-[#0a0a0a]">
        <HeroMedia {...hero.media} />
        <div className="pointer-events-none absolute inset-0 bg-black/50" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
        <LandingNavbar variant="dark" />
        <div className="relative z-10 flex min-h-[78vh] items-center justify-center px-6 pb-20 pt-12 md:min-h-[84vh]">
          <HeroCopy
            title={hero.title}
            intro={hero.intro}
            primary={hero.primary}
            secondary={hero.secondary}
          />
        </div>
      </header>

      <main>
        {/* Comment ça marche */}
        <section id="comment" className={`${SECTION} scroll-mt-20`}>
          <div className={CONTAINER}>
            <SectionHeader title={how.title} intro={how.intro} />
            <StepGrid items={how.items} columns={how.items.length === 3 ? 3 : 2} />
          </div>
        </section>

        {/* Bande photo + phrase */}
        <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden bg-[#1a1612] px-6 py-24">
          <Image src={statement.image} alt="" fill sizes="100vw" className="object-cover" />
          <WarpOverlay opacity={0.45} speed={0.3} />
          <div className="absolute inset-0 bg-black/50" />
          <Reveal className="relative z-10 max-w-3xl">
            <p className="text-on-video text-center font-title text-[26px] font-semibold leading-snug tracking-[-0.02em] text-white md:text-[38px]">
              {statement.text}
            </p>
          </Reveal>
        </section>

        {spotlight && (
          <section className={SECTION}>
            <div className={`${CONTAINER} grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20`}>
              <Reveal
                className={`${STAGE} order-2 flex min-h-[460px] items-center justify-center px-6 py-12 sm:px-12 lg:order-1`}
              >
                <div className="w-full max-w-[24rem]">
                  <spotlight.visual />
                </div>
              </Reveal>
              <div className="order-1 lg:order-2">
                <h2 className={TITLE}>{spotlight.title}</h2>
                <p className={`mt-6 max-w-md ${BODY} md:text-[17px]`}>{spotlight.intro}</p>
                {spotlight.note && (
                  <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[var(--landing-mute)]">
                    {spotlight.note}
                  </p>
                )}
                {spotlight.points && (
                  <dl className="mt-10 border-t border-black/[0.1]">
                    {spotlight.points.map((p) => (
                      <div key={p.title} className="border-b border-black/[0.1] py-5">
                        <dt className="text-[18px] font-semibold leading-snug">{p.title}</dt>
                        <dd className="mt-1.5 text-[15px] leading-relaxed text-[var(--landing-ink)]/70">
                          {p.text}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Ce que vous y gagnez */}
        <section className={SECTION}>
          <div
            className={`${CONTAINER} ${
              gains.visual ? "grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20" : ""
            }`}
          >
            <div>
              <h2 className={TITLE}>{gains.title}</h2>
              <dl
                className={`mt-12 grid gap-x-10 border-t border-black/[0.1] sm:grid-cols-2 ${
                  gains.visual ? "" : "lg:grid-cols-3"
                }`}
              >
                {gains.items.map((g) => (
                  <div key={g.title} className="border-b border-black/[0.1] py-6">
                    <dt className="text-[18px] font-semibold leading-snug">{g.title}</dt>
                    <dd className="mt-1.5 text-[15px] leading-relaxed text-[var(--landing-ink)]/70">
                      {g.text}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {gains.visual && (
              <Reveal
                className={`${STAGE} flex min-h-[420px] items-center justify-center px-6 py-12 sm:px-12`}
              >
                <div className="w-full max-w-[24rem]">
                  <gains.visual />
                </div>
              </Reveal>
            )}
          </div>
        </section>

        <FaqSection
          title={t("Vos questions, nos réponses.", "Your questions, answered.")}
          items={faq}
        />

        <CtaBanner title={cta.title} text={cta.text} primary={cta.primary} secondary={null} />
      </main>
      <Footer />
    </div>
  );
}
