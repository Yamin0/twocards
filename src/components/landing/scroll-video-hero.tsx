"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { LandingNavbar } from "@/components/landing/navbar";

/* Séquence cinématique : la vidéo des portes est épinglée en fond et sert de
   décor à deux écrans qui défilent par-dessus — l'accroche, puis la section
   passée en children. La lecture reste une timeline pilotée par le scroll :
   pause à la frame 0, scrub avant/arrière, retour exact à l'origine en haut
   de page, jamais d'autoplay.

   Le contenu est remonté d'un écran (marginTop négatif) pour recouvrir la
   vidéo épinglée. La séquence court donc sur 100dvh + hauteur des children
   + TAIL_VH, et le scrub s'étale sur toute cette course.

   La cour se révèle très lumineuse en fin de séquence : un voile noir
   s'intensifie avec le scroll pour garder le texte blanc lisible. */

const DAMPING = 0.14;
/* Respirations de vidéo nue qui encadrent la section : elles donnent au
   scrub sa lenteur cinématique (~250 px de scroll par seconde de vidéo)
   et laissent les portes s'ouvrir avant l'arrivée du texte. */
const GAP_VH = 110;
const TAIL_VH = 60;

export function ScrollVideoHero({ children }: { children?: React.ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;
    let current = 0;
    let metaReady = false;

    const onMeta = () => {
      metaReady = true;
      // Force le rendu de la frame 0 (Safari/iOS ne peint rien avant un seek)
      video.currentTime = 0.001;
    };
    if (video.readyState >= 1) onMeta();
    else video.addEventListener("loadedmetadata", onMeta, { once: true });

    if (!reduced) {
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!metaReady || !video.duration) return;

        const target = scrollYProgress.get() * video.duration;
        current += (target - current) * DAMPING;
        if (Math.abs(target - current) < 0.003) current = target;

        // On ne ré-empile pas de seek tant que le précédent n'est pas résolu
        if (!video.seeking && Math.abs(video.currentTime - current) > 0.001) {
          video.currentTime = current;
        }
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [scrollYProgress]);

  return (
    <section ref={sectionRef} className="relative bg-black">
      {/* Fond vidéo épinglé, commun aux deux écrans */}
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/hero-doors.mp4"
          poster="/videos/hero-doors-poster.jpg"
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Voile de base : garde l'accroche lisible sans éteindre l'image.
            L'assombrissement propre à la seconde section voyage avec elle. */}
        <div className="pointer-events-none absolute inset-0 bg-black/30" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Contenu qui défile par-dessus la vidéo */}
      <div className="relative z-10" style={{ marginTop: "-100dvh" }}>
        {/* Écran 1 — accroche */}
        <div className="flex h-dvh flex-col font-body">
          <LandingNavbar variant="dark" />

          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <h1 className="mb-8 max-w-4xl font-title text-[38px] font-normal leading-[1.12] tracking-[-0.02em] text-white md:text-[64px]">
              Chaque recommandation
              <br />
              devient une réservation <em className="italic">traçable</em>.
            </h1>
            <p className="mb-10 max-w-xl text-[15px] font-normal leading-relaxed text-white/75">
              TwoCards connecte les établissements aux concierges et RP
              vérifiés, synchronise les disponibilités et automatise
              l&apos;attribution, les acomptes et les commissions.
            </p>
            <Link
              href="/signup"
              className="rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-black transition-opacity hover:opacity-85"
            >
              Commencer gratuitement
            </Link>
          </div>

          <div className="pointer-events-none flex flex-col items-center gap-3 pb-8">
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/60">
              Faites défiler
            </span>
            <span className="h-10 w-px overflow-hidden bg-white/20">
              <motion.span
                animate={{ y: [-40, 40] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="block h-full w-full bg-white/70"
              />
            </span>
          </div>
        </div>

        {/* Respiration : les portes s'ouvrent seules avant l'arrivée du texte */}
        <div style={{ height: `${GAP_VH}vh` }} />

        {/* Écran 2 — section transmise, en transparence sur la vidéo */}
        {children}

        {/* Respiration finale : la cour se révèle seule avant la suite */}
        <div style={{ height: `${TAIL_VH}vh` }} />
      </div>
    </section>
  );
}
