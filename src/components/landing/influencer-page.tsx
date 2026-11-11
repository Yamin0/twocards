"use client";

import {
  Camera,
  Check,
  Link2,
  MessageCircle,
  QrCode,
  ScanLine,
  Receipt,
  Wallet,
} from "lucide-react";
import { getCostFaq } from "@/components/landing/faq-home";
import {
  ShortAudiencePage,
  panel,
} from "@/components/landing/short-audience-page";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* Page Influenceurs, sur le gabarit commun des pages métiers.

   Le contenu est lisible tout de suite : la séquence des portes n'est plus
   une vidéo pilotée par le défilement, téléchargée en entier derrière un
   écran de chargement. Elle sert de fond au héros, posée sur son affiche,
   se joue une fois quand elle est à l'écran et reste sur la cour ouverte.
   L'explication se lit ensuite sur fond ivoire : les trois étapes, un
   exemple complet de la story au paiement, les gains, la FAQ. */

/* ─── Mini-écrans des trois étapes ─────────────────────────────────────── */

function SelectionVisual() {
  const t = useT();
  const venues = [
    /* Les adresses de la fiction du film (dashboard du héros), pour
       n'évoquer aucun établissement réel. */
    {
      name: "Le Comptoir du Soir",
      kind: t("Restaurant", "Restaurant"),
      note: t("Réservez la terrasse, et prenez le dessert.", "Book the terrace, and save room for dessert."),
    },
    { name: "Brasserie Alma", kind: t("Brasserie", "Brasserie"), note: t("Mon déjeuner du dimanche.", "My Sunday lunch spot.") },
    {
      name: t("Voilier au coucher du soleil", "Sunset sailing"),
      kind: t("Expérience", "Experience"),
      note: t("À faire une fois dans sa vie.", "A once-in-a-lifetime must."),
    },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="text-[12px] font-medium text-[var(--landing-ink)]/65">
        {t("Ma sélection · Marrakech", "My selection · Marrakech")}
      </p>
      {venues.map((v) => (
        <div key={v.name} className="border-t border-black/[0.07] py-3 first-of-type:mt-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[14px] font-medium text-[var(--landing-ink)]">{v.name}</p>
            <p className="shrink-0 text-[11px] text-[var(--landing-ink)]/65">{v.kind}</p>
          </div>
          <p className="mt-0.5 text-[12px] italic text-[var(--landing-ink)]/60">{t(`« ${v.note} »`, `“${v.note}”`)}</p>
        </div>
      ))}
    </div>
  );
}

