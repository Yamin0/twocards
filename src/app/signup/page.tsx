"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import {
  AUTH_PHOTO,
  AuthAlert,
  AuthField,
  AuthShell,
  AuthSubmit,
  authHeadingClass,
  authInputClass,
  authIntroClass,
  authLinkClass,
  fieldProps,
  useHydrated,
} from "@/components/landing/auth-shell";
import { PublicMotion } from "@/components/landing/public-motion";

/* Demande d'accès en trois écrans : le métier d'abord (« Vous êtes… »),
   puis ce qui le concerne, puis les coordonnées du compte. Sur grand écran,
   une photo du métier choisi occupe la moitié gauche ; mêmes images que
   l'accordéon « Le même QR, pour chaque métier » de l'accueil.

   Les influenceurs ont un compte concierge (même espace, même lien de
   réservation) : leur profil est noté à part dans les métadonnées. La base
   n'accepte que etablissement / hotel / concierge (sync_role_to_app_metadata).

   Chaque champ est contrôlé au moment de continuer, avec un message sous
   le champ en cause et le focus posé dessus ; l'erreur s'efface dès que
   l'on corrige. Les valeurs envoyées à Supabase n'ont pas changé. */

type Kind = "hotel" | "etablissement" | "concierge" | "influenceur";
type Step = 1 | 2 | 3;

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
    image: AUTH_PHOTO("photo-1759472659432-3232e42d04d2"),
    caption: t(
      "Chaque sortie de vos clients est rattachée à votre maison.",
      "Every outing your guests book is credited to your property.",
    ),
  },
  {
    value: "etablissement",
    label: t("Établissement", "Venue"),
    line: t("Restaurant, rooftop, club, activité.", "Restaurant, rooftop, club, activity."),
    image: AUTH_PHOTO("photo-1672832593966-fe1795b8d287"),
    caption: t(
      "Des clients d'hôtels à votre porte, vous payez au résultat.",
      "Hotel guests at your door, and you only pay for results.",
    ),
  },
  {
    value: "concierge",
    label: t("Concierge ou RP", "Concierge or PR"),
    line: t("Vos recommandations, suivies et rémunérées.", "Your recommendations, tracked and rewarded."),
    image: AUTH_PHOTO("photo-1660557989695-14fac79c086d"),
    caption: t(
      "Vous savez quand votre client arrive, la commission suit.",
      "You know when your guest arrives, and the commission follows.",
    ),
  },
  {
    value: "influenceur",
    label: t("Créateur de contenu", "Content creator"),
    line: t("Un lien unique pour toute votre sélection.", "One link for your whole selection."),
    image: AUTH_PHOTO("photo-1672831744471-fb82fd8fa2e0"),
    caption: t(
      "Chaque réservation issue de vos contenus vous est attribuée.",
      "Every reservation that comes from your content is credited to you.",
    ),
  },
];

const DEFAULT_IMAGE = AUTH_PHOTO("photo-1647878501041-1609141a7fb1");

/* Types de lieu proposés à un établissement. « Hôtel / Riad » n'y figure
   plus : c'est un métier à part, choisi au premier écran. Les valeurs
   envoyées pour les autres types sont inchangées. */
const getVenueTypes = (t: Translate) =>
  [
    { value: "restaurant", label: "Restaurant" },
    { value: "rooftop", label: "Rooftop" },
    { value: "club", label: "Club" },
    { value: "lounge", label: "Lounge" },
    { value: "bar", label: "Bar" },
    { value: "beach-club", label: "Beach club" },
    /* Activité (quad, hammam, excursion…) ou service (chauffeur,
       photographe…) : l'espace montre des prestations, pas des tables. */
    { value: "activite", label: t("Activité", "Activity") },
    { value: "service", label: "Service" },
  ] as const;

const getConciergeTypes = (t: Translate) =>
  [
    { value: "hotel", label: t("Concierge d'hôtel", "Hotel concierge") },
    { value: "private", label: t("Conciergerie privée", "Private concierge") },
    { value: "rp", label: t("RP / promoteur", "PR / promoter") },
  ] as const;

