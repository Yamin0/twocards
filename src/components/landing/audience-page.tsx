"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Plus, QrCode, Mail } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { Footer } from "@/components/layout/footer";
import { GlassButton, GlassFilter } from "@/components/ui/liquid-glass";
import SocialCards, { type CardItem } from "@/components/ui/card-fan-carousel";
import { WarpOverlay, WarpBackground } from "@/components/ui/wrap-shader";

export interface AudiencePageData {
  label: string;
  titleStart: string;
  /* Optionnel : mots qui se relaient entre titleStart et titleMiddle,
     avec un glissement vertical doux. */
  titleRotate?: string[];
  /* Texte entre le mot tournant et l'accent italique. */
  titleMiddle?: string;
  titleAccent: string;
  titleEnd: string;
  /* Optionnel : certaines pages laissent le héros au seul titre. */
  subtitle?: string;
  /* Fond vidéo du héros (autoplay muet en boucle). À défaut, fond shader. */
  heroVideo?: string;
  heroPoster?: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  /* icon remplace le numéro d'étape. Clé et non composant : les données
     traversent la frontière serveur → client, qui ne passe pas les fonctions. */
  steps: { title: string; description: string; icon?: "qr" | "mail" }[];
  /* Titre de la section étapes. Par défaut « Trois étapes. Un seul réseau. » */
  stepsTitle?: string;
  stepsAccent?: string;
  /* Carrousel en éventail, sous les bénéfices. */
  carousel?: { label?: string; cards: CardItem[] };
  /* Bandeau défilant, au-dessus des bénéfices. Chaque entrée affiche son
     logo ; si le fichier manque, le nom prend le relais automatiquement. */
  marquee?: {
    label: string;
    items: { name: string; logo?: string; scale?: number }[];
  };
  image: string;
  imageAlt: string;
  statement: string;
  gainsTitle: string;
  gainsAccent: string;
  gains: { title: string; description: string }[];
  faq: { q: string; a: string }[];
  finalTitle: string;
  finalAccent: string;
  finalText: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

/* Une entrée du bandeau. Les logos de marques ont des proportions très
   différentes : hauteur commune, largeur libre, et passage en niveaux de
   gris pour que la ligne se lise comme un ensemble. `scale` corrige au cas
   par cas les logos optiquement trop petits ou trop hauts. */
function MarqueeItem({
  item,
  duplicate,
}: {
  item: { name: string; logo?: string; scale?: number };
  duplicate: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  /* L'image est rendue côté serveur : si le fichier manque, l'erreur survient
     avant l'hydratation et onError n'est jamais appelé. On relit donc l'état
     au montage. */
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  if (item.logo && !failed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        ref={ref}
        src={item.logo}
        alt={duplicate ? "" : item.name}
        aria-hidden={duplicate}
        onError={() => setFailed(true)}
        style={{ height: `${(item.scale ?? 1) * 2.25}rem` }}
        className="w-auto shrink-0 object-contain opacity-55 grayscale transition-opacity hover:opacity-80"
      />
    );
  }

  return (
    <span
      aria-hidden={duplicate}
      className="shrink-0 whitespace-nowrap font-title text-[17px] font-normal uppercase tracking-[0.22em] text-[var(--landing-ink)]/45 md:text-[20px]"
    >
      {item.name}
    </span>
  );
}

/* Vitesse de lecture du fond vidéo. La source est ré-encodée à 60 im/s par
   interpolation de mouvement (24 à l'origine), à sa durée naturelle : à 0,8
   il reste donc 48 images réelles par seconde, largement au-dessus du seuil
   de perception des saccades. */
const HERO_VIDEO_RATE = 0.8;

/* Mot tournant du titre : chaque mot sort vers le haut et le suivant monte
   à sa place, dans un léger flou. Tous les mots occupent la même cellule de
   grille, la plus large fixant la largeur : le reste du titre ne bouge
   jamais. En reduced-motion, simple fondu croisé. */
function RotatingTitleWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      2600
    );
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className="relative inline-grid align-baseline">
      {words.map((w) => (
        <span
          key={w}
          aria-hidden
          className="invisible col-start-1 row-start-1 whitespace-nowrap"
        >
          {w}
        </span>
      ))}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          initial={
            reduced
              ? { opacity: 0 }
              : { y: "0.55em", opacity: 0, filter: "blur(5px)" }
          }
          animate={
            reduced
              ? { opacity: 1 }
              : { y: 0, opacity: 1, filter: "blur(0px)" }
          }
          exit={
            reduced
              ? { opacity: 0 }
              : { y: "-0.55em", opacity: 0, filter: "blur(5px)" }
          }
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="col-start-1 row-start-1 whitespace-nowrap text-center"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function AudiencePage({ data }: { data: AudiencePageData }) {
  const onVideo = Boolean(data.heroVideo);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* playbackRate n'existe pas en attribut HTML, et il est réinitialisé à
     chaque chargement de source : on le repose aussi sur loadedmetadata. */
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

  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)] font-body">
      <GlassFilter />

      {/* Héros : fond vidéo si fourni, sinon fond shader */}
      <div className="relative overflow-hidden">
        {onVideo ? (
          <>
            <video
              ref={videoRef}
              src={data.heroVideo}
              poster={data.heroPoster}
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Voile : la scène est lumineuse, le texte blanc a besoin d'assise */}
            <div className="pointer-events-none absolute inset-0 bg-black/45" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
          </>
        ) : (
          <WarpBackground speed={0.3} />
        )}
        <LandingNavbar variant={onVideo ? "dark" : "light"} />

        {/* Sur fond vidéo : pas de sur-titre, et le paragraphe descend en
            pied de héros pour laisser la scène respirer sous le titre. */}
        <div
          className={`relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center ${
            onVideo
              ? "min-h-[82vh] pb-12 pt-10 md:min-h-[88vh] md:pb-16"
              : "pb-20 pt-16 md:pb-28 md:pt-24"
          }`}
        >
          {!onVideo && (
            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6 }}
              className="mb-8 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]"
            >
              {data.label}
            </motion.p>
          )}

          <div
            className={
              onVideo ? "flex flex-1 flex-col items-center justify-center" : ""
            }
          >
            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.7, delay: 0.1 }}
              className={`mb-8 font-title text-[34px] font-normal leading-[1.15] tracking-[-0.02em] md:text-[56px] ${
                onVideo ? "text-white" : ""
              }`}
            >
              {data.titleStart}{" "}
              {data.titleRotate && (
                <>
                  <RotatingTitleWord words={data.titleRotate} />{" "}
                </>
              )}
              {data.titleMiddle && <>{data.titleMiddle} </>}
              <em className="italic">{data.titleAccent}</em>
              {data.titleEnd}
            </motion.h1>

            {!onVideo && data.subtitle && (
              <motion.p
                {...fadeUp}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mb-10 max-w-2xl text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70"
              >
                {data.subtitle}
              </motion.p>
            )}

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col items-center gap-5 sm:flex-row"
            >
            <Link
              href={data.primaryCta.href}
              className={`rounded-full px-8 py-3.5 text-[14px] font-medium transition-opacity hover:opacity-80 ${
                onVideo
                  ? "bg-white text-black"
                  : "bg-[var(--landing-ink)] text-[var(--landing-ivory)]"
              }`}
            >
              {data.primaryCta.label}
            </Link>
              <Link
                href={data.secondaryCta.href}
                className={`text-[11px] font-medium uppercase tracking-[0.18em] underline underline-offset-4 transition-colors ${
                  onVideo
                    ? "text-white/70 decoration-white/30 hover:text-white"
                    : "text-[var(--landing-ink)]/60 decoration-black/20 hover:text-[var(--landing-ink)]"
                }`}
              >
                {data.secondaryCta.label}
              </Link>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Trois étapes */}
      <section className="border-t border-black/[0.06] px-6 py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={`text-center font-title text-3xl font-normal leading-tight md:text-4xl ${
              onVideo && data.subtitle ? "mb-6" : "mb-16"
            }`}
          >
            {data.stepsTitle ?? "Trois étapes."}{" "}
            <em className="italic">{data.stepsAccent ?? "Un seul réseau."}</em>
          </motion.h2>

          {/* Sorti du héros : le propos introduit les trois points de contact
              plutôt que de charger la scène vidéo. */}
          {onVideo && data.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mx-auto mb-16 max-w-2xl text-center text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70"
            >
              {data.subtitle}
            </motion.p>
          )}

          {/* La grille suit le nombre d'étapes : à trois colonnes fixes, deux
              étapes laisseraient une colonne vide. */}
          <div
            className={`grid gap-0 ${
              data.steps.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            {data.steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                /* Avec icône : rangée icône + texte, inversée un bloc sur
                   deux pour que les deux icônes encadrent la section. */
                className={`border-t border-black/[0.08] px-1 py-10 md:px-6 ${
                  step.icon
                    ? `flex items-center gap-5 md:gap-8 ${
                        i % 2 === 1 ? "flex-row-reverse" : ""
                      }`
                    : ""
                }`}
              >
                {/* Icône posée à côté du texte. Trait fin : à cette taille,
                    une épaisseur normale ferait un aplat. */}
                {step.icon && (
                  <span
                    aria-hidden
                    className="shrink-0 text-[var(--landing-ink)]/25"
                  >
                    {step.icon === "qr" ? (
                      <QrCode
                        strokeWidth={0.75}
                        className="h-[88px] w-[88px] md:h-[150px] md:w-[150px]"
                      />
                    ) : (
                      <Mail
                        strokeWidth={0.75}
                        className="h-[88px] w-[88px] md:h-[150px] md:w-[150px]"
                      />
                    )}
                  </span>
                )}

                <div>
                  {!step.icon && (
                    <span className="font-title text-[26px] font-normal leading-none text-[var(--landing-mute)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  <h3
                    className={`text-[16px] font-medium leading-snug ${
                      step.icon ? "" : "mt-5"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bande photo + statement */}
      <section
        className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-6 py-24"
        style={{
          background: `url("${data.image}") center center / cover`,
        }}
      >
        <WarpOverlay opacity={0.45} speed={0.3} />
        <div className="absolute inset-0 bg-black/45" />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl text-center font-title text-2xl font-normal leading-snug text-white md:text-4xl"
        >
          {data.statement}
        </motion.p>
      </section>

      {/* Bandeau défilant : la piste est dupliquée et l'animation la décale
          de moitié, ce qui rend la boucle continue et sans raccord visible. */}
      {data.marquee && (
        <section className="overflow-hidden border-t border-black/[0.06] py-14 md:py-16">
          <p className="mb-8 px-6 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            {data.marquee.label}
          </p>
          <div className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="animate-marquee-left flex w-max items-center gap-14 md:gap-20">
              {[...data.marquee.items, ...data.marquee.items].map(
                (item, i) => (
                  <MarqueeItem
                    key={`${item.name}-${i}`}
                    item={item}
                    duplicate={i >= data.marquee!.items.length}
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Ce que vous y gagnez */}
      <section className="px-6 pb-24 pt-16 md:px-16 md:pb-32 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center font-title text-3xl font-normal leading-tight md:text-4xl"
          >
            {data.gainsTitle} <em className="italic">{data.gainsAccent}</em>
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {data.gains.map((gain, i) => (
              <motion.div
                key={gain.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className="border-t border-black/[0.08] px-1 py-8 md:px-5"
              >
                <h3 className="text-[15px] font-medium leading-snug">
                  {gain.title}
                </h3>
                <p className="mt-3 text-[13px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {gain.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Carrousel en éventail */}
      {data.carousel && (
        <section className="border-t border-black/[0.06] pb-16 pt-20 md:pb-24 md:pt-24">
          {data.carousel.label && (
            <p className="mb-4 px-6 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
              {data.carousel.label}
            </p>
          )}
          <SocialCards cards={data.carousel.cards} />
        </section>
      )}

      {/* FAQ */}
      <section className="border-t border-black/[0.06] px-6 py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Questions fréquentes
          </p>
          <h2 className="mb-14 text-center font-title text-3xl font-normal leading-tight md:text-4xl">
            Ce qu&apos;on nous demande <em className="italic">souvent</em>.
          </h2>

          <div className="flex flex-col">
            {/* name commun : le navigateur referme la question précédente
                quand on en ouvre une autre, sans état à gérer. */}
            {data.faq.map((item) => (
              <details
                key={item.q}
                name="faq"
                className="group border-t border-black/[0.08] last:border-b"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus
                    size={16}
                    strokeWidth={1.5}
                    className="shrink-0 text-[var(--landing-mute)] transition-transform duration-300 group-open:rotate-45"
                  />
                </summary>
                <p className="pb-6 pr-10 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-black/[0.06] px-6 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <h2 className="mb-5 font-title text-3xl font-normal leading-[1.15] md:text-5xl">
            {data.finalTitle} <em className="italic">{data.finalAccent}</em>
          </h2>
          <p className="mb-10 max-w-xl text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70">
            {data.finalText}
          </p>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <GlassButton href={data.primaryCta.href}>
              <p className="text-base font-normal tracking-wide text-[var(--landing-ink)]">
                {data.primaryCta.label}
              </p>
            </GlassButton>
            <Link
              href={data.secondaryCta.href}
              className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/60 transition-colors hover:text-[var(--landing-ink)]"
            >
              {data.secondaryCta.label}
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
