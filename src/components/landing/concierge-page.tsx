"use client";

import { Check } from "lucide-react";
import {
  ShortAudiencePage,
  panel,
} from "@/components/landing/short-audience-page";
import { useT } from "@/lib/i18n/client";
import { useMoney } from "@/lib/currency/client";

/* Page Concierges & RP, sur le gabarit court des pages métiers. Le héros
   photo (zellige) est repris de l'ancienne page. Les adresses des
   exemples sont celles de la fiction du film. */

const SIGNUP = "/signup?role=concierge";

/* ─── Mini-écrans ──────────────────────────────────────────────────────── */

function ConditionsVisual() {
  const t = useT();
  const money = useMoney();
  const rows = [
    [t("Disponible", "Available"), t("sam. 21:00 · 22:30", "Sat. 21:00 · 22:30")],
    [t("Minimum", "Minimum spend"), t(`${money("conciergeMinimumPerGuest")} / pers.`, `${money("conciergeMinimumPerGuest")} / person`)],
    [t("Acompte", "Deposit"), t("aucun", "none")],
    [t("Tenue", "Dress code"), t("élégante", "smart")],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="flex items-baseline justify-between">
        <p className="text-[15px] font-semibold">Le Comptoir du Soir</p>
        <p className="text-[11px] text-[var(--landing-ink)]/45">{t("Restaurant", "Restaurant")}</p>
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
  const t = useT();
  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="max-w-[88%] self-end rounded-2xl rounded-br-md bg-[#111] p-3.5 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.4)]">
        <p className="text-[13px] font-medium">{t("Sam. 21:00 · 4 personnes", "Sat. 21:00 · 4 guests")}</p>
        <p className="mt-0.5 text-[12px] text-white/55">{t("Pour M. B., anniversaire", "For Mr B., birthday")}</p>
      </div>
      <div className={`${panel} max-w-[88%] self-start rounded-bl-md p-3.5`}>
        <p className="text-[13px] font-medium">{t("Complet à 21:00, terrasse à 21:30 ?", "Full at 21:00, terrace at 21:30?")}</p>
        <p className="mt-0.5 text-[12px] text-[var(--landing-ink)]/50">
          {t("Le Comptoir du Soir · en 4 min", "Le Comptoir du Soir · in 4 min")}
        </p>
      </div>
      <div className="max-w-[60%] self-end rounded-2xl rounded-br-md bg-[#111] p-3 text-[13px] text-white">
        {t("Parfait, je confirme.", "Perfect, confirmed.")}
      </div>
    </div>
  );
}

