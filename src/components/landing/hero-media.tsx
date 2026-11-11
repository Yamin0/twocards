"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/* Fond plein cadre d'un héros : une photo, ou une vidéo posée sur son
   affiche.

   L'affiche (ou la photo) passe par next/image : servie à la bonne taille,
   préchargée, elle est l'image du premier écran. La vidéo, elle, ne pèse
   rien au chargement (preload="none", pas d'autoplay dans le HTML) : le
   script la lance quand le héros est à l'écran et la met en pause dès
   qu'il en sort. Elle ne démarre jamais en mouvement réduit ni en mode
   économie de données : l'affiche reste alors seule. */

export type HeroMediaProps = {
  /* Photo fixe, ou affiche de la vidéo. */
  image: string;
  video?: {
    src: string;
    /* Encodage plus léger servi sous 768 px, s'il existe. */
    srcMobile?: string;
    /* À false, la séquence se joue une fois et reste sur sa dernière image. */
    loop?: boolean;
    /* Vitesse de lecture (1 par défaut). */
    rate?: number;
  };
};

export function HeroMedia({ image, video }: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rate = video?.rate ?? 1;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      connection?.saveData
    ) {
      return;
    }
    /* playbackRate n'existe pas en attribut HTML et se réinitialise à
       chaque chargement de source : on le repose sur loadedmetadata. */
    const applyRate = () => {
      v.playbackRate = rate;
    };
    v.addEventListener("loadedmetadata", applyRate);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!v.ended) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener("loadedmetadata", applyRate);
    };
  }, [rate]);

  return (
    <>
      <Image
        src={image}
        alt=""
        fill
        preload
        fetchPriority="high"
        sizes="100vw"
        className="object-cover"
      />
      {video && (
        <video
          ref={videoRef}
          muted
          playsInline
          loop={video.loop ?? true}
          preload="none"
          disablePictureInPicture
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        >
          {video.srcMobile && (
            <source src={video.srcMobile} type="video/mp4" media="(max-width: 767px)" />
          )}
          <source src={video.src} type="video/mp4" />
        </video>
      )}
    </>
  );
}
