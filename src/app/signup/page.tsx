"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  UserCheck,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";

type Role = "etablissement" | "concierge";
type VenueType = "club" | "restaurant" | "lounge" | "bar";

export default function SignupPage() {
  const [role, setRole] = useState<Role>("etablissement");
  const [venueType, setVenueType] = useState<VenueType>("club");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
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
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface-card rounded-md editorial-shadow p-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle size={32} strokeWidth={1.5} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-primary-dark font-[family-name:var(--font-manrope)] mb-3">
            Vérifiez votre email
          </h1>
          <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mb-6 leading-relaxed">
            Un lien de confirmation a été envoyé à{" "}
            <strong className="text-on-background">{form.email}</strong>.
            <br />
            Cliquez dessus pour activer votre compte.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-primary text-white rounded-sm text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="bg-surface-card rounded-md editorial-shadow p-8 sm:p-10">
            <div className="flex gap-4 mb-8">
              <div className="w-1 rounded-full bg-primary shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-primary-dark font-[family-name:var(--font-manrope)]">
                  Créer votre compte
                </h1>
                <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mt-1">
                  Rejoignez le réseau twocards et gérez vos soirées
                  efficacement.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-sm bg-error-container p-3 text-sm text-error">
                <AlertCircle size={16} strokeWidth={1.5} />
                {error}
              </div>
            )}

            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Role selector */}
              <fieldset className="space-y-3">
                <legend className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                  Je suis
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="etablissement"
                      checked={role === "etablissement"}
                      onChange={() => setRole("etablissement")}
                      className="peer sr-only"
                    />
                    <div className="flex items-center gap-3 p-4 rounded-sm bg-surface-low peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary-container transition-all">
                      <div className="w-10 h-10 rounded-sm bg-surface-mid flex items-center justify-center shrink-0">
                        <Building2 size={20} strokeWidth={1.5} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                          Établissement
                        </p>
                        <p className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)]">
                          Club, bar, restaurant
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
                    <div className="flex items-center gap-3 p-4 rounded-sm bg-surface-low peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary-container transition-all">
                      <div className="w-10 h-10 rounded-sm bg-surface-mid flex items-center justify-center shrink-0">
                        <UserCheck size={20} strokeWidth={1.5} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                          Concierge-RP
                        </p>
                        <p className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)]">
                          Promoteur, relations
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Personal info */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
                  Informations personnelles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="fullname" className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={16} strokeWidth={1.5} />
                      <input
                        id="fullname"
                        type="text"
                        placeholder="Karim Bennani"
                        value={form.fullname}
                        onChange={(e) => updateForm("fullname", e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                      Email professionnel
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={16} strokeWidth={1.5} />
                      <input
                        id="email"
                        type="email"
                        placeholder="nom@entreprise.com"
                        value={form.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={16} strokeWidth={1.5} />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 caractères"
                        value={form.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        required
                        minLength={8}
                        className="w-full pl-10 pr-10 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={16} strokeWidth={1.5} />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+212 6 12 34 56 78"
                        value={form.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Establishment details */}
              {role === "etablissement" && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
                    Détails de l&apos;établissement
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="venue-name" className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                        Nom de l&apos;établissement
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={16} strokeWidth={1.5} />
                        <input
                          id="venue-name"
                          type="text"
                          placeholder="Le Grand Club"
                          value={form.venueName}
                          onChange={(e) => updateForm("venueName", e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="city" className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                        Ville
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={16} strokeWidth={1.5} />
                        <input
                          id="city"
                          type="text"
                          placeholder="Casablanca"
                          value={form.city}
                          onChange={(e) => updateForm("city", e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant">
                      Type de lieu
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { value: "club", label: "Club" },
                          { value: "restaurant", label: "Restaurant" },
                          { value: "lounge", label: "Lounge" },
                          { value: "bar", label: "Bar" },
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
                          <span className="inline-block px-4 py-2 rounded-full text-xs font-medium font-[family-name:var(--font-inter)] bg-surface-low text-on-surface-variant peer-checked:bg-primary peer-checked:text-white transition-colors">
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
                className="w-full py-2.5 bg-primary text-white rounded-sm text-sm font-semibold font-[family-name:var(--font-inter)] hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Création en cours..." : "Créer mon compte"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-on-surface-variant font-[family-name:var(--font-inter)]">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
        <span>&copy; 2026 twocards. Tous droits réservés.</span>
      </footer>
    </div>
  );
}
