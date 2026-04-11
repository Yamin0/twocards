import { UserPlus, Calendar, CreditCard } from "lucide-react";

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium text-white/80 bg-white/5 border border-white/10">
            Infrastructure Fondamentale
          </div>
          <h2 className="font-[family-name:var(--font-manrope)] text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Conçu pour les exploitants de lieux.
          </h2>
          <p className="mt-3 text-white/50 text-sm max-w-xl mx-auto">
            Tout ce dont vous avez besoin pour gérer votre établissement de nuit
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Card 1 — 8 cols */}
          <div className="liquid-glass rounded-3xl p-8 lg:col-span-8 transition-all duration-500 hover:scale-[1.01] hover:bg-white/[0.1]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <UserPlus size={24} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-white">
              Gestion de la liste d&apos;invités
            </h3>
            <p className="mt-3 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/50">
              Centralisez toutes vos listes d&apos;invités en un seul endroit.
              Validez, filtrez et suivez chaque entrée en temps réel avec un
              historique complet des interactions.
            </p>
            <div className="mt-8 w-full h-40 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center">
              <div className="space-y-2 w-3/4">
                <div className="h-3 bg-white/10 rounded-full w-full" />
                <div className="h-3 bg-white/8 rounded-full w-4/5" />
                <div className="h-3 bg-white/5 rounded-full w-3/5" />
                <div className="flex gap-2 mt-4">
                  <div className="h-8 w-8 rounded-full bg-blue-400/20" />
                  <div className="h-8 w-8 rounded-full bg-purple-400/20" />
                  <div className="h-8 w-8 rounded-full bg-green-400/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — 4 cols */}
          <div className="liquid-glass rounded-3xl p-8 lg:col-span-4 transition-all duration-500 hover:scale-[1.01] hover:bg-white/[0.1]">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Calendar size={24} strokeWidth={1.5} className="text-purple-400" />
            </div>
            <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-white">
              Planification d&apos;événements
            </h3>
            <p className="mt-3 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/50">
              Créez et gérez vos soirées avec des outils de planification
              complets. Définissez les capacités, les tarifs et les accords
              de commission.
            </p>
            <div className="mt-8 w-full h-40 rounded-2xl bg-white/5 border border-white/[0.08] p-4">
              <div className="grid grid-cols-7 gap-1">
                {["L","M","M","J","V","S","D"].map((d,i) => (
                  <div key={`day-${i}`} className="text-[9px] text-center text-white/40 font-medium">{d}</div>
                ))}
                {Array.from({length: 28}, (_, i) => (
                  <div key={`date-${i}`} className={`text-[9px] text-center py-1 rounded-lg ${i === 14 ? 'bg-blue-500 text-white font-bold' : 'text-white/30'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3 — full width */}
          <div className="liquid-glass rounded-3xl p-8 lg:col-span-12 lg:flex lg:items-center lg:gap-8 transition-all duration-500 hover:scale-[1.005] hover:bg-white/[0.1]">
            <div className="flex-1">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <CreditCard size={24} strokeWidth={1.5} className="text-amber-400" />
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-white">
                Suivi des commissions
              </h3>
              <p className="mt-3 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/50">
                Automatisez le calcul et le versement des commissions pour votre
                réseau de concierges et RP. Transparence totale, zéro litige.
              </p>
            </div>

            {/* Revenue card */}
            <div className="flex-1 mt-8 lg:mt-0 lg:max-w-sm rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 p-6">
              <p className="font-[family-name:var(--font-inter)] text-xs text-white/60">
                Revenus ce mois
              </p>
              <p className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-white">
                24,850 MAD
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-inter)] text-xs text-white/50">
                    Commissions versées
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-manrope)] text-lg font-bold text-white">
                    3,420 MAD
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-inter)] text-xs text-white/50">
                    Taux moyen
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-manrope)] text-lg font-bold text-white">
                    10%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
