"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* Mot tournant du titre : chaque mot sort vers le haut et le suivant monte
   à sa place, dans un léger flou. En reduced-motion, simple fondu croisé.

   La largeur reste figée sur le mot le plus long, donc le reste du titre ne
   bouge jamais. Le jeu qu'elle laisse autour des mots courts n'est pas
   centré mais rejeté du côté où la ligne est déjà vide : à droite en
   desktop, où le mot termine la ligne ; à gauche en mobile, où le titre
   passe à la ligne juste après. */
export function RotatingTitleWord({ words }: { words: string[] }) {
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
      {/* Gabarit invisible : le mot le plus long fixe la largeur. */}
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
          className="col-start-1 row-start-1 justify-self-end whitespace-nowrap md:justify-self-start"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
