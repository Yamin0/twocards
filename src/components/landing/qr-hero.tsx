"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";

/* Héros en deux volets : l'accroche à gauche, la démonstration à droite.
   La vidéo tourne muette en boucle comme décor, et une pastille l'ouvre en
   grand, avec le son, depuis le début — c'est un explainer de 30 s, il se
   comprend dans l'ordre.

   La vidéo occupe tout le volet droit, sans cadre ni fond autour d'elle.
   En deux colonnes seulement à partir de lg — plus bas, tout s'empile.

   Deux encodages de la même source (video/TCVIDEO.mp4, 66 Mo) :
   - tc-hero-720.mp4 (1,6 Mo, sans piste audio) pour le décor ;
   - tc-hero.mp4 (1080p, 4,4 Mo, audio AAC) pour la lecture en grand.

   Les deux balises refusent le menu contextuel et le bouton de
   téléchargement des contrôles natifs. Un fichier servi reste récupérable
   par qui ouvre les outils du navigateur : c'est une protection contre le
   clic droit, pas un DRM. */
const VIDEO_LOOP = "/videos/tc-hero-720.mp4";
const VIDEO_FULL = "/videos/tc-hero.mp4";
const VIDEO_POSTER = "/videos/tc-hero-poster.jpg";

const blockContextMenu = (e: React.SyntheticEvent) => e.preventDefault();

export function QrHero() {
  const [open, setOpen] = useState(false);
  const loopRef = useRef<HTMLVideoElement>(null);

  /* En reduced-motion, le décor reste sur son poster. */
  useEffect(() => {
    const v = loopRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
    }
  }, []);

  /* La boucle s'arrête pendant la lecture en grand : deux vidéos qui
     tournent en même temps, dont une derrière un voile, c'est du décodage
     pour rien — et un faux mouvement en périphérie. */
  const openModal = useCallback(() => {
    loopRef.current?.pause();
    setOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setOpen(false);
    const v = loopRef.current;
    if (v && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.play().catch(() => {});
    }
  }, []);

  return (
    <section className="font-body">
      {/* Bandeau noir : la navigation se pose sur un aplat, à la manière
          d'un chrome de site, et non plus en transparence sur une vidéo. */}
      <div className="bg-[#0a0a0a]">
        <LandingNavbar variant="dark" />
      </div>

      <div className="grid items-stretch lg:grid-cols-2">
        {/* Volet gauche — accroche. Les graisses de Satoshi font toute la
            hiérarchie : 700 au titre, 300 à l'accent italique, 400 au
            texte courant, 500 aux libellés d'action.

            Le bloc est centré dans son volet, verticalement par le flex et
            horizontalement par la marge automatique : le texte reste aligné
            à gauche, mais l'ensemble se pose au milieu de la colonne. */}
        <div className="flex flex-col items-center justify-center bg-[var(--landing-ivory)] px-6 py-14 md:px-12 md:py-16 lg:px-10 xl:px-12">
          <div className="w-full max-w-lg">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              /* La ligne « Bien plus qu'un » doit tenir d'un seul tenant : la
                 taille est bornée pour qu'elle ne se brise jamais en deux. */
              className="mb-6 font-title text-[42px] font-bold leading-[1.04] tracking-[-0.035em] text-[var(--landing-ink)] sm:text-[52px] lg:text-[46px] xl:text-[56px] 2xl:text-[62px]"
            >
              Bien plus qu&apos;un
              <br />
              <em className="font-light italic">QR code</em>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14 }}
              className="mb-9 text-[17px] font-normal leading-relaxed text-[var(--landing-ink)]/70 md:text-[18px]"
            >
              Un QR en chambre, un lien par e-mail ou WhatsApp. Votre client
              découvre votre sélection, réserve en quelques secondes, et vous
              suivez tout : arrivée, facture vérifiée, commission.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22 }}
              className="flex flex-col items-start gap-5 sm:flex-row sm:items-center"
            >
              <Link
                href="/signup"
                className="rounded-full bg-[var(--landing-ink)] px-8 py-3.5 text-[14px] font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-80"
              >
                Demander un accès
              </Link>
              <button
                type="button"
                onClick={openModal}
                className="text-[13px] font-medium text-[var(--landing-ink)]/60 underline decoration-black/20 underline-offset-4 transition-colors hover:text-[var(--landing-ink)]"
              >
                Voir la démo · 30 s
              </button>
            </motion.div>
          </div>
        </div>

        {/* Volet droit — la vidéo occupe tout le volet, sans cadre ni
            fond visible autour. object-cover : le volet suit la hauteur de
            l'accroche, l'image se rogne de quelques pourcents sur les côtés
            plutôt que de laisser une bande. Sur mobile, le volet reprend le
            16/9 de la source, il n'y a alors plus rien à rogner. */}
        <div className="relative aspect-video overflow-hidden bg-[#e8f2fb] lg:aspect-auto">
          <video
            ref={loopRef}
            src={VIDEO_LOOP}
            poster={VIDEO_POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noremoteplayback"
            onContextMenu={blockContextMenu}
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />

          <motion.button
            type="button"
            onClick={openModal}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            /* Sur une scène claire, la pastille est encre et non blanche —
               l'inverse du modèle sur vidéo sombre, pour le même contraste.
               Posée en bas et non au centre : au centre, elle masquerait le
               texte de l'explainer. */
            className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-[var(--landing-ink)] py-3 pl-3.5 pr-5 text-[12px] font-medium text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] md:bottom-8 md:text-[13px]"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-white text-[var(--landing-ink)]">
              <Play size={11} fill="currentColor" className="ml-0.5" />
            </span>
            {/* Libellé court sur mobile : le long occupe toute la largeur. */}
            <span className="sm:hidden">Voir la vidéo · 30 s</span>
            <span className="hidden sm:inline">
              Découvrir TwoCards en 30 secondes
            </span>
          </motion.button>
        </div>
      </div>

      <VideoModal open={open} onClose={closeModal} />
    </section>
  );
}

/* Lecteur en grand : voile noir, vidéo 16/9 centrée, contrôles natifs (les
   seuls fiables au clavier et au lecteur d'écran), sans bouton de
   téléchargement. Échap ou un clic hors du cadre ferment ; le défilement de
   la page est gelé tant qu'il est ouvert. */
function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Vidéo de présentation de TwoCards"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 font-body md:p-12"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer la vidéo"
            className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={22} strokeWidth={1.5} />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            <video
              src={VIDEO_FULL}
              poster={VIDEO_POSTER}
              autoPlay
              controls
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noremoteplayback"
              onContextMenu={blockContextMenu}
              className="h-full w-full"
            >
              Votre navigateur ne peut pas lire cette vidéo.
            </video>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
