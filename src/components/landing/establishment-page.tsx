"use client";

import { Check, ScanLine, Star } from "lucide-react";
import {
  ShortAudiencePage,
  panel,
} from "@/components/landing/short-audience-page";

/* Page Établissements (restaurants, rooftops, clubs), sur le gabarit court
   des pages métiers. Le héros vidéo est repris tel quel : la séquence va de
   la salle au zellige fermé, elle se joue une fois et reste sur le mur
   clos. Les adresses des exemples sont celles de la fiction du film. */

const SIGNUP = "/signup";

/* ─── Mini-écrans ──────────────────────────────────────────────────────── */

function InventoryVisual() {
  const rows = [
    ["Tables confiées", "2 tables de 4"],
    ["Créneaux", "ven. & sam. · 20:00–23:00"],
    ["Minimum par table", "800 MAD"],
    ["Acompte", "20 %"],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
        Mes conditions · Terrasse
      </p>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px] first-of-type:mt-2"
        >
          <span className="text-[var(--landing-ink)]/55">{label}</span>
          <span className="font-medium text-[var(--landing-ink)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function RequestVisual() {
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          Nouvelle demande
        </p>
        <span className="text-[11px] text-[var(--landing-ink)]/45">il y a 2 min</span>
      </div>
      <p className="mt-2 text-[15px] font-semibold text-[var(--landing-ink)]">
        Sam. 21:00 · 4 couverts
      </p>
      <p className="mt-0.5 text-[13px] text-[var(--landing-ink)]/60">
        Anniversaire · envoyée par Riad Al Andalus
      </p>
      <div className="mt-4 flex gap-2">
        <span className="flex-1 rounded-lg bg-[var(--landing-ink)] py-2 text-center text-[12px] font-semibold text-[var(--landing-ivory)]">
          Accepter
        </span>
        <span className="flex-1 rounded-lg bg-black/[0.06] py-2 text-center text-[12px] text-[var(--landing-ink)]/70">
          Proposer 22:00
        </span>
      </div>
    </div>
  );
}

function VerifiedVisual() {
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="flex items-center gap-3 border-b border-black/[0.07] pb-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-[var(--landing-ink)] text-white">
          <ScanLine size={15} />
        </span>
        <div>
          <p className="text-[14px] font-medium">Arrivée confirmée</p>
          <p className="text-[12px] text-[var(--landing-ink)]/50">QR scanné à la porte · 21:04</p>
        </div>
      </div>
      <div className="flex items-center justify-between py-3 text-[13px]">
        <span className="text-[var(--landing-ink)]/55">Addition vérifiée</span>
        <span className="font-medium">2 300 MAD</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] font-medium text-emerald-800">
        <Check size={14} strokeWidth={2.5} className="shrink-0" />
        Commission calculée au taux convenu
      </div>
    </div>
  );
}

/* Le message envoyé au client le lendemain : la note d'abord (elle arrive
   à l'établissement, en privé), puis l'invitation à laisser un avis sur
   Google. L'invitation est proposée à tous les clients : n'inviter que les
   notes de 5 étoiles (« review gating ») est interdit par Google. */
function ReviewVisual() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-[11px] text-[var(--landing-ink)]/45">
        Le lendemain · par WhatsApp
      </p>
      <div className={`${panel} p-5 text-left`}>
        <p className="text-[14px] font-semibold leading-snug">
          Comment s&apos;est passée votre soirée au Comptoir du Soir ?
        </p>
        <div className="mt-3 flex gap-1 text-amber-500">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={22} fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-black/[0.04] px-3 py-2 text-[13px] italic text-[var(--landing-ink)]/70">
          « Service parfait, la terrasse était magique. »
        </p>
        <p className="mt-2 text-[11px] text-[var(--landing-ink)]/45">
          Votre note est transmise à l&apos;établissement.
        </p>
      </div>
      <div className={`${panel} flex items-center justify-between gap-3 px-4 py-3`}>
        <span className="text-[13px] font-medium">
          Partager votre avis sur Google ?
        </span>
        <span className="shrink-0 rounded-full bg-[var(--landing-ink)] px-3 py-1.5 text-[12px] font-medium text-white">
          Laisser un avis
        </span>
      </div>
    </div>
  );
}

