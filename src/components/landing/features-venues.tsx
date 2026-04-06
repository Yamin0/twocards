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
    title: "Tableau de bord unifie",
    description:
      "Vue d'ensemble en temps reel de vos reservations, listes d'invites, couverts et revenus depuis une interface unique.",
  },
  {
    icon: Users,
    title: "Gestion du reseau RP",
    description:
      "Invitez, suivez et evaluez vos concierges et RP. Visualisez les performances individuelles et les commissions dues.",
  },
  {
    icon: CalendarCheck,
    title: "Evenements & soirees",
    description:
      "Creez des evenements avec capacites, zones VIP, minimum de consommation et conditions de commission personnalisees.",
  },
  {
    icon: BarChart3,
    title: "Analyses avancees",
    description:
      "Suivez vos KPIs : couverts, chiffre d'affaires, taux de conversion, performance par RP et tendances mensuelles.",
  },
  {
    icon: Bell,
    title: "Notifications en temps reel",
    description:
      "Recevez des alertes instantanees pour chaque nouvelle reservation, arrivee client ou modification de liste.",
  },
  {
    icon: Shield,
    title: "Controle des acces",
    description:
      "Definissez les permissions par role — manager, hotesse, RP — et gardez le controle total sur vos donnees.",
  },
  {
    icon: Smartphone,
    title: "Optimise mobile",
    description:
      "Interface responsive conçue pour fonctionner aussi bien sur tablette au comptoir que sur telephone en deplacement.",
  },
  {
    icon: Globe,
    title: "Multi-etablissements",
    description:
      "Gerez plusieurs lieux depuis un seul compte. Comparez les performances et centralisez votre reseau de RP.",
  },
];

export function FeaturesVenues() {
  return (
    <section className="bg-surface-low py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
            Fonctionnalites
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-manrope)] text-3xl font-bold text-primary-dark sm:text-4xl">
            Tout ce dont vous avez besoin,
            <br />
            rien de superflu.
          </h2>
          <p className="mt-4 mx-auto max-w-lg font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
            Une suite d'outils pensee pour simplifier la gestion de votre etablissement
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
