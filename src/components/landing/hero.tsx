import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-12 lg:pb-32 lg:pt-28">
        {/* Status badge */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-[family-name:var(--font-inter)] text-xs text-on-primary-container">
              Etat du systeme : Operationnel
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-[family-name:var(--font-manrope)] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Votre reseau d&apos;etablissements, une seule plateforme.
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-inter)] text-base leading-relaxed text-on-primary-container lg:text-lg">
            Gerez les listes d&apos;invites, les reservations de tables et votre
            reseau de RP et concierges depuis un tableau de bord unique.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/signup"
            className="rounded-sm bg-white px-6 py-3 font-[family-name:var(--font-manrope)] text-sm font-semibold text-primary-dark transition-opacity hover:opacity-90"
          >
            Commencer en tant qu&apos;etablissement
          </Link>
          <Link
            href="/signup?role=concierge"
            className="group inline-flex items-center gap-2 font-[family-name:var(--font-manrope)] text-sm font-semibold text-on-primary-container transition-colors hover:text-white"
          >
            Je suis un Concierge/RP
            <ArrowRight
              size={16}
              strokeWidth={1.5}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Product mockup placeholder */}
        <div className="mx-auto mt-16 max-w-4xl lg:mt-20">
          <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-white/5 backdrop-blur-sm">
            <span className="font-[family-name:var(--font-inter)] text-sm text-on-primary-container/60">
              Product Mockup
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
