"use client";

import { Check, ScanLine, Star } from "lucide-react";
import { getCostFaq } from "@/components/landing/faq-home";
import { CONTACT_MAILTO } from "@/components/landing/section-header";
import {
  ShortAudiencePage,
  panel,
} from "@/components/landing/short-audience-page";
import { useT } from "@/lib/i18n/client";

/* Page Établissements (restaurants, rooftops, clubs), sur le gabarit commun
   des pages métiers. La séquence du héros va de la salle au zellige fermé :
   elle se joue une fois et reste sur le mur clos. Les adresses des exemples sont celles de la fiction du film. */

const SIGNUP = "/signup?role=etablissement";

/* ─── Mini-écrans ──────────────────────────────────────────────────────── */

function InventoryVisual() {
  const t = useT();
  const rows = [
    [t("Tables confiées", "Tables shared"), t("2 tables de 4", "2 tables for 4")],
    [t("Créneaux", "Time slots"), t("ven. & sam. · 20:00–23:00", "Fri. & Sat. · 20:00–23:00")],
    [t("Minimum par table", "Minimum per table"), "800 MAD"],
    [t("Acompte", "Deposit"), t("20 %", "20%")],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="text-[12px] font-medium text-[var(--landing-ink)]/65">
        {t("Mes conditions · Terrasse", "My conditions · Terrace")}
      </p>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px] first-of-type:mt-2"
        >
          <span className="text-[var(--landing-ink)]/65">{label}</span>
          <span className="font-medium text-[var(--landing-ink)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function RequestVisual() {
  const t = useT();
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-[var(--landing-ink)]/65">
          {t("Nouvelle demande", "New request")}
        </p>
        <span className="text-[11px] text-[var(--landing-ink)]/65">{t("il y a 2 min", "2 min ago")}</span>
      </div>
      <p className="mt-2 text-[15px] font-semibold text-[var(--landing-ink)]">
        {t("Sam. 21:00 · 4 couverts", "Sat. 21:00 · 4 covers")}
      </p>
      <p className="mt-0.5 text-[13px] text-[var(--landing-ink)]/60">
        {t("Anniversaire · envoyée par Riad Al Andalus", "Birthday · sent by Riad Al Andalus")}
      </p>
      <div className="mt-4 flex gap-2">
        <span className="flex-1 rounded-lg bg-[var(--landing-ink)] py-2 text-center text-[12px] font-semibold text-[var(--landing-ivory)]">
          {t("Accepter", "Accept")}
        </span>
        <span className="flex-1 rounded-lg bg-black/[0.06] py-2 text-center text-[12px] text-[var(--landing-ink)]/70">
          {t("Proposer 22:00", "Suggest 22:00")}
        </span>
      </div>
    </div>
  );
}

function VerifiedVisual() {
  const t = useT();
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="flex items-center gap-3 border-b border-black/[0.07] pb-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-[var(--landing-ink)] text-white">
          <ScanLine size={15} />
        </span>
        <div>
          <p className="text-[14px] font-medium">{t("Arrivée confirmée", "Arrival confirmed")}</p>
          <p className="text-[12px] text-[var(--landing-ink)]/65">{t("QR scanné à la porte · 21:04", "QR scanned at the door · 21:04")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between py-3 text-[13px]">
        <span className="text-[var(--landing-ink)]/65">{t("Addition vérifiée", "Bill verified")}</span>
        <span className="font-medium">2 300 MAD</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] font-medium text-emerald-800">
        <Check size={14} strokeWidth={2.5} className="shrink-0" />
        {t("Commission calculée au taux convenu", "Commission calculated at the agreed rate")}
      </div>
    </div>
  );
}

/* Le message envoyé au client le lendemain : la note d'abord (elle arrive
   à l'établissement, en privé), puis l'invitation à laisser un avis sur
   Google. L'invitation est proposée à tous les clients : n'inviter que les
   notes de 5 étoiles (« review gating ») est interdit par Google. */
