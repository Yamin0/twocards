import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Créez votre établissement",
    description:
      "Inscrivez votre lieu en quelques minutes. Configurez vos espaces, capacités et paramètres de commission selon vos règles.",
  },
  {
    number: "02",
    title: "Invitez votre réseau",
    description:
      "Ajoutez vos concierges et RP existants ou découvrez de nouveaux partenaires au sein du Registre twocards.",
  },
  {
    number: "03",
    title: "Lancez vos soirées",
    description:
      "Publiez des événements, recevez des listes d'invités qualifiées et suivez chaque commission en temps réel.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left column */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium text-white/80 bg-white/5 border border-white/10 w-fit mb-4">
              Comment ça marche
            </div>
            <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
              Opérationnel en quelques minutes, pas en quelques mois.
            </h2>
            <p className="mt-4 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/50">
              Aucune installation complexe. Aucune formation requise. twocards
              s&apos;adapte à vos flux de travail existants et s&apos;intègre de
              manière transparente à votre exploitation.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full px-6 py-3 text-sm transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(96,165,250,0.25)] font-[family-name:var(--font-manrope)]"
              >
                Commencer maintenant
              </Link>
            </div>
          </div>

          {/* Right column — steps */}
          <div className="flex flex-col gap-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="liquid-glass rounded-2xl p-6 transition-all duration-500 hover:bg-white/[0.1] hover:scale-[1.01]"
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <span className="font-[family-name:var(--font-manrope)] text-lg font-bold text-blue-400">
                      {step.number}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/50">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
