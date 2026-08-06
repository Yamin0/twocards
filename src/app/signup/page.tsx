"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  UserCheck,
  Mail,
  Lock,
  Phone,
  User,
  AtSign,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";

type Role = "etablissement" | "concierge";
type VenueType =
  | "club"
  | "restaurant"
  | "rooftop"
  | "lounge"
  | "bar"
  | "beach-club"
  | "hotel-riad";

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-11 py-3.5 text-sm text-[var(--landing-ink)] outline-none transition-all placeholder:text-black/30 focus:border-black/40 focus:ring-1 focus:ring-black/10";

const labelClass =
  "block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-mute)]";

/* Ramène toute saisie à l'identifiant seul : « @Karim », « Karim » ou une URL
   de profil collée donnent tous « karim ». Normaliser à l'envoi plutôt qu'à
   la frappe évite de déplacer le curseur pendant que l'utilisateur écrit.
   Renvoie null si le champ est vide, laissé facultatif. */
function normalizeInstagram(raw: string): string | null {
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
  return handle || null;
}

function SignupForm() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role>(
    searchParams.get("role") === "concierge" ? "concierge" : "etablissement"
  );
  const [venueType, setVenueType] = useState<VenueType>("restaurant");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
    instagram: "",
    venueName: "",
    city: "",
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullname,
          phone: form.phone,
          instagram: normalizeInstagram(form.instagram),
          role: role,
          venue_name: role === "etablissement" ? form.venueName : null,
          venue_type: role === "etablissement" ? venueType : null,
          city: role === "etablissement" ? form.city : null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(
        error.message === "User already registered"
          ? "Un compte existe déjà avec cet email."
          : error.message
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[var(--landing-ivory)] px-4 font-body text-[var(--landing-ink)]">
        <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white/60 p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <CheckCircle
              size={32}
              strokeWidth={1.5}
              className="text-emerald-600"
            />
          </div>
          <h1 className="mb-3 font-title text-2xl font-normal">
            Vérifiez votre email
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-[var(--landing-ink)]/60">
            Un lien de confirmation a été envoyé à{" "}
            <strong className="text-[var(--landing-ink)]">{form.email}</strong>.
            <br />
            Cliquez dessus pour activer votre compte.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-[var(--landing-ink)] px-6 py-3 text-sm font-semibold text-[var(--landing-ivory)] transition-opacity hover:opacity-85"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--landing-ivory)] px-4 py-12 font-body text-[var(--landing-ink)]">
      <div className="relative w-full max-w-2xl">
        {/* Wordmark */}
        <div className="mb-10 flex flex-col items-center">
          <Link
            href="/"
            className="font-title text-3xl font-medium tracking-tight"
          >
            twocards<span className="text-[var(--landing-mute)]">.</span>
          </Link>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Rejoindre le réseau
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white/60 p-8 sm:p-10">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Role selector */}
            <fieldset className="space-y-3">
              <legend className={`${labelClass} mb-1`}>Je suis</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="etablissement"
                    checked={role === "etablissement"}
                    onChange={() => setRole("etablissement")}
                    className="peer sr-only"
                  />
                  <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 transition-all peer-checked:border-black peer-checked:ring-1 peer-checked:ring-black">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-ink)] text-[var(--landing-ivory)]">
                      <Building2 size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Établissement</p>
                      <p className="text-xs text-[var(--landing-mute)]">
                        Restaurant, rooftop, club, hôtel
                      </p>
                    </div>
                  </div>
                </label>

                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="concierge"
                    checked={role === "concierge"}
                    onChange={() => setRole("concierge")}
                    className="peer sr-only"
                  />
                  <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 transition-all peer-checked:border-black peer-checked:ring-1 peer-checked:ring-black">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-ink)] text-[var(--landing-ivory)]">
                      <UserCheck size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Concierge / RP</p>
                      <p className="text-xs text-[var(--landing-mute)]">
                        Conciergerie, promoteur, influenceur
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Personal info */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--landing-ink)]/80">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fullname" className={labelClass}>
                    Nom complet
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                      size={16}
                      strokeWidth={1.5}
                    />
                    <input
                      id="fullname"
                      type="text"
                      placeholder="Karim Bennani"
                      value={form.fullname}
                      onChange={(e) => updateForm("fullname", e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className={labelClass}>
                    Email professionnel
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                      size={16}
                      strokeWidth={1.5}
                    />
                    <input
                      id="email"
                      type="email"
                      placeholder="nom@entreprise.com"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className={labelClass}>
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                      size={16}
                      strokeWidth={1.5}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      required
                      minLength={8}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 transition-colors hover:text-black/60"
                    >
                      {showPassword ? (
                        <EyeOff size={16} strokeWidth={1.5} />
                      ) : (
                        <Eye size={16} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className={labelClass}>
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                      size={16}
                      strokeWidth={1.5}
                    />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+212 6 12 34 56 78"
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Pleine largeur : cinquième champ d'une grille à deux
                    colonnes, il paraîtrait orphelin sur une demi-ligne. */}
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="instagram" className={labelClass}>
                    Instagram
                  </label>
                  <div className="relative">
                    <AtSign
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                      size={16}
                      strokeWidth={1.5}
                    />
                    <input
                      id="instagram"
                      type="text"
                      inputMode="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="@nom_du_compte"
                      value={form.instagram}
                      onChange={(e) => updateForm("instagram", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <p className="text-xs text-[var(--landing-ink)]/45">
                    Facultatif. Un lien de profil complet fonctionne aussi.
                  </p>
                </div>
              </div>
            </div>

            {/* Establishment details */}
            {role === "etablissement" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[var(--landing-ink)]/80">
                  Détails de l&apos;établissement
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="venue-name" className={labelClass}>
                      Nom de l&apos;établissement
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                        size={16}
                        strokeWidth={1.5}
                      />
                      <input
                        id="venue-name"
                        type="text"
                        placeholder="Le Grand Rooftop"
                        value={form.venueName}
                        onChange={(e) =>
                          updateForm("venueName", e.target.value)
                        }
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="city" className={labelClass}>
                      Ville
                    </label>
                    <div className="relative">
                      <MapPin
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                        size={16}
                        strokeWidth={1.5}
                      />
                      <input
                        id="city"
                        type="text"
                        placeholder="Marrakech"
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className={labelClass}>Type de lieu</span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "restaurant", label: "Restaurant" },
                        { value: "rooftop", label: "Rooftop" },
                        { value: "club", label: "Club" },
                        { value: "lounge", label: "Lounge" },
                        { value: "bar", label: "Bar" },
                        { value: "beach-club", label: "Beach club" },
                        { value: "hotel-riad", label: "Hôtel / Riad" },
                      ] as const
                    ).map((type) => (
                      <label key={type.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="venueType"
                          value={type.value}
                          checked={venueType === type.value}
                          onChange={() => setVenueType(type.value)}
                          className="peer sr-only"
                        />
                        <span className="inline-block rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-medium text-[var(--landing-ink)]/60 transition-all peer-checked:border-black peer-checked:bg-[var(--landing-ink)] peer-checked:text-[var(--landing-ivory)]">
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] py-3.5 text-sm font-semibold text-[var(--landing-ivory)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.08]" />
            <span className="text-[11px] text-black/30">ou</span>
            <div className="h-px flex-1 bg-black/[0.08]" />
          </div>

          <p className="text-center text-sm text-[var(--landing-ink)]/55">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-black/60"
            >
              Se connecter
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-black/35">
          <span>
            &copy; {new Date().getFullYear()} twocards. Tous droits réservés.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
