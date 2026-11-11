"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  Check,
  Link2,
  MessageCircle,
  Plus,
  QrCode,
  ScanLine,
  Receipt,
  Wallet,
} from "lucide-react";
import { ScrollVideoHero } from "@/components/landing/scroll-video-hero";
import { CtaBanner } from "@/components/landing/cta-banner";
import {
  CONTAINER,
  SECTION,
  STAGE,
  SectionHeader,
  TITLE,
} from "@/components/landing/section-header";
import { Footer } from "@/components/layout/footer";
import { useT } from "@/lib/i18n/client";
import { useMoney } from "@/lib/currency/client";
import type { Money } from "@/lib/currency/amounts";
import type { Translate } from "@/lib/i18n";

/* Page Influenceurs, dans l'écriture de la page d'accueil.

   La séquence des portes (vidéo pilotée par le scroll) ne porte plus que
   l'accroche et une phrase-principe, en grand et sur un voile sombre :
   auparavant toute la page défilait sur la vidéo, en petit texte blanc à
   peine détaché du jardin. Toute l'explication se lit ensuite sur fond
   ivoire : les trois étapes illustrées, un exemple complet de la story au
   paiement, les bénéfices, la FAQ. */

const panel =
  "w-full rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-30px_rgba(60,40,10,0.35)]";

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
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
        {t("Ma sélection · Marrakech", "My selection · Marrakech")}
      </p>
      {venues.map((v) => (
        <div key={v.name} className="border-t border-black/[0.07] py-3 first-of-type:mt-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[14px] font-medium text-[var(--landing-ink)]">{v.name}</p>
            <p className="shrink-0 text-[11px] text-[var(--landing-ink)]/45">{v.kind}</p>
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
          <p className="text-[11px] text-[var(--landing-ink)]/45">{t("Votre lien unique", "Your unique link")}</p>
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
  const money = useMoney();
  const rows = [
    [t("Réservations ce mois", "Reservations this month"), "18"],
    [t("Clients arrivés", "Guests arrived"), "17"],
    [t("Revenu vérifié", "Verified revenue"), money("influencerVerifiedRevenue")],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          {t("Mon tableau de bord", "My dashboard")}
        </p>
        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t("en direct", "live")}
        </span>
      </div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between border-t border-black/[0.07] py-2.5 text-[13px]"
        >
          <span className="text-[var(--landing-ink)]/55">{label}</span>
          <span className="font-medium text-[var(--landing-ink)]">{value}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-[13px] text-emerald-800">{t("Mes commissions", "My commissions")}</span>
        <span className="text-[16px] font-semibold text-emerald-700">{money("influencerCommissions")}</span>
      </div>
    </div>
  );
}

const getSteps = (t: Translate) => [
  {
    title: t("Composez votre sélection", "Build your selection"),
    description: t(
      "Choisissez les restaurants, rooftops et clubs que vous recommandez déjà, et ajoutez votre mot sur chacun. Uniquement des établissements vérifiés du réseau, avec leur commission affichée avant que vous les ajoutiez.",
      "Pick the restaurants, rooftops and clubs you already recommend, and add your own note to each. Only verified venues from the network, with their commission shown before you add them.",
    ),
    visual: SelectionVisual,
  },
  {
    title: t("Partagez un seul lien", "Share a single link"),
    description: t(
      "Un lien couvre toute votre sélection. Mettez-le en bio, en story, dans un message WhatsApp ou sur un QR code. Votre audience voit vos adresses et réserve directement, aux vraies disponibilités.",
      "One link covers your whole selection. Put it in your bio, in a story, in a WhatsApp message or on a QR code. Your audience sees your places and books directly, with real availability.",
    ),
    visual: ShareVisual,
  },
  {
    title: t("Touchez une commission", "Earn a commission"),
    description: t(
      "Chaque réservation faite depuis votre lien vous est attribuée automatiquement. Quand le client arrive et que l'addition est vérifiée, votre commission est calculée et apparaît dans votre tableau de bord.",
      "Every reservation made through your link is attributed to you automatically. When the guest arrives and the bill is verified, your commission is calculated and shows up in your dashboard.",
    ),
    visual: EarnVisual,
  },
];

/* ─── Exemple complet ──────────────────────────────────────────────────── */

const getExample = (t: Translate, money: Money) => [
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
    title: t(
      `L'addition de ${money("influencerBill")} est vérifiée`,
      `The ${money("influencerBill")} bill is verified`,
    ),
    detail: t(
      "Votre commission est calculée sur ce montant réel.",
      "Your commission is calculated on that actual amount.",
    ),
  },
  {
    icon: Wallet,
    when: t("Aussitôt", "Instantly"),
    title: t(
      `+${money("influencerBillCommission")} dans votre tableau de bord`,
      `+${money("influencerBillCommission")} in your dashboard`,
    ),
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
    description: t(
      "Vos recommandations remplissent des salles depuis des années. Désormais, chaque réservation qu'elles déclenchent vous est attribuée et rémunérée.",
      "Your recommendations have been filling dining rooms for years. Now every reservation they drive is attributed to you, and paid.",
    ),
  },
  {
    title: t("Un lien, toutes vos adresses", "One link, all your places"),
    description: t(
      "Une seule sélection peut couvrir une soirée entière : dîner, rooftop, club, expérience. Un lien, plusieurs sources de revenu.",
      "A single selection can cover a whole night out: dinner, rooftop, club, experience. One link, several income streams.",
    ),
  },
  {
    title: t("Votre audience reste la vôtre", "Your audience stays yours"),
    description: t(
      "Votre sélection, votre image, votre lien. TwoCards ne s'installe jamais entre vous et les gens qui vous suivent.",
      "Your selection, your image, your link. TwoCards never comes between you and the people who follow you.",
    ),
  },
  {
    title: t("Tout est visible, en direct", "Everything visible, live"),
    description: t(
      "Clics, réservations, revenu attribué, commissions en attente et payées : votre tableau de bord est à jour en permanence.",
      "Clicks, reservations, attributed revenue, pending and paid commissions: your dashboard is always up to date.",
    ),
  },
  {
    title: t("Des adresses vérifiées", "Verified places"),
    description: t(
      "Vous n'envoyez jamais votre audience à l'aveugle : établissements vérifiés, conditions affichées, venue prouvée au check-in.",
      "You never send your audience in blind: verified venues, conditions shown upfront, visits proven at check-in.",
    ),
  },
  {
    title: t("Une place de premier arrivé", "A first-mover's seat"),
    description: t(
      "Le réseau de Marrakech se construit maintenant. Les premiers influenceurs vérifiés définissent la façon dont la ville réserve demain.",
      "The Marrakech network is being built right now. The first verified influencers will shape how the city books tomorrow.",
    ),
  },
];

