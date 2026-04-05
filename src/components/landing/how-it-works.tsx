import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Creez votre etablissement",
    description:
      "Inscrivez votre lieu en quelques minutes. Configurez vos espaces, capacites et parametres de commission selon vos regles.",
  },
  {
    number: "02",
    title: "Invitez votre reseau",
    description:
      "Ajoutez vos concierges et RP existants ou decouvrez de nouveaux partenaires au sein du Registre twocards.",
  },
  {
    number: "03",
    title: "Lancez vos soirees",
    description:
      "Publiez des evenements, recevez des listes d'invites qualifiees et suivez chaque commission en temps reel.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface-low py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:gap-24 lg:px-12">
        {/* Left column */}
        <div className="flex flex-col justify-center">
          <p className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Comment ca marche
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-3xl font-bold text-primary-dark sm:text-4xl">
            Operationnel en quelques minutes, pas en quelques mois.
          </h2>
          <p className="mt-4 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
            Aucune installation complexe. Aucune formation requise. twocards
            s&apos;adapte a vos flux de travail existants et s&apos;integre de
            maniere transparente a votre exploitation.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="rounded-sm bg-primary px-6 py-3 font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              Commencer maintenant
            </Link>
          </div>
        </div>

        {/* Right column — steps */}
        <div className="flex flex-col gap-12">
          {steps.map((step) => (
            <div key={step.number} className="relative pl-20">
              {/* Large faded number */}
              <span className="absolute left-0 top-0 font-[family-name:var(--font-manrope)] text-6xl font-bold text-primary-dark/10 lg:text-7xl">
                {step.number}
              </span>
              <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-primary-dark">
                {step.title}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
