"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { useLocale, useT } from "@/lib/i18n/client";

/* Héros : l'accroche centrée sur fond noir, puis le film de marque en grand
   format, à cheval entre le noir et l'ivoire de la page.

   Le film (60 s, musique, textes incrustés) tourne muet en boucle comme
   aperçu. « Regarder le film » le reprend au début, avec le son et les
   contrôles natifs ; à la fin, il redevient l'aperçu muet. Rien n'est posé
   par-dessus l'image : le film porte déjà ses propres titres.

   Deux encodages de la même source (Downloads/twocards-hero-film-60s-
   musique-C.mp4, 1080p 24 i/s) :
   - tc-film-1080.mp4 (~10 Mo) à partir de lg ;
   - tc-film-720.mp4 (~5 Mo) en dessous.
   La version anglaise (voix off, titres et interfaces en anglais) a ses
   propres fichiers, suffixés -en. */
const FILMS = {
  fr: {
    hd: "/videos/tc-film-1080.mp4",
    sd: "/videos/tc-film-720.mp4",
    poster: "/videos/tc-film-poster.jpg",
  },
  en: {
    hd: "/videos/tc-film-en-1080.mp4",
    sd: "/videos/tc-film-en-720.mp4",
    poster: "/videos/tc-film-en-poster.jpg",
  },
} as const;

const blockContextMenu = (e: React.SyntheticEvent) => e.preventDefault();
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function QrHero() {
  const t = useT();
  const locale = useLocale();
  const film = FILMS[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [withSound, setWithSound] = useState(false);

  /* L'aperçu muet ne tourne que s'il est à l'écran, et jamais en
     reduced-motion : il reste alors sur son poster. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (prefersReducedMotion()) {
      v.pause();
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!v.muted) return;
      if (entry.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
    // La vidéo est remontée à chaque changement de langue (key).
  }, [locale]);

  /* Appelé dans le geste de l'utilisateur : le son n'est autorisé par le
     navigateur que s'il est activé dans le clic lui-même. */
  const playWithSound = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    frameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    v.loop = false;
    v.muted = false;
    v.currentTime = 0;
    setWithSound(true);
    v.play().catch(() => {});
  }, []);

  const backToPreview = useCallback(() => {
    const v = videoRef.current;
    setWithSound(false);
    if (!v) return;
    v.muted = true;
    v.loop = true;
    v.currentTime = 0;
    if (!prefersReducedMotion()) v.play().catch(() => {});
  }, []);

  return (
    <section className="font-body">
      <div className="bg-[#0a0a0a] text-white">
        <LandingNavbar variant="dark" />

        {/* max-w-5xl : le titre anglais, plus long, tient aussi sur une ligne
            à partir de lg — sinon le bloc noir descend d'une ligne. */}
        <div className="mx-auto max-w-5xl px-6 pb-12 pt-14 text-center md:pb-16 md:pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-title text-[44px] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[60px] lg:text-[76px]"
          >
            {t(
              <>
                Bien plus qu&apos;un <em className="font-light italic whitespace-nowrap">QR code</em>.
              </>,
              <>
                Much more than a <em className="font-light italic whitespace-nowrap">QR code</em>.
              </>,
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.14 }}
            className="mx-auto mt-7 max-w-xl text-[16px] leading-relaxed text-white/60 md:text-[18px]"
          >
            {t(
              "Un QR en chambre, un lien par e-mail ou WhatsApp. Votre client découvre votre sélection, réserve en quelques secondes, et vous suivez tout : arrivée, facture vérifiée, commission.",
              "A QR code in the room, a link by email or WhatsApp. Your guest browses your selection, books in seconds, and you track everything: arrival, verified bill, commission.",
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7"
          >
            <Link
              href="/signup"
              className="rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-[var(--landing-ink)] transition-opacity hover:opacity-85"
            >
              {t("Demander un accès", "Request access")}
            </Link>
            <button
              type="button"
              onClick={playWithSound}
              className="group flex items-center gap-3 text-[14px] font-medium text-white/75 transition-colors hover:text-white"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-white/25 transition-colors group-hover:border-white/60">
                <Play size={12} fill="currentColor" className="ml-0.5" />
              </span>
              {t("Regarder le film · 1 min", "Watch the film · 1 min")}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Le cadre du film chevauche la frontière noir / ivoire : le
          dégradé de fond coupe la section à mi-hauteur du cadre. */}
      <div className="bg-[linear-gradient(to_bottom,#0a0a0a_50%,var(--landing-ivory)_50%)] px-4 sm:px-6 md:px-10">
        <motion.div
          ref={frameRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-video max-w-6xl overflow-hidden rounded-xl bg-black shadow-[0_50px_120px_-40px_rgba(0,0,0,0.55)] ring-1 ring-white/10 md:rounded-2xl"
        >
          {/* key : changer de langue recharge la vidéo sur la bonne source. */}
          <video
            key={locale}
            ref={videoRef}
            poster={film.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            controls={withSound}
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noremoteplayback"
            onContextMenu={blockContextMenu}
            onEnded={backToPreview}
            aria-label={t("Film de présentation de TwoCards", "TwoCards introduction film")}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={film.hd} type="video/mp4" media="(min-width: 1024px)" />
            <source src={film.sd} type="video/mp4" />
            {t("Votre navigateur ne peut pas lire cette vidéo.", "Your browser cannot play this video.")}
          </video>

          {!withSound && (
            <button
              type="button"
              onClick={playWithSound}
              className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-full bg-black/45 py-2 pl-2 pr-4 text-[12px] font-medium text-white ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-black/65 md:bottom-6 md:left-6 md:text-[13px]"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-white text-[var(--landing-ink)]">
                <Play size={10} fill="currentColor" className="ml-0.5" />
              </span>
              {t("Regarder avec le son", "Watch with sound")}
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