function PaidVisual() {
  const t = useT();
  const rows = [
    { step: t("Réservation attribuée", "Reservation attributed"), done: true },
    { step: t("Client arrivé · QR scanné", "Guest arrived · QR scanned"), done: true },
    { step: t("Addition vérifiée", "Bill verified"), done: true },
    { step: t("Commission payée", "Commission paid"), done: false },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
        {t("Réservation de M. B.", "Mr B.'s reservation")}
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
            <span className="ml-auto text-[12px] text-[var(--landing-ink)]/45">{t("le 5 du mois", "on the 5th")}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EarningsVisual() {
  const t = useT();
  const money = useMoney();
  const paid = t("Payée", "Paid");
  const rows = [
    ["Le Comptoir du Soir", t("4 pers.", "4 guests"), paid],
    ["Brasserie Alma", t("2 pers.", "2 guests"), t("Validée", "Approved")],
    [t("Voilier au coucher du soleil", "Sunset sailing"), t("6 pers.", "6 guests"), t("En cours", "Pending")],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          {t("Mes commissions", "My commissions")}
        </p>
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t("en direct", "live")}
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
              status === paid ? "text-emerald-600" : "text-[var(--landing-ink)]/60"
            }`}
          >
            {status}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-[13px] text-emerald-800">{t("Ce mois", "This month")}</span>
        <span className="text-[16px] font-semibold text-emerald-700">{money("conciergeMonthlyEarnings")}</span>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function ConciergePage() {
  const t = useT();
  return (
    <ShortAudiencePage
      data={{
        hero: {
          image: "/images/concierges-hero.jpg",
          title: t(
            <>
              Vos recommandations valent de l&apos;argent.{" "}
              <em className="italic">Encaissez-les</em>.
            </>,
            <>
              Your recommendations are worth money.{" "}
              <em className="italic">Cash in on them</em>.
            </>,
          ),
          primary: { label: t("Rejoindre le réseau", "Join the network"), href: SIGNUP },
          secondary: { label: t("Comment ça marche", "How it works"), href: "#comment" },
        },
        how: {
          title: t(
            <>
              Comment ça marche.
              <br />
              <em className="font-light italic">En trois étapes.</em>
            </>,
            <>
              How it works.
              <br />
              <em className="font-light italic">In three steps.</em>
            </>,
          ),
          intro: t(
            "Fini les appels pour connaître les conditions et les relances pour être payé.",
            "No more calls to check the conditions, no more chasing to get paid.",
          ),
          items: [
            {
              title: t("Vous voyez les conditions", "You see the conditions"),
              text: t(
                "Disponibilités, minimum, acompte et tenue, avant même de demander.",
                "Availability, minimum spend, deposit and dress code, before you even ask.",
              ),
              visual: ConditionsVisual,
            },
            {
              title: t("Vous réservez pour votre client", "You book for your guest"),
              text: t(
                "Une réponse en quelques minutes, ou une autre heure si c'est complet.",
                "An answer within minutes, or another time if it's full.",
              ),
              visual: BookingVisual,
            },
            {
              title: t("Vous êtes payé", "You get paid"),
              text: t(
                "Le QR prouve votre apport, la commission est suivie jusqu'au versement.",
                "The QR code proves your referral, and the commission is tracked through to payout.",
              ),
              visual: PaidVisual,
            },
          ],
        },
        statement: {
          image:
            "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2000&auto=format&fit=crop",
          text: t(
            "Votre carnet d'adresses est un métier. TwoCards en fait un revenu certain.",
            "Your little black book is a craft. TwoCards turns it into reliable income.",
          ),
        },
        gains: {
          title: t(
            <>
              Ce que vous
              <br />
              <em className="font-light italic">y gagnez</em>.
            </>,
            <>
              What&apos;s in it
              <br />
              <em className="font-light italic">for you</em>.
            </>,
          ),
          items: [
            {
              title: t("Vos clients restent les vôtres", "Your guests stay yours"),
              text: t(
                "Coordonnées masquées, révélées seulement après confirmation.",
                "Contact details hidden, revealed only after confirmation.",
              ),
            },
            {
              title: t("Votre apport prouvé", "Your referral, proven"),
              text: t(
                "Le scan à l'arrivée atteste que votre client est venu.",
                "The scan on arrival confirms your guest showed up.",
              ),
            },
            {
              title: t("Un paiement certain", "Guaranteed payment"),
              text: t(
                "Conditions acceptées d'avance, versement à date fixe.",
                "Terms agreed in advance, payout on a fixed date.",
              ),
            },
            {
              title: t("Une réputation qui voyage", "A reputation that travels"),
              text: t(
                "Votre historique vous suit de ville en ville.",
                "Your track record follows you from city to city.",
              ),
            },
          ],
          visual: EarningsVisual,
        },
        faq: [
          {
            q: t("Combien ça coûte ?", "How much does it cost?"),
            a: t(
              "Rien. L'accès est gratuit pour les concierges et RP vérifiés : TwoCards se rémunère côté établissements.",
              "Nothing. Access is free for verified concierges and PRs: TwoCards is paid by the venues.",
            ),
          },
          {
            q: t("Comment mon apport est-il prouvé ?", "How is my referral proven?"),
            a: t(
              "La réservation porte votre nom dès la demande, et le QR scanné à l'arrivée du client en apporte la preuve horodatée.",
              "The reservation carries your name from the moment you request it, and the QR code scanned when your guest arrives provides time-stamped proof.",
            ),
          },
          {
            q: t(
              "Mon employeur n'autorise pas les commissions personnelles ?",
              "What if my employer doesn't allow personal commissions?",
            ),
            a: t(
              "Vous choisissez où va la rémunération : votre agence, votre équipe ou un avantage pour le client. Et même sans commission, TwoCards vous fait gagner du temps : conditions affichées, réponses en quelques minutes, plus aucune relance.",
              "You choose where the reward goes: your agency, your team or a perk for the guest. And even without a commission, TwoCards saves you time: conditions shown upfront, answers within minutes, no more chasing.",
            ),
          },
          {
            q: t("Quand suis-je payé ?", "When do I get paid?"),
            a: t(
              "À date fixe, acceptée d'avance par l'établissement. Vous suivez chaque commission en direct : validée, en cours, payée.",
              "On a fixed date, agreed in advance by the venue. You track every commission live: approved, pending, paid.",
            ),
          },
        ],
        cta: {
          title: t(
            <>
              Votre réseau travaille déjà.
              <br />
              <em className="font-light italic">Faites-le payer.</em>
            </>,
            <>
              Your network already works.
              <br />
              <em className="font-light italic">Make it pay.</em>
            </>,
          ),
          text: t("Inscription gratuite, vérification en 24 h.", "Free sign-up, verified within 24 hours."),
          primary: { label: t("Rejoindre le réseau", "Join the network"), href: SIGNUP },
        },
      }}
    />
  );
}
