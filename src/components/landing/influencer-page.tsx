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
  const venues = [
    /* Les adresses de la fiction du film (dashboard du héros), pour
       n'évoquer aucun établissement réel. */
    { name: "Le Comptoir du Soir", kind: "Restaurant", note: "Réservez la terrasse, et prenez le dessert." },
    { name: "Brasserie Alma", kind: "Brasserie", note: "Mon déjeuner du dimanche." },
    { name: "Voilier au coucher du soleil", kind: "Expérience", note: "À faire une fois dans sa vie." },
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
        Ma sélection · Marrakech
      </p>
      {venues.map((v) => (
        <div key={v.name} className="border-t border-black/[0.07] py-3 first-of-type:mt-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[14px] font-medium text-[var(--landing-ink)]">{v.name}</p>
            <p className="shrink-0 text-[11px] text-[var(--landing-ink)]/45">{v.kind}</p>
          </div>
          <p className="mt-0.5 text-[12px] italic text-[var(--landing-ink)]/60">« {v.note} »</p>
        </div>
      ))}
    </div>
  );
}

function ShareVisual() {
  const channels = [
    { icon: Camera, label: "Bio Instagram" },
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
          <p className="text-[11px] text-[var(--landing-ink)]/45">Votre lien unique</p>
          <p className="truncate text-[15px] font-medium text-[var(--landing-ink)]">
            twocardspro.com/s/votre-nom
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
  const rows = [
    ["Réservations ce mois", "18"],
    ["Clients arrivés", "17"],
    ["Revenu vérifié", "21 400 MAD"],
  ];
  return (
    <div className={`${panel} p-5 text-left`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--landing-ink)]/45">
          Mon tableau de bord
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
          <span className="font-medium text-[var(--landing-ink)]">{value}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-[13px] text-emerald-800">Mes commissions</span>
        <span className="text-[16px] font-semibold text-emerald-700">2 140 MAD</span>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Composez votre sélection",
    description:
      "Choisissez les restaurants, rooftops et clubs que vous recommandez déjà, et ajoutez votre mot sur chacun. Uniquement des établissements vérifiés du réseau, avec leur commission affichée avant que vous les ajoutiez.",
    visual: SelectionVisual,
  },
  {
    title: "Partagez un seul lien",
    description:
      "Un lien couvre toute votre sélection. Mettez-le en bio, en story, dans un message WhatsApp ou sur un QR code. Votre audience voit vos adresses et réserve directement, aux vraies disponibilités.",
    visual: ShareVisual,
  },
  {
    title: "Touchez une commission",
    description:
      "Chaque réservation faite depuis votre lien vous est attribuée automatiquement. Quand le client arrive et que l'addition est vérifiée, votre commission est calculée et apparaît dans votre tableau de bord.",
    visual: EarnVisual,
  },
];

/* ─── Exemple complet ──────────────────────────────────────────────────── */

const EXAMPLE = [
  {
    icon: Camera,
    when: "Lundi, 18:00",
    title: "Vous publiez votre sélection en story",
    detail: "Avec votre lien, comme d'habitude.",
  },
  {
    icon: Link2,
    when: "Lundi, 18:12",
    title: "Sara réserve pour 4 au Comptoir du Soir",
    detail: "Samedi, 21:00. La réservation vous est attribuée.",
  },
  {
    icon: ScanLine,
    when: "Samedi, 21:04",
    title: "Elle scanne le QR à l'entrée",
    detail: "Sa venue est prouvée, sans rien vous demander.",
  },
  {
    icon: Receipt,
    when: "Samedi, 23:30",
    title: "L'addition de 1 240 MAD est vérifiée",
    detail: "Votre commission est calculée sur ce montant réel.",
  },
  {
    icon: Wallet,
    when: "Aussitôt",
    title: "+124 MAD dans votre tableau de bord",
    detail: "Au taux fixé par l'établissement, payés à la date prévue.",
  },
];

/* ─── Bénéfices et FAQ ─────────────────────────────────────────────────── */

const GAINS = [
  {
    title: "Vous le faites déjà gratuitement",
    description:
      "Vos recommandations remplissent des salles depuis des années. Désormais, chaque réservation qu'elles déclenchent vous est attribuée et rémunérée.",
  },
  {
    title: "Un lien, toutes vos adresses",
    description:
      "Une seule sélection peut couvrir une soirée entière : dîner, rooftop, club, expérience. Un lien, plusieurs sources de revenu.",
  },
  {
    title: "Votre audience reste la vôtre",
    description:
      "Votre sélection, votre image, votre lien. TwoCards ne s'installe jamais entre vous et les gens qui vous suivent.",
  },
  {
    title: "Tout est visible, en direct",
    description:
      "Clics, réservations, revenu attribué, commissions en attente et payées : votre tableau de bord est à jour en permanence.",
  },
  {
    title: "Des adresses vérifiées",
    description:
      "Vous n'envoyez jamais votre audience à l'aveugle : établissements vérifiés, conditions affichées, venue prouvée au check-in.",
  },
  {
    title: "Une place de premier arrivé",
    description:
      "Le réseau de Marrakech se construit maintenant. Les premiers influenceurs vérifiés définissent la façon dont la ville réserve demain.",
  },
];