const getFaq = (t: Translate) => [
  {
    q: t("Combien ça coûte ?", "How much does it cost?"),
    a: t(
      "Rien. L'inscription et le lien de sélection sont gratuits. Vous êtes rémunéré sur les réservations réellement finalisées, selon les règles de commission de chaque établissement.",
      "Nothing. Signing up and your selection link are free. You earn on reservations that actually go through, according to each venue's commission rules.",
    ),
  },
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

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function InfluencerPage() {
  const t = useT();
  const money = useMoney();
  const steps = getSteps(t);
  const example = getExample(t, money);
  const gains = getGains(t);
  const faq = getFaq(t);
  /* Écran 1 : l'accroche, posée sur un voile radial qui assombrit le centre
     de l'image sans éteindre les portes. */
  const hero = (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),rgba(0,0,0,0)_70%)]"
      />
      <div className="relative">
        <p className="mb-6 text-[12px] font-medium uppercase tracking-[0.22em] text-white/75">
          {t("TwoCards pour les influenceurs", "TwoCards for influencers")}
        </p>
        <h1 className="mx-auto max-w-6xl text-balance font-title text-[42px] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-[60px] lg:text-[72px]">
          {t(
            <>
              Votre goût a déjà de la valeur.
              <br />
              <em className="font-light italic">TwoCards le rémunère.</em>
            </>,
            <>
              Your taste already has value.
              <br />
              <em className="font-light italic">TwoCards pays for it.</em>
            </>,
          )}
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-white/90 md:text-[19px]">
          {t(
            "Vous recommandez déjà des restaurants, des rooftops et des clubs. Avec TwoCards, chaque réservation qui passe par votre lien vous est attribuée, et vous touchez une commission.",
            "You already recommend restaurants, rooftops and clubs. With TwoCards, every reservation made through your link is attributed to you, and you earn a commission.",
          )}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
          <Link
            href={SIGNUP}
            className="rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-[var(--landing-ink)] transition-opacity hover:opacity-85"
          >
            {t("Créer ma sélection", "Create my selection")}
          </Link>
          <a
            href="#comment"
            className="text-[14px] font-medium text-white/90 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white"
          >
            {t("Comment ça marche", "How it works")}
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)]">
      <ScrollVideoHero
        videoDesktop="/videos/hero-doors.mp4"
        videoMobile="/videos/hero-doors-720.mp4"
        poster="/videos/hero-doors-poster.jpg"
        hero={hero}
      >
        {/* Écran 2 : le principe en une phrase, en grand, pendant que les
            portes s'ouvrent. */}
        <div className="flex min-h-dvh items-center justify-center px-6">
          <div className="max-w-3xl rounded-3xl bg-black/45 px-8 py-12 text-center backdrop-blur-md md:px-14 md:py-16">
            <p className="font-title text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-white md:text-[42px]">
              {t(
                <>
                  Aujourd&apos;hui, vos stories remplissent des tables{" "}
                  <em className="font-light italic">sans que vous le sachiez</em>.
                </>,
                <>
                  Right now, your stories are filling tables{" "}
                  <em className="font-light italic">without you knowing</em>.
                </>,
              )}
            </p>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/85 md:text-[18px]">
              {t(
                "Avec TwoCards, chaque table réservée grâce à votre lien est suivie jusqu'à l'addition, et vous en touchez une part.",
                "With TwoCards, every table booked through your link is tracked all the way to the bill, and you get a share.",
              )}
            </p>
          </div>
        </div>
      </ScrollVideoHero>

      <main>
        {/* Comment ça marche */}
        <section id="comment" className={`${SECTION} scroll-mt-20`}>
          <div className={CONTAINER}>
            <SectionHeader
              title={t(
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
              )}
              intro={t(
                "Pas de code promo, pas de capture d'écran à envoyer, pas de relance : votre lien fait le suivi à votre place.",
                "No promo codes, no screenshots to send, no chasing: your link does the tracking for you.",
              )}
            />

            <div className="grid gap-x-6 gap-y-16 lg:grid-cols-3">
              {steps.map((step, i) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                >
                  <div className={`${STAGE} flex h-[330px] items-center justify-center px-6 sm:px-10 lg:px-6`}>
                    <div className="w-full max-w-[21rem]">
                      <step.visual />
                    </div>
                  </div>
                  <div className="mt-8 flex gap-5">
                    <span className="pt-1 font-title text-[15px] font-medium tabular-nums text-[var(--landing-mute)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[22px] font-semibold leading-snug tracking-[-0.015em] text-[var(--landing-ink)]">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-[16px] leading-relaxed text-[var(--landing-ink)]/70">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Exemple complet */}
        <section className={SECTION}>
          <div className={`${CONTAINER} grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <h2 className={TITLE}>
                {t(
                  <>
                    Un exemple,
                    <br />
                    <em className="font-light italic">de la story au paiement.</em>
                  </>,
                  <>
                    One example,
                    <br />
                    <em className="font-light italic">from story to payout.</em>
                  </>,
                )}
              </h2>
              <p className="mt-7 max-w-md text-[16px] leading-relaxed text-[var(--landing-ink)]/70 md:text-[17px]">
                {t(
                  "Une story le lundi, une table le samedi, une commission le soir même. Vous n'avez rien à faire entre les deux.",
                  "A story on Monday, a table on Saturday, a commission that same night. You don't have to do a thing in between.",
                )}
              </p>
              <p className="mt-6 max-w-md text-[13px] leading-relaxed text-[var(--landing-mute)]">
                {t(
                  "Exemple illustratif. Le taux de commission est fixé par chaque établissement et affiché avant que vous l'ajoutiez à votre sélection.",
                  "Illustrative example. The commission rate is set by each venue and shown before you add it to your selection.",
                )}
              </p>
            </motion.div>

            <ol className={`${STAGE} p-4 sm:p-8`}>
              {example.map((e, i) => {
                const last = i === example.length - 1;
                return (
                  <motion.li
                    key={e.title}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="relative flex gap-5 pb-8 last:pb-0"
                  >
                    {/* Fil de la chronologie */}
                    {!last && (
                      <span
                        aria-hidden
                        className="absolute left-[21px] top-12 bottom-0 w-px bg-black/10"
                      />
                    )}
                    <span
                      className={`relative flex size-11 shrink-0 items-center justify-center rounded-full ${
                        last
                          ? "bg-emerald-600 text-white"
                          : "border border-black/10 bg-white text-[var(--landing-ink)]"
                      }`}
                    >
                      {last ? <Check size={18} strokeWidth={2.5} /> : <e.icon size={17} strokeWidth={1.6} />}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--landing-mute)]">
                        {e.when}
                      </p>
                      <p
                        className={`mt-1 text-[17px] font-semibold leading-snug md:text-[18px] ${
                          last ? "text-emerald-700" : "text-[var(--landing-ink)]"
                        }`}
                      >
                        {e.title}
                      </p>
                      <p className="mt-1 text-[15px] leading-relaxed text-[var(--landing-ink)]/65">
                        {e.detail}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Ce que vous y gagnez */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <SectionHeader
              title={t(
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
              )}
            />
            <div className="grid border-t border-black/[0.1] sm:grid-cols-2 lg:grid-cols-3">
              {gains.map((g, i) => (
                <motion.div
                  key={g.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  className="border-b border-black/[0.1] py-9 sm:pr-10"
                >
                  <h3 className="text-[20px] font-semibold leading-snug tracking-[-0.01em] text-[var(--landing-ink)]">
                    {g.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-[var(--landing-ink)]/70">
                    {g.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={SECTION}>
          <div className={`${CONTAINER} grid gap-12 md:grid-cols-[1fr_1.5fr] md:gap-20`}>
            <div className="md:sticky md:top-28 md:self-start">
              <h2 className={TITLE}>
                {t(
                  <>
                    Vos questions,
                    <br />
                    <em className="font-light italic">nos réponses</em>.
                  </>,
                  <>
                    Your questions,
                    <br />
                    <em className="font-light italic">answered</em>.
                  </>,
                )}
              </h2>
            </div>
            <div className="flex flex-col">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group border-t border-black/[0.1] last:border-b"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-medium text-[var(--landing-ink)] md:text-[18px] [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <Plus
                      size={18}
                      strokeWidth={1.5}
                      className="shrink-0 text-[var(--landing-mute)] transition-transform duration-300 group-open:rotate-45"
                    />
                  </summary>
                  <p className="-mt-1 pb-7 pr-10 text-[16px] leading-relaxed text-[var(--landing-ink)]/70">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <CtaBanner
          title={t(
            <>
              Vos recommandations tournent déjà.
              <br />
              <em className="font-light italic">Récupérez votre part.</em>
            </>,
            <>
              Your recommendations are already out there.
              <br />
              <em className="font-light italic">Claim your share.</em>
            </>,
          )}
          text={t(
            "Inscription gratuite, vérification en 24 h, sélection en ligne le jour même.",
            "Free sign-up, verified within 24 hours, your selection live the same day.",
          )}
          primary={{ label: t("Créer ma sélection", "Create my selection"), href: SIGNUP }}
          secondary={null}
        />
      </main>
      <Footer />
    </div>
  );
}
