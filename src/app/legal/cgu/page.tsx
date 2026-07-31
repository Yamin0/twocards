import type { Metadata } from "next";
import { LegalArticle } from "@/components/landing/legal-article";

export const metadata: Metadata = {
  title: "twocards. | Conditions générales d'utilisation",
  robots: { index: false },
};

export default function CguPage() {
  return (
    <LegalArticle
      label="Juridique"
      title="Conditions générales d'utilisation"
      updated="31 juillet 2026"
      sections={[
        {
          heading: "Objet",
          body: [
            "TwoCards est une plateforme B2B qui met en relation des établissements (restaurants, rooftops, clubs, hôtels, riads) et des apporteurs d'affaires vérifiés (conciergeries, concierges, RP, influenceurs), et qui trace le cycle complet d'une réservation : demande, confirmation, acompte, check-in, facture vérifiée, commission.",
            "Les présentes conditions régissent l'accès et l'utilisation de la plateforme par tout utilisateur professionnel.",
          ],
        },
        {
          heading: "Comptes et vérification",
          body: [
            "L'accès au réseau est réservé aux professionnels. Chaque compte fait l'objet d'une vérification (KYB/KYC) avant activation. L'utilisateur garantit l'exactitude des informations fournies et la confidentialité de ses identifiants.",
            "TwoCards peut suspendre tout compte en cas de manquement aux présentes conditions, de fraude, d'auto-référencement ou de non-paiement répété des commissions dues.",
          ],
        },
        {
          heading: "Règles de commission",
          body: [
            "Les conditions de commission (montant fixe ou pourcentage, base de calcul, dépenses exclues, bénéficiaire, délai de paiement) sont définies par l'établissement et acceptées par l'apporteur avant toute réservation. Elles font foi pour l'ensemble du cycle.",
            "La commission n'est due que sur le revenu vérifié : synchronisation système, justificatif documentaire ou validation mutuelle. Lorsque la politique de l'employeur d'un apporteur interdit les commissions individuelles, la rémunération peut être redirigée ou remplacée par une simple attribution avec reporting.",
          ],
        },
        {
          heading: "Rôle de TwoCards",
          body: [
            "TwoCards agit comme intermédiaire technique et n'est partie ni au contrat de restauration ou d'accueil conclu entre l'établissement et le client final, ni au contrat commercial entre l'établissement et l'apporteur, dont il assure la traçabilité.",
            "Pendant la phase pilote, l'acompte éventuel est encaissé directement pour le compte de l'établissement via son propre contrat marchand ; TwoCards ne détient pas les fonds et ne conserve aucune donnée de carte bancaire.",
          ],
        },
        {
          heading: "Litiges",
          body: [
            "Tout litige relatif à une réservation ou à une commission est traité via le centre de litiges de la plateforme, sur la base du journal horodaté (demande, confirmation, check-in, facture, commission). Les pièces et échanges y sont conservés de manière auditable.",
          ],
        },
        {
          heading: "Droit applicable",
          body: [
            "Les présentes conditions sont régies par le droit marocain. À défaut de résolution amiable, tout différend sera soumis aux tribunaux compétents de [ville], Maroc.",
          ],
        },
      ]}
    />
  );
}
