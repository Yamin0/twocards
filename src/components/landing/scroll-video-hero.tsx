"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useScroll } from "framer-motion";
import { LandingNavbar } from "@/components/landing/navbar";

/* Séquence cinématique : la vidéo des portes est épinglée en fond et sert de
   décor à deux écrans qui défilent par-dessus — l'accroche, puis la section
   passée en children. La lecture reste une timeline pilotée par le scroll :
   pause à la frame 0, scrub avant/arrière, retour exact à l'origine en haut
   de page, jamais d'autoplay.

   La vidéo est téléchargée intégralement (fetch en flux → blob) derrière un
   écran de chargement : indispensable sur mobile, où le navigateur ne
   précharge pas les vidéos et laisserait un fond noir, et sur les connexions
   lentes, où un scrub sur une vidéo partiellement bufferisée saccade. */

/* 1080p pour desktop (20 Mo), 720p pour mobile (9 Mo) : même timeline,
   même encodage all-intra, seul le poids du préchargement change. */
const VIDEO_SRC_DESKTOP = "/videos/hero-doors.mp4";
const VIDEO_SRC_MOBILE = "/videos/hero-doors-720.mp4";
const VIDEO_POSTER = "/videos/hero-doors-poster.jpg";
const DAMPING = 0.14;
/* Respiration finale : la cour se révèle seule avant le pied de page. */
const TAIL_VH = 40;

export function ScrollVideoHero({
  children,
  videoDesktop = VIDEO_SRC_DESKTOP,
  videoMobile = VIDEO_SRC_MOBILE,
  poster = VIDEO_POSTER,
  hero,
}: {
  children?: React.ReactNode;
  /* Toute autre scène que les portes doit fournir ses deux encodages
     all-intra : le scrub décode une image par frame et saccaderait sur un
     encodage classique. */
  videoDesktop?: string;
  videoMobile?: string;
  poster?: string;
  /* Remplace l'accroche par défaut. Sans lui, l'écran 1 reste celui de la
     page d'accueil. */
  hero?: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /* Préchargement : vidéo complète + polices, avec progression réelle. */
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const src = window.matchMedia("(max-width: 767px)").matches
      ? videoMobile
      : videoDesktop;

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
        const total = Number(res.headers.get("Content-Length")) || 0;
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (!cancelled && total) {
            setProgress(Math.min(0.97, received / total));
          }
        }
        objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
        if (!cancelled) setVideoUrl(objectUrl);
      } catch {
        // Téléchargement contrôlé impossible : on laisse la balise vidéo
        // se débrouiller plutôt que de bloquer l'accès au site.
        if (!cancelled) setVideoUrl(src);
      }

      try {
        await document.fonts.ready;
      } catch {}

      if (!cancelled) {
        setProgress(1);
        setPhase("fading");
        setTimeout(() => !cancelled && setPhase("done"), 750);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoDesktop, videoMobile]);

  /* Pas de défilement tant que le chargement couvre l'écran. */
  useEffect(() => {
    if (phase === "done") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [phase]);

  /* Deuxième filet pour iOS : si la frame a été composée pendant que l'écran
     de chargement couvrait la vidéo, elle peut ne jamais être réaffichée à sa
     disparition. Un micro-seek force le repaint ; le scrub ramènera la tête de
     lecture vers le haut de page tout seul. */
  useEffect(() => {
    if (phase !== "done") return;
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      video.currentTime = video.currentTime + 0.001;
    }
  }, [phase]);

  /* Scrub : le scroll pilote currentTime, lissé par amortissement. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* Chaque affectation de currentTime décode une frame (encodage
       all-intra). Au seuil de 1 ms, le crawl amorti déclenche un décodage à
       chaque frame d'écran — supportable sur desktop, mais sur mobile cela
       sature le fil principal et saccade tout le défilement de la section.
       On quantifie donc le seek mobile au pas d'une frame de la timeline
       (1/30 s) : moitié moins de décodages, dérive visuelle sous-frame. */
    const seekEpsilon = window.matchMedia("(max-width: 767px)").matches
      ? 1 / 30
      : 0.001;

    let raf = 0;
    let current = 0;
    let metaReady = false;

    const onMeta = () => {
      metaReady = true;
      // Force le rendu de la frame 0 (Safari/iOS ne peint rien avant un seek)
      video.currentTime = 0.001;
      /* Le seek seul ne suffit pas au tout premier chargement sur iOS : tant
         qu'aucune lecture n'a démarré, aucune frame n'est peinte et le fond
         reste noir (un aller-retour de navigation « réparait » la page, le
         fichier étant alors en cache). Lecture muette d'une frame, figée
         aussitôt — permise sans geste car muted + playsInline. */
      const kick = video.play();
      if (kick) kick.then(() => video.pause()).catch(() => {});
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
        if (
          !video.seeking &&
          Math.abs(video.currentTime - current) > seekEpsilon
        ) {
          video.currentTime = current;
        }
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, [scrollYProgress, videoUrl]);

  const pct = Math.round(progress * 100);

  return (
    <section ref={sectionRef} className="relative bg-black">
      {/* Écran de chargement : couvre le site tant que la vidéo complète
          et les polices ne sont pas prêtes. */}
      {phase !== "done" && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-[#0a0a0a] font-body transition-opacity duration-700 ${
            phase === "fading" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          role="status"
          aria-label="Chargement du site"
        >
          <span className="font-title text-[30px] font-medium tracking-tight text-white">
            twocards<span className="text-white/50">.</span>
          </span>
          <div className="flex flex-col items-center gap-4">
            <div className="h-px w-56 overflow-hidden bg-white/15">
              <div
                className="h-full bg-white transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/50">
              {pct} %
            </span>
          </div>
        </div>
      )}

      <LandingNavbar variant="dark" fixed />

      {/* Fond vidéo épinglé, commun aux deux écrans */}
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          poster={poster}
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
          {hero ?? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <h1 className="mb-8 max-w-4xl font-title text-[38px] font-normal leading-[1.12] tracking-[-0.02em] text-white md:text-[64px]">
                Ils vous amènent des clients.
                <br />
                Vous les payez au <em className="italic">résultat</em>.
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
          )}
        </div>

        {/* Écrans suivants — sections transmises, en transparence sur la vidéo */}
        {children}

        {/* Respiration finale : la cour se révèle seule avant la suite */}
        <div style={{ height: `${TAIL_VH}vh` }} />
      </div>
    </section>
  );
}
