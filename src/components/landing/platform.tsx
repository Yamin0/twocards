"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  Building2,
  UserRound,
  QrCode,
  Percent,
  Star,
  ScanLine,
  Link2,
  ChartLine,
} from "lucide-react";

/* Section « plateforme » de la page d'accueil : dit explicitement ce que
   twocards fait, pour qui, et renvoie vers les trois pages métier — dans
   l'esprit des pages d'accueil SevenRooms / Fourvenues où chaque audience
   trouve sa porte d'entrée en un écran. */

const AUDIENCES = [
  {
    icon: BedDouble,
    label: "Hôtels & riads",
    title: "Un QR par chambre, une commission par sortie",
    points: [
      { icon: QrCode, text: "QR codes traçables, menu de sorties choisi chambre par chambre" },
      { icon: Percent, text: "10 % du montant dépensé par vos clients, calculés automatiquement" },
      { icon: ScanLine, text: "Scans, réservations et satisfaction suivis en temps réel" },
    ],
    href: "/hotels",
    cta: "Découvrir l'offre hôtels",
  },
  {
    icon: Building2,
    label: "Restaurants, clubs & activités",
    title: "Des clients qualifiés, une réputation mesurée",
    points: [
      { icon: UserRound, text: "Des clients d'hôtels envoyés par les prescripteurs de la ville" },
      { icon: Star, text: "Un avis vérifié après chaque visite — votre satisfaction pilotable" },
      { icon: ChartLine, text: "CA apporté, sorties par semaine, commissions : tout est chiffré" },
    ],
    href: "/restaurants",
    cta: "Découvrir l'offre établissements",
  },
  {
    icon: UserRound,
    label: "Concierges & prescripteurs",
    title: "Votre carnet d'adresses, enfin rémunéré",
    points: [
      { icon: Link2, text: "Un lien unique à votre nom, chaque client attribué sans ambiguïté" },
      { icon: Percent, text: "Une commission sur ce que dépensent réellement vos clients" },
      { icon: ChartLine, text: "Suivi en temps réel et versement mensuel documenté" },
    ],
    href: "/concierges",
    cta: "Découvrir l'offre concierges",
  },
];

export function Platform() {
  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 md:px-16 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--landing-ink)]/40"
        >
          La plateforme
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mt-4 text-center font-title text-3xl font-normal leading-tight text-[var(--landing-ink)] md:text-4xl"
        >
          Chaque recommandation devient une réservation{" "}
          <em className="italic">traçable, notée et commissionnée.</em>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-6 max-w-3xl text-center text-[15px] leading-relaxed text-[var(--landing-ink)]/65"
        >
          twocards relie les hôtels, les concierges et les meilleurs
          établissements d&apos;une même ville. Le client d&apos;hôtel scanne un
          QR code, choisit sa sortie et réserve ; l&apos;établissement le
          reçoit et saisit le montant de l&apos;addition ; l&apos;apporteur
          touche sa commission, calculée automatiquement ; le client note son
          expérience. Tout le monde voit les mêmes chiffres.
        </motion.p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {AUDIENCES.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="group flex flex-col rounded-3xl border border-black/[0.08] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-1"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--landing-ink)] text-[var(--landing-ivory)]">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--landing-ink)]/40">
                  {a.label}
                </p>
                <h3 className="mt-2 font-title text-xl font-normal leading-snug text-[var(--landing-ink)]">
                  {a.title}
                </h3>
                <ul className="mt-5 flex-1 space-y-3">
                  {a.points.map((p) => {
                    const PIcon = p.icon;
                    return (
                      <li
                        key={p.text}
                        className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[var(--landing-ink)]/65"
                      >
                        <PIcon
                          size={15}
                          strokeWidth={1.5}
                          className="mt-0.5 shrink-0 text-[var(--landing-ink)]/35"
                        />
                        {p.text}
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={a.href}
                  className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--landing-ink)] transition-opacity hover:opacity-70"
                >
                  {a.cta}
                  <ArrowRight
                    size={15}
                    strokeWidth={1.5}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
