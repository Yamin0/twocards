import type { Metadata } from "next";
import { LegalArticle } from "@/components/landing/legal-article";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("twocards. | Conditions générales d'utilisation", "twocards. | Terms of use"),
    robots: { index: false },
  };
}

export default async function CguPage() {
  const t = await getT();
  return (
    <LegalArticle
      label={t("Juridique", "Legal")}
      title={t("Conditions générales d'utilisation", "Terms of use")}
      updated={t("31 juillet 2026", "31 July 2026")}
      sections={[
        {
          heading: t("Objet", "Purpose"),
          body: [
            t(
              "TwoCards est une plateforme B2B qui met en relation des établissements (restaurants, rooftops, clubs, hôtels, riads) et des apporteurs d'affaires vérifiés (conciergeries, concierges, RP, influenceurs), et qui trace le cycle complet d'une réservation : demande, confirmation, acompte, check-in, facture vérifiée, commission.",
              "TwoCards is a B2B platform that connects venues (restaurants, rooftops, clubs, hotels, riads) with verified business referrers (concierge services, concierges, PRs, influencers), and that tracks the full life cycle of a reservation: request, confirmation, deposit, check-in, verified invoice, commission.",
            ),
            t(
              "Les présentes conditions régissent l'accès et l'utilisation de la plateforme par tout utilisateur professionnel.",
              "These terms govern access to and use of the platform by any professional user.",
            ),
          ],
        },
        {
          heading: t("Comptes et vérification", "Accounts and verification"),
          body: [
            t(
              "L'accès au réseau est réservé aux professionnels. Chaque compte fait l'objet d'une vérification (KYB/KYC) avant activation. L'utilisateur garantit l'exactitude des informations fournies et la confidentialité de ses identifiants.",
              "Access to the network is restricted to professionals. Each account is subject to verification (KYB/KYC) before activation. Users warrant the accuracy of the information they provide and the confidentiality of their login credentials.",
            ),
            t(
              "TwoCards peut suspendre tout compte en cas de manquement aux présentes conditions, de fraude, d'auto-référencement ou de non-paiement répété des commissions dues.",
              "TwoCards may suspend any account in the event of a breach of these terms, fraud, self-referral or repeated non-payment of commissions due.",
            ),
          ],
        },
        {
          heading: t("Règles de commission", "Commission rules"),
          body: [
            t(
              "Les conditions de commission (montant fixe ou pourcentage, base de calcul, dépenses exclues, bénéficiaire, délai de paiement) sont définies par l'établissement et acceptées par l'apporteur avant toute réservation. Elles font foi pour l'ensemble du cycle.",
              "Commission terms (fixed amount or percentage, calculation basis, excluded spending, beneficiary, payment period) are set by the venue and accepted by the referrer before any reservation. They are binding for the entire cycle.",
            ),
            t(
              "La commission n'est due que sur le revenu vérifié : synchronisation système, justificatif documentaire ou validation mutuelle. Lorsque la politique de l'employeur d'un apporteur interdit les commissions individuelles, la rémunération peut être redirigée ou remplacée par une simple attribution avec reporting.",
              "Commission is only due on verified revenue: system synchronisation, supporting documentation or mutual validation. Where a referrer's employer policy prohibits individual commissions, the remuneration may be redirected or replaced by attribution with reporting only.",
            ),
          ],
        },
        {
          heading: t("Rôle de TwoCards", "Role of TwoCards"),
          body: [
            t(
              "TwoCards agit comme intermédiaire technique et n'est partie ni au contrat de restauration ou d'accueil conclu entre l'établissement et le client final, ni au contrat commercial entre l'établissement et l'apporteur, dont il assure la traçabilité.",
              "TwoCards acts as a technical intermediary and is not a party either to the dining or hospitality contract concluded between the venue and the end customer, or to the commercial agreement between the venue and the referrer, the traceability of which it provides.",
            ),
            t(
              "Pendant la phase pilote, l'acompte éventuel est encaissé directement pour le compte de l'établissement via son propre contrat marchand ; TwoCards ne détient pas les fonds et ne conserve aucune donnée de carte bancaire.",
              "During the pilot phase, any deposit is collected directly on behalf of the venue through its own merchant agreement; TwoCards does not hold the funds and does not store any payment card data.",
            ),
          ],
        },
        {
          heading: t("Litiges", "Disputes"),
          body: [
            t(
              "Tout litige relatif à une réservation ou à une commission est traité via le centre de litiges de la plateforme, sur la base du journal horodaté (demande, confirmation, check-in, facture, commission). Les pièces et échanges y sont conservés de manière auditable.",
              "Any dispute relating to a reservation or a commission is handled through the platform's dispute centre, on the basis of the time-stamped log (request, confirmation, check-in, invoice, commission). Documents and exchanges are kept there in an auditable manner.",
            ),
          ],
        },
        {
          heading: t("Droit applicable", "Governing law"),
          body: [
            t(
              "Les présentes conditions sont régies par le droit marocain. À défaut de résolution amiable, tout différend sera soumis aux tribunaux compétents de [ville], Maroc.",
              "These terms are governed by Moroccan law. Failing an amicable settlement, any dispute shall be submitted to the competent courts of [city], Morocco.",
            ),
          ],
        },
      ]}
    />
  );
}
