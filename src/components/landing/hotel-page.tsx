"use client";

import QRCode from "react-qr-code";
import { RotatingTitleWord } from "@/components/landing/rotating-title-word";
import {
  ShortAudiencePage,
  panel,
} from "@/components/landing/short-audience-page";

/* Page Hôtels & riads, sur le gabarit court des pages métiers. Le héros
   vidéo et la bande « Le service que vos clients réclament… » sont repris
   tels qu'ils étaient sur l'ancienne page. */

const SIGNUP = "/signup?role=hotel";

/* ─── Mini-écrans ──────────────────────────────────────────────────────── */

function RoomQrVisual() {
  return (
    <div className={`${panel} mx-auto flex max-w-[17rem] flex-col items-center gap-3 px-6 py-6`}>
      <p className="font-title text-[15px] font-semibold text-[var(--landing-ink)]">
        Chambre 204
      </p>
      <QRCode
        value="https://twocardspro.com/?qr=demo"
        size={96}
        bgColor="#ffffff"
        fgColor="#0d0d0d"
        level="M"
        style={{ display: "block", width: 96, height: 96 }}
        aria-label="QR code de démonstration"
      />
      <p className="text-center text-[12px] leading-snug text-[var(--landing-ink)]/55">
        Scannez pour réserver
        <br />
        nos adresses favorites
      </p>
    </div>
  );
}

function MessageVisual() {
  return (
    <div className="mx-auto flex max-w-[20rem] flex-col gap-2">
      <p className="text-center text-[11px] text-[var(--landing-ink)]/45">
        WhatsApp ou e-mail · 3 jours avant l&apos;arrivée
      </p>
      <div className="max-w-[90%] self-start rounded-2xl rounded-bl-md border border-black/[0.08] bg-white p-3.5 text-[13px] leading-relaxed text-[var(--landing-ink)] shadow-[0_16px_40px_-20px_rgba(60,40,10,0.35)]">
        Bonjour Mme Laurent, votre suite vous attend samedi. Réservez dès
        maintenant vos tables et sorties :
        <span className="mt-1.5 block font-medium text-[#1d5fd1]">
          twocardspro.com/s/riad-andalus
        </span>
      </div>
      <div className="max-w-[70%] self-end rounded-2xl rounded-br-md bg-[#dcf8c6] p-3 text-[13px] text-[var(--landing-ink)]">
        Parfait, c&apos;est réservé pour samedi soir. Merci !
      </div>
    </div>
  );
}

function DashboardVisual() {
  const rows = [
    { place: "Chambre 204", count: 6, amount: "620 MAD" },
    { place: "Lobby", count: 11, amount: "1 140 MAD" },
    { place: "Spa", count: 4, amount: "380 MAD" },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          Ce mois · par emplacement
        </p>
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>
      {rows.map((r) => (
        <div
          key={r.place}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]">{r.place}</span>
          <span className="text-[var(--landing-ink)]/50">
            {r.count} réservations
          </span>
          <span className="w-20 text-right font-medium text-[var(--landing-ink)]">
            {r.amount}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-[13px] text-emerald-800">Commission de l&apos;hôtel</span>
        <span className="text-[16px] font-semibold text-emerald-700">2 140 MAD</span>
      </div>
    </div>
  );
}

/* ─── Contenu ──────────────────────────────────────────────────────────── */

const WAYS = [
  {
    title: "Un QR code dans la chambre",
    text: "Sur le chevet ou le bureau. Le client réserve seul, à toute heure, sans passer par le desk.",
    visual: RoomQrVisual,
  },
  {
    title: "Un message avant l'arrivée",
    text: "Un lien par e-mail ou WhatsApp. Le client arrive avec ses tables déjà réservées.",
    visual: MessageVisual,
  },
];

const GAINS = [
  {
    title: "Les tables introuvables",
    text: "Les adresses complètes gardent des places pour le réseau.",
  },
  {
    title: "Une part de chaque sortie",
    text: "Calculée sur le montant réellement dépensé, versée chaque mois.",
  },
  {
    title: "Chaque réservation rattachée",
    text: "À la chambre, au lobby ou au spa qui l'a générée.",
  },
  {
    title: "Une équipe soulagée",
    text: "Les clients réservent seuls, et une part peut revenir à la conciergerie.",
  },
];

const FAQ = [
  {
    q: "TwoCards remplace-t-il notre PMS ou notre outil de conciergerie ?",
    a: "Non. TwoCards gère la réservation de bout en bout et restitue l'activité à votre équipe. Vos outils internes restent la source de vérité.",
  },
  {
    q: "Et notre équipe de conciergerie, qu'est-ce qu'elle y gagne ?",
    a: "Du temps, d'abord : les demandes simples se réservent seules depuis la chambre, et votre équipe se concentre sur ce qui demande vraiment son savoir-faire. La rémunération est versée à l'hôtel, qui choisit comment la répartir : une partie peut revenir à l'équipe de conciergerie, en toute transparence. Et chaque réservation reste visible et modifiable depuis son tableau de bord.",
  },
  {
    q: "Notre conciergerie fait déjà ce travail. Pourquoi ajouter un QR ?",
    a: "Parce que beaucoup de clients n'osent pas appeler la conciergerie pour une table. Par habitude, ils cherchent leurs adresses sur Instagram ou TikTok, et réservent ailleurs, sans vous. Le QR en chambre les ramène vers vos recommandations, au moment où ils se posent la question, et chaque réservation reste attribuée à votre hôtel.",
  },
  {
    q: "Combien ça coûte ?",
    a: "Rien. Rejoindre le réseau est gratuit pour l'hôtel : TwoCards se rémunère côté établissements partenaires.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "Moins d'une journée : comptes vérifiés, QR imprimés, premières réservations le soir même.",
  },
];

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function HotelPage() {
  return (
    <ShortAudiencePage
      data={{
        hero: {
          video: "/videos/hotels-hero-60.mp4",
          poster: "/videos/hotels-hero-poster.jpg",
          title: (
            <>
              Offrez à vos clients{" "}
              <RotatingTitleWord words={["la table", "l'activité", "le service"]} />{" "}
              qu&apos;ils <em className="italic">veulent vraiment</em>.
            </>
          ),
          primary: { label: "Équiper mon établissement", href: SIGNUP },
          secondary: { label: "Parler à notre équipe", href: SIGNUP },
        },
        how: {
          title: (
            <>
              Deux chemins.
              <br />
              <em className="font-light italic">Un seul suivi.</em>
            </>
          ),
          intro:
            "Que le client réserve depuis sa chambre ou avant même d'arriver, la réservation est attribuée à votre hôtel.",
          items: WAYS,
        },
        statement: {
          image: "/images/hotels-beach.jpg",
          text: "Le service que vos clients réclament. La traçabilité que votre direction exige.",
        },
        gains: {
          title: (
            <>
              Ce que votre hôtel
              <br />
              <em className="font-light italic">y gagne</em>.
            </>
          ),
          items: GAINS,
          visual: DashboardVisual,
        },
        faq: FAQ,
        cta: {
          title: (
            <>
              Donnez la table à vos clients.
              <br />
              <em className="font-light italic">Gardez la traçabilité.</em>
            </>
          ),
          text: "Un nombre limité d'établissements par quartier pendant le pilote à Marrakech.",
          primary: { label: "Équiper mon établissement", href: SIGNUP },
        },
      }}
    />
  );
}
