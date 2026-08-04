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
          "La table impossible à obtenir est la première chose qu'un client demande au desk, et la seule que la plupart des établissements ne peuvent pas garantir. TwoCards la met à portée de votre équipe sur trois points de contact, avec une attribution claire à votre établissement et une part du revenu généré.",
        primaryCta: { label: "Équiper mon établissement", href: "/signup" },
        secondaryCta: { label: "Parler à notre équipe", href: "/signup" },
        steps: [
          {
            title: "Un QR code dans la chambre",
            description:
              "Posé sur le bureau ou le chevet, il ouvre la sélection des restaurants, clubs et expériences que vous recommandez. Le client réserve seul, à toute heure, sans passer par le desk.",
          },
          {
            title: "Un message avant l'arrivée",
            description:
              "Un lien envoyé par mail ou WhatsApp quelques jours avant le séjour. Le client arrive avec ses tables déjà réservées, et vous connaissez son programme avant qu'il ne franchisse la porte.",
          },
          {
            title: "Le desk réserve pour lui",
            description:
              "Votre concierge garde la main : disponibilités réelles, réservation au nom du client, suivi de chaque demande. Les trois chemins aboutissent au même tableau de bord.",
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
            title: "Les tables que vos clients n'obtiennent pas seuls",
            description:
              "Les adresses complètes depuis des semaines gardent des places pour le réseau. Votre équipe y accède directement, sans appeler personne.",
          },
          {
            title: "Une part du revenu généré",
            description:
              "Chaque réservation issue de votre établissement vous revient, qu'elle soit honorée chez vous ou dans un restaurant de la ville. Rejoindre le réseau ne coûte rien : TwoCards se rémunère côté établissements partenaires.",
          },
          {
            title: "Conforme à votre politique interne",
            description:
              "Les standards professionnels de conciergerie interdisent souvent les commissions individuelles. TwoCards s'y adapte : rémunération à l'établissement, au fonds d'équipe, en avantage client, ou aucune.",
          },
          {
            title: "Une marque blanche à votre image",
            description:
              "QR en chambre, lien avant l'arrivée, sélection de restaurants recommandés : vos clients réservent dans un univers à vos couleurs, attribué à votre établissement.",
          },
          {
            title: "Un suivi auditable de bout en bout",
            description:
              "Tableau de bord en temps réel, réservations modifiables, historique horodaté de chaque demande et versements à échéance fixe. Votre direction peut vérifier chaque ligne.",
          },
          {
            title: "Des partenaires vérifiés",
            description:
              "Tous les établissements du réseau sont vérifiés, avec conditions affichées et réputation transactionnelle. Vous savez où vous envoyez vos clients.",
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
            a: "Oui : portail concierge à vos couleurs, QR en chambre et lien envoyé au client avant son séjour, avec vos restaurants recommandés en tête de liste.",
          },
          {
            q: "Un client peut-il réserver sans passer par le desk ?",
            a: "Oui, c'est même l'intérêt du QR en chambre et du message avant l'arrivée. La réservation reste attribuée à votre établissement, et votre équipe la voit apparaître dans son tableau de bord.",
          },
          {
            q: "Quand et comment sommes-nous rémunérés ?",
            a: "Les versements suivent un calendrier fixe, sur la base des factures vérifiées. Chaque ligne est justifiée par une réservation horodatée et un check-in confirmé, exportable pour votre comptabilité.",
          },
          {
            q: "Que se passe-t-il si le client modifie ou annule ?",
            a: "La réservation reste modifiable jusqu'aux conditions fixées par l'établissement. Toute modification est horodatée et visible des deux côtés, ce qui évite les litiges sur ce qui a réellement été honoré.",
          },
          {
            q: "Combien de temps pour être opérationnel ?",
            a: "Un établissement est équipé en moins d'une journée : comptes vérifiés, inventaire visible, QR imprimés, premières réservations le soir même.",
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
