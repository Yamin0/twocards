"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { BackgroundPaths } from "@/components/ui/background-paths";

const words = ["restaurant", "club", "festival", "evenement"];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const titleStatic = "Plateforme tout-en-un concue pour votre";

  return (
    <BackgroundPaths>
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="container mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="max-w-5xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tighter font-[family-name:var(--font-manrope)]">
              {titleStatic.split(" ").map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block mr-3 last:mr-0">
                  {word.split("").map((letter, letterIndex) => (
                    <motion.span
                      key={`${wordIndex}-${letterIndex}`}
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: wordIndex * 0.1 + letterIndex * 0.03,
                        type: "spring",
                        stiffness: 150,
                        damping: 25,
                      }}
                      className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-primary-dark/80"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
              <br />
              <span
                className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 transition-all duration-400 ease-in-out ${
                  isAnimating
                    ? "translate-y-4 opacity-0"
                    : "translate-y-0 opacity-100"
                }`}
              >
                {words[currentIndex]}
              </span>
            </h1>

            <p className="mx-auto mt-2 max-w-xl font-[family-name:var(--font-inter)] text-base leading-relaxed text-on-surface-variant lg:text-lg">
              Gerez les listes d&apos;invites, les reservations de tables et
              votre reseau de RP et concierges depuis un tableau de bord
              unique.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <Link
                href="/signup"
                className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 p-px rounded-2xl backdrop-blur-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <span className="flex items-center rounded-[1.15rem] px-8 py-4 text-sm font-semibold backdrop-blur-md bg-primary hover:bg-primary-dark text-white transition-all duration-300 group-hover:-translate-y-0.5">
                  <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                    Commencer en tant qu&apos;etablissement
                  </span>
                  <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300">
                    &rarr;
                  </span>
                </span>
              </Link>
              <Link
                href="/signup?role=concierge"
                className="group inline-flex items-center gap-2 font-[family-name:var(--font-manrope)] text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary-dark"
              >
                Je suis un Concierge/RP
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </BackgroundPaths>
  );
}
