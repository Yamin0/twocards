import Image from "next/image";
import {
  ArrowRight,
  Layers,
  Zap,
  PieChart,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

const highlights = [
  {
    icon: Layers,
    title: "Plan de salle interactif",
    description:
      "Visualisez votre salle en temps reel. Assignez, deplacez et gerez les tables VIP et standard d'un glissement.",
  },
  {
    icon: Zap,
    title: "Commissions automatisees",
    description:
      "Calcul, suivi et versement des commissions RP en un clic. Historique complet et transparence totale.",
  },
  {
    icon: PieChart,
    title: "Rapports detailles",
    description:
      "Exportez vos analyses par periode, par RP ou par evenement. Prenez des decisions basees sur les donnees.",
  },
];

const useCases = [
  {
    icon: UserCheck,
    label: "Check-in rapide",
    description: "Validez les arrivees en un scan",
  },
  {
    icon: ClipboardList,
    label: "Listes d'invites",
    description: "Centralisez et filtrez en temps reel",
  },
];

export function FeaturesShowcase() {
  return (
    <section className="bg-surface py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Visual */}
          <div className="relative">
            <div className="bg-primary-dark rounded-xl p-6 editorial-shadow">
              {/* Mockup stats bar */}
              <div className="bg-primary/80 rounded-lg p-5 mb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.625rem] uppercase tracking-wider text-on-primary-container">
                      Couverts ce soir
                    </p>
                    <p className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white mt-1">
                      38
                    </p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.625rem] uppercase tracking-wider text-on-primary-container">
                      Chiffre d'affaires
                    </p>
                    <p className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white mt-1">
                      52 400 MAD
                    </p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.625rem] uppercase tracking-wider text-on-primary-container">
                      Taux de remplissage
                    </p>
                    <p className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white mt-1">
                      87%
                    </p>
                  </div>
                </div>
              </div>

              {/* Mockup table grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "T1", status: "occupied" },
                  { label: "T2", status: "available" },
                  { label: "T3", status: "occupied" },
                  { label: "VIP", status: "vip" },
                  { label: "T5", status: "available" },
                  { label: "T6", status: "blocked" },
                  { label: "T7", status: "occupied" },
                  { label: "T8", status: "available" },
                ].map((t, i) => (
                  <div
                    key={i}
                    className={`rounded-md p-3 text-center text-xs font-semibold ${
                      t.status === "occupied"
                        ? "bg-primary/30 text-blue-200"
                        : t.status === "vip"
                        ? "bg-amber-400/20 text-amber-300"
                        : t.status === "blocked"
                        ? "bg-white/5 text-white/30"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating notification card */}
            <div className="absolute -bottom-4 -right-4 bg-surface-card rounded-md editorial-shadow p-4 max-w-[220px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[0.6875rem] font-semibold text-primary-dark">
                  Nouvelle arrivee
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Karim B. — Table VIP 9, groupe de 6
              </p>
            </div>
          </div>

          {/* Right — Content */}
          <div>
            <p className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant mb-3">
              Puissance & simplicite
            </p>
            <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-primary-dark sm:text-4xl mb-5">
              Votre salle, vos regles, notre technologie.
            </h2>
            <p className="font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant mb-8 max-w-md">
              twocards. combine une interface intuitive avec des outils puissants
              pour vous donner une visibilite totale sur votre activite, du plan
              de salle aux commissions RP.
            </p>

            <div className="space-y-6 mb-8">
              {highlights.map((h) => (
                <div key={h.title} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-surface-low flex items-center justify-center">
                    <h.icon size={20} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-manrope)] text-sm font-bold text-primary-dark mb-1">
                      {h.title}
                    </h3>
                    <p className="font-[family-name:var(--font-inter)] text-[0.8125rem] leading-relaxed text-on-surface-variant">
                      {h.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 font-[family-name:var(--font-manrope)] text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              Decouvrir toutes les fonctionnalites
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