function ShareVisual() {
  const t = useT();
  const channels = [
    { icon: Camera, label: t("Bio Instagram", "Instagram bio") },
    { icon: Camera, label: "Story" },
    { icon: MessageCircle, label: "WhatsApp" },
    { icon: QrCode, label: "QR code" },
  ];
  return (
    <div className="flex flex-col items-center gap-5">
      <div className={`${panel} flex items-center gap-3 px-4 py-3.5`}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-ink)] text-white">
          <Link2 size={15} />
        </span>
        <div className="min-w-0 text-left">
          <p className="text-[11px] text-[var(--landing-ink)]/65">{t("Votre lien unique", "Your unique link")}</p>
          <p className="truncate text-[15px] font-medium text-[var(--landing-ink)]">
            {t("twocardspro.com/s/votre-nom", "twocardspro.com/s/your-name")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {channels.map((c) => (
          <span
            key={c.label}
            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--landing-ink)]/75"
          >
            <c.icon size={13} strokeWidth={1.5} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EarnVisual() {
  const t = useT();
  const rows = [
    [t("Réservations ce mois", "Reservations this month"), "18"],
    [t("Clients arrivés", "Guests arrived"), "17"],
    [t("Revenu vérifié", "Verified revenue"), t("21 400 MAD", "21,400 MAD")],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-medium text-[var(--landing-ink)]/65">
          {t("Mon tableau de bord", "My dashboard")}
        </p>
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]/65">{label}</span>
          <span className="font-medium text-[var(--landing-ink)]">{value}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-[13px] text-emerald-800">{t("Mes commissions", "My commissions")}</span>
        <span className="text-[16px] font-semibold text-emerald-700">{t("2 140 MAD", "2,140 MAD")}</span>
      </div>
    </div>
  );
}

const getSteps = (t: Translate) => [
  {
    title: t("Composez votre sélection", "Build your selection"),
    text: t(
      "Choisissez les restaurants, rooftops et clubs que vous recommandez déjà, et ajoutez votre mot sur chacun. Uniquement des établissements vérifiés du réseau, avec leur commission affichée avant que vous les ajoutiez.",
      "Pick the restaurants, rooftops and clubs you already recommend, and add your own note to each. Only verified venues from the network, with their commission shown before you add them.",
    ),
    visual: SelectionVisual,
  },
  {
    title: t("Partagez un seul lien", "Share a single link"),
    text: t(
      "Un lien couvre toute votre sélection. Mettez-le en bio, en story, dans un message WhatsApp ou sur un QR code. Votre audience voit vos adresses et réserve directement, aux vraies disponibilités.",
      "One link covers your whole selection. Put it in your bio, in a story, in a WhatsApp message or on a QR code. Your audience sees your places and books directly, with real availability.",
    ),
    visual: ShareVisual,
  },
  {
    title: t("Touchez une commission", "Earn a commission"),
    text: t(
      "Chaque réservation faite depuis votre lien vous est attribuée automatiquement. Quand le client arrive et que l'addition est vérifiée, votre commission est calculée et apparaît dans votre tableau de bord.",
      "Every reservation made through your link is attributed to you automatically. When the guest arrives and the bill is verified, your commission is calculated and shows up in your dashboard.",
    ),
    visual: EarnVisual,
  },
];

/* ─── Exemple complet ──────────────────────────────────────────────────── */

const getExample = (t: Translate) => [
  {
    icon: Camera,
    when: t("Lundi, 18:00", "Monday, 18:00"),
    title: t("Vous publiez votre sélection en story", "You post your selection in a story"),
    detail: t("Avec votre lien, comme d'habitude.", "With your link, as usual."),
  },
  {
    icon: Link2,
    when: t("Lundi, 18:12", "Monday, 18:12"),
    title: t("Sara réserve pour 4 au Comptoir du Soir", "Sara books a table for 4 at Le Comptoir du Soir"),
    detail: t(
      "Samedi, 21:00. La réservation vous est attribuée.",
      "Saturday, 21:00. The reservation is attributed to you.",
    ),
  },
  {
    icon: ScanLine,
    when: t("Samedi, 21:04", "Saturday, 21:04"),
    title: t("Elle scanne le QR à l'entrée", "She scans the QR code at the door"),
    detail: t(
      "Sa venue est prouvée, sans rien vous demander.",
      "Her visit is proven, without you lifting a finger.",
    ),
  },
  {
    icon: Receipt,
    when: t("Samedi, 23:30", "Saturday, 23:30"),
    title: t("L'addition de 1 240 MAD est vérifiée", "The 1,240 MAD bill is verified"),
    detail: t(
      "Votre commission est calculée sur ce montant réel.",
      "Your commission is calculated on that actual amount.",
    ),
  },
  {
    icon: Wallet,
    when: t("Aussitôt", "Instantly"),
    title: t("+124 MAD dans votre tableau de bord", "+124 MAD in your dashboard"),
    detail: t(
      "Au taux fixé par l'établissement, payés à la date prévue.",
      "At the rate set by the venue, paid on the scheduled date.",
    ),
  },
];

/* ─── Bénéfices et FAQ ─────────────────────────────────────────────────── */

const getGains = (t: Translate) => [
  {
    title: t("Vous le faites déjà gratuitement", "You already do it for free"),
    text: t(
      "Vos recommandations remplissent des salles depuis des années. Désormais, chaque réservation qu'elles déclenchent vous est attribuée et rémunérée.",
      "Your recommendations have been filling dining rooms for years. Now every reservation they drive is attributed to you, and paid.",
    ),
  },
  {
    title: t("Un lien, toutes vos adresses", "One link, all your places"),
    text: t(
      "Une seule sélection peut couvrir une soirée entière : dîner, rooftop, club, expérience. Un lien, plusieurs sources de revenu.",
      "A single selection can cover a whole night out: dinner, rooftop, club, experience. One link, several income streams.",
    ),
  },
  {
    title: t("Votre audience reste la vôtre", "Your audience stays yours"),
    text: t(
      "Votre sélection, votre image, votre lien. TwoCards ne s'installe jamais entre vous et les gens qui vous suivent.",
      "Your selection, your image, your link. TwoCards never comes between you and the people who follow you.",
    ),
  },
  {
    title: t("Tout est visible, en direct", "Everything visible, live"),
    text: t(
      "Clics, réservations, revenu attribué, commissions en attente et payées : votre tableau de bord est à jour en permanence.",
      "Clicks, reservations, attributed revenue, pending and paid commissions: your dashboard is always up to date.",
    ),
  },
  {
    title: t("Des adresses vérifiées", "Verified places"),
    text: t(
      "Vous n'envoyez jamais votre audience à l'aveugle : établissements vérifiés, conditions affichées, venue prouvée au check-in.",
      "You never send your audience in blind: verified venues, conditions shown upfront, visits proven at check-in.",
    ),
  },
  {
    title: t("Une place de premier arrivé", "A first-mover's seat"),
    text: t(
      "Le réseau de Marrakech se construit maintenant. Les premiers influenceurs vérifiés définissent la façon dont la ville réserve demain.",
      "The Marrakech network is being built right now. The first verified influencers will shape how the city books tomorrow.",
    ),
  },
];

const getFaq = (t: Translate) => [
  getCostFaq(t),
  {
    q: t("Combien je touche par réservation ?", "How much do I earn per reservation?"),
    a: t(
      "Chaque établissement fixe son taux de commission, affiché avant que vous l'ajoutiez à votre sélection. La commission est calculée sur l'addition réellement vérifiée, pas sur une estimation.",
      "Each venue sets its own commission rate, shown before you add it to your selection. The commission is calculated on the actual verified bill, not on an estimate.",
    ),
  },
  {
    q: t("Quand suis-je payé ?", "When do I get paid?"),
    a: t(
      "Selon un calendrier fixe, visible sur chaque commission, une fois la facture de la réservation vérifiée. Vous suivez chaque statut en temps réel : validée, en cours, payée.",
      "On a fixed schedule, shown on each commission, once the reservation's invoice has been verified. You track every status in real time: approved, pending, paid.",
    ),
  },
  {
    q: t("Combien de temps mon lien rapporte-t-il ?", "How long does my link keep earning?"),
    a: t(
      "Tant que votre sélection est active. Chaque réservation passée par votre lien vous reste attribuée, sans plafond ni date limite.",
      "For as long as your selection is live. Every reservation made through your link stays attributed to you, with no cap and no end date.",
    ),
  },
  {
    q: t(
      "Un lieu que j'adore n'est pas encore sur TwoCards ?",
      "A place I love isn't on TwoCards yet?",
    ),
    a: t(
      "Proposez-le. Les établissements suggérés par le réseau sont contactés en priorité, et vous restez l'apporteur attribué s'ils rejoignent.",
      "Suggest it. Venues suggested by the network are contacted first, and you remain the attributed referrer if they join.",
    ),
  },
  {
    q: t("Puis-je couvrir plusieurs villes ?", "Can I cover several cities?"),
    a: t(
      "Marrakech d'abord. Le réseau suivra ensuite les corridors de clientèle (Casablanca, Paris, Saint-Tropez, Dubaï), et votre réputation voyagera avec vous.",
      "Marrakech first. The network will then follow the routes our guests travel (Casablanca, Paris, Saint-Tropez, Dubai), and your reputation will travel with you.",
    ),
  },
];

const SIGNUP = "/signup?role=influenceur";

/* Chronologie de l'exemple : de la story du lundi à la commission. */
function ExampleVisual() {
  const t = useT();
  const example = getExample(t);
  return (
    <ol className="text-left">
      {example.map((e, i) => {
        const last = i === example.length - 1;
        return (
          <li key={e.title} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Fil de la chronologie */}
            {!last && (
              <span aria-hidden className="absolute bottom-0 left-[19px] top-11 w-px bg-black/10" />
            )}
            <span
              className={`relative flex size-10 shrink-0 items-center justify-center rounded-full ${
                last
                  ? "bg-emerald-700 text-white"
                  : "border border-black/10 bg-white text-[var(--landing-ink)]"
              }`}
            >
              {last ? <Check size={17} strokeWidth={2.5} /> : <e.icon size={16} strokeWidth={1.6} />}
            </span>
            <div className="pt-0.5">
              <p className="text-[13px] font-medium text-[var(--landing-ink)]/65">{e.when}</p>
              <p
                className={`mt-0.5 text-[16px] font-semibold leading-snug ${
                  last ? "text-emerald-800" : "text-[var(--landing-ink)]"
                }`}
              >
                {e.title}
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-[var(--landing-ink)]/70">
                {e.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function InfluencerPage() {
  const t = useT();
  return (
    <ShortAudiencePage
      data={{
        hero: {
          media: {
            image: "/videos/hero-doors-poster.jpg",
            video: {
              src: "/videos/hero-doors.mp4",
              srcMobile: "/videos/hero-doors-720.mp4",
              loop: false,
            },
          },
          title: t(
            <>
              Votre goût a déjà de la valeur.{" "}
              <em className="font-light italic">TwoCards le rémunère</em>.
            </>,
            <>
              Your taste already has value.{" "}
              <em className="font-light italic">TwoCards pays for it</em>.
            </>,
          ),
          intro: t(
            "Vous recommandez déjà des restaurants, des rooftops et des clubs. Avec TwoCards, chaque réservation qui passe par votre lien vous est attribuée, et vous touchez une commission.",
            "You already recommend restaurants, rooftops and clubs. With TwoCards, every reservation made through your link is attributed to you, and you earn a commission.",
          ),
          primary: { label: t("Créer ma sélection", "Create my selection"), href: SIGNUP },
          secondary: { label: t("Comment ça marche", "How it works"), href: "#comment" },
        },
        how: {
          title: t(
            <>
              Comment ça marche.
              <br />
              En trois étapes.
            </>,
            <>
              How it works.
              <br />
              In three steps.
            </>,
          ),
          intro: t(
            "Pas de code promo, pas de capture d'écran à envoyer, pas de relance : votre lien fait le suivi à votre place.",
            "No promo codes, no screenshots to send, no chasing: your link does the tracking for you.",
          ),
          items: getSteps(t),
        },
        statement: {
          image:
            "https://images.unsplash.com/photo-1672831744471-fb82fd8fa2e0?auto=format&fit=crop&w=2000&q=80",
          text: t(
            "Aujourd'hui, vos stories remplissent des tables sans que vous le sachiez.",
            "Right now, your stories are filling tables without you knowing.",
          ),
        },
        spotlight: {
          title: t(
            "Un exemple, de la story au paiement.",
            "One example, from story to payout.",
          ),
          intro: t(
            "Une story le lundi, une table le samedi, une commission le soir même. Vous n'avez rien à faire entre les deux.",
            "A story on Monday, a table on Saturday, a commission that same night. You don't have to do a thing in between.",
          ),
          note: t(
            "Exemple illustratif. Le taux de commission est fixé par chaque établissement et affiché avant que vous l'ajoutiez à votre sélection.",
            "Illustrative example. The commission rate is set by each venue and shown before you add it to your selection.",
          ),
          visual: ExampleVisual,
        },
        gains: {
          title: t("Ce que vous y gagnez.", "What's in it for you."),
          items: getGains(t),
        },
        faq: getFaq(t),
        cta: {
          title: t(
            <>
              Vos recommandations tournent déjà.
              <br />
              Récupérez votre part.
            </>,
            <>
              Your recommendations are already out there.
              <br />
              Claim your share.
            </>,
          ),
          text: t(
            "Inscription gratuite, vérification en 24 h, sélection en ligne le jour même.",
            "Free sign-up, verified within 24 hours, your selection live the same day.",
          ),
          primary: { label: t("Créer ma sélection", "Create my selection"), href: SIGNUP },
        },
      }}
    />
  );
}
