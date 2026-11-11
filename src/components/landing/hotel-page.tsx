"use client";

import { DemoQr } from "@/components/landing/demo-qr";
import { RotatingTitleWord } from "@/components/landing/rotating-title-word";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";
import { getCostFaq } from "@/components/landing/faq-home";
import { CONTACT_MAILTO } from "@/components/landing/section-header";
import {
  ShortAudiencePage,
  panel,
} from "@/components/landing/short-audience-page";

/* Page Hôtels & riads, sur le gabarit commun des pages métiers. */

const SIGNUP = "/signup?role=hotel";

/* ─── Mini-écrans ──────────────────────────────────────────────────────── */

function RoomQrVisual() {
  const t = useT();
  return (
    <div className={`${panel} mx-auto flex max-w-[17rem] flex-col items-center gap-3 px-6 py-6`}>
      <p className="font-title text-[15px] font-semibold text-[var(--landing-ink)]">
        {t("Chambre 204", "Room 204")}
      </p>
      <DemoQr label={t("QR code de démonstration", "Demo QR code")} />
      <p className="text-center text-[12px] leading-snug text-[var(--landing-ink)]/65">
        {t(
          <>
            Scannez pour réserver
            <br />
            nos adresses favorites
          </>,
          <>
            Scan to book
            <br />
            our favourite places
          </>,
        )}
      </p>
    </div>
  );
}

function MessageVisual() {
  const t = useT();
  return (
    <div className="mx-auto flex max-w-[20rem] flex-col gap-2">
      <p className="text-center text-[11px] text-[var(--landing-ink)]/65">
        {t("WhatsApp ou e-mail · 3 jours avant l'arrivée", "WhatsApp or email · 3 days before arrival")}
      </p>
      <div className="max-w-[90%] self-start rounded-2xl rounded-bl-md border border-black/[0.08] bg-white p-3.5 text-[13px] leading-relaxed text-[var(--landing-ink)] shadow-[0_16px_40px_-20px_rgba(60,40,10,0.35)]">
        {t(
          "Bonjour Mme Laurent, votre suite vous attend samedi. Réservez dès maintenant vos tables et sorties :",
          "Hello Ms Laurent, your suite awaits you on Saturday. Book your tables and outings now:",
        )}
        <span className="mt-1.5 block font-medium text-[#1d5fd1]">
          twocardspro.com/s/riad-andalus
        </span>
      </div>
      <div className="max-w-[70%] self-end rounded-2xl rounded-br-md bg-[#dcf8c6] p-3 text-[13px] text-[var(--landing-ink)]">
        {t("Parfait, c'est réservé pour samedi soir. Merci !", "Perfect, it's booked for Saturday night. Thank you!")}
      </div>
    </div>
  );
}