function DashboardVisual() {
  const rows = [
    ["Chiffre d'affaires apporté", "48 200 MAD"],
    ["Sorties ce mois", "37"],
    ["Clients venus", "35 sur 37"],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          Le Comptoir du Soir · ce mois
        </p>
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]/55">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
        <span className="text-[13px] text-amber-900">Note des clients</span>
        <span className="flex items-center gap-1 text-[15px] font-semibold text-amber-700">
          4,8 <Star size={14} fill="currentColor" />
        </span>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function EstablishmentPage() {
  return (
    <ShortAudiencePage
      data={{
        hero: {
          video: "/videos/etablissements-hero-60.mp4",
          poster: "/videos/etablissements-hero-poster.jpg",
          loop: false,
          title: (
            <>
              Remplissez vos tables,{" "}
              <em className="italic">à vos conditions</em>.
            </>
          ),
          primary: { label: "Devenir partenaire", href: SIGNUP },
          secondary: { label: "Parler à notre équipe", href: SIGNUP },
        },
        how: {
          title: (
            <>
              Vos conditions.
              <br />
              <em className="font-light italic">Notre réseau.</em>
            </>
          ),
          intro:
            "Les hôtels, concierges et RP de la ville vous envoient leurs clients. Vous ne payez que lorsqu'ils viennent.",
          items: [
            {
              title: "Vous choisissez vos tables",
              text: "Lesquelles, quels soirs, avec quel minimum et quel acompte. Le reste de la salle ne change pas.",
              visual: InventoryVisual,
            },
            {
              title: "Le réseau réserve",
              text: "Des demandes complètes, venues d'apporteurs vérifiés. Vous acceptez ou proposez une autre heure.",
              visual: RequestVisual,
            },
            {
              title: "Vous payez au réel",
              text: "Le QR prouve la venue, la commission se calcule sur l'addition vérifiée.",
              visual: VerifiedVisual,
            },
          ],
        },
        statement: {
          image:
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop",
          text: "Chaque table apportée, comptabilisée. Chaque client, attendu à la porte.",
        },
        spotlight: {
          title: (
            <>
              Votre réputation,
              <br />
              <em className="font-light italic">soignée après chaque visite</em>.
            </>
          ),
          intro:
            "Le lendemain de sa soirée, chaque client reçoit un message pour la noter. Vous n'avez rien à faire.",
          points: [
            {
              title: "Les retours vous arrivent d'abord",
              text: "Un client déçu vous le dit à vous, en privé. Vous pouvez réagir le jour même.",
            },
            {
              title: "Plus d'avis Google",
              text: "Chaque client est ensuite invité à partager son avis sur votre fiche Google, en un clic. Des voyageurs qui, d'habitude, n'en laissent jamais.",
            },
            {
              title: "Des avis de vrais clients",
              text: "Seuls les clients venus reçoivent le message : aucun faux avis possible.",
            },
            {
              title: "Une note que vous pilotez",
              text: "Moyenne, commentaires, soirs qui déçoivent : tout est dans votre tableau de bord.",
            },
          ],
          visual: ReviewVisual,
        },
        gains: {
          title: (
            <>
              Ce que votre établissement
              <br />
              <em className="font-light italic">y gagne</em>.
            </>
          ),
          items: [
            {
              title: "Des clients d'hôtels",
              text: "Des voyageurs en séjour, recommandés par des prescripteurs de confiance.",
            },
            {
              title: "Vos soirs creux remplis",
              text: "Vous ouvrez des tables au réseau quand votre salle en a besoin.",
            },
            {
              title: "Payé au résultat",
              text: "Aucun abonnement : la commission ne part que si le client est venu.",
            },
            {
              title: "Moins de tables vides",
              text: "Client confirmé par son concierge, acompte si vous le souhaitez.",
            },
            {
              title: "Visible dans les hôtels",
              text: "Votre maison peut être proposée sur les QR en chambre des hôtels partenaires.",
            },
            {
              title: "Compatible avec vos outils",
              text: "Votre logiciel de réservation et votre caisse restent en place.",
            },
          ],
          visual: DashboardVisual,
        },
        faq: [
          {
            q: "TwoCards remplace-t-il notre logiciel de réservation ?",
            a: "Non. TwoCards gère la relation avec vos apporteurs (attribution, check-in, addition, commission) au-dessus de votre système actuel.",
          },
          {
            q: "Qui fixe les commissions ?",
            a: "Vous. Montant ou pourcentage, base de calcul et délai de paiement sont définis par vous et acceptés par l'apporteur avant la première réservation.",
          },
          {
            q: "Devons-nous ouvrir toute notre salle ?",
            a: "Non. Vous confiez au réseau uniquement les tables que vous voulez, quand vous le voulez.",
          },
          {
            q: "Combien ça coûte ?",
            a: "Rien pendant le pilote à Marrakech : installation gratuite et import de votre réseau d'apporteurs existant.",
          },
        ],
        cta: {
          title: (
            <>
              Vos tables sont déjà là.
              <br />
              <em className="font-light italic">Faites-en un actif.</em>
            </>
          ),
          text: "Opérationnel en moins d'une journée, avec votre réseau d'apporteurs existant importé.",
          primary: { label: "Devenir partenaire", href: SIGNUP },
        },
      }}
    />
  );
}
