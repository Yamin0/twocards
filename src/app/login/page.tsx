"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message
      );
      setPassword("");
      setLoading(false);
      return;
    }

    // Hard redirect based on role — must use window.location to trigger middleware
    const role = data.user?.user_metadata?.role;
    window.location.href = role === "concierge" ? "/concierge" : "/dashboard";
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-[#0a0a0f]">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Frosted glass card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-8 sm:p-10 shadow-[0_8px_64px_rgba(0,0,0,0.4)]">
          {/* Logo */}
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
              Connectez-vous à votre espace
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-300">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  size={16}
                  strokeWidth={1.5}
                />
                <input
                  id="email"
                  type="email"
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-white/25 font-[family-name:var(--font-inter)] focus:bg-white/[0.1] focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)] font-medium"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  size={16}
                  strokeWidth={1.5}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-sm text-white placeholder:text-white/25 font-[family-name:var(--font-inter)] focus:bg-white/[0.1] focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400/80 font-medium font-[family-name:var(--font-inter)] hover:text-blue-400 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white/15 hover:bg-white/20 border border-white/10 text-white rounded-2xl text-sm font-semibold font-[family-name:var(--font-inter)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-[0.6875rem] text-white/30 font-[family-name:var(--font-inter)]">ou</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <p className="text-center text-sm text-white/40 font-[family-name:var(--font-inter)]">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href="/signup"
              className="text-blue-400/80 font-medium hover:text-blue-400 transition-colors"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/20 font-[family-name:var(--font-inter)] space-x-4">
          <span>&copy; {new Date().getFullYear()} twocards.</span>
          <Link href="/legal" className="hover:text-white/40 transition-colors">
            Conditions
          </Link>
          <Link href="/privacy" className="hover:text-white/40 transition-colors">
            Confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}