function DashboardVisual() {
  const t = useT();
  const rows = [
    { place: t("Chambre 204", "Room 204"), count: 6, amount: "620 MAD" },
    { place: "Lobby", count: 11, amount: t("1 140 MAD", "1,140 MAD") },
    { place: "Spa", count: 4, amount: "380 MAD" },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-medium text-[var(--landing-ink)]/65">
          {t("Ce mois · par emplacement", "This month · by location")}
        </p>
      </div>
      {rows.map((r) => (
        <div
          key={r.place}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]">{r.place}</span>
          <span className="text-[var(--landing-ink)]/65">
            {t(`${r.count} réservations`, `${r.count} reservations`)}
          </span>
          <span className="w-20 text-right font-medium text-[var(--landing-ink)]">
            {r.amount}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-[13px] text-emerald-800">{t("Commission de l'hôtel", "Hotel commission")}</span>
        <span className="text-[16px] font-semibold text-emerald-700">{t("2 140 MAD", "2,140 MAD")}</span>
      </div>
    </div>
  );
}

/* ─── Contenu ──────────────────────────────────────────────────────────── */

const getWays = (t: Translate) => [
  {
    title: t("Un QR code dans la chambre", "A QR code in the room"),
    text: t(
      "Sur le chevet ou le bureau. Le client réserve seul, à toute heure, sans passer par le desk.",
      "On the bedside table or the desk. Guests book on their own, at any hour, without going through the front desk.",
    ),
    visual: RoomQrVisual,
  },
  {
    title: t("Un message avant l'arrivée", "A message before arrival"),
    text: t(
      "Un lien par e-mail ou WhatsApp. Le client arrive avec ses tables déjà réservées.",
      "A link by email or WhatsApp. Guests arrive with their tables already booked.",
    ),
    visual: MessageVisual,
  },
];

const getGains = (t: Translate) => [
  {
    title: t("Les tables introuvables", "The impossible tables"),
    text: t(
      "Les adresses complètes gardent des places pour le réseau.",
      "Fully booked venues hold seats back for the network.",
    ),
  },
  {
    title: t("Une part de chaque sortie", "A share of every outing"),
    text: t(
      "Calculée sur le montant réellement dépensé, versée chaque mois.",
      "Calculated on the amount actually spent, paid every month.",
    ),
  },
  {
    title: t("Chaque réservation rattachée", "Every reservation attributed"),
    text: t(
      "À la chambre, au lobby ou au spa qui l'a générée.",
      "To the room, lobby or spa that generated it.",
    ),
  },
  {
    title: t("Une équipe soulagée", "A lighter load for your team"),
    text: t(
      "Les clients réservent seuls, et une part peut revenir à la conciergerie.",
      "Guests book on their own, and a share can go to the concierge desk.",
    ),
  },
];

const getFaq = (t: Translate) => [
  {
    q: t(
      "TwoCards remplace-t-il notre PMS ou notre outil de conciergerie ?",
      "Does TwoCards replace our PMS or our concierge software?",
    ),
    a: t(
      "Non. TwoCards gère la réservation de bout en bout et restitue l'activité à votre équipe. Vos outils internes restent la source de vérité.",
      "No. TwoCards handles the reservation end to end and reports the activity back to your team. Your internal tools remain the source of truth.",
    ),
  },
  {
    q: t(
      "Et notre équipe de conciergerie, qu'est-ce qu'elle y gagne ?",
      "And what does our concierge team get out of it?",
    ),
    a: t(
      "Du temps, d'abord : les demandes simples se réservent seules depuis la chambre, et votre équipe se concentre sur ce qui demande vraiment son savoir-faire. La rémunération est versée à l'hôtel, qui choisit comment la répartir : une partie peut revenir à l'équipe de conciergerie, en toute transparence. Et chaque réservation reste visible et modifiable depuis son tableau de bord.",
      "Time, first of all: simple requests get booked straight from the room, so your team can focus on what truly needs its expertise. Rewards are paid to the hotel, which decides how to share them: part can go to the concierge team, with full transparency. And every reservation stays visible and editable from their dashboard.",
    ),
  },
  {
    q: t(
      "Notre conciergerie fait déjà ce travail. Pourquoi ajouter un QR ?",
      "Our concierge desk already does this. Why add a QR code?",
    ),
    a: t(
      "Parce que beaucoup de clients n'osent pas appeler la conciergerie pour une table. Par habitude, ils cherchent leurs adresses sur Instagram ou TikTok, et réservent ailleurs, sans vous. Le QR en chambre les ramène vers vos recommandations, au moment où ils se posent la question, et chaque réservation reste attribuée à votre hôtel.",
      "Because many guests hesitate to call the concierge desk just for a table. Out of habit, they look for places on Instagram or TikTok and book elsewhere, without you. The in-room QR code brings them back to your recommendations at the very moment they're wondering, and every reservation stays attributed to your hotel.",
    ),
  },
  getCostFaq(t),
  {
    q: t("Combien de temps pour être opérationnel ?", "How long does it take to get up and running?"),
    a: t(
      "Moins d'une journée : comptes vérifiés, QR imprimés, premières réservations le soir même.",
      "Less than a day: accounts verified, QR codes printed, first reservations that same evening.",
    ),
  },
];

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function HotelPage() {
  const t = useT();
  return (
    <ShortAudiencePage
      data={{
        hero: {
          media: {
            image: "/videos/hotels-hero-poster.jpg",
            video: { src: "/videos/hotels-hero-60.mp4", rate: 0.8 },
          },
          title: t(
            <>
              Offrez à vos clients{" "}
              <RotatingTitleWord words={["la table", "l'activité", "le service"]} />{" "}
              qu&apos;ils <em className="font-light italic">veulent vraiment</em>.
            </>,
            <>
              Give your guests{" "}
              <RotatingTitleWord words={["the table", "the experience", "the service"]} />{" "}
              they <em className="font-light italic">really want</em>.
            </>,
          ),
          intro: t(
            "Un QR code en chambre, un lien avant l'arrivée : vos clients réservent seuls vos adresses, et chaque réservation est attribuée à votre hôtel.",
            "A QR code in the room, a link before arrival: guests book your recommended places on their own, and every reservation is attributed to your hotel.",
          ),
          primary: { label: t("Équiper mon établissement", "Equip my property"), href: SIGNUP },
          secondary: { label: t("Parler à notre équipe", "Talk to our team"), href: CONTACT_MAILTO },
        },
        how: {
          title: t(
            <>
              Deux chemins.
              <br />
              Un seul suivi.
            </>,
            <>
              Two paths.
              <br />
              One record.
            </>,
          ),
          intro: t(
            "Sur place ou avant l'arrivée, le client passe par la même sélection, et votre équipe voit tout au même endroit.",
            "On site or before arrival, guests go through the same selection, and your team sees everything in one place.",
          ),
          items: getWays(t),
        },
        statement: {
          image: "/images/hotels-beach.jpg",
          text: t(
            "Le service que vos clients réclament. La traçabilité que votre direction exige.",
            "The service your guests ask for. The traceability your management requires.",
          ),
        },
        gains: {
          title: t(
"Ce que votre hôtel y gagne.",
            "What your hotel gains.",
          ),
          items: getGains(t),
          visual: DashboardVisual,
        },
        faq: getFaq(t),
        cta: {
          title: t(
            <>
              Donnez la table à vos clients.
              <br />
              Gardez la traçabilité.
            </>,
            <>
              Give your guests the table.
              <br />
              Keep the traceability.
            </>,
          ),
          text: t(
            "Un nombre limité d'établissements par quartier pendant le pilote à Marrakech.",
            "A limited number of properties per neighbourhood during the Marrakech pilot.",
          ),
          primary: { label: t("Équiper mon établissement", "Equip my property"), href: SIGNUP },
        },
      }}
    />
  );
}
