"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

/* Demande d'accès en trois écrans : le métier d'abord (« Vous êtes… »),
   puis ce qui le concerne, puis les coordonnées du compte. Sur grand écran,
   une photo du métier choisi occupe la moitié gauche ; mêmes images que
   l'accordéon « Le même QR, pour chaque métier » de l'accueil.

   Les influenceurs ont un compte concierge (même espace, même lien de
   réservation) : leur profil est noté à part dans les métadonnées. La base
   n'accepte que etablissement / hotel / concierge (sync_role_to_app_metadata). */

type Kind = "hotel" | "etablissement" | "concierge" | "influenceur";
type Step = 1 | 2 | 3;

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

const getKinds = (
  t: Translate,
): {
  value: Kind;
  label: string;
  line: string;
  image: string;
  caption: string;
}[] => [
  {
    value: "hotel",
    label: t("Hôtel ou riad", "Hotel or riad"),
    line: t("Un QR en chambre, vos clients réservent seuls.", "A QR code in every room, guests book on their own."),
    image: UNSPLASH("photo-1759472659432-3232e42d04d2"),
    caption: t(
      "Chaque sortie de vos clients est rattachée à votre maison.",
      "Every outing your guests book is credited to your property.",
    ),
  },
  {
    value: "etablissement",
    label: t("Établissement", "Venue"),
    line: t("Restaurant, rooftop, club, activité.", "Restaurant, rooftop, club, activity."),
    image: UNSPLASH("photo-1672832593966-fe1795b8d287"),
    caption: t(
      "Des clients d'hôtels à votre porte, vous payez au résultat.",
      "Hotel guests at your door, and you only pay for results.",
    ),
  },
  {
    value: "concierge",
    label: t("Concierge ou RP", "Concierge or PR"),
    line: t("Vos recommandations, suivies et rémunérées.", "Your recommendations, tracked and rewarded."),
    image: UNSPLASH("photo-1660557989695-14fac79c086d"),
    caption: t(
      "Vous savez quand votre client arrive, la commission suit.",
      "You know when your guest arrives, and the commission follows.",
    ),
  },
  {
    value: "influenceur",
    label: t("Créateur de contenu", "Content creator"),
    line: t("Un lien unique pour toute votre sélection.", "One link for your whole selection."),
    image: UNSPLASH("photo-1672831744471-fb82fd8fa2e0"),
    caption: t(
      "Chaque réservation issue de vos contenus vous est attribuée.",
      "Every reservation that comes from your content is credited to you.",
    ),
  },
];

const DEFAULT_IMAGE = UNSPLASH("photo-1647878501041-1609141a7fb1");

const getVenueTypes = (t: Translate) => [
  { value: "restaurant", label: "Restaurant" },
  { value: "rooftop", label: "Rooftop" },
  { value: "club", label: "Club" },
  { value: "lounge", label: "Lounge" },
  { value: "bar", label: "Bar" },
  { value: "beach-club", label: "Beach club" },
  { value: "hotel-riad", label: t("Hôtel / Riad", "Hotel / Riad") },
  /* Activité (quad, hammam, excursion…) ou service (chauffeur,
     photographe…) : l'espace montre des prestations, pas des tables. */
  { value: "activite", label: t("Activité", "Activity") },
  { value: "service", label: "Service" },
] as const;

const getConciergeTypes = (t: Translate) => [
  { value: "hotel", label: t("Concierge d'hôtel", "Hotel concierge") },
  { value: "private", label: t("Conciergerie privée", "Private concierge") },
  { value: "rp", label: t("RP / promoteur", "PR / promoter") },
] as const;

const getAudienceSizes = (t: Translate) => [
  { value: "lt10k", label: t("Moins de 10 k", "Under 10k") },
  { value: "10-50k", label: t("10 à 50 k", "10k–50k") },
  { value: "50-200k", label: t("50 à 200 k", "50k–200k") },
  { value: "gt200k", label: t("Plus de 200 k", "Over 200k") },
] as const;

