import type { Metadata } from "next";
import { LegalArticle } from "@/components/landing/legal-article";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("twocards. | Mentions légales", "twocards. | Legal notice"),
    robots: { index: false },
  };
}

export default async function MentionsLegalesPage() {
  const t = await getT();
  return (
    <LegalArticle
      label={t("Juridique", "Legal")}
      title={t("Mentions légales", "Legal notice")}
      updated={t("31 juillet 2026", "31 July 2026")}
      sections={[
        {
          heading: t("Éditeur du site", "Website publisher"),
          body: [
            t(
              "Le site twocardspro.com est édité par [Raison sociale de la société], société [forme juridique] au capital de [montant] MAD, immatriculée au registre du commerce de [ville] sous le numéro [RC], dont le siège social est situé [adresse complète], Maroc.",
              "The website twocardspro.com is published by [Company name], a [legal form] with a share capital of [amount] MAD, registered with the Trade Register of [city] under number [RC], whose registered office is located at [full address], Morocco.",
            ),
            t(
              "Identifiant fiscal : [IF] · ICE : [ICE] · Directeur de la publication : [nom du représentant légal].",
              "Tax identification number (IF): [IF] · ICE: [ICE] · Publication director: [name of legal representative].",
            ),
          ],
        },
        {
          heading: t("Contact", "Contact"),
          body: [
            t(
              "Pour toute question relative au site ou au service : contact@twocardspro.com.",
              "For any question about the website or the service: contact@twocardspro.com.",
            ),
          ],
        },
        {
          heading: t("Hébergement", "Hosting"),
          body: [
            t(
              "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com).",
              "The website is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, United States (vercel.com).",
            ),
            t(
              "Les données applicatives sont hébergées par Supabase Inc. (supabase.com).",
              "Application data is hosted by Supabase Inc. (supabase.com).",
            ),
          ],
        },
        {
          heading: t("Propriété intellectuelle", "Intellectual property"),
          body: [
            t(
              "L'ensemble des éléments composant le site (textes, graphismes, logos, interfaces, logiciels) est la propriété exclusive de [Raison sociale] ou de ses partenaires, et est protégé par la législation applicable en matière de propriété intellectuelle.",
              "All elements making up the website (text, graphics, logos, interfaces, software) are the exclusive property of [Company name] or its partners, and are protected by applicable intellectual property law.",
            ),
            t(
              "Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation écrite préalable est interdite.",
              "Any reproduction, representation or use, in whole or in part, without prior written permission is prohibited.",
            ),
          ],
        },
        {
          heading: t("Responsabilité", "Liability"),
          body: [
            t(
              "TwoCards met en relation des établissements et des apporteurs d'affaires vérifiés. Les prestations de restauration, d'accueil et d'événementiel restent de la responsabilité exclusive des établissements concernés.",
              "TwoCards connects venues with verified business referrers. Dining, hospitality and event services remain the sole responsibility of the venues concerned.",
            ),
            t(
              "TwoCards s'efforce d'assurer l'exactitude des informations publiées (disponibilités, conditions, commissions) sans pouvoir garantir l'absence d'erreur ; chaque réservation fait foi par son journal horodaté.",
              "TwoCards strives to ensure the accuracy of the information published (availability, conditions, commissions) but cannot guarantee that it is error-free; each reservation is evidenced by its time-stamped log.",
            ),
          ],
        },
      ]}
    />
  );
}
