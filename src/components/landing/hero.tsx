"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Users, Ticket, BarChart3, Network, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const words = ["restaurant", "club", "festival", "événement"];

const phoneCards = [
  {
    title: "Listes",
    sub: "Gérez vos invités, validez les entrées et suivez chaque couvert en temps réel.",
    badge: "GUESTLIST",
    gradient: "from-blue-600 to-blue-900",
    icon: Users,
  },
  {
    title: "Événements",
    sub: "Planifiez vos soirées, définissez les capacités et publiez en un clic.",
    badge: "EVENTS",
    gradient: "from-purple-600 to-indigo-900",
    icon: Ticket,
    videoSrc: "/videos/events.mp4",
  },
  {
    title: "Dashboard",
    sub: "Vue complète de votre établissement — stats, réservations et performance.",
    badge: "ANALYTICS",
    gradient: "from-emerald-600 to-teal-900",
    icon: BarChart3,
  },
  {
    title: "Réseau RP",
    sub: "Connectez-vous aux meilleurs concierges et promoteurs de votre ville.",
    badge: "NETWORK",
    gradient: "from-sky-600 to-cyan-900",
    icon: Network,
  },
  {
    title: "Commissions",
    sub: "Suivi automatique des paiements et versements pour votre réseau.",
    badge: "PREMIUM",
    gradient: "from-amber-600 to-orange-900",
    icon: CreditCard,
  },
];

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

  const titleStatic = "Gestion des RP pour votre";

  return (
    <section className="relative isolate overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-14 sm:py-20">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="mt-3 text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-[family-name:var(--font-manrope)]"
          >
            {titleStatic.split(" ").map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-3 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.08 + letterIndex * 0.02,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-white"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
            <br />
            <span
              className={`inline-block text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.35)] transition-all duration-400 ease-in-out ${
                isAnimating
                  ? "translate-y-4 opacity-0"
                  : "translate-y-0 opacity-100"
              }`}
            >
              {words[currentIndex]}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-4 max-w-2xl text-center text-sm sm:text-base text-white/60 font-[family-name:var(--font-inter)]"
          >
            Améliorez et contrôlez les performances de votre équipe de
            relations publiques.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          >
            <Link
              href="/signup"
              className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full px-8 py-3.5 text-sm shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.4)] transition-all duration-300 hover:scale-[1.02] font-[family-name:var(--font-manrope)]"
            >
              Commencer
            </Link>
            <Link
              href="/signup?role=concierge"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors font-[family-name:var(--font-manrope)]"
            >
              Je suis un Concierge/RP
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>

          {/* Phone Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-14 grid w-full gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
          >
            {phoneCards.map((card, i) => {
              const visibility =
                i <= 2
                  ? ""
                  : i === 3
                    ? "hidden md:block"
                    : "hidden lg:block";
              return (
                <div key={i} className={visibility}>
                  <PhoneCard
                    title={card.title}
                    sub={card.sub}
                    badge={card.badge}
                    gradient={card.gradient}
                    icon={card.icon}
                    videoSrc={card.videoSrc}
                  />
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PhoneCard({
  title,
  sub,
  badge,
  gradient,
  icon: Icon,
  videoSrc,
}: {
  title: string;
  sub: string;
  badge: string;
  gradient: string;
  icon: typeof Users;
  videoSrc?: string;
}) {
  return (
    <div className="relative rounded-[28px] liquid-glass p-2">
      <div className={`relative aspect-[9/19] w-full overflow-hidden rounded-2xl bg-gradient-to-b ${gradient}`}>
        {/* Video background */}
        {videoSrc && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {/* Decorative background elements */}
        <div className="absolute inset-0">
          {!videoSrc && (
            <>
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute bottom-1/4 left-1/4 w-24 h-24 rounded-full bg-white/3 blur-xl" />
            </>
          )}
          <Icon
            size={120}
            strokeWidth={0.5}
            className="absolute bottom-8 right-4 text-white/[0.06]"
          />
        </div>

        {/* Dark overlay for video readability */}
        {videoSrc && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        )}

        {/* Content overlay */}
        <div className="relative z-10 p-4 h-full flex flex-col">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/20" />
          <div className="space-y-2 flex-1">
            <h3 className="text-3xl font-bold leading-snug text-white/90 font-[family-name:var(--font-manrope)]">
              {title}
            </h3>
            <p className="text-xs text-white/60 font-[family-name:var(--font-inter)] leading-relaxed">
              {sub}
            </p>
            <div className="mt-3 inline-flex items-center rounded-full bg-blue-400/20 border border-blue-400/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-blue-300 font-semibold">
              {badge}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
