import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

export const metadata: Metadata = {
  title: "twocards. | Concierges & RP — chaque apport tracé, chaque commission payée",
  description:
    "Accédez aux disponibilités des meilleurs établissements, confirmez vos clients plus vite et suivez chaque commission jusqu'au paiement.",
};

export default function ConciergesPage() {
  return (
    <AudiencePage
      data={{
        label: "TwoCards pour les concierges & RP",
        titleStart: "Vos recommandations valent de l'argent.",
        titleAccent: "Encaissez-les",
        titleEnd: ".",
        subtitle:
          "Les réservations ont toujours circulé par relations, WhatsApp et faveurs discrètes. TwoCards transforme ces faveurs en transactions traçables : conditions connues à l'avance, apport prouvé au check-in, commission suivie jusqu'au paiement.",
        primaryCta: { label: "Rejoindre le réseau", href: "/signup?role=concierge" },
        secondaryCta: { label: "Voir comment ça marche", href: "/" },
        steps: [
          {
            title: "Accédez à l'inventaire vérifié",
            description:
              "Disponibilités, minimum spend, acompte, dress code et commission : les conditions de chaque établissement sont affichées avant même que vous demandiez. Fini les allers-retours.",
          },
          {
            title: "Réservez et confirmez votre client",
            description:
              "Envoyez une demande structurée, recevez une confirmation ou une contre-proposition en minutes. Un lien sécurisé permet à votre client de confirmer, payer l'acompte et préciser ses demandes.",
          },
          {
            title: "Suivez la commission jusqu'au paiement",
            description:
              "Le check-in QR prouve votre apport. La facture est vérifiée, la commission calculée selon les règles acceptées d'avance et payée selon un calendrier fixe. Sans relance.",
          },
        ],
        image:
          "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=2000&auto=format&fit=crop",
        imageAlt: "Cocktail servi au bar",
        statement:
          "Votre carnet d'adresses est un métier. TwoCards en fait un revenu certain.",
        gainsTitle: "Ce que vous",
        gainsAccent: "y gagnez.",
        gains: [
          {
            title: "Les conditions avant de demander",
            description:
              "Plus besoin d'appeler pour connaître le minimum spend ou la politique d'acompte : tout est affiché, à jour, établissement par établissement.",
          },
          {
            title: "Des contre-propositions, pas des refus",
            description:
              "Quand votre premier choix est complet, l'établissement propose une autre heure, une autre zone, une autre table. Votre client a toujours une solution.",
          },
          {
            title: "Vos clients restent les vôtres",
            description:
              "Coordonnées masquées, lien relais, divulgation uniquement après confirmation. Aucun établissement ne peut exporter votre portefeuille.",
          },
          {
            title: "L'apport prouvé, noir sur blanc",
            description:
              "Le check-in QR atteste que votre client est bien venu. Personne ne peut contester votre rôle dans la réservation.",
          },
          {
            title: "Un paiement certain",
            description:
              "Conditions préacceptées, calendrier de paiement fixe, historique auditable. Les établissements qui ne paient pas sont suspendus du réseau.",
          },
          {
            title: "Une réputation qui voyage",
            description:
              "Taux de présence, fiabilité, volume généré : votre historique vous suit de Marrakech à Paris, Saint-Tropez ou Dubaï. C'est votre passeport professionnel.",
          },
        ],
        faq: [
          {
            q: "Combien ça coûte ?",
            a: "Rien. L'accès au réseau est gratuit pour les concierges et RP vérifiés. TwoCards se rémunère côté établissements, sur les réservations réellement finalisées.",
          },
          {
            q: "Comment mon apport est-il prouvé ?",
            a: "Chaque réservation porte votre attribution dès l'origine, et le check-in QR à l'arrivée du client en apporte la preuve horodatée. La facture vérifiée fixe ensuite la base de calcul de votre commission.",
          },
          {
            q: "Et si je ne peux pas toucher de commission personnellement ?",
            a: "Certains employeurs et standards professionnels l'interdisent. TwoCards permet de rediriger la rémunération vers votre agence, votre équipe, un avantage client — ou de fonctionner en simple attribution et reporting, sans aucun versement individuel.",
          },
          {
            q: "Mes clients sensibles sont-ils protégés ?",
            a: "Oui. Les profils confidentiels peuvent être réservés sous alias, avec des coordonnées révélées uniquement après acceptation, et un statut attaché à la réservation — jamais à la personne.",
          },
          {
            q: "Quand suis-je payé ?",
            a: "Selon un calendrier fixe accepté d'avance par l'établissement, visible sur chaque commission. Vous suivez le statut en temps réel : validée, en cours, payée.",
          },
        ],
        finalTitle: "Votre réseau travaille déjà.",
        finalAccent: "Faites-le payer.",
        finalText:
          "Inscription gratuite, vérification en 24 h. Vos commissions en cours apparaissent dès votre première réservation.",
      }}
    />
  );
}
