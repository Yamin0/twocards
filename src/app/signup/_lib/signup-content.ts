import type { Translate } from "@/lib/i18n";
import { AUTH_PHOTO } from "@/components/landing/auth-shell";
import type { AudienceSize, ConciergeType, Kind, VenueType } from "./signup-payload";

/* Textes et listes de la demande d'accès : les quatre métiers, les choix
   proposés et l'en-tête du formulaire. Seuls les libellés sont traduits ;
   les valeurs envoyées restent celles d'origine. */

export const getKinds = (
  t: Translate,
): {
  value: Kind;
  label: string;
  line: string;
  image: string;
  caption: string;
}[] => [
  {
    value: "hotel",
    label: t("Hôtel ou riad", "Hotel or riad"),
    line: t("Un QR en chambre, vos clients réservent seuls.", "A QR code in every room, guests book on their own."),
    image: AUTH_PHOTO("photo-1759472659432-3232e42d04d2"),
    caption: t(
      "Chaque sortie de vos clients est rattachée à votre maison.",
      "Every outing your guests book is credited to your property.",
    ),
  },
  {
    value: "etablissement",
    label: t("Établissement", "Venue"),
    line: t("Restaurant, rooftop, club, activité.", "Restaurant, rooftop, club, activity."),
    image: AUTH_PHOTO("photo-1672832593966-fe1795b8d287"),
    caption: t(
      "Des clients d'hôtels à votre porte, vous payez au résultat.",
      "Hotel guests at your door, and you only pay for results.",
    ),
  },
  {
    value: "concierge",
    label: t("Concierge ou RP", "Concierge or PR"),
    line: t("Vos recommandations, suivies et rémunérées.", "Your recommendations, tracked and rewarded."),
    image: AUTH_PHOTO("photo-1660557989695-14fac79c086d"),
    caption: t(
      "Vous savez quand votre client arrive, la commission suit.",
      "You know when your guest arrives, and the commission follows.",
    ),
  },
  {
    value: "influenceur",
    label: t("Créateur de contenu", "Content creator"),
    line: t("Un lien unique pour toute votre sélection.", "One link for your whole selection."),
    image: AUTH_PHOTO("photo-1672831744471-fb82fd8fa2e0"),
    caption: t(
      "Chaque réservation issue de vos contenus vous est attribuée.",
      "Every reservation that comes from your content is credited to you.",
    ),
  },
];

export const DEFAULT_IMAGE = AUTH_PHOTO("photo-1647878501041-1609141a7fb1");

/* Types de lieu proposés à un établissement. « Hôtel / Riad » n'y figure
   pas : c'est un métier à part, choisi au premier écran. */
export const getVenueTypes = (t: Translate): readonly { value: VenueType; label: string }[] => [
  { value: "restaurant", label: "Restaurant" },
  { value: "rooftop", label: "Rooftop" },
  { value: "club", label: "Club" },
  { value: "lounge", label: "Lounge" },
  { value: "bar", label: "Bar" },
  { value: "beach-club", label: "Beach club" },
  /* Activité (quad, hammam, excursion…) ou service (chauffeur,
     photographe…) : l'espace montre des prestations, pas des tables. */
  { value: "activite", label: t("Activité", "Activity") },
  { value: "service", label: "Service" },
];

export const getConciergeTypes = (t: Translate): readonly { value: ConciergeType; label: string }[] => [
  { value: "hotel", label: t("Concierge d'hôtel", "Hotel concierge") },
  { value: "private", label: t("Conciergerie privée", "Private concierge") },
  { value: "rp", label: t("RP / promoteur", "PR / promoter") },
];

export const getAudienceSizes = (t: Translate): readonly { value: AudienceSize; label: string }[] => [
  { value: "lt10k", label: t("Moins de 10 k", "Under 10k") },
  { value: "10-50k", label: t("10 à 50 k", "10k–50k") },
  { value: "50-200k", label: t("50 à 200 k", "50k–200k") },
  { value: "gt200k", label: t("Plus de 200 k", "Over 200k") },
];

/* En-tête du formulaire, par métier : le titre de l'écran, sa phrase
   d'introduction, le nom du groupe de champs propre au métier (absent pour
   un concierge, qui n'a que des champs facultatifs) et le libellé du bouton
   qui déplie les champs facultatifs. */
export const getFormCopy = (
  t: Translate,
): Record<Kind, { title: string; intro: string; group: string | null; more: string }> => ({
  hotel: {
    title: t("Inscrire votre hôtel", "Register your hotel"),
    intro: t(
      "De quoi préparer vos QR codes, et les identifiants avec lesquels vous vous connecterez.",
      "What we need to prepare your QR codes, and the details you’ll log in with.",
    ),
    group: t("Votre hôtel", "Your hotel"),
    more: t("Ajouter le nombre de chambres, Instagram, un téléphone", "Add number of rooms, Instagram, a phone number"),
  },
  etablissement: {
    title: t("Inscrire votre établissement", "Register your venue"),
    intro: t(
      "Ce que les clients verront dans le menu des hôtels, et vos identifiants de connexion.",
      "What guests will see in the hotels’ menu, and the details you’ll log in with.",
    ),
    group: t("Votre établissement", "Your venue"),
    more: t("Ajouter Instagram, un téléphone", "Add Instagram, a phone number"),
  },
  concierge: {
    title: t("Créer votre compte concierge", "Create your concierge account"),
    intro: t(
      "Les identifiants avec lesquels vous vous connecterez. Le reste se complète plus tard.",
      "The details you’ll log in with. The rest can be added later.",
    ),
    group: null,
    more: t("Ajouter votre activité, Instagram, un téléphone", "Add what you do, Instagram, a phone number"),
  },
  influenceur: {
    title: t("Créer votre compte créateur", "Create your creator account"),
    intro: t(
      "Votre compte Instagram, pour vous proposer les adresses qui lui ressemblent, et vos identifiants de connexion.",
      "Your Instagram account, so we can suggest places that suit it, and the details you’ll log in with.",
    ),
    group: t("Votre audience", "Your audience"),
    more: t("Ajouter votre nombre d'abonnés, un téléphone", "Add your follower count, a phone number"),
  },
});
