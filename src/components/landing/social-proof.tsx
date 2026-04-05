const logos = ["VANTAGE", "MONOLITH", "OBSIDIAN.", "VELVET", "PRISM"];

export function SocialProof() {
  return (
    <section className="bg-surface py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Logo strip */}
        <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
          {logos.map((name) => (
            <span
              key={name}
              className="font-[family-name:var(--font-manrope)] text-lg font-bold tracking-widest text-on-surface-variant/30"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mx-auto mt-20 max-w-3xl text-center">
          <blockquote className="font-[family-name:var(--font-manrope)] text-xl font-semibold leading-relaxed text-primary-dark sm:text-2xl">
            &ldquo;twocards a transforme notre facon de gerer les listes
            d&apos;invites et les relations avec nos concierges. En trois mois,
            nos revenus par soiree ont augmente de 34%.&rdquo;
          </blockquote>
          <div className="mt-8">
            <p className="font-[family-name:var(--font-manrope)] text-sm font-bold text-primary-dark">
              Julian Moreau
            </p>
            <p className="mt-1 font-[family-name:var(--font-inter)] text-sm text-on-surface-variant">
              Fondateur, L&apos;Eclipse Paris
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
