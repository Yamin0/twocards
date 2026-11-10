"use client";

import { Check } from "lucide-react";
import {
  ShortAudiencePage,
  panel,
} from "@/components/landing/short-audience-page";

/* Page Concierges & RP, sur le gabarit court des pages métiers. Le héros
   photo (zellige) est repris de l'ancienne page. Les adresses des
   exemples sont celles de la fiction du film. */

const SIGNUP = "/signup?role=concierge";

/* ─── Mini-écrans ──────────────────────────────────────────────────────── */

function ConditionsVisual() {
  const rows = [
    ["Disponible", "sam. 21:00 · 22:30"],
    ["Minimum", "600 MAD / pers."],
    ["Acompte", "aucun"],
    ["Tenue", "élégante"],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="flex items-baseline justify-between">
        <p className="text-[15px] font-semibold">Le Comptoir du Soir</p>
        <p className="text-[11px] text-[var(--landing-ink)]/45">Restaurant</p>
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px] first-of-type:mt-2"
        >
          <span className="text-[var(--landing-ink)]/55">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

function BookingVisual() {
  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="max-w-[88%] self-end rounded-2xl rounded-br-md bg-[#111] p-3.5 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
        <p className="text-[13px] font-medium">Sam. 21:00 · 4 personnes</p>
        <p className="mt-0.5 text-[12px] text-white/55">Pour M. B., anniversaire</p>
      </div>
      <div className={`${panel} max-w-[88%] self-start rounded-bl-md p-3.5`}>
        <p className="text-[13px] font-medium">Complet à 21:00, terrasse à 21:30 ?</p>
        <p className="mt-0.5 text-[12px] text-[var(--landing-ink)]/50">
          Le Comptoir du Soir · en 4 min
        </p>
      </div>
      <div className="max-w-[60%] self-end rounded-2xl rounded-br-md bg-[#111] p-3 text-[13px] text-white">
        Parfait, je confirme.
      </div>
    </div>
  );
}

function PaidVisual() {
  const rows = [
    { step: "Réservation attribuée", done: true },
    { step: "Client arrivé · QR scanné", done: true },
    { step: "Addition vérifiée", done: true },
    { step: "Commission payée", done: false },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
        Réservation de M. B.
      </p>
      {rows.map((r) => (
        <div
          key={r.step}
          className="flex items-center gap-3 border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span
            className={`flex size-5 items-center justify-center rounded-full ${
              r.done ? "bg-emerald-600 text-white" : "border border-black/15"
            }`}
          >
            {r.done && <Check size={11} strokeWidth={3} />}
          </span>
          <span className={r.done ? "" : "text-[var(--landing-ink)]/50"}>{r.step}</span>
          {!r.done && (
            <span className="ml-auto text-[12px] text-[var(--landing-ink)]/45">le 5 du mois</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EarningsVisual() {
  const rows = [
    ["Le Comptoir du Soir", "4 pers.", "Payée"],
    ["Brasserie Alma", "2 pers.", "Validée"],
    ["Voilier au coucher du soleil", "6 pers.", "En cours"],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          Mes commissions
        </p>
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>
      {rows.map(([place, size, status]) => (
        <div
          key={place}
          className="flex items-center justify-between gap-3 border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="min-w-0 truncate">{place}</span>
          <span className="shrink-0 text-[var(--landing-ink)]/50">{size}</span>
          <span
            className={`w-16 shrink-0 text-right text-[12px] font-medium ${
              status === "Payée" ? "text-emerald-600" : "text-[var(--landing-ink)]/60"
            }`}
          >
            {status}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-[13px] text-emerald-800">Ce mois</span>
        <span className="text-[16px] font-semibold text-emerald-700">1 860 MAD</span>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function ConciergePage() {
  return (
    <ShortAudiencePage
      data={{
        hero: {
          image: "/images/concierges-hero.jpg",
          title: (
            <>
              Vos recommandations valent de l&apos;argent.{" "}
              <em className="italic">Encaissez-les</em>.
            </>
          ),
          primary: { label: "Rejoindre le réseau", href: SIGNUP },
          secondary: { label: "Comment ça marche", href: "#comment" },
        },
        how: {
          title: (
            <>
              Comment ça marche.
              <br />
              <em className="font-light italic">En trois étapes.</em>
            </>
          ),
          intro:
            "Fini les appels pour connaître les conditions et les relances pour être payé.",
          items: [
            {
              title: "Vous voyez les conditions",
              text: "Disponibilités, minimum, acompte et tenue, avant même de demander.",
              visual: ConditionsVisual,
            },
            {
              title: "Vous réservez pour votre client",
              text: "Une réponse en quelques minutes, ou une autre heure si c'est complet.",
              visual: BookingVisual,
            },
            {
              title: "Vous êtes payé",
              text: "Le QR prouve votre apport, la commission est suivie jusqu'au versement.",
              visual: PaidVisual,
            },
          ],
        },
        statement: {
          image:
            "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2000&auto=format&fit=crop",
          text: "Votre carnet d'adresses est un métier. TwoCards en fait un revenu certain.",
        },
        gains: {
          title: (
            <>
              Ce que vous
              <br />
              <em className="font-light italic">y gagnez</em>.
            </>
          ),
          items: [
            {
              title: "Vos clients restent les vôtres",
              text: "Coordonnées masquées, révélées seulement après confirmation.",
            },
            {
              title: "Votre apport prouvé",
              text: "Le scan à l'arrivée atteste que votre client est venu.",
            },
            {
              title: "Un paiement certain",
              text: "Conditions acceptées d'avance, versement à date fixe.",
            },
            {
              title: "Une réputation qui voyage",
              text: "Votre historique vous suit de ville en ville.",
            },
          ],
          visual: EarningsVisual,
        },
        faq: [
          {
            q: "Combien ça coûte ?",
            a: "Rien. L'accès est gratuit pour les concierges et RP vérifiés : TwoCards se rémunère côté établissements.",
          },
          {
            q: "Comment mon apport est-il prouvé ?",
            a: "La réservation porte votre nom dès la demande, et le QR scanné à l'arrivée du client en apporte la preuve horodatée.",
          },
          {
            q: "Mon employeur n'autorise pas les commissions personnelles ?",
            a: "Vous choisissez où va la rémunération : votre agence, votre équipe ou un avantage pour le client. Et même sans commission, TwoCards vous fait gagner du temps : conditions affichées, réponses en quelques minutes, plus aucune relance.",
          },
          {
            q: "Quand suis-je payé ?",
            a: "À date fixe, acceptée d'avance par l'établissement. Vous suivez chaque commission en direct : validée, en cours, payée.",
          },
        ],
        cta: {
          title: (
            <>
              Votre réseau travaille déjà.
              <br />
              <em className="font-light italic">Faites-le payer.</em>
            </>
          ),
          text: "Inscription gratuite, vérification en 24 h.",
          primary: { label: "Rejoindre le réseau", href: SIGNUP },
        },
      }}
    />
  );
}