const getStep2 = (t: Translate): Record<Kind, { title: string; intro: string }> => ({
  hotel: {
    title: t("Votre hôtel", "Your hotel"),
    intro: t("Pour préparer vos QR codes et votre espace.", "So we can prepare your QR codes and your workspace."),
  },
  etablissement: {
    title: t("Votre établissement", "Your venue"),
    intro: t("Ce que les clients verront dans le menu des hôtels.", "What guests will see in the hotels’ menu."),
  },
  concierge: {
    title: t("Votre activité", "Your work"),
    intro: t("Pour vous présenter aux établissements du réseau.", "So we can introduce you to venues in the network."),
  },
  influenceur: {
    title: t("Votre audience", "Your audience"),
    intro: t("Pour vous proposer les adresses qui lui ressemblent.", "So we can suggest places that suit your audience."),
  },
});

/* Ramène toute saisie à l'identifiant seul : « @Karim », « Karim » ou une URL
   de profil collée donnent tous « karim ». Normaliser à l'envoi plutôt qu'à
   la frappe évite de déplacer le curseur pendant que l'utilisateur écrit. */
function normalizeInstagram(raw: string): string | null {
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
  return handle || null;
}

const inputClass =
  "h-12 w-full rounded-xl border border-black/[0.12] bg-white px-4 text-[15px] text-[var(--landing-ink)] outline-none transition-colors placeholder:text-black/30 hover:border-black/25 focus:border-[var(--landing-ink)]";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-[14px] font-medium">
        {label}
        {hint && <span className="text-[13px] font-normal text-[var(--landing-mute)]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Choices<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-[14px] font-medium">
        {label}
        {hint && <span className="text-[13px] font-normal text-[var(--landing-mute)]">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="inline-block rounded-full border border-black/[0.12] bg-white px-4 py-2 text-[14px] text-[var(--landing-ink)]/70 transition-colors hover:border-black/30 peer-checked:border-[var(--landing-ink)] peer-checked:bg-[var(--landing-ink)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--landing-ink)] peer-focus-visible:ring-offset-2">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PrimaryButton({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={17} className="animate-spin" />
      ) : (
        <>
          {children}
          <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 text-[24px] font-semibold leading-none tracking-tight ${
        light ? "text-white" : "text-[var(--landing-ink)]"
      }`}
    >
      <Image src="/logo-cards-transp.png" alt="" width={64} height={64} className="h-6 w-auto" />
      <span>
        twocards<span className={light ? "text-white/50" : "text-[var(--landing-mute)]"}>.</span>
      </span>
    </Link>
  );
}

function SignupFlow() {
  const t = useT();
  const KINDS = getKinds(t);
  const VENUE_TYPES = getVenueTypes(t);
  const CONCIERGE_TYPES = getConciergeTypes(t);
  const AUDIENCE_SIZES = getAudienceSizes(t);
  const STEP2 = getStep2(t);
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  /* Arrivé depuis une page métier (?role=hotel…) : le métier est déjà
     connu, on ouvre directement sur le deuxième écran. */
  const roleParam = searchParams.get("role");
  const initialKind = KINDS.some((k) => k.value === roleParam) ? (roleParam as Kind) : null;

  const [kind, setKind] = useState<Kind | null>(initialKind);
  const [hovered, setHovered] = useState<Kind | null>(null);
  const [step, setStep] = useState<Step>(initialKind ? 2 : 1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [venueType, setVenueType] = useState<ReturnType<typeof getVenueTypes>[number]["value"]>("restaurant");
  const [conciergeType, setConciergeType] = useState<ReturnType<typeof getConciergeTypes>[number]["value"] | null>(null);
  const [audienceSize, setAudienceSize] = useState<ReturnType<typeof getAudienceSizes>[number]["value"] | null>(null);
  const [form, setForm] = useState({
    venueName: "",
    city: "",
    rooms: "",
    organization: "",
    instagram: "",
    fullname: "",
    email: "",
    phone: "",
    password: "",
  });
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  /* À chaque écran : retour en haut (mobile) et focus sur le titre, pour
     que le lecteur d'écran annonce le nouvel écran. */
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, done]);

  const chooseKind = (k: Kind) => {
    setKind(k);
    setError("");
    setStep(2);
  };

  const back = () => {
    setError("");
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind) return;
    setError("");
    if (form.password.length < 8) {
      setError(t("Le mot de passe doit contenir au moins 8 caractères.", "Your password must be at least 8 characters long."));
      return;
    }
    setLoading(true);

    const hasVenue = kind === "hotel" || kind === "etablissement";
    const { error } = await createClient().auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullname,
          phone: form.phone,
          instagram: normalizeInstagram(form.instagram),
          role: kind === "influenceur" ? "concierge" : kind,
          signup_profile: kind,
          venue_name: hasVenue ? form.venueName : null,
          venue_type: kind === "etablissement" ? venueType : null,
          city: hasVenue ? form.city : null,
          rooms_count: kind === "hotel" && form.rooms ? Number(form.rooms) : null,
          organization: kind === "concierge" ? form.organization.trim() || null : null,
          concierge_type: kind === "concierge" ? conciergeType : null,
          audience_size: kind === "influenceur" ? audienceSize : null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(
        error.message === "User already registered"
          ? t("Un compte existe déjà avec cet e-mail.", "An account already exists with this email.")
          : /rate limit|security purposes/i.test(error.message)
            ? t(
                "Trop de tentatives. Patientez un instant avant de réessayer.",
                "Too many attempts. Please wait a moment before trying again.",
              )
            : /password should be|weak password/i.test(error.message)
              ? t("Ce mot de passe est trop faible. Choisissez-en un plus robuste.", "This password is too weak. Please choose a stronger one.")
              : /invalid.*email|email.*invalid/i.test(error.message)
                ? t("Adresse e-mail invalide.", "Invalid email address.")
                : error.message
      );
      return;
    }
    setDone(true);
  };

  const shown = KINDS.find((k) => k.value === (step === 1 ? hovered ?? kind : kind));
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      };

  const heading = "text-[36px] font-bold leading-[1.05] tracking-[-0.03em] outline-none md:text-[48px]";

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Photo du métier, grand écran seulement. Les images sont toutes
          posées et se relaient en fondu, sans rechargement au survol. */}
      <aside className="relative hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden bg-[#1a1612]">
          {/* Conteneur absolu : next/image « fill » refuse un parent sticky. */}
          <div className="absolute inset-0">
            {[DEFAULT_IMAGE, ...KINDS.map((k) => k.image)].map((src) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                priority={src === DEFAULT_IMAGE}
                sizes="45vw"
                className={`object-cover transition-opacity duration-700 ${
                  (shown?.image ?? DEFAULT_IMAGE) === src ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          <div className="absolute left-10 top-8">
            <Wordmark light />
          </div>
          <div className="absolute inset-x-10 bottom-12 max-w-md text-white">
            <p className="text-[14px] text-white/60">{shown ? shown.label : t("Rejoindre le réseau", "Join the network")}</p>
            <p className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              {shown
                ? shown.caption
                : t(
                    "Hôtels, établissements, concierges et créateurs : un même réseau, chaque réservation suivie.",
                    "Hotels, venues, concierges and creators: one network, every reservation tracked.",
                  )}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex h-10 items-center justify-between gap-4">
          <div className="lg:hidden">
            <Wordmark />
          </div>
          <p className="ml-auto shrink-0 text-[14px] text-[var(--landing-mute)]">
            <span className="hidden sm:inline">{t("Déjà un compte ? ", "Already have an account? ")}</span>
            <Link href="/login" className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4 hover:decoration-black/60">
              {t("Se connecter", "Log in")}
            </Link>
          </p>
          <LanguageSwitcher className="shrink-0" />
        </header>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-[520px] py-12 lg:py-16">
            {!done && (
              <div className="mb-10">
                <div className="flex gap-1.5" aria-hidden>
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
                        n <= step ? "bg-[var(--landing-ink)]" : "bg-black/10"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex h-6 items-center justify-between text-[14px] text-[var(--landing-mute)]">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={back}
                      className="-ml-1 inline-flex items-center gap-1.5 rounded px-1 text-[var(--landing-ink)]/70 transition-colors hover:text-[var(--landing-ink)]"
                    >
                      <ArrowLeft size={15} strokeWidth={1.75} />
                      {t("Retour", "Back")}
                    </button>
                  ) : (
                    <span>{t("Demander un accès", "Request access")}</span>
                  )}
                  <span>{t(`Étape ${step} sur 3`, `Step ${step} of 3`)}</span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.div key="done" {...motionProps}>
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    {t("Vérifiez votre boîte mail.", "Check your inbox.")}
                  </h1>
                  <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                    {t(
                      <>
                        Un lien de confirmation vient d&apos;être envoyé à{" "}
                        <span className="font-medium text-[var(--landing-ink)]">{form.email}</span>. Cliquez dessus pour
                        activer votre compte.
                      </>,
                      <>
                        We&apos;ve just sent a confirmation link to{" "}
                        <span className="font-medium text-[var(--landing-ink)]">{form.email}</span>. Click it to
                        activate your account.
                      </>,
                    )}
                  </p>
                  <Link
                    href="/login"
                    className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
                  >
                    {t("Aller à la connexion", "Go to log in")}
                    <ArrowRight size={16} strokeWidth={1.75} />
                  </Link>
                </motion.div>
              ) : step === 1 ? (
                <motion.div key="step-1" {...motionProps}>
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    {t(
                      <>
                        Vous <em className="font-light italic">êtes</em>…
                      </>,
                      <>
                        You <em className="font-light italic">are</em>…
                      </>,
                    )}
                  </h1>
                  <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                    {t(
                      <>La suite de l&apos;inscription s&apos;adapte à votre métier.</>,
                      <>The rest of sign-up adapts to what you do.</>,
                    )}
                  </p>

                  <ul className="mt-9 border-t border-black/[0.08]" onMouseLeave={() => setHovered(null)}>
                    {KINDS.map((k) => (
                      <li key={k.value} className="border-b border-black/[0.08]">
                        <button
                          type="button"
                          onClick={() => chooseKind(k.value)}
                          onMouseEnter={() => setHovered(k.value)}
                          onFocus={() => setHovered(k.value)}
                          className="group flex w-full items-center gap-4 py-5 text-left outline-none focus-visible:bg-black/[0.03] sm:gap-6"
                        >
                          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#1a1612] sm:h-[76px] sm:w-[76px]">
                            <Image src={k.image} alt="" fill sizes="76px" className="object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[19px] font-semibold tracking-[-0.015em] sm:text-[22px]">
                              {k.label}
                            </span>
                            <span className="mt-1 block text-[14px] leading-snug text-[var(--landing-mute)] sm:text-[15px]">
                              {k.line}
                            </span>
                          </span>
                          <ArrowRight
                            size={20}
                            strokeWidth={1.5}
                            className="shrink-0 text-black/25 transition-all group-hover:translate-x-1 group-hover:text-[var(--landing-ink)]"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : step === 2 && kind ? (
                <motion.div key={`step-2-${kind}`} {...motionProps}>
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    {STEP2[kind].title}
                  </h1>
                  <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">{STEP2[kind].intro}</p>

                  <form onSubmit={submitDetails} className="mt-9 space-y-6">
                    {(kind === "hotel" || kind === "etablissement") && (
                      <>
                        <Field id="venue-name" label={kind === "hotel" ? t("Nom de l'hôtel", "Hotel name") : t("Nom de l'établissement", "Venue name")}>
                          <input
                            id="venue-name"
                            required
                            autoComplete="organization"
                            placeholder={kind === "hotel" ? "Riad Palais Bleu" : "Le Grand Rooftop"}
                            value={form.venueName}
                            onChange={set("venueName")}
                            className={inputClass}
                          />
                        </Field>
                        <div className="grid gap-6 sm:grid-cols-2">
                          <Field id="city" label={t("Ville", "City")}>
                            <input
                              id="city"
                              required
                              autoComplete="address-level2"
                              placeholder="Marrakech"
                              value={form.city}
                              onChange={set("city")}
                              className={inputClass}
                            />
                          </Field>
                          {kind === "hotel" ? (
                            <Field id="rooms" label={t("Chambres", "Rooms")} hint={t("facultatif", "optional")}>
                              <input
                                id="rooms"
                                type="number"
                                min={1}
                                inputMode="numeric"
                                placeholder="45"
                                value={form.rooms}
                                onChange={set("rooms")}
                                className={inputClass}
                              />
                            </Field>
                          ) : (
                            <InstagramField value={form.instagram} onChange={set("instagram")} />
                          )}
                        </div>
                        {kind === "etablissement" && (
                          <Choices
                            label={t("Type de lieu", "Type of venue")}
                            name="venueType"
                            options={VENUE_TYPES}
                            value={venueType}
                            onChange={setVenueType}
                          />
                        )}
                        {kind === "hotel" && <InstagramField value={form.instagram} onChange={set("instagram")} />}
                      </>
                    )}

                    {kind === "concierge" && (
                      <>
                        <Choices
                          label={t("Vous travaillez comme", "You work as")}
                          name="conciergeType"
                          options={CONCIERGE_TYPES}
                          value={conciergeType}
                          onChange={setConciergeType}
                        />
                        <Field
                          id="organization"
                          label={t("Hôtel, conciergerie ou agence", "Hotel, concierge company or agency")}
                          hint={t("facultatif", "optional")}
                        >
                          <input
                            id="organization"
                            autoComplete="organization"
                            placeholder="Royal Mansour"
                            value={form.organization}
                            onChange={set("organization")}
                            className={inputClass}
                          />
                        </Field>
                        <InstagramField value={form.instagram} onChange={set("instagram")} />
                      </>
                    )}

                    {kind === "influenceur" && (
                      <>
                        <InstagramField value={form.instagram} onChange={set("instagram")} required />
                        <Choices
                          label={t("Abonnés", "Followers")}
                          name="audienceSize"
                          hint={t("facultatif", "optional")}
                          options={AUDIENCE_SIZES}
                          value={audienceSize}
                          onChange={setAudienceSize}
                        />
                      </>
                    )}

                    <PrimaryButton>{t("Continuer", "Continue")}</PrimaryButton>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="step-3" {...motionProps}>
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    {t("Votre compte", "Your account")}
                  </h1>
                  <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                    {t("Les coordonnées avec lesquelles vous vous connecterez.", "The details you’ll log in with.")}
                  </p>

                  <form onSubmit={submitAccount} className="mt-9 space-y-6">
                    <Field id="fullname" label={t("Nom complet", "Full name")}>
                      <input
                        id="fullname"
                        required
                        autoComplete="name"
                        placeholder="Karim Bennani"
                        value={form.fullname}
                        onChange={set("fullname")}
                        className={inputClass}
                      />
                    </Field>
                    <Field id="email" label={t("E-mail professionnel", "Work email")}>
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={t("nom@entreprise.com", "name@company.com")}
                        value={form.email}
                        onChange={set("email")}
                        className={inputClass}
                      />
                    </Field>
                    <Field id="phone" label={t("Téléphone", "Phone")} hint={t("facultatif", "optional")}>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+212 6 12 34 56 78"
                        value={form.phone}
                        onChange={set("phone")}
                        className={inputClass}
                      />
                    </Field>
                    <Field id="password" label={t("Mot de passe", "Password")} hint={t("8 caractères minimum", "At least 8 characters")}>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={set("password")}
                          className={`${inputClass} pr-24`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[13px] font-medium text-[var(--landing-ink)]/55 transition-colors hover:text-[var(--landing-ink)]"
                        >
                          {showPassword ? t("Masquer", "Hide") : t("Afficher", "Show")}
                        </button>
                      </div>
                    </Field>

                    {error && (
                      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
                        {error}
                      </p>
                    )}

                    <PrimaryButton loading={loading}>{t("Créer mon compte", "Create my account")}</PrimaryButton>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="text-[13px] text-black/35">
          &copy; {new Date().getFullYear()} twocards.
        </footer>
      </main>
    </div>
  );
}

function InstagramField({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  const t = useT();
  return (
    <Field id="instagram" label="Instagram" hint={required ? undefined : t("facultatif", "optional")}>
      <input
        id="instagram"
        required={required}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t("@nom_du_compte", "@account_name")}
        value={value}
        onChange={onChange}
        className={inputClass}
      />
    </Field>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupFlow />
    </Suspense>
  );
}
