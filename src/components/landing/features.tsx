import { UserPlus, Calendar, CreditCard } from "lucide-react";

export function Features() {
  return (
    <section className="bg-surface py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Infrastructure Fondamentale
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-3xl font-bold text-primary-dark sm:text-4xl">
            Conçu pour les exploitants de lieux
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Card 1 — 8 cols */}
          <div className="editorial-shadow flex flex-col justify-between rounded-md bg-surface-card p-8 lg:col-span-8">
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-surface-low">
                <UserPlus
                  size={24}
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-primary-dark">
                Gestion de la liste d&apos;invités
              </h3>
              <p className="mt-3 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
                Centralisez toutes vos listes d&apos;invités en un seul endroit.
                Validez, filtrez et suivez chaque entrée en temps réel avec un
                historique complet des interactions.
              </p>
            </div>
            {/* Placeholder for feature visual */}
            <div className="mt-8 w-full h-40 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <div className="space-y-2 w-3/4">
                <div className="h-3 bg-primary/20 rounded-full w-full" />
                <div className="h-3 bg-primary/15 rounded-full w-4/5" />
                <div className="h-3 bg-primary/10 rounded-full w-3/5" />
                <div className="flex gap-2 mt-4">
                  <div className="h-8 w-8 rounded-full bg-primary/20" />
                  <div className="h-8 w-8 rounded-full bg-primary/15" />
                  <div className="h-8 w-8 rounded-full bg-primary/10" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — 4 cols */}
          <div className="editorial-shadow flex flex-col justify-between rounded-md bg-surface-card p-8 lg:col-span-4">
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-surface-low">
                <Calendar
                  size={24}
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-primary-dark">
                Planification d&apos;événements
              </h3>
              <p className="mt-3 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
                Créez et gérez vos soirées avec des outils de planification
                complets. Définissez les capacités, les tarifs et les accords
                de commission.
              </p>
            </div>
            <div className="mt-8 w-full h-40 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
              <div className="grid grid-cols-7 gap-1">
                {["L","M","M","J","V","S","D"].map((d,i) => (
                  <div key={i} className="text-[9px] text-center text-on-surface-variant font-medium">{d}</div>
                ))}
                {Array.from({length: 28}, (_, i) => (
                  <div key={i} className={`text-[9px] text-center py-1 rounded-sm ${i === 14 ? 'bg-primary text-white font-bold' : 'text-on-surface-variant/60'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3 — full width */}
          <div className="editorial-shadow flex flex-col gap-8 rounded-md bg-surface-card p-8 lg:col-span-12 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-surface-low">
                <CreditCard
                  size={24}
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-primary-dark">
                Suivi des commissions
              </h3>
              <p className="mt-3 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
                Automatisez le calcul et le versement des commissions pour votre
                réseau de concierges et RP. Transparence totale, zéro litige.
              </p>
            </div>

            {/* Dark revenue card */}
            <div className="flex-1 rounded-md bg-primary p-6 lg:max-w-sm">
              <p className="font-[family-name:var(--font-inter)] text-xs text-on-primary-container">
                Revenus ce mois
              </p>
              <p className="mt-2 font-[family-name:var(--font-manrope)] text-3xl font-bold text-white">
                24,850 MAD
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-inter)] text-xs text-on-primary-container">
                    Commissions versées
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-manrope)] text-lg font-bold text-white">
                    3,420 MAD
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-inter)] text-xs text-on-primary-container">
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
