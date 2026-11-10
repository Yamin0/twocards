"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

const KINDS: {
  value: Kind;
  label: string;
  line: string;
  image: string;
  caption: string;
}[] = [
  {
    value: "hotel",
    label: "Hôtel ou riad",
    line: "Un QR en chambre, vos clients réservent seuls.",
    image: UNSPLASH("photo-1759472659432-3232e42d04d2"),
    caption: "Chaque sortie de vos clients est rattachée à votre maison.",
  },
  {
    value: "etablissement",
    label: "Établissement",
    line: "Restaurant, rooftop, club, activité.",
    image: UNSPLASH("photo-1672832593966-fe1795b8d287"),
    caption: "Des clients d'hôtels à votre porte, vous payez au résultat.",
  },
  {
    value: "concierge",
    label: "Concierge ou RP",
    line: "Vos recommandations, suivies et rémunérées.",
    image: UNSPLASH("photo-1660557989695-14fac79c086d"),
    caption: "Vous savez quand votre client arrive, la commission suit.",
  },
  {
    value: "influenceur",
    label: "Créateur de contenu",
    line: "Un lien unique pour toute votre sélection.",
    image: UNSPLASH("photo-1672831744471-fb82fd8fa2e0"),
    caption: "Chaque réservation issue de vos contenus vous est attribuée.",
  },
];

const DEFAULT_IMAGE = UNSPLASH("photo-1647878501041-1609141a7fb1");

const VENUE_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "rooftop", label: "Rooftop" },
  { value: "club", label: "Club" },
  { value: "lounge", label: "Lounge" },
  { value: "bar", label: "Bar" },
  { value: "beach-club", label: "Beach club" },
  { value: "hotel-riad", label: "Hôtel / Riad" },
  /* Activité (quad, hammam, excursion…) ou service (chauffeur,
     photographe…) : l'espace montre des prestations, pas des tables. */
  { value: "activite", label: "Activité" },
  { value: "service", label: "Service" },
] as const;

const CONCIERGE_TYPES = [
  { value: "hotel", label: "Concierge d'hôtel" },
  { value: "private", label: "Conciergerie privée" },
  { value: "rp", label: "RP / promoteur" },
] as const;

const AUDIENCE_SIZES = [
  { value: "lt10k", label: "Moins de 10 k" },
  { value: "10-50k", label: "10 à 50 k" },
  { value: "50-200k", label: "50 à 200 k" },
  { value: "gt200k", label: "Plus de 200 k" },
] as const;

