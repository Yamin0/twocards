import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

export const metadata: Metadata = {
  title: "twocards. | Influenceurs — votre goût a déjà de la valeur",
  description:
    "Vos recommandations circulent déjà. TwoCards les transforme en réservations traçables et en commissions suivies, sans rien changer à votre façon de partager.",
};

export default function InfluenceursPage() {
  return (
    <AudiencePage
      data={{
        label: "TwoCards pour les influenceurs",
        titleStart: "Votre goût a déjà de la valeur.",
        titleAccent: "TwoCards le rémunère",
        titleEnd: ".",
        subtitle:
          "On vous demande déjà où dîner, où sortir, où passer la soirée. Chaque réponse déclenche des réservations dont vous ne voyez jamais la couleur. TwoCards attribue chaque réservation issue de vos recommandations et vous rémunère sur le revenu réellement vérifié.",
        primaryCta: { label: "Créer ma sélection", href: "/signup?role=concierge" },
        secondaryCta: { label: "Voir comment ça marche", href: "/" },
        steps: [
          {
            title: "Composez votre sélection",
            description:
              "Les restaurants, rooftops et clubs que vous recommandez déjà, avec votre mot sur chacun. Uniquement des établissements vérifiés du réseau, aux conditions affichées.",
          },
          {
            title: "Partagez un lien unique",
            description:
              "Bio Instagram, stories, WhatsApp, QR code : un seul lien couvre toute votre sélection. Votre audience réserve directement, aux vraies disponibilités.",
          },
          {
            title: "Encaissez sur chaque réservation",
            description:
              "Chaque réservation issue de votre lien vous est attribuée, prouvée au check-in et calculée sur la facture vérifiée. Suivi en temps réel, paiement selon un calendrier fixe.",
          },
        ],
        image:
          "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2000&auto=format&fit=crop",
        imageAlt: "Groupe d'amis portant un toast",
        statement:
          "Chaque story génère des tables. Il est temps que ça se voie sur votre relevé.",
        gainsTitle: "Ce que vous",
        gainsAccent: "y gagnez.",
        gains: [
          {
            title: "Vous le faites déjà gratuitement",
            description:
              "Vos recommandations remplissent des salles depuis des années. Désormais chaque réservation qu'elles déclenchent vous est attribuée — et rémunérée.",
          },
          {
            title: "Un lien, toutes vos adresses",
            description:
              "Une seule sélection peut couvrir un séjour entier : dîner, rooftop, club, expérience. Un lien, plusieurs sources de revenu.",
          },
          {
            title: "Votre audience reste la vôtre",
            description:
              "Votre sélection, votre image, votre lien. TwoCards ne s'installe jamais entre vous et les gens qui vous suivent.",
          },
          {
            title: "Un suivi transparent, en direct",
            description:
              "Clics, réservations, revenu attribué, commissions en attente : votre tableau de bord est à jour en permanence. Aucune boîte noire.",
          },
          {
            title: "Des établissements vérifiés",
            description:
              "Vous n'envoyez jamais votre audience à l'aveugle : conditions affichées, réputation transactionnelle, check-in prouvé.",
          },
          {
            title: "Une place de premier arrivé",
            description:
              "Le réseau Marrakech se construit maintenant. Les premiers influenceurs vérifiés définiront la façon dont la ville réserve demain.",
          },
        ],
        faq: [
          {
            q: "Combien ça coûte ?",
            a: "Rien. L'inscription et le lien de sélection sont gratuits. Vous êtes rémunéré sur les réservations réellement finalisées, selon les règles de commission de chaque établissement.",
          },
          {
            q: "Quand suis-je payé ?",
            a: "Selon un calendrier fixe, visible sur chaque commission, une fois la facture de la réservation vérifiée. Vous suivez chaque statut en temps réel : validée, en cours, payée.",
          },
          {
            q: "Combien de temps mon lien rapporte-t-il ?",
            a: "Tant que votre sélection est active. Chaque réservation passée par votre lien vous reste attribuée, sans plafond ni date limite.",
          },
          {
            q: "Un lieu que j'adore n'est pas encore sur TwoCards ?",
            a: "Proposez-le. Les établissements suggérés par le réseau sont contactés en priorité — et vous restez l'apporteur attribué s'ils rejoignent.",
          },
          {
            q: "Puis-je couvrir plusieurs villes ?",
            a: "Marrakech d'abord. Le réseau suivra ensuite les corridors de clientèle — Casablanca, Paris, Saint-Tropez, Dubaï — et votre réputation voyagera avec vous.",
          },
        ],
        finalTitle: "Vos recommandations tournent déjà.",
        finalAccent: "Récupérez votre part.",
        finalText:
          "Inscription gratuite, vérification en 24 h, sélection en ligne le jour même.",
      }}
    />
  );
}