function ReviewVisual() {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-[11px] text-[var(--landing-ink)]/65">
        {t("Le lendemain · par WhatsApp", "The next day · via WhatsApp")}
      </p>
      <div className={`${panel} p-5 text-left`}>
        <p className="text-[14px] font-semibold leading-snug">
          {t(
            "Comment s'est passée votre soirée au Comptoir du Soir ?",
            "How was your evening at Le Comptoir du Soir?",
          )}
        </p>
        <div className="mt-3 flex gap-1 text-amber-500">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={22} fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-black/[0.04] px-3 py-2 text-[13px] italic text-[var(--landing-ink)]/70">
          {t("« Service parfait, la terrasse était magique. »", "“Perfect service, the terrace was magical.”")}
        </p>
        <p className="mt-2 text-[11px] text-[var(--landing-ink)]/65">
          {t("Votre note est transmise à l'établissement.", "Your rating is shared with the venue.")}
        </p>
      </div>
      <div className={`${panel} flex items-center justify-between gap-3 px-4 py-3`}>
        <span className="text-[13px] font-medium">
          {t("Partager votre avis sur Google ?", "Share your review on Google?")}
        </span>
        <span className="shrink-0 rounded-full bg-[var(--landing-ink)] px-3 py-1.5 text-[12px] font-medium text-white">
          {t("Laisser un avis", "Leave a review")}
        </span>
      </div>
    </div>
  );
}

