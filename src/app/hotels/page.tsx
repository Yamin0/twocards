import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

export const metadata: Metadata = {
  title: "twocards. | Hôtels & riads — le service que vos clients demandent le plus",
  description:
    "Offrez à vos clients les tables les plus difficiles de la ville, avec une attribution claire à votre établissement et une rémunération conforme à votre politique interne.",
};

export default function HotelsPage() {
  return (
    <AudiencePage
      data={{
        label: "TwoCards pour les hôtels & riads",
        titleStart: "Offrez à vos clients la table qu'ils",
        titleAccent: "veulent vraiment",
        titleEnd: ".",
        subtitle:
          "La réservation difficile à obtenir est la première chose que chaque client demande au desk — et la seule que la plupart des établissements ne peuvent pas garantir. TwoCards la met à portée de votre conciergerie, avec une attribution claire à votre établissement sur chaque réservation.",
        primaryCta: { label: "Équiper mon desk", href: "/signup" },
        secondaryCta: { label: "Parler à notre équipe", href: "/#contact" },
        steps: [
          {
            title: "Équipez votre desk concierge",
            description:
              "Dès le check-in, votre équipe voit les disponibilités réelles, les conditions et les zones des restaurants, rooftops et clubs que vos clients recherchent déjà. Sans WhatsApp, sans appels à froid.",
          },
          {
            title: "Accompagnez tout le séjour",
            description:
              "Dîner ce soir, brunch demain, Agafay le troisième jour. Une seule plateforme couvre chaque recommandation, chaque réservation et chaque suivi, du premier jour au départ.",
          },
          {
            title: "L'attribution revient à votre établissement",
            description:
              "Chaque réservation générée par votre équipe est tracée jusqu'à votre établissement. La rémunération suit votre politique interne : l'hôtel, un fonds d'équipe, un avantage client — ou un simple reporting, sans versement.",
          },
        ],
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop",
        imageAlt: "Piscine d'un hôtel de luxe",
        statement:
          "Le service que vos clients réclament. La traçabilité que votre direction exige.",
        gainsTitle: "Ce que votre établissement",
        gainsAccent: "y gagne.",
        gains: [
          {
            title: "Le service n°1 du desk, enfin garanti",
            description:
              "Résolvez la première frustration d'un client qui arrive en ville : obtenir la bonne table, au bon moment, sans chasse au WhatsApp.",
          },
          {
            title: "Une attribution à votre établissement",
            description:
              "Chaque réservation issue de votre conciergerie est rattachée à votre établissement, avec un reporting complet par période et par équipe.",
          },
          {
            title: "Conforme à votre politique interne",
            description:
              "Les standards professionnels de conciergerie interdisent souvent les commissions individuelles. TwoCards s'y adapte : rémunération à l'établissement, au fonds d'équipe, en avantage client — ou aucune.",
          },
          {
            title: "Une marque blanche à votre image",
            description:
              "QR en chambre, lien pré-arrivée, sélection de restaurants recommandés : vos clients réservent dans un univers à vos couleurs, attribué à votre établissement.",
          },
          {
            title: "Des partenaires vérifiés",
            description:
              "Tous les établissements du réseau sont vérifiés, avec conditions affichées et réputation transactionnelle. Vous savez où vous envoyez vos clients.",
          },
          {
            title: "Aucun coût d'entrée",
            description:
              "Rejoindre le réseau est gratuit. TwoCards se rémunère sur les réservations finalisées côté restaurants — jamais sur votre desk.",
          },
        ],
        faq: [
          {
            q: "TwoCards remplace-t-il notre PMS ou notre outil de conciergerie ?",
            a: "Non. TwoCards gère la réservation de bout en bout et restitue l'activité à votre équipe. Votre PMS et vos outils internes restent la source de vérité de votre établissement.",
          },
          {
            q: "Nos concierges ne peuvent pas recevoir de commissions. Et alors ?",
            a: "C'est prévu. Le mode éthique permet une rémunération à l'établissement, à un fonds d'équipe, en avantage client — ou une simple attribution avec reporting, sans aucun versement individuel.",
          },
          {
            q: "Comment la réservation est-elle attribuée à notre établissement ?",
            a: "Chaque compte concierge est rattaché à votre établissement. La réservation porte cette attribution de la demande au check-in, et le reporting consolide l'activité par période.",
          },
          {
            q: "Proposez-vous une marque blanche ?",
            a: "Oui : portail concierge à vos couleurs, QR en chambre et lien pré-arrivée envoyé au client avant son séjour, avec vos restaurants recommandés en tête de liste.",
          },
          {
            q: "Combien de temps pour être opérationnel ?",
            a: "Un desk est équipé en moins d'une journée : comptes vérifiés, inventaire visible, premières réservations le soir même.",
          },
        ],
        finalTitle: "Donnez la table à vos clients.",
        finalAccent: "Gardez la traçabilité.",
        finalText:
          "Un nombre limité d'établissements par quartier pendant le pilote Marrakech. Parlez-nous pour réserver le vôtre.",
      }}
    />
  );
}
