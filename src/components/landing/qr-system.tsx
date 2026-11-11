"use client";

import QRCode from "react-qr-code";
import {
  BedDouble,
  Check,
  Mail,
  MessageCircle,
} from "lucide-react";
import {
  CONTAINER,
  DEMO_QR_URL,
  PANEL as panel,
  SECTION,
  SectionHeader,
  StepGrid,
} from "@/components/landing/section-header";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* Le parcours du système QR, dans l'ordre où le film le raconte : un seul
   QR, la sélection, la réservation, le suivi. Chaque étape est une tuile :
   une scène sable (la teinte chaude du film) qui porte un mini-écran
   simulé, puis le texte. Deux tuiles par rangée sur grand écran : les
   mini-écrans y ont la place d'être lisibles. */

function QrVisual() {
  const t = useT();
  const chips = [
    { icon: BedDouble, label: t("En chambre", "In the room") },
    { icon: Mail, label: t("Par e-mail", "By email") },
    { icon: MessageCircle, label: t("Par WhatsApp", "On WhatsApp") },
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
          aria-label={t("QR code de démonstration TwoCards", "TwoCards demo QR code")}
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
  const t = useT();
  const venues = [
    { name: "Rooftop · Hivernage", slot: t("ce soir · 21:00", "tonight · 21:00"), tag: t("Recommandé", "Recommended") },
    { name: t("Restaurant festif · Guéliz", "Party restaurant · Guéliz"), slot: t("ce soir · 22:30", "tonight · 22:30") },
    { name: "Beach club · Agafay", slot: t("demain · 13:00", "tomorrow · 13:00") },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="mb-2 text-[12px] font-medium text-[var(--landing-ink)]/65">
        {t("Sélection", "Selection")} · Riad Al Andalus
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
            <p className="text-[12px] text-[var(--landing-ink)]/65">{v.slot}</p>
          </div>
          {v.tag ? (
            <span className="shrink-0 rounded-md bg-[var(--landing-ink)] px-2 py-1 text-[11px] font-medium text-[var(--landing-ivory)]">
              {v.tag}
            </span>
          ) : (
            <span className="shrink-0 text-[12px] text-emerald-700">
              {t("Disponible", "Available")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function BookingVisual() {
  const t = useT();
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check size={16} strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-[14px] font-medium text-[var(--landing-ink)]">
            {t("Réservation confirmée", "Reservation confirmed")}
          </p>
          <p className="text-[12px] text-[var(--landing-ink)]/65">
            {t("en 40 secondes, sans passer par le desk", "in 40 seconds, no call to the desk")}
          </p>
        </div>
      </div>
      {[
        [t("Table", "Table"), t("4 couverts · sam. 21:00", "4 covers · Sat 21:00")],
        [t("Acompte", "Deposit"), t("payé · 800 MAD", "paid · 800 MAD")],
        [t("Attribuée à", "Attributed to"), t("Chambre 12 · QR chevet", "Room 12 · bedside QR")],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]/65">{label}</span>
          <span className="font-medium text-[var(--landing-ink)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function TrackingVisual() {
  const t = useT();
  const rows = [
    { label: t("Scans", "Scans"), value: "128", bar: 100 },
    { label: t("Réservations", "Reservations"), value: "41", bar: 32 },
    { label: t("Arrivées confirmées", "Arrivals confirmed"), value: "39", bar: 30 },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] font-medium text-[var(--landing-ink)]/65">
          {t("Tableau de bord", "Dashboard")}
        </p>
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t("en direct", "live")}
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="py-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--landing-ink)]/65">{r.label}</span>
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
        <span className="text-[13px] text-[var(--landing-ink)]/65">
          {t("Commission du mois", "Commission this month")}
        </span>
        <span className="text-[15px] font-semibold text-[var(--landing-ink)]">
          {t("3 640 MAD", "3,640 MAD")}
        </span>
      </div>
    </div>
  );
}

const getSteps = (t: Translate) => [
  {
    title: t("Un seul QR", "One QR code"),
    text: t(
      "Posé sur le chevet, glissé dans l'e-mail de confirmation ou envoyé par WhatsApp avant l'arrivée. Un code, trois points de contact, la même sélection derrière.",
      "On the bedside table, in the confirmation email or sent on WhatsApp before arrival. One code, three touchpoints, the same curated selection behind them."
    ),
    visual: QrVisual,
  },
  {
    title: t("Il découvre votre sélection", "Guests discover your selection"),
    text: t(
      "Les restaurants, rooftops, clubs et expériences que vous recommandez, aux vraies disponibilités. Vos adresses en tête, uniquement des établissements vérifiés.",
      "The restaurants, rooftops, clubs and experiences you recommend, with live availability. Your favourites first, and only verified venues."
    ),
    visual: SelectionVisual,
  },
  {
    title: t("Il réserve en quelques secondes", "They book in seconds"),
    text: t(
      "Date, couverts, acompte : le client réserve seul, à toute heure. La réservation porte dès l'origine le QR qui l'a générée, chambre, lobby, table ou carte.",
      "Date, covers, deposit: guests book on their own, at any hour. From the outset, every reservation carries the QR that generated it: room, lobby, table or menu."
    ),
    visual: BookingVisual,
  },
  {
    title: t("Et vous, vous suivez tout", "You track every step"),
    text: t(
      "Scans, réservations, arrivées confirmées et commissions apparaissent dans votre tableau de bord à l'instant où ils se produisent. Chaque ligne est auditable.",
      "Scans, reservations, confirmed arrivals and commissions appear in your dashboard the moment they happen. Every line is auditable."
    ),
    visual: TrackingVisual,
  },
];

export function QrFlow() {
  const t = useT();
  const STEPS = getSteps(t);
  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <SectionHeader
          title={t(
            <>
              Un seul QR.
              <br />
              Tout le parcours.
            </>,
            <>
              One QR code.
              <br />
              The whole journey.
            </>
          )}
          intro={t(
            "Le service d'une conciergerie, la traçabilité en plus. Du scan à la commission, chaque étape est horodatée et attribuée à son origine.",
            "The service of a concierge desk, with full traceability on top. From scan to commission, every step is timestamped and traced to its source."
          )}
        />

        <StepGrid items={STEPS} columns={2} />
      </div>
    </section>
  );
}
