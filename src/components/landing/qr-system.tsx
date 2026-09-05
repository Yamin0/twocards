"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  Check,
  Mail,
  MessageCircle,
  ScanLine,
} from "lucide-react";

/* Le parcours du système QR, dans l'ordre où la vidéo le raconte : un seul
   QR, la sélection, la réservation, le suivi. Chaque étape est illustrée
   d'un mini-écran simulé, dans la même écriture que les différenciateurs. */

const panel = "rounded-2xl border border-black/10 bg-white";

/* Le chevalet en chêne gravé, tel qu'il est posé sur le chevet : c'est le
   support physique du QR, pas un carré généré. Le PNG est détouré, il se pose
   donc directement sur le blanc de la carte. */
function QrVisual() {
  const chips = [
    { icon: BedDouble, label: "En chambre" },
    { icon: Mail, label: "Par e-mail" },
    { icon: MessageCircle, label: "Par WhatsApp" },
  ];
  return (
    <div className={`${panel} flex flex-col items-center gap-4 p-5`}>
      <Image
        src="/qr-stand.png"
        alt="Chevalet TwoCards en chêne, gravé du QR code, posé sur le chevet"
        width={440}
        height={795}
        sizes="120px"
        className="h-[140px] w-auto"
      />
      <div className="flex flex-wrap justify-center gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-[10px] font-medium text-[var(--landing-ink)]/70"
          >
            <chip.icon size={11} strokeWidth={1.5} />
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
    <div className={`${panel} p-4 text-left`}>
      <p className="mb-2 text-[10px] uppercase tracking-wide text-[var(--landing-ink)]/45">
        Sélection · Riad Al Andalus
      </p>
      {venues.map((v) => (
        <div
          key={v.name}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5"
        >
          <div>
            <p className="text-[12px] font-medium text-[var(--landing-ink)]">
              {v.name}
            </p>
            <p className="text-[10px] text-[var(--landing-ink)]/50">{v.slot}</p>
          </div>
          {v.tag ? (
            <span className="rounded-md bg-[var(--landing-ink)] px-2 py-0.5 text-[9px] font-medium text-[var(--landing-ivory)]">
              {v.tag}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-600">Disponible</span>
          )}
        </div>
      ))}
    </div>
  );
}

function BookingVisual() {
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check size={14} strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-[12px] font-medium text-[var(--landing-ink)]">
            Réservation confirmée
          </p>
          <p className="text-[10px] text-[var(--landing-ink)]/50">
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
          className="flex items-center justify-between border-t border-black/[0.07] py-2 text-[11px]"
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
    { label: "Commission du mois", value: "3 640 MAD", bar: 0 },
  ];
  return (
    <div className={`${panel} p-4 text-left`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide text-[var(--landing-ink)]/45">
          Tableau de bord
        </p>
        <span className="flex items-center gap-1 text-[10px] text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="py-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--landing-ink)]/55">{r.label}</span>
            <span className="font-medium text-[var(--landing-ink)]">
              {r.value}
            </span>
          </div>
          {r.bar > 0 && (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[var(--landing-ink)]"
                style={{ width: `${r.bar}%` }}
              />
            </div>
          )}
        </div>
      ))}
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
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 font-body md:px-16 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center md:mb-20"
        >
          <h2 className="font-title text-3xl font-bold leading-tight tracking-[-0.03em] text-[var(--landing-ink)] md:text-5xl">
            Un seul QR. <em className="italic">Tout le parcours.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70">
            Le service d&apos;une conciergerie, la traçabilité en plus. Du scan
            à la commission, chaque étape est horodatée et attribuée à son
            origine.
          </p>
        </motion.div>

        {/* Les mini-écrans n'ont pas la même hauteur : sans alignement, les
            numéros et les titres démarreraient chacun à une hauteur
            différente. Chaque étape devient donc une sous-grille de deux
            rangées (visuel, texte) calées sur celles du conteneur : les
            visuels partagent une rangée commune, dimensionnée sur le plus
            haut, et tous les textes commencent au même niveau. Les visuels
            sont posés en bas de cette rangée, sur une ligne d'assise.

            L'écart de rangée (gap-y) sert alors d'espace entre le visuel et
            son texte ; l'espace entre deux étapes empilées revient à la
            marge basse des articles. */}
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 sm:grid-rows-[auto_auto] sm:gap-y-7 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 4) * 0.1 }}
              className="flex flex-col sm:mb-10 sm:grid sm:grid-rows-subgrid sm:row-span-2 lg:mb-0"
            >
              <div className="mb-7 flex w-full items-end sm:mb-0">
                <step.visual />
              </div>
              <div>
                <span className="font-title text-[26px] font-light leading-none text-[var(--landing-mute)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[16px] font-semibold leading-snug text-[var(--landing-ink)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {step.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Le même QR, lu différemment selon le métier. Chaque carte renvoie sur la
   page dédiée, où le parcours est détaillé. */
const AUDIENCES = [
  {
    href: "/hotels",
    label: "Hôtels & riads",
    where: "En chambre, avant l'arrivée",
    description:
      "Le client réserve seul, à toute heure. Chaque réservation est attribuée à votre établissement, conforme à votre politique interne.",
  },
  {
    href: "/restaurants",
    label: "Établissements",
    where: "À la porte, au check-in",
    description:
      "Le scan à l'arrivée prouve la visite. La commission se calcule sur la facture vérifiée, aux conditions fixées dès l'origine.",
  },
  {
    href: "/concierges",
    label: "Concierges / RP",
    where: "Sur une carte, dans un message",
    description:
      "Votre QR suit votre client. Vous savez quand il est arrivé, et la commission apparaît validée sans relancer personne.",
  },
  {
    href: "/influenceurs",
    label: "Influenceurs",
    where: "En bio, en story",
    description:
      "Un lien unique couvre toute votre sélection. Chaque réservation issue de vos recommandations vous est attribuée et rémunérée.",
  },
];

export function QrAudiences() {
  return (
    <section className="border-t border-black/[0.06] bg-[var(--landing-ivory)] px-6 py-24 font-body md:px-16 md:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <h2 className="font-title text-3xl font-bold leading-tight tracking-[-0.03em] text-[var(--landing-ink)] md:text-4xl">
            Le même QR,
            <br />
            <em className="italic">pour chaque métier</em>.
          </h2>
          <p className="max-w-sm text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
            Où qu&apos;il soit posé, le QR sait d&apos;où vient le client. Le
            réseau, lui, est commun : les établissements vérifiés, les
            disponibilités réelles, les commissions calculées sur du revenu
            vérifié.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <motion.div
              key={a.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            >
              <Link
                href={a.href}
                className="group flex h-full flex-col border-t border-black/[0.08] px-1 py-8 transition-colors hover:border-black/30 md:px-5"
              >
                <span className="mb-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--landing-mute)]">
                  <ScanLine size={13} strokeWidth={1.5} />
                  {a.where}
                </span>
                <h3 className="text-[17px] font-semibold leading-snug text-[var(--landing-ink)]">
                  {a.label}
                </h3>
                <p className="mt-3 flex-1 text-[13px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {a.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/60 transition-colors group-hover:text-[var(--landing-ink)]">
                  En savoir plus
                  <ArrowRight
                    size={13}
                    strokeWidth={1.5}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
