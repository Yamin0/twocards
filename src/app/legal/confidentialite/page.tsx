import type { Metadata } from "next";
import { LegalArticle } from "@/components/landing/legal-article";

export const metadata: Metadata = {
  title: "twocards. | Politique de confidentialité",
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <LegalArticle
      label="Juridique"
      title="Politique de confidentialité"
      updated="31 juillet 2026"
      sections={[
        {
          heading: "Responsable de traitement",
          body: [
            "[Raison sociale], éditrice de TwoCards, est responsable du traitement des données collectées via la plateforme, conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, et, le cas échéant, au RGPD pour les utilisateurs situés dans l'Union européenne.",
            "Les traitements font l'objet des déclarations requises auprès de la CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel).",
          ],
        },
        {
          heading: "Données collectées",
          body: [
            "Comptes professionnels : identité, coordonnées, rôle (établissement ou apporteur), établissement de rattachement, données de vérification (KYB/KYC).",
            "Réservations : identité ou alias du client final, nombre de couverts, horaires, demandes particulières (dont, le cas échéant, allergies communiquées volontairement), montants d'acompte et de facture vérifiée.",
            "Données techniques : journaux de connexion et d'audit horodatés, nécessaires à la traçabilité des réservations et des commissions.",
          ],
        },
        {
          heading: "Finalités",
          body: [
            "Mise en relation entre établissements et apporteurs vérifiés ; gestion des réservations, du check-in, des factures vérifiées et des commissions ; prévention de la fraude et des litiges ; obligations comptables et légales.",
            "Aucune utilisation commerciale des données à des fins de prospection n'est effectuée sans consentement explicite.",
          ],
        },
        {
          heading: "Confidentialité des portefeuilles clients",
          body: [
            "Les coordonnées des clients d'un apporteur sont masquées par défaut (relais de confidentialité) et ne sont révélées à l'établissement qu'après confirmation de la réservation. Les profils sensibles peuvent être traités sous alias.",
            "L'export des données clients par des utilisateurs non autorisés est techniquement bloqué.",
          ],
        },
        {
          heading: "Durées de conservation",
          body: [
            "Les données de réservation et les journaux d'audit sont conservés pendant la durée nécessaire à la gestion des litiges et aux obligations comptables, puis supprimés ou anonymisés. Les pièces justificatives (factures) sont expurgées des données non nécessaires puis supprimées à l'issue de la durée définie.",
          ],
        },
        {
          heading: "Vos droits",
          body: [
            "Conformément à la loi 09-08, vous disposez de droits d'accès, de rectification, d'opposition et de suppression de vos données. Pour les exercer : privacy@twocardspro.com.",
            "Tout transfert de données hors du Maroc est encadré par la procédure prévue par la CNDP.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "TwoCards utilise uniquement les cookies strictement nécessaires à l'authentification et au fonctionnement de la plateforme (session Supabase). Aucun cookie publicitaire ou de pistage tiers n'est déposé.",
          ],
        },
      ]}
    />
  );
}
