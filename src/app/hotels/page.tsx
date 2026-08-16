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
        heroVideo: "/videos/hotels-hero-60.mp4",
        heroPoster: "/videos/hotels-hero-poster.jpg",
        titleStart: "Offrez à vos clients",
        titleRotate: ["la table", "l'activité", "le service"],
        titleMiddle: "qu'ils",
        titleAccent: "veulent vraiment",
        titleEnd: ".",
        primaryCta: { label: "Équiper mon établissement", href: "/signup?role=hotel" },
        secondaryCta: { label: "Parler à notre équipe", href: "/signup?role=hotel" },
        stepsTitle: "Deux chemins.",
        stepsAccent: "Un seul suivi.",
        steps: [
          {
            icon: "qr",
            title: "Un QR code dans la chambre",
            description:
              "Posé sur le bureau ou le chevet, il ouvre la sélection des restaurants, clubs et expériences que vous recommandez. Le client réserve seul, à toute heure, sans passer par le desk.",
          },
          {
            icon: "mail",
            title: "Un message avant l'arrivée",
            description:
              "Un lien envoyé par mail ou WhatsApp quelques jours avant le séjour. Le client arrive avec ses tables déjà réservées, et vous connaissez son programme avant qu'il ne franchisse la porte.",
          },
        ],
        marquee: {
          label: "Ils nous font confiance.",
          items: [
            { name: "Six Senses", logo: "/logos/six-senses.png", scale: 1.35 },
            { name: "Aman", logo: "/logos/aman.png", scale: 0.75 },
            { name: "St. Regis", logo: "/logos/st-regis.png" },
            { name: "Cheval Blanc", logo: "/logos/cheval-blanc.png", scale: 1.2 },
            { name: "Raffles", logo: "/logos/raffles.png", scale: 1.35 },
            { name: "Shangri-La", logo: "/logos/shangri-la.png", scale: 1.5 },
          ],
        },
        features: {
          title: "Tout ce que twocards apporte",
          accent: "à votre hôtel.",
          intro:
            "De la chambre au versement de la commission, chaque étape est outillée, mesurée et traçable — sans changer vos habitudes ni celles de vos équipes.",
          items: [
            {
              id: "chambres",
              nav: "QR par chambre",
              kicker: "Traçabilité",
              title: "Un QR code par chambre, chaque scan attribué",
              description:
                "Chaque chambre, le lobby, le spa ou la piscine reçoit son propre QR code. Quand un client le scanne, le scan est compté et toute réservation qui en découle est rattachée à cet emplacement précis — vous savez exactement d'où vient chaque sortie, et donc chaque commission.",
              bullets: [
                {
                  title: "Génération en un clic",
                  text: "Créez « Chambre 204 » ou « Rooftop » depuis votre dashboard : le QR est prêt à imprimer en SVG haute définition, activable et désactivable à tout moment.",
                },
                {
                  title: "Lien unique par emplacement",
                  text: "Chaque QR porte son propre lien de suivi : scans, réservations et commissions de cet emplacement, isolés du reste.",
                },
                {
                  title: "Sans application à installer",
                  text: "Le client scanne avec son appareil photo et réserve en moins d'une minute. Aucun compte, aucune friction.",
                },
              ],
              stat: { value: "< 60 s", label: "du scan à la demande de réservation" },
            },
            {
              id: "curation",
              nav: "Menu par client",
              kicker: "Curation",
              title: "Vous décidez ce que chaque client peut voir",
              description:
                "Le menu qui s'ouvre au scan n'est pas un annuaire : c'est votre sélection. Restaurants, activités, clubs et services du catalogue twocards de votre ville — et pour chaque chambre, vous retirez ou proposez chaque adresse individuellement. Un VIP ne voit pas la même sélection qu'une famille.",
              bullets: [
                {
                  title: "Catalogue de votre ville uniquement",
                  text: "Un hôtel de Marrakech ne proposera jamais une table à Casablanca : le catalogue est filtré par votre ville, automatiquement.",
                },
                {
                  title: "Personnalisation par chambre",
                  text: "Cochez, décochez : le menu de la suite 12 peut différer de celui du lobby. Idéal pour adapter la sélection à un client précis.",
                },
                {
                  title: "Toujours à jour",
                  text: "Une adresse retirée disparaît immédiatement de tous les téléphones — aucun support imprimé à refaire.",
                },
              ],
            },
            {
              id: "commissions",
              nav: "Commissions",
              kicker: "Revenus",
              title: "Une commission claire sur chaque sortie",
              description:
                "Votre hôtel touche un pourcentage du montant réellement dépensé par le client — 10 % par défaut. Le montant est saisi par l'établissement après la sortie, la commission est calculée automatiquement, sans déclaratif ni discussion. Vous suivez tout, exportez tout.",
              bullets: [
                {
                  title: "Calcul automatique, jamais manuel",
                  text: "La commission est dérivée en base de données du montant saisi par l'établissement. Personne ne peut la modifier à la main — ni eux, ni nous.",
                },
                {
                  title: "Export comptable",
                  text: "Un CSV par période, avec montant, taux et commission par réservation, prêt pour votre comptabilité.",
                },
                {
                  title: "Versement mensuel",
                  text: "Les commissions sont consolidées et versées chaque mois, avec le détail réservation par réservation.",
                },
              ],
              stat: { value: "10 %", label: "du montant dépensé, reversés à l'hôtel" },
            },
            {
              id: "suivi",
              nav: "Suivi & satisfaction",
              kicker: "Pilotage",
              title: "Un dashboard en temps réel, satisfaction comprise",
              description:
                "Chaque réservation apparaît dans votre espace à la seconde où le client la fait, rattachée à sa chambre. Vous suivez la demande semaine par semaine, la répartition par type de sortie, et la satisfaction de vos clients — qui notent leur soirée après coup.",
              bullets: [
                {
                  title: "Temps réel, vraiment",
                  text: "Pas de rafraîchissement, pas d'email le lendemain : la réservation s'affiche pendant que le client la confirme.",
                },
                {
                  title: "Satisfaction mesurée",
                  text: "Après chaque sortie, le client peut noter son expérience sur 5. Vous voyez la moyenne et les commentaires — la qualité de vos recommandations devient un chiffre.",
                },
                {
                  title: "Vos données vous appartiennent",
                  text: "Scans, réservations, commissions, avis : tout est consultable et exportable à tout moment.",
                },
              ],
            },
          ],
        },
        image: "/images/hotels-beach.jpg",
        imageAlt:
          "Piscine d'un hôtel en bord de mer, transats et parasols rayés face à la plage",
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
            title: "Votre desk garde la main",
            description:
              "Votre concierge voit les disponibilités réelles, réserve au nom du client et suit chaque demande. Qu'elle vienne de la chambre, d'un message ou du desk, toute réservation remonte au même tableau de bord.",
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
        /* Photos libres de droit, à remplacer : il suffit d'écraser les
           fichiers public/images/carousel/01.jpg … 09.jpg. */
        carousel: {
          label: "Ce que vos clients réservent",
          cards: [
            { imgUrl: "/images/carousel/01.jpg", alt: "Piscine d'hôtel" },
            { imgUrl: "/images/carousel/02.jpg", alt: "Table de restaurant" },
            { imgUrl: "/images/carousel/03.jpg", alt: "Rooftop au coucher du soleil" },
            { imgUrl: "/images/carousel/04.jpg", alt: "Club" },
            { imgUrl: "/images/carousel/05.jpg", alt: "Plage" },
            { imgUrl: "/images/carousel/06.jpg", alt: "Dîner privé" },
            { imgUrl: "/images/carousel/07.jpg", alt: "Salle de restaurant" },
            { imgUrl: "/images/carousel/08.jpg", alt: "Bar" },
            { imgUrl: "/images/carousel/09.jpg", alt: "Terrasse" },
          ],
        },
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
