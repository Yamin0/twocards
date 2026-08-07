import type { Metadata } from "next";
import { AudiencePage } from "@/components/landing/audience-page";

export const metadata: Metadata = {
  title: "twocards. | Restaurants — remplissez vos tables à vos conditions",
  description:
    "TwoCards distribue votre inventaire aux concierges et RP vérifiés. Vous gardez le contrôle de chaque table, chaque commission est calculée sur du revenu vérifié.",
};

export default function RestaurantsPage() {
  return (
    <AudiencePage
      data={{
        label: "TwoCards pour les restaurants",
        titleStart: "Remplissez vos tables,",
        titleAccent: "à vos conditions",
        titleEnd: ".",
        subtitle:
          "TwoCards transforme les réservations que vous recevez déjà sur WhatsApp en un canal géré : votre inventaire est distribué aux concierges et RP vérifiés, chaque client est attribué, et les commissions se calculent sur du revenu vérifié — pas sur des promesses.",
        scrollVideo: {
          desktop: "/videos/etablissements-hero.mp4",
          mobile: "/videos/etablissements-hero-480.mp4",
          poster: "/videos/etablissements-hero-poster.jpg",
        },
        primaryCta: { label: "Devenir partenaire", href: "/signup" },
        secondaryCta: { label: "Parler à notre équipe", href: "/signup" },
        steps: [
          {
            title: "Allouez votre inventaire et vos conditions",
            description:
              "Vous décidez quelles tables entrent dans le réseau, à quelles heures, avec quel minimum spend, quel acompte et quelle commission. Le reste de votre salle ne change pas.",
          },
          {
            title: "Le réseau vérifié réserve",
            description:
              "Concierges, RP et hôtels envoient des demandes structurées : date, couverts, budget, niveau de service. Vous acceptez ou contre-proposez une autre heure, une autre zone, un autre minimum.",
          },
          {
            title: "Vérifiez, puis payez au réel",
            description:
              "Check-in QR à l'arrivée, facture vérifiée au départ. La commission se calcule automatiquement sur le montant validé, selon les règles fixées dès l'origine. Zéro litige.",
          },
        ],
        image:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop",
        imageAlt: "Salle de restaurant gastronomique",
        statement:
          "Chaque table apportée, comptabilisée. Chaque client, attendu à la porte.",
        gainsTitle: "Ce que votre restaurant",
        gainsAccent: "y gagne.",
        gains: [
          {
            title: "Du revenu incrémental les soirs de pointe",
            description:
              "Les tables à forte valeur partent aux apporteurs qui amènent les bons clients, aux conditions que vous fixez : minimum spend, acompte, commission.",
          },
          {
            title: "La fin des litiges de commission",
            description:
              "Montant, base de calcul, dépenses exclues et délai de paiement sont acceptés avant la réservation. Tout est horodaté et auditable.",
          },
          {
            title: "Des clients attendus, pas des surprises",
            description:
              "Chaque réservation arrive avec le nombre exact de couverts, le niveau de service et les demandes spéciales, transmis par un apporteur vérifié qui engage sa réputation.",
          },
          {
            title: "Compatible avec vos outils",
            description:
              "TwoCards ne remplace ni votre logiciel de réservation ni votre caisse. Il gère la couche commerciale entre vous et vos apporteurs, au-dessus de l'existant.",
          },
          {
            title: "Une visibilité dans les réseaux fermés",
            description:
              "Votre établissement apparaît dans les desks concierges, les hôtels et les carnets d'adresses que vous ne touchez pas aujourd'hui.",
          },
          {
            title: "La mesure de chaque apporteur",
            description:
              "Taux de présence, exactitude des couverts, dépense réelle générée : vous savez enfin qui remplit vos tables — noir sur blanc.",
          },
        ],
        faq: [
          {
            q: "TwoCards remplace-t-il notre logiciel de réservation ?",
            a: "Non. TwoCards gère la relation commerciale avec vos apporteurs — attribution, check-in, facture, commission — et fonctionne au-dessus de votre système actuel, avec ou sans intégration technique.",
          },
          {
            q: "Qui fixe les commissions ?",
            a: "Vous. Montant fixe ou pourcentage, base de calcul, dépenses exclues (TVA, pourboires, frais) et délai de paiement : tout est défini par établissement et accepté par l'apporteur avant la première réservation.",
          },
          {
            q: "Devons-nous publier tout notre plan de salle ?",
            a: "Non. Vous allouez uniquement l'inventaire que vous voulez confier au réseau — deux tables le vendredi, dix couverts pour les hôtels, une zone précise. Le reste vous appartient.",
          },
          {
            q: "Comment le montant de la facture est-il vérifié ?",
            a: "Trois niveaux : synchronisation avec votre système, saisie avec photo de la facture, ou validation mutuelle entre vous et l'apporteur. En cas de désaccord, la pièce fait foi.",
          },
          {
            q: "Combien ça coûte ?",
            a: "Rien pendant le pilote Founding Circle : installation gratuite, import de votre réseau existant, rapport hebdomadaire. Le payant ne commence qu'après la preuve du ROI.",
          },
        ],
        finalTitle: "Vos tables sont déjà là.",
        finalAccent: "Faites-en un actif.",
        finalText:
          "Les établissements partenaires sont opérationnels en moins d'une journée, avec leur réseau d'apporteurs existant importé.",
      }}
    />
  );
}
