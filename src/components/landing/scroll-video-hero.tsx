"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { LandingNavbar } from "@/components/landing/navbar";

/* Hero cinématique : la vidéo (portes marocaines) est une timeline pilotée
   par le scroll, jamais lue en autoplay. Le viewport reste épinglé (sticky)
   pendant TRACK_VH de défilement ; en fin de piste les portes sont ~45 %
   ouvertes (OPEN_FRACTION de la durée totale). Un amortissement exponentiel
   dans une boucle rAF lisse le scrub dans les deux sens — aucun saut,
   aucune relecture. */

/* La vidéo dure 10 s mais les portes atteignent 40-50 % d'ouverture
   vers 2,8 s : on ne scrubbe que cette fraction de la timeline. */
const OPEN_FRACTION = 0.28;
const TRACK_VH = 300;
const DAMPING = 0.14;

export function ScrollVideoHero() {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
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

        const target =
          scrollYProgress.get() * video.duration * OPEN_FRACTION;
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

  const contentOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.35], [0, -48]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <div
      ref={trackRef}
      className="relative"
      style={{ height: `${TRACK_VH}vh` }}
    >
      <div className="sticky top-0 h-dvh overflow-hidden bg-black">
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

        {/* Voiles de lisibilité */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/65 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-20">
          <LandingNavbar variant="dark" />
        </div>

        {/* Contenu éditorial — s'efface pendant l'ouverture des portes */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center font-body"
        >
          <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.28em] text-white/70">
            Le channel manager des concierges &amp; RP
          </p>
          <h1 className="mb-8 max-w-4xl font-title text-[38px] font-normal leading-[1.12] tracking-[-0.02em] text-white md:text-[64px]">
            Chaque recommandation
            <br />
            devient une réservation <em className="italic">traçable</em>.
          </h1>
          <p className="mb-10 max-w-xl text-[15px] font-normal leading-relaxed text-white/75">
            TwoCards connecte les établissements aux concierges et RP vérifiés,
            synchronise les disponibilités et automatise l&apos;attribution,
            les acomptes et les commissions.
          </p>
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-black transition-opacity hover:opacity-85"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/signup?role=concierge"
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
            >
              Je suis concierge / RP
            </Link>
          </div>
        </motion.div>

        {/* Indice de scroll */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 font-body"
        >
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
        </motion.div>
      </div>
    </div>
  );
}
