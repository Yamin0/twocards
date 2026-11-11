import type { Translate } from "@/lib/i18n";

/* Les RPC publiques de réservation lèvent des messages français stables
   (supabase/schema.sql, 20260924120000_security_hardening). On les range par
   cause pour dire au client quoi faire, plutôt qu'un « Réessayez » qui, pour
   la limite de débit, prolonge justement le blocage. */

export type BookingErrorKind =
  | "rate"
  | "date"
  | "unavailable"
  | "name"
  | "phone"
  | "length"
  | "closed"
  | "network"
  | "unknown";

type RpcError = { message?: string | null; code?: string | null } | null | undefined;

const NETWORK = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|aborted/i;

/** Vrai quand la requête n'a obtenu aucune réponse du serveur. */
export function isNetworkError(error: RpcError) {
  if (!error) return false;
  if (!error.code && NETWORK.test(error.message ?? "")) return true;
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function bookingErrorKind(error: RpcError): BookingErrorKind {
  const message = error?.message ?? "";
  if (message.includes("Trop de demandes")) return "rate";
  if (message.includes("Date invalide")) return "date";
  if (message.includes("Adresse indisponible")) return "unavailable";
  if (message.includes("Nom invalide")) return "name";
  if (message.includes("Téléphone invalide")) return "phone";
  if (message.includes("Champ trop long")) return "length";
  /* « QR code introuvable ou inactif », « Portail introuvable ou désactivé ». */
  if (message.includes("introuvable")) return "closed";
  if (isNetworkError(error)) return "network";
  return "unknown";
}

/** Message affiché au client pour une cause donnée. `desk` nomme vers qui se
    tourner : la réception (menu QR) ou l'établissement (portail direct). */
export function bookingErrorMessage(kind: BookingErrorKind, t: Translate, desk: "reception" | "venue"): string {
  const fallback =
    desk === "reception"
      ? t("contactez la réception", "contact reception")
      : t("appelez directement l'établissement", "call the venue directly");
  switch (kind) {
    case "rate":
      return t(
        `Vous avez déjà envoyé plusieurs demandes. Patientez une dizaine de minutes avant d'en envoyer une autre, ou ${fallback}.`,
        `You have already sent several requests. Please wait about ten minutes before sending another, or ${fallback}.`
      );
    case "date":
      return t(
        "Cette date n'est plus réservable. Revenez à l'étape précédente et choisissez un autre jour.",
        "This date can no longer be booked. Go back one step and choose another day."
      );
    case "unavailable":
      return t(
        `Cette adresse n'est plus proposée. Choisissez-en une autre, ou ${fallback}.`,
        `This place is no longer available. Please choose another one, or ${fallback}.`
      );
    case "name":
      return t("Indiquez votre nom (120 caractères au plus).", "Please enter your name (120 characters at most).");
    case "phone":
      return t(
        "Indiquez un numéro de téléphone où vous joindre (40 caractères au plus).",
        "Please enter a phone number where you can be reached (40 characters at most)."
      );
    case "length":
      return t(
        "Votre message est trop long. Raccourcissez la précision et renvoyez la demande.",
        "Your message is too long. Please shorten your note and send again."
      );
    case "closed":
      return desk === "reception"
        ? t(
            "Ce QR code n'est plus actif. Adressez-vous à la réception.",
            "This QR code is no longer active. Please ask at reception."
          )
        : t(
            "Ce portail de réservation n'est plus actif. Appelez directement l'établissement.",
            "This booking page is no longer active. Please call the venue directly."
          );
    case "network":
      return t(
        "Pas de connexion. Vérifiez votre réseau puis réessayez : rien n'a été envoyé.",
        "No connection. Check your network and try again: nothing was sent."
      );
    default:
      return t(
        `Votre demande n'a pas pu être envoyée. Réessayez, ou ${fallback}.`,
        `Your request could not be sent. Please try again, or ${fallback}.`
      );
  }
}
