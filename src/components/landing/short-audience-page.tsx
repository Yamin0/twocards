"use client";

import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { CtaBanner } from "@/components/landing/cta-banner";
import {
  CONTAINER,
  SECTION,
  STAGE,
  SectionHeader,
  TITLE,
} from "@/components/landing/section-header";
import { WarpOverlay } from "@/components/ui/wrap-shader";
import { Footer } from "@/components/layout/footer";

/* Gabarit court des pages métiers (hôtels, établissements, concierges),
   dans l'écriture de la page d'accueil :

     héros média → comment ça marche (mini-écrans sur scène sable) →
     bande photo + phrase → ce que vous y gagnez (4 points + un écran) →
     FAQ courte → bandeau final.

   Une phrase par idée. Les mini-écrans sont des composants : chaque page
   est donc un composant client qui définit ses données et rend ce
   gabarit (une fonction ne traverse pas la frontière serveur → client). */

export const panel =
  "w-full rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-30px_rgba(60,40,10,0.35)]";

type Cta = { label: string; href: string };

export type ShortAudienceData = {
  hero: {
    /* Vidéo en boucle, ou photo fixe à défaut. */
    video?: string;
    poster?: string;
    /* À false, la séquence se joue une fois et reste sur sa dernière image. */
    loop?: boolean;
    image?: string;
    title: ReactNode;
    primary: Cta;
    secondary?: Cta;
  };
  how: {
    title: ReactNode;
    intro: string;
    items: { title: string; text: string; visual: () => ReactElement }[];
  };
  statement: { image: string; text: string };
  /* Optionnel : une capacité mise en avant entre la bande photo et les
     gains, mini-écran à gauche, texte à droite (l'inverse des gains). */
  spotlight?: {
    title: ReactNode;
    intro: string;
    points: { title: string; text: string }[];
    visual: () => ReactElement;
  };
  gains: {
    title: ReactNode;
    items: { title: string; text: string }[];
    visual: () => ReactElement;
  };
  faq: { q: string; a: string }[];
  cta: { title: ReactNode; text: string; primary: Cta };
};

const HERO_VIDEO_RATE = 0.8;

