import type { Translate } from "@/lib/i18n";

/* Qui partage le menu client `/s/<code>` : un hôtel (QR en chambre, au
   lobby) ou un concierge / RP / influenceur (lien partagé, QR personnel).
   Les deux possèdent les mêmes tables (`hotel_qr_codes`, `hotel_profiles`) ;
   seul le vocabulaire change à l'écran.

   `qr_get_menu` renvoie le rôle du propriétaire dans `owner_role` depuis la
   migration 20261112100000_menu_role_du_proprietaire. Tant qu'elle n'est pas
   lancée, la colonne est absente : on retombe sur « hôtel », c'est-à-dire
   exactement l'écran d'avant. Tout rôle autre que « concierge » (hôtel,
   admin, valeur inconnue) garde aussi le vocabulaire de l'hôtel. */

export type HostKind = "hotel" | "concierge";

export function hostKind(role: unknown): HostKind {
  return role === "concierge" ? "concierge" : "hotel";
}

export type HostWords = {
  /* Grand titre quand le profil n'a pas de nom (ni `?h=` des anciens QR). */
  fallbackName: string;
  /* Dernière mention sous le titre : « Sélection de l'hôtel ». */
  curatedBy: string;
  /* Pastille posée sur une adresse maison, dans la liste. */
  pickBadge: string;
  /* Bouton WhatsApp du pied de page et de l'écran « menu désactivé ». */
  contactCta: string;
  /* Début du message WhatsApp pré-rempli. */
  greeting: string;
  /* Écran « Ce menu n'est plus disponible ». */
  inactiveText: string;
  /* Menu vide : vers qui se tourner. */
  emptyHint: string;
  /* Vers qui orienter le client dans les messages d'erreur de réservation. */
  desk: "reception" | "host";
};

/** Vocabulaire du menu client. `name` est le nom saisi dans le profil (ou
    `?h=`), `null` s'il n'y en a pas. Pour un hôtel, les textes sont ceux
    affichés jusqu'ici, mot pour mot. */
export function hostWords(kind: HostKind, name: string | null, t: Translate): HostWords {
  if (kind === "hotel") {
    const shown = name ?? t("Votre hôtel", "Your hotel");
    return {
      fallbackName: t("Votre hôtel", "Your hotel"),
      curatedBy: t("Sélection de l'hôtel", "Curated by the hotel"),
      pickBadge: t("Par l'hôtel", "Hotel pick"),
      contactCta: t("Écrire à la réception", "Message reception"),
      greeting: t(`Bonjour ${shown}, `, `Hello ${shown}, `),
      inactiveText: t(
        "Ce QR code a été désactivé par l'hôtel. Adressez-vous à la réception pour réserver vos sorties.",
        "This QR code has been deactivated by the hotel. Please ask at reception to book your outings."
      ),
      emptyHint: t("Adressez-vous à la réception.", "Please ask at reception."),
      desk: "reception",
    };
  }
  /* Concierge : ni hôtel ni réception. Le nom n'est repris que s'il existe,
     sinon des tournures neutres (« la personne qui vous a partagé ce lien »). */
  return {
    fallbackName: t("Votre sélection", "Your selection"),
    curatedBy: name ? t(`Sélection de ${name}`, `Curated by ${name}`) : t("Sélection sur mesure", "Hand-picked selection"),
    pickBadge: t("Coup de cœur", "Top pick"),
    contactCta: name ? t(`Écrire à ${name}`, `Message ${name}`) : t("Envoyer un message", "Send a message"),
    greeting: name ? t(`Bonjour ${name}, `, `Hello ${name}, `) : t("Bonjour, ", "Hello, "),
    inactiveText: t(
      "Ce lien a été désactivé. Pour réserver vos sorties, contactez la personne qui vous l'a partagé.",
      "This link has been deactivated. To book your outings, contact the person who shared it with you."
    ),
    emptyHint: t(
      "Revenez un peu plus tard, ou contactez la personne qui vous a partagé ce lien.",
      "Check back a little later, or contact the person who shared this link with you."
    ),
    desk: "host",
  };
}
