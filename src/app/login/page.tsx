"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl flex rounded-md overflow-hidden editorial-shadow bg-surface-card">
          {/* Left decorative panel — hidden on mobile */}
          <div className="hidden lg:flex lg:w-1/2 relative hero-gradient flex-col justify-end p-8">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-12 left-8 w-32 h-32 rounded-full border border-white/30" />
              <div className="absolute top-24 right-12 w-48 h-48 rounded-full border border-white/20" />
              <div className="absolute bottom-32 left-16 w-24 h-24 rounded-full bg-white/5" />
            </div>

            <div className="relative z-10 space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-on-primary-container text-xs font-medium font-[family-name:var(--font-inter)] uppercase tracking-wider">
                Espace Prive
              </span>
              <h2 className="text-2xl font-bold text-white font-[family-name:var(--font-manrope)]">
                Gerez votre nightlife,
                <br />
                simplifiez vos soirees.
              </h2>
              <p className="text-on-primary-container/80 text-sm font-[family-name:var(--font-inter)] leading-relaxed">
                Listes d&apos;invites, reservations VIP et reseau de concierges
                — tout depuis un seul tableau de bord.
              </p>
            </div>
          </div>

          {/* Right form panel */}
          <div className="w-full lg:w-1/2 p-8 sm:p-10 flex flex-col justify-center">
            {/* Logo */}
            <div className="mb-8">
              <span className="text-2xl font-extrabold text-primary-dark font-[family-name:var(--font-nunito)] tracking-tight">
                twocards<span className="text-primary">.</span>
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-primary-dark font-[family-name:var(--font-manrope)] mb-1">
              Bon retour
            </h1>
            <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mb-8">
              Connectez-vous a votre espace professionnel
            </p>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60"
                    size={16}
                    strokeWidth={1.5}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="nom@entreprise.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block font-[family-name:var(--font-inter)] text-xs uppercase tracking-wider text-on-surface-variant"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60"
                    size={16}
                    strokeWidth={1.5}
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:bg-surface-card focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  href="#"
                  className="text-xs text-primary font-medium font-[family-name:var(--font-inter)] hover:underline"
                >
                  Mot de passe oublie ?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white rounded-sm text-sm font-semibold font-[family-name:var(--font-inter)] hover:bg-primary-dark transition-colors cursor-pointer"
              >
                Se connecter
              </button>
            </form>

            {/* Signup link */}
            <p className="mt-6 text-center text-sm text-on-surface-variant font-[family-name:var(--font-inter)]">
              Vous n&apos;avez pas de compte ?{" "}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Creer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-on-surface-variant/60 font-[family-name:var(--font-inter)] space-x-4">
        <span>&copy; 2026 twocards. Tous droits reserves.</span>
        <Link href="#" className="hover:text-on-surface-variant">
          Conditions d&apos;utilisation
        </Link>
        <Link href="#" className="hover:text-on-surface-variant">
          Politique de confidentialite
        </Link>
      </footer>
    </div>
  );
}