const STEP2: Record<Kind, { title: string; intro: string }> = {
  hotel: {
    title: "Votre hôtel",
    intro: "Pour préparer vos QR codes et votre espace.",
  },
  etablissement: {
    title: "Votre établissement",
    intro: "Ce que les clients verront dans le menu des hôtels.",
  },
  concierge: {
    title: "Votre activité",
    intro: "Pour vous présenter aux établissements du réseau.",
  },
  influenceur: {
    title: "Votre audience",
    intro: "Pour vous proposer les adresses qui lui ressemblent.",
  },
};

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

  const [venueType, setVenueType] = useState<(typeof VENUE_TYPES)[number]["value"]>("restaurant");
  const [conciergeType, setConciergeType] = useState<(typeof CONCIERGE_TYPES)[number]["value"] | null>(null);
  const [audienceSize, setAudienceSize] = useState<(typeof AUDIENCE_SIZES)[number]["value"] | null>(null);
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
      setError("Le mot de passe doit contenir au moins 8 caractères.");
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
          ? "Un compte existe déjà avec cet e-mail."
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

  const heading = "text-[34px] font-bold leading-[1.05] tracking-[-0.03em] outline-none md:text-[44px]";

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Photo du métier, grand écran seulement. Les images sont toutes
          posées et se relaient en fondu, sans rechargement au survol. */}
      <aside className="relative hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden bg-[#1a1612]">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          <div className="absolute left-10 top-8">
            <Wordmark light />
          </div>
          <div className="absolute inset-x-10 bottom-12 max-w-md text-white">
            <p className="text-[14px] text-white/60">{shown ? shown.label : "Rejoindre le réseau"}</p>
            <p className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              {shown
                ? shown.caption
                : "Hôtels, établissements, concierges et créateurs : un même réseau, chaque réservation suivie."}
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
            <span className="hidden sm:inline">Déjà un compte ? </span>
            <Link href="/login" className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4 hover:decoration-black/60">
              Se connecter
            </Link>
          </p>
        </header>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-[460px] py-12 lg:py-16">
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
                      Retour
                    </button>
                  ) : (
                    <span>Demander un accès</span>
                  )}
                  <span>Étape {step} sur 3</span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.div key="done" {...motionProps}>
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    Vérifiez votre boîte mail.
                  </h1>
                  <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                    Un lien de confirmation vient d&apos;être envoyé à{" "}
                    <span className="font-medium text-[var(--landing-ink)]">{form.email}</span>. Cliquez dessus pour
                    activer votre compte.
                  </p>
                  <Link
                    href="/login"
                    className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Aller à la connexion
                    <ArrowRight size={16} strokeWidth={1.75} />
                  </Link>
                </motion.div>
              ) : step === 1 ? (
                <motion.div key="step-1" {...motionProps}>
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    Vous <em className="font-light italic">êtes</em>…
                  </h1>
                  <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                    La suite de l&apos;inscription s&apos;adapte à votre métier.
                  </p>

                  <ul className="mt-9 border-t border-black/[0.08]" onMouseLeave={() => setHovered(null)}>
                    {KINDS.map((k) => (
                      <li key={k.value} className="border-b border-black/[0.08]">
                        <button
                          type="button"
                          onClick={() => chooseKind(k.value)}
                          onMouseEnter={() => setHovered(k.value)}
                          onFocus={() => setHovered(k.value)}
                          className="group flex w-full items-center gap-4 py-4 text-left outline-none focus-visible:bg-black/[0.03] sm:gap-5"
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#1a1612]">
                            <Image src={k.image} alt="" fill sizes="56px" className="object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[18px] font-semibold tracking-[-0.01em] sm:text-[19px]">
                              {k.label}
                            </span>
                            <span className="mt-0.5 block text-[14px] leading-snug text-[var(--landing-mute)]">
                              {k.line}
                            </span>
                          </span>
                          <ArrowRight
                            size={18}
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
                        <Field id="venue-name" label={kind === "hotel" ? "Nom de l'hôtel" : "Nom de l'établissement"}>
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
                          <Field id="city" label="Ville">
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
                            <Field id="rooms" label="Chambres" hint="facultatif">
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
                            label="Type de lieu"
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
                          label="Vous travaillez comme"
                          name="conciergeType"
                          options={CONCIERGE_TYPES}
                          value={conciergeType}
                          onChange={setConciergeType}
                        />
                        <Field id="organization" label="Hôtel, conciergerie ou agence" hint="facultatif">
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
                          label="Abonnés"
                          name="audienceSize"
                          hint="facultatif"
                          options={AUDIENCE_SIZES}
                          value={audienceSize}
                          onChange={setAudienceSize}
                        />
                      </>
                    )}

                    <PrimaryButton>Continuer</PrimaryButton>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="step-3" {...motionProps}>
                  <h1 ref={headingRef} tabIndex={-1} className={heading}>
                    Votre compte
                  </h1>
                  <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
                    Les coordonnées avec lesquelles vous vous connecterez.
                  </p>

                  <form onSubmit={submitAccount} className="mt-9 space-y-6">
                    <Field id="fullname" label="Nom complet">
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
                    <Field id="email" label="E-mail professionnel">
                      <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="nom@entreprise.com"
                        value={form.email}
                        onChange={set("email")}
                        className={inputClass}
                      />
                    </Field>
                    <Field id="phone" label="Téléphone" hint="facultatif">
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
                    <Field id="password" label="Mot de passe" hint="8 caractères minimum">
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
                          {showPassword ? "Masquer" : "Afficher"}
                        </button>
                      </div>
                    </Field>

                    {error && (
                      <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
                        {error}
                      </p>
                    )}

                    <PrimaryButton loading={loading}>Créer mon compte</PrimaryButton>
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
  return (
    <Field id="instagram" label="Instagram" hint={required ? undefined : "facultatif"}>
      <input
        id="instagram"
        required={required}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="@nom_du_compte"
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
