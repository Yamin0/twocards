"use client";

import Link from "next/link";
import Image from "next/image";
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

  // Shared glass input style
  const inputClass =
    "w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-white/25 font-[family-name:var(--font-inter)] focus:bg-white/[0.1] focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all";

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#0a0a0f]">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-emerald-600/20 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[120px] animate-pulse [animation-delay:1s]" />
        </div>

        <div className="relative max-w-md w-full bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-10 text-center shadow-[0_8px_64px_rgba(0,0,0,0.4)]">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle size={32} strokeWidth={1.5} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-manrope)] mb-3">
            Vérifiez votre email
          </h1>
          <p className="text-sm text-white/50 font-[family-name:var(--font-inter)] mb-6 leading-relaxed">
            Un lien de confirmation a été envoyé à{" "}
            <strong className="text-white/80">{form.email}</strong>.
            <br />
            Cliquez dessus pour activer votre compte.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-white/15 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-sm font-semibold transition-all backdrop-blur-sm"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Frosted glass card */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-8 sm:p-10 shadow-[0_8px_64px_rgba(0,0,0,0.4)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo-header.png"
              alt="twocards."
              width={56}
              height={56}
              className="h-14 w-auto brightness-0 invert mb-3"
            />
            <span className="text-2xl font-extrabold text-white font-[family-name:var(--font-nunito)] tracking-tight">
              twocards<span className="text-blue-400">.</span>
            </span>
            <p className="text-white/40 text-sm font-[family-name:var(--font-inter)] mt-1">
              Rejoignez le réseau et gérez vos soirées
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-300">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Role selector */}
            <fieldset className="space-y-3">
              <legend className="text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium mb-1">
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
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] peer-checked:bg-white/[0.1] peer-checked:border-white/[0.15] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Building2 size={20} strokeWidth={1.5} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                        Établissement
                      </p>
                      <p className="text-xs text-white/40 font-[family-name:var(--font-inter)]">
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
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] peer-checked:bg-white/[0.1] peer-checked:border-white/[0.15] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                      <UserCheck size={20} strokeWidth={1.5} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                        Concierge-RP
                      </p>
                      <p className="text-xs text-white/40 font-[family-name:var(--font-inter)]">
                        Promoteur, relations
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </fieldset>

            {/* Personal info */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white/70 font-[family-name:var(--font-manrope)]">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="fullname" className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
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
                  <label htmlFor="email" className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium">
                    Email professionnel
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
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
                  <label htmlFor="password" className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 caractères"
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-11 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-white/25 font-[family-name:var(--font-inter)] focus:bg-white/[0.1] focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
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
              </div>
            </div>

            {/* Establishment details */}
            {role === "etablissement" && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white/70 font-[family-name:var(--font-manrope)]">
                  Détails de l&apos;établissement
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="venue-name" className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium">
                      Nom de l&apos;établissement
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
                      <input
                        id="venue-name"
                        type="text"
                        placeholder="Le Grand Club"
                        value={form.venueName}
                        onChange={(e) => updateForm("venueName", e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium">
                      Ville
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
                      <input
                        id="city"
                        type="text"
                        placeholder="Casablanca"
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium">
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
                        <span className="inline-block px-4 py-2 rounded-full text-xs font-medium font-[family-name:var(--font-inter)] bg-white/[0.04] border border-white/[0.06] text-white/50 peer-checked:bg-white/15 peer-checked:border-white/20 peer-checked:text-white transition-all">
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
              className="w-full py-3.5 bg-white/15 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-sm font-semibold font-[family-name:var(--font-inter)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[0.6875rem] text-white/30 font-[family-name:var(--font-inter)]">ou</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <p className="text-center text-sm text-white/40 font-[family-name:var(--font-inter)]">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-400/80 font-medium hover:text-blue-400 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/20 font-[family-name:var(--font-inter)]">
          <span>&copy; {new Date().getFullYear()} twocards. Tous droits réservés.</span>
        </div>
      </div>
    </div>
  );
}
