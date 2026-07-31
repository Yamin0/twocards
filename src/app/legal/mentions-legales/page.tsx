import type { Metadata } from "next";
import { LegalArticle } from "@/components/landing/legal-article";

export const metadata: Metadata = {
  title: "twocards. | Mentions légales",
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <LegalArticle
      label="Juridique"
      title="Mentions légales"
      updated="31 juillet 2026"
      sections={[
        {
          heading: "Éditeur du site",
          body: [
            "Le site twocardspro.com est édité par [Raison sociale de la société], société [forme juridique] au capital de [montant] MAD, immatriculée au registre du commerce de [ville] sous le numéro [RC], dont le siège social est situé [adresse complète], Maroc.",
            "Identifiant fiscal : [IF] — ICE : [ICE] — Directeur de la publication : [nom du représentant légal].",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Pour toute question relative au site ou au service : contact@twocardspro.com.",
          ],
        },
        {
          heading: "Hébergement",
          body: [
            "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com).",
            "Les données applicatives sont hébergées par Supabase Inc. (supabase.com).",
          ],
        },
        {
          heading: "Propriété intellectuelle",
          body: [
            "L'ensemble des éléments composant le site (textes, graphismes, logos, interfaces, logiciels) est la propriété exclusive de [Raison sociale] ou de ses partenaires, et est protégé par la législation applicable en matière de propriété intellectuelle.",
            "Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation écrite préalable est interdite.",
          ],
        },
        {
          heading: "Responsabilité",
          body: [
            "TwoCards met en relation des établissements et des apporteurs d'affaires vérifiés. Les prestations de restauration, d'accueil et d'événementiel restent de la responsabilité exclusive des établissements concernés.",
            "TwoCards s'efforce d'assurer l'exactitude des informations publiées (disponibilités, conditions, commissions) sans pouvoir garantir l'absence d'erreur ; chaque réservation fait foi par son journal horodaté.",
          ],
        },
      ]}
    />
  );
}
