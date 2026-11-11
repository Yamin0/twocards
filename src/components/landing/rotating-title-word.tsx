"use client";

import { useEffect, useState } from "react";

/* Mot tournant du titre : chaque mot sort vers le haut et le suivant monte
   à sa place, dans un léger flou. En mouvement réduit, le mot change sans
   animation (règle globale de globals.css).

   Animation en CSS pur (.landing-word-in / .landing-word-out) : ce mot est
   dans le titre du héros, il ne doit pas faire charger une bibliothèque
   d'animation au premier écran.

   La largeur reste figée sur le mot le plus long, donc le reste du titre ne
   bouge jamais. Le jeu qu'elle laisse autour des mots courts n'est pas
   centré mais rejeté du côté où la ligne est déjà vide : à droite en
   desktop, où le mot termine la ligne ; à gauche en mobile, où le titre
   passe à la ligne juste après. */

/* Rythme : un mot toutes les 2,6 s ; sortie puis entrée de 0,4 s chacune
   (même durée que les keyframes de globals.css). */
const EVERY_MS = 2600;
const SWAP_MS = 400;

export function RotatingTitleWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  /* "idle" : premier mot, rendu par le serveur, sans animation. */
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");

  useEffect(() => {
    let swap: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setPhase("out");
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setPhase("in");
      }, SWAP_MS);
    }, EVERY_MS);
    return () => {
      clearInterval(id);
      clearTimeout(swap);
    };
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
      <span
        key={words[index]}
        className={`col-start-1 row-start-1 justify-self-end whitespace-nowrap md:justify-self-start ${
          phase === "out" ? "landing-word-out" : phase === "in" ? "landing-word-in" : ""
        }`}
      >
        {words[index]}
      </span>
    </span>
  );
}