const getAudienceSizes = (t: Translate) =>
  [
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* Identifiant Instagram : lettres, chiffres, points et tirets bas, 30 au plus. */
const INSTAGRAM = /^[a-z0-9._]{1,30}$/;

type FormState = {
  venueName: string;
  city: string;
  rooms: string;
  organization: string;
  instagram: string;
  fullname: string;
  email: string;
  phone: string;
  password: string;
};
type FieldName = keyof FormState;
type Errors = Partial<Record<FieldName, string>>;

/* Ordre des champs à l'écran : sert à poser le focus sur la première erreur. */
const FIELD_IDS: [FieldName, string][] = [
  ["venueName", "venue-name"],
  ["city", "city"],
  ["rooms", "rooms"],
  ["organization", "organization"],
  ["instagram", "instagram"],
  ["fullname", "fullname"],
  ["email", "email"],
  ["phone", "phone"],
  ["password", "password"],
];

function validateDetails(kind: Kind, form: FormState, t: Translate): Errors {
  const errors: Errors = {};
  if (kind === "hotel" || kind === "etablissement") {
    if (!form.venueName.trim()) {
      errors.venueName =
        kind === "hotel"
          ? t("Indiquez le nom de votre hôtel.", "Enter the name of your hotel.")
          : t("Indiquez le nom de votre établissement.", "Enter the name of your venue.");
    }
    if (!form.city.trim()) {
      errors.city = t("Indiquez votre ville.", "Enter your city.");
    }
  }
  if (kind === "hotel" && form.rooms.trim()) {
    const rooms = Number(form.rooms);
    if (!Number.isInteger(rooms) || rooms < 1) {
      errors.rooms = t("Indiquez un nombre entier, 1 ou plus.", "Enter a whole number, 1 or more.");
    }
  }
  const handle = normalizeInstagram(form.instagram);
  if (kind === "influenceur" && !handle) {
    errors.instagram = t("Indiquez votre compte Instagram.", "Enter your Instagram account.");
  } else if (handle && !INSTAGRAM.test(handle)) {
    errors.instagram = t(
      "Ce nom de compte ne semble pas valide. Exemple : @nom_du_compte",
      "This account name doesn't look valid. Example: @account_name",
    );
  }
  return errors;
}

function validateAccount(form: FormState, t: Translate): Errors {
  const errors: Errors = {};
  if (form.fullname.trim().length < 2) {
    errors.fullname = t("Indiquez votre nom complet.", "Enter your full name.");
  }
  const email = form.email.trim();
  if (!email) {
    errors.email = t("Indiquez votre e-mail.", "Enter your email.");
  } else if (!EMAIL.test(email)) {
    errors.email = t("Cette adresse e-mail ne semble pas valide.", "This email address doesn't look valid.");
  }
  if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 8) {
    errors.phone = t(
      "Ce numéro semble incomplet. Exemple : +212 6 12 34 56 78",
      "This number looks incomplete. Example: +212 6 12 34 56 78",
    );
  }
  if (form.password.length < 8) {
    errors.password = t(
      "Le mot de passe doit contenir au moins 8 caractères.",
      "Your password must be at least 8 characters long.",
    );
  }
  return errors;
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
            <span className="inline-block rounded-full border border-black/20 bg-white px-4 py-2 text-[14px] text-[var(--landing-ink)]/80 transition-colors hover:border-black/40 peer-checked:border-[var(--landing-ink)] peer-checked:bg-[var(--landing-ink)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--landing-ink)] peer-focus-visible:ring-offset-2">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SignupFlow() {
  const t = useT();
  const hydrated = useHydrated();
  const KINDS = getKinds(t);
  const VENUE_TYPES = getVenueTypes(t);
  const CONCIERGE_TYPES = getConciergeTypes(t);
  const AUDIENCE_SIZES = getAudienceSizes(t);
  const STEP2 = getStep2(t);
  const searchParams = useSearchParams();

  /* Arrivé depuis une page métier (?role=hotel…) : le métier est déjà
     connu, on ouvre directement sur le deuxième écran. */
  const roleParam = searchParams.get("role");
  const initialKind = KINDS.some((k) => k.value === roleParam) ? (roleParam as Kind) : null;

  const [kind, setKind] = useState<Kind | null>(initialKind);
  const [hovered, setHovered] = useState<Kind | null>(null);
  const [step, setStep] = useState<Step>(initialKind ? 2 : 1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [venueType, setVenueType] = useState<ReturnType<typeof getVenueTypes>[number]["value"]>("restaurant");
  const [conciergeType, setConciergeType] = useState<ReturnType<typeof getConciergeTypes>[number]["value"] | null>(null);
  const [audienceSize, setAudienceSize] = useState<ReturnType<typeof getAudienceSizes>[number]["value"] | null>(null);
  const [form, setForm] = useState<FormState>({
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
  const set = (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

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

  /* Affiche les erreurs et pose le focus sur le premier champ en cause. */
  const reject = (found: Errors) => {
    setErrors(found);
    const first = FIELD_IDS.find(([name]) => found[name]);
    if (first) document.getElementById(first[1])?.focus();
  };

  const chooseKind = (k: Kind) => {
    setKind(k);
    setError("");
    setErrors({});
    setStep(2);
  };

  const back = () => {
    setError("");
    setErrors({});
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind) return;
    const found = validateDetails(kind, form, t);
    if (Object.keys(found).length) return reject(found);
    setErrors({});
    setStep(3);
  };

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind) return;
    setError("");
    const found = validateAccount(form, t);
    if (Object.keys(found).length) return reject(found);
    setErrors({});
    setLoading(true);

    const hasVenue = kind === "hotel" || kind === "etablissement";
    const { error } = await createClient()
      .auth.signUp({
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
      })
      .catch((err: unknown) => ({ error: err as { message?: string } }));

    setLoading(false);
    if (error) {
      setError(authErrorMessage(error, t));
      return;
    }
    setDone(true);
  };

  const shown = KINDS.find((k) => k.value === (step === 1 ? hovered ?? kind : kind));
  /* Le déplacement est retiré en mouvement réduit par PublicMotion. */
  const motionProps = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  };

  const instagramField = (required: boolean) => (
    <AuthField
      id="instagram"
      label="Instagram"
      hint={required ? undefined : t("facultatif", "optional")}
      error={errors.instagram}
    >
      <input
        {...fieldProps("instagram", errors.instagram)}
        required={required}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t("@nom_du_compte", "@account_name")}
        value={form.instagram}
        onChange={set("instagram")}
        className={authInputClass}
      />
    </AuthField>
  );

  return (
    <AuthShell
      image={shown?.image ?? DEFAULT_IMAGE}
      eyebrow={shown ? shown.label : t("Rejoindre le réseau", "Join the network")}
      caption={
        shown
          ? shown.caption
          : t(
              "Hôtels, établissements, concierges et créateurs : un même réseau, chaque réservation suivie.",
              "Hotels, venues, concierges and creators: one network, every reservation tracked.",
            )
      }
      maxWidth="max-w-[520px]"
      headerLink={
        <>
          <span className="hidden sm:inline">{t("Déjà un compte ? ", "Already have an account? ")}</span>
          <Link href="/login" className={authLinkClass}>
            {t("Se connecter", "Log in")}
          </Link>
        </>
      }
    >
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
                className="-ml-1 inline-flex items-center gap-1.5 rounded px-1 text-[var(--landing-ink)]/80 transition-colors hover:text-[var(--landing-ink)]"
              >
                <ArrowLeft size={15} strokeWidth={1.75} aria-hidden />
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
          <motion.div key="done" {...motionProps} role="status">
            <h1 ref={headingRef} tabIndex={-1} className={authHeadingClass}>
              {t("Vérifiez votre boîte mail.", "Check your inbox.")}
            </h1>
            <p className={authIntroClass}>
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
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
            </Link>
          </motion.div>
        ) : step === 1 ? (
          <motion.div key="step-1" {...motionProps}>
            <h1 ref={headingRef} tabIndex={-1} className={authHeadingClass}>
              {t(
                <>
                  Vous <em className="font-light italic">êtes</em>…
                </>,
                <>
                  You <em className="font-light italic">are</em>…
                </>,
              )}
            </h1>
            <p className={authIntroClass}>
              {t(
                "La suite de l'inscription s'adapte à votre métier.",
                "The rest of sign-up adapts to what you do.",
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
                    className="group flex w-full items-center gap-4 py-5 text-left outline-none focus-visible:bg-black/[0.04] sm:gap-6"
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
                      aria-hidden
                      className="shrink-0 text-black/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--landing-ink)]"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : step === 2 && kind ? (
          <motion.div key={`step-2-${kind}`} {...motionProps}>
            <h1 ref={headingRef} tabIndex={-1} className={authHeadingClass}>
              {STEP2[kind].title}
            </h1>
            <p className={authIntroClass}>{STEP2[kind].intro}</p>

            <form onSubmit={submitDetails} noValidate={hydrated} className="mt-9 space-y-6">
              {(kind === "hotel" || kind === "etablissement") && (
                <>
                  <AuthField
                    id="venue-name"
                    label={kind === "hotel" ? t("Nom de l'hôtel", "Hotel name") : t("Nom de l'établissement", "Venue name")}
                    error={errors.venueName}
                  >
                    <input
                      {...fieldProps("venue-name", errors.venueName)}
                      required
                      autoComplete="organization"
                      placeholder={kind === "hotel" ? "Riad Palais Bleu" : "Le Grand Rooftop"}
                      value={form.venueName}
                      onChange={set("venueName")}
                      className={authInputClass}
                    />
                  </AuthField>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <AuthField id="city" label={t("Ville", "City")} error={errors.city}>
                      <input
                        {...fieldProps("city", errors.city)}
                        required
                        autoComplete="address-level2"
                        placeholder="Marrakech"
                        value={form.city}
                        onChange={set("city")}
                        className={authInputClass}
                      />
                    </AuthField>
                    {kind === "hotel" ? (
                      <AuthField
                        id="rooms"
                        label={t("Chambres", "Rooms")}
                        hint={t("facultatif", "optional")}
                        error={errors.rooms}
                      >
                        <input
                          {...fieldProps("rooms", errors.rooms)}
                          type="number"
                          min={1}
                          inputMode="numeric"
                          placeholder="45"
                          value={form.rooms}
                          onChange={set("rooms")}
                          className={authInputClass}
                        />
                      </AuthField>
                    ) : (
                      instagramField(false)
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
                  {kind === "hotel" && instagramField(false)}
                </>
              )}

              {kind === "concierge" && (
                <>
                  <Choices
                    label={t("Vous travaillez comme", "You work as")}
                    name="conciergeType"
                    hint={t("facultatif", "optional")}
                    options={CONCIERGE_TYPES}
                    value={conciergeType}
                    onChange={setConciergeType}
                  />
                  <AuthField
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
                      className={authInputClass}
                    />
                  </AuthField>
                  {instagramField(false)}
                </>
              )}

              {kind === "influenceur" && (
                <>
                  {instagramField(true)}
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

              <AuthSubmit>{t("Continuer", "Continue")}</AuthSubmit>
            </form>
          </motion.div>
        ) : (
          <motion.div key="step-3" {...motionProps}>
            <h1 ref={headingRef} tabIndex={-1} className={authHeadingClass}>
              {t("Votre compte", "Your account")}
            </h1>
            <p className={authIntroClass}>
              {t("Les coordonnées avec lesquelles vous vous connecterez.", "The details you’ll log in with.")}
            </p>

            <form onSubmit={submitAccount} noValidate={hydrated} className="mt-9 space-y-6">
              <AuthField id="fullname" label={t("Nom complet", "Full name")} error={errors.fullname}>
                <input
                  {...fieldProps("fullname", errors.fullname)}
                  required
                  autoComplete="name"
                  placeholder="Karim Bennani"
                  value={form.fullname}
                  onChange={set("fullname")}
                  className={authInputClass}
                />
              </AuthField>
              <AuthField id="email" label={t("E-mail professionnel", "Work email")} error={errors.email}>
                <input
                  {...fieldProps("email", errors.email)}
                  required
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t("nom@entreprise.com", "name@company.com")}
                  value={form.email}
                  onChange={set("email")}
                  className={authInputClass}
                />
              </AuthField>
              <AuthField
                id="phone"
                label={t("Téléphone", "Phone")}
                hint={t("facultatif", "optional")}
                error={errors.phone}
              >
                <input
                  {...fieldProps("phone", errors.phone)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+212 6 12 34 56 78"
                  value={form.phone}
                  onChange={set("phone")}
                  className={authInputClass}
                />
              </AuthField>
              <AuthField
                id="password"
                label={t("Mot de passe", "Password")}
                hint={t("8 caractères minimum", "At least 8 characters")}
                error={errors.password}
              >
                <div className="relative">
                  <input
                    {...fieldProps("password", errors.password)}
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={set("password")}
                    className={`${authInputClass} pr-24`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[13px] font-medium text-[var(--landing-ink)]/70 transition-colors hover:text-[var(--landing-ink)]"
                  >
                    {showPassword ? t("Masquer", "Hide") : t("Afficher", "Show")}
                  </button>
                </div>
              </AuthField>

              {error && <AuthAlert>{error}</AuthAlert>}

              <AuthSubmit loading={loading}>{t("Créer mon compte", "Create my account")}</AuthSubmit>

              {/* Nouvel onglet : la saisie en cours n'est pas perdue. */}
              <p className="text-[13px] leading-relaxed text-[var(--landing-mute)]">
                {t(
                  <>
                    En créant votre compte, vous acceptez nos{" "}
                    <Link href="/legal/cgu" target="_blank" className={authLinkClass}>
                      conditions générales d&apos;utilisation
                    </Link>{" "}
                    et notre{" "}
                    <Link href="/legal/confidentialite" target="_blank" className={authLinkClass}>
                      politique de confidentialité
                    </Link>
                    .
                  </>,
                  <>
                    By creating your account, you agree to our{" "}
                    <Link href="/legal/cgu" target="_blank" className={authLinkClass}>
                      terms of use
                    </Link>{" "}
                    and our{" "}
                    <Link href="/legal/confidentialite" target="_blank" className={authLinkClass}>
                      privacy policy
                    </Link>
                    .
                  </>,
                )}
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <PublicMotion>
      <Suspense fallback={null}>
        <SignupFlow />
      </Suspense>
    </PublicMotion>
  );
}