export function ShortAudiencePage({ data }: { data: ShortAudienceData }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  /* playbackRate n'existe pas en attribut HTML et se réinitialise à chaque
     chargement de source : on le repose sur loadedmetadata. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const apply = () => {
      v.playbackRate = HERO_VIDEO_RATE;
    };
    apply();
    v.addEventListener("loadedmetadata", apply);
    return () => v.removeEventListener("loadedmetadata", apply);
  }, []);

  const { hero, how, statement, spotlight, gains, faq, cta } = data;
  const steps = how.items.length;

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)]">
      {/* Héros média — même habillage que l'ancienne AudiencePage. */}
      <div className="relative overflow-hidden">
        {hero.video ? (
          <video
            ref={videoRef}
            src={hero.video}
            poster={hero.poster}
            autoPlay
            loop={hero.loop ?? true}
            muted
            playsInline
            disablePictureInPicture
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // Décoratif, plein cadre, sans dimensions connues à la compilation.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.image}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
        <LandingNavbar variant="dark" />

        <div className="relative z-10 mx-auto flex min-h-[82vh] max-w-4xl flex-col items-center px-6 pb-12 pt-10 text-center md:min-h-[88vh] md:pb-16">
          <div className="flex flex-1 flex-col items-center justify-center">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-8 font-title text-[34px] font-normal leading-[1.15] tracking-[-0.02em] text-white md:text-[56px]"
            >
              {hero.title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col items-center gap-5 sm:flex-row"
            >
              <Link
                href={hero.primary.href}
                className="rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-black transition-opacity hover:opacity-80"
              >
                {hero.primary.label}
              </Link>
              {hero.secondary && (
                <Link
                  href={hero.secondary.href}
                  className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                >
                  {hero.secondary.label}
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <main>
        {/* Comment ça marche */}
        <section id="comment" className={`${SECTION} scroll-mt-20`}>
          <div className={CONTAINER}>
            <SectionHeader title={how.title} intro={how.intro} />
            <div
              className={`grid gap-x-6 gap-y-14 ${
                steps === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"
              }`}
            >
              {how.items.map((item, i) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                >
                  <div
                    className={`${STAGE} flex h-[320px] items-center justify-center px-6 sm:h-[340px] ${
                      steps === 3 ? "sm:px-10 lg:px-6" : "sm:px-12"
                    }`}
                  >
                    <div className="w-full max-w-[21rem]">
                      <item.visual />
                    </div>
                  </div>
                  <div className="mt-7 flex gap-4">
                    {steps === 3 && (
                      <span className="pt-1 font-title text-[15px] font-medium tabular-nums text-[var(--landing-mute)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                    <div>
                      <h3 className="text-[22px] font-semibold leading-snug tracking-[-0.015em]">
                        {item.title}
                      </h3>
                      <p className="mt-2 max-w-md text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Bande photo + phrase */}
        <section
          className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-6 py-24"
          style={{ background: `url("${statement.image}") center center / cover` }}
        >
          <WarpOverlay opacity={0.45} speed={0.3} />
          <div className="absolute inset-0 bg-black/45" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-on-video relative z-10 max-w-3xl text-center font-title text-2xl font-normal leading-snug text-white md:text-4xl"
          >
            {statement.text}
          </motion.p>
        </section>

        {spotlight && (
          <section className={SECTION}>
            <div className={`${CONTAINER} grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20`}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
                className={`${STAGE} order-2 flex min-h-[460px] items-center justify-center px-6 py-12 sm:px-12 lg:order-1`}
              >
                <div className="w-full max-w-[22rem]">
                  <spotlight.visual />
                </div>
              </motion.div>
              <div className="order-1 lg:order-2">
                <h2 className={TITLE}>{spotlight.title}</h2>
                <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--landing-ink)]/65 md:text-[17px]">
                  {spotlight.intro}
                </p>
                <dl className="mt-10 border-t border-black/[0.1]">
                  {spotlight.points.map((p) => (
                    <div key={p.title} className="border-b border-black/[0.1] py-5">
                      <dt className="text-[18px] font-semibold leading-snug">{p.title}</dt>
                      <dd className="mt-1.5 text-[15px] leading-relaxed text-[var(--landing-ink)]/65">
                        {p.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
        )}

        {/* Ce que vous y gagnez */}
        <section className={SECTION}>
          <div className={`${CONTAINER} grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20`}>
            <div>
              <h2 className={TITLE}>{gains.title}</h2>
              <dl className="mt-12 grid gap-x-10 border-t border-black/[0.1] sm:grid-cols-2">
                {gains.items.map((g) => (
                  <div key={g.title} className="border-b border-black/[0.1] py-6">
                    <dt className="text-[18px] font-semibold leading-snug">{g.title}</dt>
                    <dd className="mt-1.5 text-[15px] leading-relaxed text-[var(--landing-ink)]/65">
                      {g.text}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className={`${STAGE} flex min-h-[420px] items-center justify-center px-6 py-12 sm:px-12`}
            >
              <div className="w-full max-w-[24rem]">
                <gains.visual />
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ courte */}
        <section className={SECTION}>
          <div className={`${CONTAINER} grid gap-12 md:grid-cols-[1fr_1.5fr] md:gap-20`}>
            <h2 className={`${TITLE} md:sticky md:top-28 md:self-start`}>
              Vos questions,
              <br />
              <em className="font-light italic">nos réponses</em>.
            </h2>
            <div className="flex flex-col">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group border-t border-black/[0.1] last:border-b"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-medium md:text-[18px] [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus
                      size={18}
                      strokeWidth={1.5}
                      className="shrink-0 text-[var(--landing-mute)] transition-transform duration-300 group-open:rotate-45"
                    />
                  </summary>
                  <p className="-mt-1 pb-7 pr-10 text-[16px] leading-relaxed text-[var(--landing-ink)]/70">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <CtaBanner
          title={cta.title}
          text={cta.text}
          primary={cta.primary}
          secondary={null}
        />
      </main>
      <Footer />
    </div>
  );
}
