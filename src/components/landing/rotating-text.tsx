"use client";

import { useEffect, useState } from "react";

const words = ["restaurant", "club festival", "club de plage", "evenement"];

export function RotatingText() {
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

  return (
    <section className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 text-center">
        <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-primary-dark sm:text-4xl lg:text-5xl leading-tight">
          Plateforme tout-en-un
          <br />
          concue pour votre{" "}
          <span
            className={`inline-block text-primary transition-all duration-400 ease-in-out ${
              isAnimating
                ? "translate-y-4 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            {words[currentIndex]}
          </span>
        </h2>
      </div>
    </section>
  );
}
