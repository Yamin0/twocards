"use client";

import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

/* ─── Grammaire commune du site public ───────────────────────────────────
   L'accueil et les quatre pages métiers s'écrivent avec les mêmes pièces :
   un héros (HeroCopy), des sections à en-tête (SectionHeader), des étapes
   illustrées (StepGrid), une FAQ (FaqSection) et un bandeau final
   (CtaBanner). Largeur, gouttières et rythme vertical sont fixés ici, une
   seule fois. */

/* Grille commune, calée sur le cadre du film de l'accueil : même largeur
   (max-w-6xl) et mêmes gouttières, un seul axe vertical du haut en bas. */
export const SECTION =
  "bg-[var(--landing-ivory)] px-5 py-24 font-body sm:px-6 md:px-10 md:py-36";
export const CONTAINER = "mx-auto max-w-6xl";
/* Titre de section (h2). */
export const TITLE =
  "font-title text-[36px] font-bold leading-[1.05] tracking-[-0.035em] text-[var(--landing-ink)] sm:text-[46px] lg:text-[56px]";
/* Titre de héros (h1) : la même échelle sur les cinq pages. */
export const HERO_TITLE =
  "font-title text-[40px] font-bold leading-[1.04] tracking-[-0.04em] text-balance sm:text-[56px] lg:text-[72px]";
/* Texte courant d'une section : 4,9:1 sur l'ivoire. */
export const BODY = "text-[16px] leading-relaxed text-[var(--landing-ink)]/70";
/* La teinte sable des scènes : la lumière chaude du film, en aplat. */
export const STAGE = "rounded-3xl bg-[#f3eee5]";
/* Carte blanche des mini-écrans posés sur une scène. */
export const PANEL =
  "w-full rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-30px_rgba(60,40,10,0.35)]";
/* Intitulé d'un mini-écran : petit, en casse normale. */
export const PANEL_LABEL = "text-[12px] font-medium text-[var(--landing-ink)]/65";

/* Le QR des exemples est un vrai QR : il ouvre le menu de démonstration. */
export const DEMO_QR_URL = "https://twocardspro.com/s/a1f3c07b";
export const CONTACT_MAILTO = "mailto:contact@twocardspro.com";

export type Cta = { label: string; href: string };

/* Lien interne, ancre ou mailto : un seul composant pour les trois. */
export function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

const PRIMARY_ON_DARK =
  "rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-[var(--landing-ink)] transition-opacity hover:opacity-85";
export const SECONDARY_ON_DARK =
  "text-[15px] font-medium text-white/90 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white";

/* Bloc d'accroche d'un héros, sur fond sombre (noir de l'accueil, ou média
   voilé des pages métiers) : titre, phrase d'introduction, bouton principal
   et lien secondaire. Rendu visible dès le HTML du serveur : l'entrée est
   un glissement CSS, jamais une opacité à zéro. */
export function HeroCopy({
  title,
  intro,
  primary,
  secondary,
}: {
  title: ReactNode;
  intro?: ReactNode;
  primary: Cta;
  /* Un lien, ou un élément libre (le bouton « Regarder le film »). */
  secondary?: Cta | ReactElement;
}) {
  return (
    <div className="landing-rise mx-auto max-w-5xl text-center text-white">
      <h1 className={HERO_TITLE}>{title}</h1>
      {intro && (
        <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-white/80 md:text-[18px]">
          {intro}
        </p>
      )}
      <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
        <CtaLink href={primary.href} className={PRIMARY_ON_DARK}>
          {primary.label}
        </CtaLink>
        {secondary &&
          ("href" in secondary ? (
            <CtaLink href={secondary.href} className={SECONDARY_ON_DARK}>
              {secondary.label}
            </CtaLink>
          ) : (
            secondary
          ))}
      </div>
    </div>
  );
}

/* Apparition d'un bloc à son entrée dans l'écran, sans bibliothèque.
   Le serveur rend le bloc visible ; le script ne masque que ceux qui sont
   encore sous l'écran au montage, puis les révèle une fois. Sans
   JavaScript, ou en mouvement réduit, rien n'est jamais masqué. */
export function Reveal({
  as = "div",
  className,
  children,
}: {
  as?: "div" | "article" | "li" | "ul";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /* Balise au choix ; le type de la référence est celui d'un div, les
     quatre balises partageant la même interface utile ici. */
  const Tag = as as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.reveal = "wait";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "in";
        io.disconnect();
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.dataset.reveal = "in";
    };
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/* En-tête de section : le titre à gauche, le texte d'introduction posé en
   bas à droite. */
export function SectionHeader({
  title,
  intro,
}: {
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <Reveal className="mb-14 grid gap-6 md:mb-20 md:grid-cols-[1.35fr_1fr] md:items-end md:gap-16">
      <h2 className={TITLE}>{title}</h2>
      {intro && (
        <p className={`max-w-md ${BODY} md:justify-self-end md:pb-2 md:text-[17px]`}>
          {intro}
        </p>
      )}
    </Reveal>
  );
}

export type Step = {
  title: string;
  text: string;
  visual: () => ReactElement;
};

/* Étapes illustrées : une scène sable qui porte un mini-écran, puis le
   numéro, le titre et une phrase. Deux ou trois colonnes sur grand écran. */
export function StepGrid({ items, columns }: { items: Step[]; columns: 2 | 3 }) {
  return (
    <div
      className={`grid gap-x-6 gap-y-14 ${
        columns === 3 ? "lg:grid-cols-3" : "md:grid-cols-2 md:gap-y-20"
      }`}
    >
      {items.map((item, i) => (
        <Reveal as="article" key={item.title}>
          {/* Hauteur fixe : les scènes s'alignent, quel que soit le
              mini-écran qu'elles portent. */}
          <div
            className={`${STAGE} flex h-[340px] items-center justify-center px-6 ${
              columns === 3 ? "sm:px-10 lg:px-6" : "sm:h-[380px] sm:px-12"
            }`}
          >
            <div className="w-full max-w-[22rem]">
              <item.visual />
            </div>
          </div>
          <div className="mt-7 flex gap-4">
            <span className="pt-1 font-title text-[15px] font-medium tabular-nums text-[var(--landing-mute)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-[22px] font-semibold leading-snug tracking-[-0.015em] text-[var(--landing-ink)]">
                {item.title}
              </h3>
              <p className={`mt-2 max-w-md ${BODY}`}>{item.text}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* FAQ : le titre reste à l'écran pendant qu'on parcourt les questions.
   <details> natif : ouvrable au clavier, et sans JavaScript. */
export function FaqSection({
  title,
  aside,
  items,
}: {
  title: ReactNode;
  aside?: ReactNode;
  items: { q: string; a: string }[];
}) {
  return (
    <section className={SECTION}>
      <div className={`${CONTAINER} grid gap-12 md:grid-cols-[1fr_1.5fr] md:gap-20`}>
        <div className="md:sticky md:top-28 md:self-start">
          <h2 className={TITLE}>{title}</h2>
          {aside && <p className={`mt-6 max-w-xs ${BODY}`}>{aside}</p>}
        </div>
        <div className="flex flex-col">
          {items.map((item) => (
            <details key={item.q} className="group border-t border-black/[0.1] last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-medium text-[var(--landing-ink)] md:text-[18px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden
                  className="shrink-0 text-[var(--landing-mute)] transition-transform duration-300 group-open:rotate-45"
                />
              </summary>
              <p className={`-mt-1 pb-7 pr-10 ${BODY}`}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