const FAQ = [
  {
    q: "Combien ça coûte ?",
    a: "Rien. L'inscription et le lien de sélection sont gratuits. Vous êtes rémunéré sur les réservations réellement finalisées, selon les règles de commission de chaque établissement.",
  },
  {
    q: "Combien je touche par réservation ?",
    a: "Chaque établissement fixe son taux de commission, affiché avant que vous l'ajoutiez à votre sélection. La commission est calculée sur l'addition réellement vérifiée, pas sur une estimation.",
  },
  {
    q: "Quand suis-je payé ?",
    a: "Selon un calendrier fixe, visible sur chaque commission, une fois la facture de la réservation vérifiée. Vous suivez chaque statut en temps réel : validée, en cours, payée.",
  },
  {
    q: "Combien de temps mon lien rapporte-t-il ?",
    a: "Tant que votre sélection est active. Chaque réservation passée par votre lien vous reste attribuée, sans plafond ni date limite.",
  },
  {
    q: "Un lieu que j'adore n'est pas encore sur TwoCards ?",
    a: "Proposez-le. Les établissements suggérés par le réseau sont contactés en priorité, et vous restez l'apporteur attribué s'ils rejoignent.",
  },
  {
    q: "Puis-je couvrir plusieurs villes ?",
    a: "Marrakech d'abord. Le réseau suivra ensuite les corridors de clientèle (Casablanca, Paris, Saint-Tropez, Dubaï), et votre réputation voyagera avec vous.",
  },
];

const SIGNUP = "/signup?role=concierge";

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function InfluencerPage() {
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
          TwoCards pour les influenceurs
        </p>
        <h1 className="mx-auto max-w-6xl text-balance font-title text-[42px] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-[60px] lg:text-[72px]">
          Votre goût a déjà de la valeur.
          <br />
          <em className="font-light italic">TwoCards le rémunère.</em>
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-white/90 md:text-[19px]">
          Vous recommandez déjà des restaurants, des rooftops et des clubs.
          Avec TwoCards, chaque réservation qui passe par votre lien vous
          est attribuée, et vous touchez une commission.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
          <Link
            href={SIGNUP}
            className="rounded-full bg-white px-8 py-3.5 text-[14px] font-medium text-[var(--landing-ink)] transition-opacity hover:opacity-85"
          >
            Créer ma sélection
          </Link>
          <a
            href="#comment"
            className="text-[14px] font-medium text-white/90 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white"
          >
            Comment ça marche
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
              Aujourd&apos;hui, vos stories remplissent des tables{" "}
              <em className="font-light italic">sans que vous le sachiez</em>.
            </p>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/85 md:text-[18px]">
              Avec TwoCards, chaque table réservée grâce à votre lien est
              suivie jusqu&apos;à l&apos;addition, et vous en touchez une part.
            </p>
          </div>
        </div>
      </ScrollVideoHero>

      <main>
        {/* Comment ça marche */}
        <section id="comment" className={`${SECTION} scroll-mt-20`}>
          <div className={CONTAINER}>
            <SectionHeader
              title={
                <>
                  Comment ça marche.
                  <br />
                  <em className="font-light italic">En trois étapes.</em>
                </>
              }
              intro="Pas de code promo, pas de capture d'écran à envoyer, pas de relance : votre lien fait le suivi à votre place."
            />

            <div className="grid gap-x-6 gap-y-16 lg:grid-cols-3">
              {STEPS.map((step, i) => (
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
                Un exemple,
                <br />
                <em className="font-light italic">de la story au paiement.</em>
              </h2>
              <p className="mt-7 max-w-md text-[16px] leading-relaxed text-[var(--landing-ink)]/70 md:text-[17px]">
                Une story le lundi, une table le samedi, une commission le
                soir même. Vous n&apos;avez rien à faire entre les deux.
              </p>
              <p className="mt-6 max-w-md text-[13px] leading-relaxed text-[var(--landing-mute)]">
                Exemple illustratif. Le taux de commission est fixé par chaque
                établissement et affiché avant que vous l&apos;ajoutiez à votre
                sélection.
              </p>
            </motion.div>

            <ol className={`${STAGE} p-4 sm:p-8`}>
              {EXAMPLE.map((e, i) => {
                const last = i === EXAMPLE.length - 1;
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
              title={
                <>
                  Ce que vous
                  <br />
                  <em className="font-light italic">y gagnez</em>.
                </>
              }
            />
            <div className="grid border-t border-black/[0.1] sm:grid-cols-2 lg:grid-cols-3">
              {GAINS.map((g, i) => (
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
                Vos questions,
                <br />
                <em className="font-light italic">nos réponses</em>.
              </h2>
            </div>
            <div className="flex flex-col">
              {FAQ.map((item) => (
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
          title={
            <>
              Vos recommandations tournent déjà.
              <br />
              <em className="font-light italic">Récupérez votre part.</em>
            </>
          }
          text="Inscription gratuite, vérification en 24 h, sélection en ligne le jour même."
          primary={{ label: "Créer ma sélection", href: SIGNUP }}
          secondary={null}
        />
      </main>
      <Footer />
    </div>
  );
}
