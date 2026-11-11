import type { Translate } from "@/lib/i18n";

/* Libellés partagés par les onglets des réglages. */

export type SettingsTab = "profil" | "etablissement" | "notifications" | "securite";

export const managedNote = (t: Translate) =>
  t(
    "Géré par twocards, contactez le support pour le modifier.",
    "Managed by twocards. Contact support to change it."
  );

/* La clé (valeur de venue_type en base) n'est jamais traduite : seul le
   libellé affiché suit la langue. */
export const venueTypeLabel = (type: string, t: Translate): string => {
  const labels: Record<string, string> = {
    restaurant: "Restaurant",
    bar: "Bar",
    club: "Club",
    "restaurant-bar": t("Restaurant-Bar", "Restaurant & bar"),
    lounge: "Lounge",
    rooftop: "Rooftop",
    "beach-club": "Beach club",
    "hotel-riad": t("Hôtel / Riad", "Hotel / Riad"),
    activite: t("Activité", "Activity"),
    service: "Service",
  };
  return labels[type] ?? type;
};

export const deleteMailto = (t: Translate) =>
  `mailto:support@twocards.io?subject=${encodeURIComponent(
    t("Suppression de compte", "Account deletion")
  )}&body=${encodeURIComponent(
    t(
      "Bonjour,\n\nJe souhaite supprimer mon compte twocards ainsi que les données associées.\n\nMerci.",
      "Hello,\n\nI would like to delete my twocards account and the associated data.\n\nThank you."
    )
  )}`;
