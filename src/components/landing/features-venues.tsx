import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  Bell,
  Shield,
  Smartphone,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Tableau de bord unifié",
    description:
      "Vue d'ensemble en temps réel de vos réservations, listes d'invités, couverts et revenus depuis une interface unique.",
  },
  {
    icon: Users,
    title: "Gestion du réseau RP",
    description:
      "Invitez, suivez et évaluez vos concierges et RP. Visualisez les performances individuelles et les commissions dues.",
  },
  {
    icon: CalendarCheck,
    title: "Événements & soirées",
    description:
      "Créez des événements avec capacités, zones VIP, minimum de consommation et conditions de commission personnalisées.",
  },
  {
    icon: BarChart3,
    title: "Analyses avancées",
    description:
      "Suivez vos KPIs : couverts, chiffre d'affaires, taux de conversion, performance par RP et tendances mensuelles.",
  },
  {
    icon: Bell,
    title: "Notifications en temps réel",
    description:
      "Recevez des alertes instantanées pour chaque nouvelle réservation, arrivée client ou modification de liste.",
  },
  {
    icon: Shield,
    title: "Contrôle des accès",
    description:
      "Définissez les permissions par rôle — manager, hôtesse, RP — et gardez le contrôle total sur vos données.",
  },
  {
    icon: Smartphone,
    title: "Optimisé mobile",
    description:
      "Interface responsive conçue pour fonctionner aussi bien sur tablette au comptoir que sur téléphone en déplacement.",
  },
  {
    icon: Globe,
    title: "Multi-établissements",
    description:
      "Gérez plusieurs lieux depuis un seul compte. Comparez les performances et centralisez votre réseau de RP.",
  },
];

export function FeaturesVenues() {
  return (
    <section className="bg-surface-low py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Fonctionnalités
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-3xl font-bold text-primary-dark sm:text-4xl">
            Tout ce dont vous avez besoin,
            <br />
            rien de superflu.
          </h2>
          <p className="mt-4 mx-auto max-w-lg font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
            Une suite d'outils pensée pour simplifier la gestion de votre établissement
            et maximiser vos revenus.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-surface-card rounded-md editorial-shadow p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-surface-low group-hover:bg-primary/10 transition-colors">
                <feature.icon
                  size={22}
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] text-sm font-bold text-primary-dark mb-2">
                {feature.title}
              </h3>
              <p className="font-[family-name:var(--font-inter)] text-[0.8125rem] leading-relaxed text-on-surface-variant">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
