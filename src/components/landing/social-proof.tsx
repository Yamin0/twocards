import { Star } from "lucide-react";

const logos = ["VANTAGE", "MONOLITH", "OBSIDIAN.", "VELVET", "PRISM"];

export function SocialProof() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Logo strip */}
        <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
          {logos.map((name) => (
            <span
              key={name}
              className="font-[family-name:var(--font-manrope)] text-lg font-bold tracking-widest text-white/15"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Testimonial card */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="liquid-glass rounded-3xl p-8 sm:p-10 text-center">
            <div className="mb-6 flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-blue-400 text-blue-400" />
              ))}
            </div>
            <blockquote className="font-[family-name:var(--font-manrope)] text-xl font-semibold leading-relaxed text-white sm:text-2xl">
              &ldquo;twocards a transformé notre façon de gérer les listes
              d&apos;invités et les relations avec nos concierges. En trois mois,
              nos revenus par soirée ont augmenté de 34%.&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <span className="text-sm font-bold text-white">JM</span>
              </div>
              <div className="text-left">
                <p className="font-[family-name:var(--font-manrope)] text-sm font-bold text-white">
                  Julian Moreau
                </p>
                <p className="font-[family-name:var(--font-inter)] text-xs text-white/50">
                  Fondateur, L&apos;Eclipse Paris
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
