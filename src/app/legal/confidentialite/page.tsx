import type { Metadata } from "next";
import { LegalArticle } from "@/components/landing/legal-article";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("twocards. | Politique de confidentialité", "twocards. | Privacy policy"),
    robots: { index: false },
  };
}

export default async function ConfidentialitePage() {
  const t = await getT();
  return (
    <LegalArticle
      label={t("Juridique", "Legal")}
      title={t("Politique de confidentialité", "Privacy policy")}
      updated={t("31 juillet 2026", "31 July 2026")}
      sections={[
        {
          heading: t("Responsable de traitement", "Data controller"),
          body: [
            t(
              "[Raison sociale], éditrice de TwoCards, est responsable du traitement des données collectées via la plateforme, conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, et, le cas échéant, au RGPD pour les utilisateurs situés dans l'Union européenne.",
              "[Company name], publisher of TwoCards, is the controller of the data collected through the platform, in accordance with Moroccan Law No. 09-08 on the protection of individuals with regard to the processing of personal data and, where applicable, the GDPR for users located in the European Union.",
            ),
            t(
              "Les traitements font l'objet des déclarations requises auprès de la CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel).",
              "The processing operations are subject to the required declarations to the CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel).",
            ),
          ],
        },
        {
          heading: t("Données collectées", "Data collected"),
          body: [
            t(
              "Comptes professionnels : identité, coordonnées, rôle (établissement ou apporteur), établissement de rattachement, données de vérification (KYB/KYC).",
              "Professional accounts: identity, contact details, role (venue or referrer), affiliated venue, verification data (KYB/KYC).",
            ),
            t(
              "Réservations : identité ou alias du client final, nombre de couverts, horaires, demandes particulières (dont, le cas échéant, allergies communiquées volontairement), montants d'acompte et de facture vérifiée.",
              "Reservations: identity or alias of the end customer, number of covers, times, special requests (including, where applicable, allergies voluntarily disclosed), deposit and verified invoice amounts.",
            ),
            t(
              "Données techniques : journaux de connexion et d'audit horodatés, nécessaires à la traçabilité des réservations et des commissions.",
              "Technical data: time-stamped connection and audit logs, required for the traceability of reservations and commissions.",
            ),
          ],
        },
        {
          heading: t("Finalités", "Purposes"),
          body: [
            t(
              "Mise en relation entre établissements et apporteurs vérifiés ; gestion des réservations, du check-in, des factures vérifiées et des commissions ; prévention de la fraude et des litiges ; obligations comptables et légales.",
              "Connecting venues with verified referrers; managing reservations, check-in, verified invoices and commissions; preventing fraud and disputes; accounting and legal obligations.",
            ),
            t(
              "Aucune utilisation commerciale des données à des fins de prospection n'est effectuée sans consentement explicite.",
              "No commercial use of the data for marketing purposes is made without explicit consent.",
            ),
          ],
        },
        {
          heading: t("Confidentialité des portefeuilles clients", "Confidentiality of client portfolios"),
          body: [
            t(
              "Les coordonnées des clients d'un apporteur sont masquées par défaut (relais de confidentialité) et ne sont révélées à l'établissement qu'après confirmation de la réservation. Les profils sensibles peuvent être traités sous alias.",
              "The contact details of a referrer's clients are masked by default (privacy relay) and are only revealed to the venue once the reservation is confirmed. Sensitive profiles may be handled under an alias.",
            ),
            t(
              "L'export des données clients par des utilisateurs non autorisés est techniquement bloqué.",
              "Export of client data by unauthorised users is technically blocked.",
            ),
          ],
        },
        {
          heading: t("Durées de conservation", "Retention periods"),
          body: [
            t(
              "Les données de réservation et les journaux d'audit sont conservés pendant la durée nécessaire à la gestion des litiges et aux obligations comptables, puis supprimés ou anonymisés. Les pièces justificatives (factures) sont expurgées des données non nécessaires puis supprimées à l'issue de la durée définie.",
              "Reservation data and audit logs are kept for as long as necessary to handle disputes and meet accounting obligations, and are then deleted or anonymised. Supporting documents (invoices) are redacted of unnecessary data and then deleted at the end of the defined period.",
            ),
          ],
        },
        {
          heading: t("Vos droits", "Your rights"),
          body: [
            t(
              "Conformément à la loi 09-08, vous disposez de droits d'accès, de rectification, d'opposition et de suppression de vos données. Pour les exercer : privacy@twocardspro.com.",
              "In accordance with Law 09-08, you have the right to access, rectify, object to and delete your data. To exercise these rights: privacy@twocardspro.com.",
            ),
            t(
              "Tout transfert de données hors du Maroc est encadré par la procédure prévue par la CNDP.",
              "Any transfer of data outside Morocco is governed by the procedure laid down by the CNDP.",
            ),
          ],
        },
        {
          heading: t("Cookies", "Cookies"),
          body: [
            t(
              "TwoCards utilise uniquement les cookies strictement nécessaires à l'authentification et au fonctionnement de la plateforme (session Supabase). Aucun cookie publicitaire ou de pistage tiers n'est déposé.",
              "TwoCards only uses cookies that are strictly necessary for authentication and for the platform to function (Supabase session). No advertising or third-party tracking cookies are set.",
            ),
          ],
        },
      ]}
    />
  );
}