function DashboardVisual() {
  const t = useT();
  const rows = [
    [t("Chiffre d'affaires apporté", "Revenue referred"), t("48 200 MAD", "48,200 MAD")],
    [t("Sorties ce mois", "Outings this month"), "37"],
    [t("Clients venus", "Guests who came"), t("35 sur 37", "35 of 37")],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-medium text-[var(--landing-ink)]/65">
          {t("Le Comptoir du Soir · ce mois", "Le Comptoir du Soir · this month")}
        </p>
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]/65">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
        <span className="text-[13px] text-amber-900">{t("Note des clients", "Guest rating")}</span>
        <span className="flex items-center gap-1 text-[15px] font-semibold text-amber-700">
          {t("4,8", "4.8")} <Star size={14} fill="currentColor" />
        </span>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function EstablishmentPage() {
  const t = useT();
  return (
    <ShortAudiencePage
      data={{
        hero: {
          media: {
            image: "/videos/etablissements-hero-poster.jpg",
            video: { src: "/videos/etablissements-hero-60.mp4", loop: false, rate: 0.8 },
          },
          title: t(
            <>
              Remplissez vos tables,{" "}
              <em className="font-light italic">à vos conditions</em>.
            </>,
            <>
              Fill your tables,{" "}
              <em className="font-light italic">on your terms</em>.
            </>,
          ),
          intro: t(
            "Les hôtels, concierges et RP de la ville vous envoient leurs clients. Vous ne payez que lorsqu'ils viennent.",
            "The city's hotels, concierges and PRs send you their guests. You only pay when they show up.",
          ),
          primary: { label: t("Devenir partenaire", "Become a partner"), href: SIGNUP },
          secondary: { label: t("Parler à notre équipe", "Talk to our team"), href: CONTACT_MAILTO },
        },
        how: {
          title: t(
            <>
              Vos conditions.
              <br />
              Notre réseau.
            </>,
            <>
              Your terms.
              <br />
              Our network.
            </>,
          ),
          intro: t(
            "Vous gardez le contrôle de chaque table, et chaque commission est calculée sur du revenu vérifié.",
            "You keep control of every table, and every commission is calculated on verified revenue.",
          ),
          items: [
            {
              title: t("Vous choisissez vos tables", "You choose your tables"),
              text: t(
                "Lesquelles, quels soirs, avec quel minimum et quel acompte. Le reste de la salle ne change pas.",
                "Which ones, which nights, with what minimum spend and deposit. The rest of the room stays as it is.",
              ),
              visual: InventoryVisual,
            },
            {
              title: t("Le réseau réserve", "The network books"),
              text: t(
                "Des demandes complètes, venues d'apporteurs vérifiés. Vous acceptez ou proposez une autre heure.",
                "Complete requests from verified referral partners. You accept or suggest another time.",
              ),
              visual: RequestVisual,
            },
            {
              title: t("Vous payez au réel", "You pay on actual results"),
              text: t(
                "Le QR prouve la venue, la commission se calcule sur l'addition vérifiée.",
                "The QR code proves the visit, and the commission is calculated on the verified bill.",
              ),
              visual: VerifiedVisual,
            },
          ],
        },
        statement: {
          image:
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop",
          text: t(
            "Chaque table apportée, comptabilisée. Chaque client, attendu à la porte.",
            "Every table referred, accounted for. Every guest, expected at the door.",
          ),
        },
        spotlight: {
          title: t(
"Votre réputation, soignée après chaque visite.",
            "Your reputation, cared for after every visit.",
          ),
          intro: t(
            "Le lendemain de sa soirée, chaque client reçoit un message pour la noter. Vous n'avez rien à faire.",
            "The day after their evening, every guest receives a message inviting them to rate it. You don't have to lift a finger.",
          ),
          points: [
            {
              title: t("Les retours vous arrivent d'abord", "Feedback reaches you first"),
              text: t(
                "Un client déçu vous le dit à vous, en privé. Vous pouvez réagir le jour même.",
                "A disappointed guest tells you, privately. You can respond the same day.",
              ),
            },
            {
              title: t("Plus d'avis Google", "More Google reviews"),
              text: t(
                "Chaque client est ensuite invité à partager son avis sur votre fiche Google, en un clic. Des voyageurs qui, d'habitude, n'en laissent jamais.",
                "Every guest is then invited to share a review on your Google profile, in one click. Travellers who normally never leave one.",
              ),
            },
            {
              title: t("Des avis de vrais clients", "Reviews from real guests"),
              text: t(
                "Seuls les clients venus reçoivent le message : aucun faux avis possible.",
                "Only guests who actually came receive the message: no fake reviews possible.",
              ),
            },
            {
              title: t("Une note que vous pilotez", "A rating you can steer"),
              text: t(
                "Moyenne, commentaires, soirs qui déçoivent : tout est dans votre tableau de bord.",
                "Average score, comments, nights that disappoint: it's all in your dashboard.",
              ),
            },
          ],
          visual: ReviewVisual,
        },
        gains: {
          title: t(
"Ce que votre établissement y gagne.",
            "What your venue gains.",
          ),
          items: [
            {
              title: t("Des clients d'hôtels", "Hotel guests"),
              text: t(
                "Des voyageurs en séjour, recommandés par des prescripteurs de confiance.",
                "Travellers in town, recommended by people they trust.",
              ),
            },
            {
              title: t("Vos soirs creux remplis", "Quiet nights filled"),
              text: t(
                "Vous ouvrez des tables au réseau quand votre salle en a besoin.",
                "You open tables to the network whenever your room needs it.",
              ),
            },
            {
              title: t("Payé au résultat", "Pay for results"),
              text: t(
                "Aucun abonnement : la commission ne part que si le client est venu.",
                "No subscription: commission is only due if the guest shows up.",
              ),
            },
            {
              title: t("Moins de tables vides", "Fewer empty tables"),
              text: t(
                "Client confirmé par son concierge, acompte si vous le souhaitez.",
                "Guests confirmed by their concierge, with a deposit if you wish.",
              ),
            },
            {
              title: t("Visible dans les hôtels", "Visible in hotels"),
              text: t(
                "Votre maison peut être proposée sur les QR en chambre des hôtels partenaires.",
                "Your venue can be featured on the in-room QR codes of partner hotels.",
              ),
            },
            {
              title: t("Compatible avec vos outils", "Works with your tools"),
              text: t(
                "Votre logiciel de réservation et votre caisse restent en place.",
                "Your reservation software and your till stay exactly as they are.",
              ),
            },
          ],
          visual: DashboardVisual,
        },
        faq: [
          {
            q: t(
              "TwoCards remplace-t-il notre logiciel de réservation ?",
              "Does TwoCards replace our reservation software?",
            ),
            a: t(
              "Non. TwoCards gère la relation avec vos apporteurs (attribution, check-in, addition, commission) au-dessus de votre système actuel.",
              "No. TwoCards manages the relationship with your referral partners (attribution, check-in, bill, commission) on top of your current system.",
            ),
          },
          {
            q: t("Qui fixe les commissions ?", "Who sets the commissions?"),
            a: t(
              "Vous. Montant ou pourcentage, base de calcul et délai de paiement sont définis par vous et acceptés par l'apporteur avant la première réservation.",
              "You do. Fixed amount or percentage, calculation basis and payment terms are set by you and accepted by the referral partner before the first reservation.",
            ),
          },
          {
            q: t("Devons-nous ouvrir toute notre salle ?", "Do we have to open up our whole room?"),
            a: t(
              "Non. Vous confiez au réseau uniquement les tables que vous voulez, quand vous le voulez.",
              "No. You only share the tables you want with the network, when you want.",
            ),
          },
          getCostFaq(t),
        ],
        cta: {
          title: t(
            <>
              Vos tables sont déjà là.
              <br />
              Faites-en un actif.
            </>,
            <>
              Your tables are already there.
              <br />
              Make them an asset.
            </>,
          ),
          text: t(
            "Opérationnel en moins d'une journée, avec votre réseau d'apporteurs existant importé.",
            "Up and running in less than a day, with your existing network of referral partners imported.",
          ),
          primary: { label: t("Devenir partenaire", "Become a partner"), href: SIGNUP },
        },
      }}
    />
  );
}
