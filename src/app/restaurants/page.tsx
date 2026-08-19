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
        heroVideo: "/videos/etablissements-hero-60.mp4",
        heroPoster: "/videos/etablissements-hero-poster.jpg",
        /* La séquence va de la salle au zellige fermé : elle se joue une fois
           et reste sur le mur clos. En boucle, le retour brutal à la salle
           se verrait à chaque tour. */
        heroVideoLoop: false,
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
        features: {
          title: "Une plateforme complète",
          accent: "pour votre établissement.",
          intro:
            "Des clients qualifiés envoyés par les hôtels et concierges de la ville, un réseau d'apporteurs pilotable, votre réputation mesurée après chaque visite — et des chiffres que vous contrôlez.",
          items: [
            {
              id: "reservations",
              nav: "Réservations",
              kicker: "Demande qualifiée",
              title: "Des clients d'hôtels, pas des passants",
              description:
                "Chaque réservation twocards vient d'un client déjà installé dans un hôtel partenaire, recommandé par le desk, un QR en chambre ou un concierge. Nom, téléphone, date, taille du groupe, occasion : la demande arrive complète, en temps réel, dans votre espace.",
              bullets: [
                {
                  title: "Fiche complète à chaque demande",
                  text: "Vous savez qui arrive, à combien, pour quelle occasion — de quoi préparer la table et le service qui vont avec.",
                },
                {
                  title: "Temps réel",
                  text: "La demande apparaît dans votre dashboard à la seconde où le client la confirme sur son téléphone.",
                },
                {
                  title: "Clientèle à panier élevé",
                  text: "Des voyageurs en séjour, envoyés par des prescripteurs de confiance — le profil de client que toute maison veut recevoir.",
                },
              ],
            },
            {
              id: "reseau",
              nav: "Réseau d'apporteurs",
              kicker: "Prescription",
              title: "Hôtels et concierges deviennent votre force de vente",
              description:
                "Chaque hôtel équipé d'un QR twocards, chaque concierge avec son lien, recommande votre maison à ses clients. Vous rémunérez uniquement au résultat : un pourcentage du montant réellement dépensé, calculé automatiquement — l'apporteur est payé, la relation est saine, le volume suit.",
              bullets: [
                {
                  title: "Rémunération au résultat",
                  text: "Pas d'abonnement à un annuaire : la commission ne part que si un client est venu et a dépensé chez vous.",
                },
                {
                  title: "Attribution incontestable",
                  text: "Chaque réservation est rattachée à son apporteur de bout en bout — plus de discussion sur qui a envoyé qui.",
                },
                {
                  title: "Un réseau qui grandit",
                  text: "Plus les hôtels de la ville s'équipent, plus votre maison est proposée — sans effort commercial de votre part.",
                },
              ],
            },
            {
              id: "reputation",
              nav: "Réputation",
              kicker: "Management de réputation",
              title: "Chaque visite se termine par un avis",
              description:
                "Après la sortie, chaque client reçoit un lien pour noter son expérience sur 5 et laisser un commentaire. Vous suivez votre note moyenne, lisez les retours, repérez les soirs qui déçoivent — et la qualité perçue de votre maison devient une donnée pilotable, pas une rumeur.",
              bullets: [
                {
                  title: "Avis vérifiés par construction",
                  text: "Seuls les clients ayant réellement réservé peuvent noter, une seule fois : pas de faux avis, pas de concurrent malveillant.",
                },
                {
                  title: "Note moyenne et commentaires",
                  text: "Votre satisfaction client, agrégée et détaillée dans votre dashboard, sortie par sortie.",
                },
                {
                  title: "Le lien s'envoie en un clic",
                  text: "Au moment de saisir l'addition, copiez le lien d'avis et envoyez-le au client par WhatsApp — le tour est joué.",
                },
              ],
              stat: { value: "1 clic", label: "pour envoyer la demande d'avis après la sortie" },
            },
            {
              id: "data",
              nav: "Data & revenus",
              kicker: "Pilotage",
              title: "Vos chiffres, semaine par semaine",
              description:
                "CA apporté par twocards, sorties par semaine, commissions reversées, satisfaction moyenne : votre dashboard agrège tout ce que le réseau vous rapporte. C'est vous qui saisissez le montant de chaque addition — la commission est calculée automatiquement, au taux convenu.",
              bullets: [
                {
                  title: "Montant saisi — ou envoyé par votre caisse",
                  text: "Deux chiffres et une validation, ou zéro geste : connectez votre POS (Lightspeed, Square, Tiller, L'Addition…) et chaque ticket fermé remplit le montant tout seul.",
                },
                {
                  title: "Des courbes, pas des impressions",
                  text: "Volume hebdomadaire, CA saisi, commissions, note moyenne : l'apport du réseau se lit d'un coup d'œil.",
                },
                {
                  title: "Contrôle et transparence",
                  text: "Le taux de commission est convenu à l'avance et visible sur chaque ligne — aucune surprise en fin de mois.",
                },
              ],
            },
          ],
        },
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
