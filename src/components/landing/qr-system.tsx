"use client";

import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import {
  BedDouble,
  Check,
  Mail,
  MessageCircle,
} from "lucide-react";
import {
  CONTAINER,
  SECTION,
  SectionHeader,
} from "@/components/landing/section-header";

/* Le parcours du système QR, dans l'ordre où le film le raconte : un seul
   QR, la sélection, la réservation, le suivi. Chaque étape est une tuile :
   une scène sable (la teinte chaude du film) qui porte un mini-écran
   simulé, puis le texte. Deux tuiles par rangée sur grand écran : les
   mini-écrans y ont la place d'être lisibles. */

const panel =
  "w-full rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-30px_rgba(60,40,10,0.35)]";

/* Un vrai QR, scannable : il renvoie sur le site, avec le même format d'URL
   que ceux générés depuis le tableau de bord hôtel (/?qr=<code>). */
const DEMO_QR_URL = "https://twocardspro.com/?qr=demo";

function QrVisual() {
  const chips = [
    { icon: BedDouble, label: "En chambre" },
    { icon: Mail, label: "Par e-mail" },
    { icon: MessageCircle, label: "Par WhatsApp" },
  ];
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Taille fixe en pixels, sans width: 100 % : le QR ne suit jamais la
          largeur de la scène. */}
      <div className="shrink-0 rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-[0_24px_60px_-30px_rgba(60,40,10,0.35)]">
        <QRCode
          value={DEMO_QR_URL}
          size={96}
          bgColor="#ffffff"
          fgColor="#0d0d0d"
          level="M"
          style={{ display: "block", width: 96, height: 96 }}
          aria-label="QR code de démonstration TwoCards"
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--landing-ink)]/75"
          >
            <chip.icon size={13} strokeWidth={1.5} />
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SelectionVisual() {
  const venues = [
    { name: "Rooftop · Hivernage", slot: "ce soir · 21:00", tag: "Recommandé" },
    { name: "Restaurant festif · Guéliz", slot: "ce soir · 22:30" },
    { name: "Beach club · Agafay", slot: "demain · 13:00" },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
        Sélection · Riad Al Andalus
      </p>
      {venues.map((v) => (
        <div
          key={v.name}
          className="flex items-center justify-between gap-3 border-t border-black/[0.07] py-3"
        >
          <div>
            <p className="text-[14px] font-medium text-[var(--landing-ink)]">
              {v.name}
            </p>
            <p className="text-[12px] text-[var(--landing-ink)]/50">{v.slot}</p>
          </div>
          {v.tag ? (
            <span className="shrink-0 rounded-md bg-[var(--landing-ink)] px-2 py-1 text-[11px] font-medium text-[var(--landing-ivory)]">
              {v.tag}
            </span>
          ) : (
            <span className="shrink-0 text-[12px] text-emerald-600">
              Disponible
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function BookingVisual() {
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check size={16} strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-[14px] font-medium text-[var(--landing-ink)]">
            Réservation confirmée
          </p>
          <p className="text-[12px] text-[var(--landing-ink)]/50">
            en 40 secondes, sans passer par le desk
          </p>
        </div>
      </div>
      {[
        ["Table", "4 couverts · sam. 21:00"],
        ["Acompte", "payé · 800 MAD"],
        ["Attribuée à", "Chambre 12 · QR chevet"],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]/50">{label}</span>
          <span className="font-medium text-[var(--landing-ink)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function TrackingVisual() {
  const rows = [
    { label: "Scans", value: "128", bar: 100 },
    { label: "Réservations", value: "41", bar: 32 },
    { label: "Arrivées confirmées", value: "39", bar: 30 },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          Tableau de bord
        </p>
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="py-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--landing-ink)]/55">{r.label}</span>
            <span className="font-medium text-[var(--landing-ink)]">
              {r.value}
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-[var(--landing-ink)]"
              style={{ width: `${r.bar}%` }}
            />
          </div>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between border-t border-black/[0.07] pt-3">
        <span className="text-[13px] text-[var(--landing-ink)]/55">
          Commission du mois
        </span>
        <span className="text-[15px] font-semibold text-[var(--landing-ink)]">
          3 640 MAD
        </span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Un seul QR",
    description:
      "Posé sur le chevet, glissé dans l'e-mail de confirmation ou envoyé par WhatsApp avant l'arrivée. Un code, trois points de contact, la même sélection derrière.",
    visual: QrVisual,
  },
  {
    title: "Il découvre votre sélection",
    description:
      "Les restaurants, rooftops, clubs et expériences que vous recommandez, aux vraies disponibilités. Vos adresses en tête, uniquement des établissements vérifiés.",
    visual: SelectionVisual,
  },
  {
    title: "Il réserve en quelques secondes",
    description:
      "Date, couverts, acompte : le client réserve seul, à toute heure. La réservation porte dès l'origine le QR qui l'a générée, chambre, lobby, table ou carte.",
    visual: BookingVisual,
  },
  {
    title: "Et vous, vous suivez tout",
    description:
      "Scans, réservations, arrivées confirmées et commissions apparaissent dans votre tableau de bord à l'instant où ils se produisent. Chaque ligne est auditable.",
    visual: TrackingVisual,
  },
];

export function QrFlow() {
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <SectionHeader
          title={
            <>
              Un seul QR.
              <br />
              <em className="font-light italic">Tout le parcours.</em>
            </>
          }
          intro="Le service d'une conciergerie, la traçabilité en plus. Du scan à la commission, chaque étape est horodatée et attribuée à son origine."
        />

        <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 md:gap-y-20">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
            >
              {/* Hauteur fixe : les quatre scènes s'alignent, quel que soit
                  le mini-écran qu'elles portent. */}
              <div className="flex h-[340px] items-center justify-center rounded-3xl bg-[#f3eee5] px-6 sm:h-[380px] sm:px-12">
                <div className="w-full max-w-[22rem]">
                  <step.visual />
                </div>
              </div>
              <div className="mt-8 flex gap-5 md:pr-10">
                <span className="pt-0.5 font-title text-[15px] font-medium tabular-nums text-[var(--landing-mute)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[21px] font-semibold leading-snug tracking-[-0.015em] text-[var(--landing-ink)] md:text-[24px]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
