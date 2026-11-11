import type { Translate } from "@/lib/i18n";
import { normalizeInstagram, type FormState, type Kind } from "./signup-payload";

/* Contrôles de saisie de la demande d'accès : un message par champ. Les
   règles sont celles des deux anciens écrans (« métier » puis « compte »),
   appliquées ensemble maintenant que le formulaire tient sur un écran. */

export type FieldName = keyof FormState;
export type Errors = Partial<Record<FieldName, string>>;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* Identifiant Instagram : lettres, chiffres, points et tirets bas, 30 au plus. */
export const INSTAGRAM = /^[a-z0-9._]{1,30}$/;

export const FIELD_ID: Record<FieldName, string> = {
  venueName: "venue-name",
  city: "city",
  rooms: "rooms",
  organization: "organization",
  instagram: "instagram",
  fullname: "fullname",
  email: "email",
  phone: "phone",
  password: "password",
};

/* Champs facultatifs de chaque métier, rangés derrière « Ajouter… ». */
export const OPTIONAL_FIELDS: Record<Kind, readonly FieldName[]> = {
  hotel: ["rooms", "instagram", "phone"],
  etablissement: ["instagram", "phone"],
  concierge: ["organization", "instagram", "phone"],
  influenceur: ["phone"],
};

/* Ordre des champs à l'écran, par métier : sert à poser le focus sur la
   première erreur. Les obligatoires d'abord, les facultatifs ensuite. */
export const FIELD_ORDER: Record<Kind, readonly FieldName[]> = {
  hotel: ["venueName", "city", "fullname", "email", "password", ...OPTIONAL_FIELDS.hotel],
  etablissement: ["venueName", "city", "fullname", "email", "password", ...OPTIONAL_FIELDS.etablissement],
  concierge: ["fullname", "email", "password", ...OPTIONAL_FIELDS.concierge],
  influenceur: ["instagram", "fullname", "email", "password", ...OPTIONAL_FIELDS.influenceur],
};

function validateDetails(kind: Kind, form: FormState, t: Translate): Errors {
  const errors: Errors = {};
  if (kind === "hotel" || kind === "etablissement") {
    if (!form.venueName.trim()) {
      errors.venueName =
        kind === "hotel"
          ? t("Indiquez le nom de votre hôtel.", "Enter the name of your hotel.")
          : t("Indiquez le nom de votre établissement.", "Enter the name of your venue.");
    }
    if (!form.city.trim()) {
      errors.city = t("Indiquez votre ville.", "Enter your city.");
    }
  }
  if (kind === "hotel" && form.rooms.trim()) {
    const rooms = Number(form.rooms);
    if (!Number.isInteger(rooms) || rooms < 1) {
      errors.rooms = t("Indiquez un nombre entier, 1 ou plus.", "Enter a whole number, 1 or more.");
    }
  }
  const handle = normalizeInstagram(form.instagram);
  if (kind === "influenceur" && !handle) {
    errors.instagram = t("Indiquez votre compte Instagram.", "Enter your Instagram account.");
  } else if (handle && !INSTAGRAM.test(handle)) {
    errors.instagram = t(
      "Ce nom de compte ne semble pas valide. Exemple : @nom_du_compte",
      "This account name doesn't look valid. Example: @account_name",
    );
  }
  return errors;
}

function validateAccount(form: FormState, t: Translate): Errors {
  const errors: Errors = {};
  if (form.fullname.trim().length < 2) {
    errors.fullname = t("Indiquez votre nom complet.", "Enter your full name.");
  }
  const email = form.email.trim();
  if (!email) {
    errors.email = t("Indiquez votre e-mail.", "Enter your email.");
  } else if (!EMAIL.test(email)) {
    errors.email = t("Cette adresse e-mail ne semble pas valide.", "This email address doesn't look valid.");
  }
  if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 8) {
    errors.phone = t(
      "Ce numéro semble incomplet. Exemple : +212 6 12 34 56 78",
      "This number looks incomplete. Example: +212 6 12 34 56 78",
    );
  }
  if (form.password.length < 8) {
    errors.password = t(
      "Le mot de passe doit contenir au moins 8 caractères.",
      "Your password must be at least 8 characters long.",
    );
  }
  return errors;
}

export function validateSignup(kind: Kind, form: FormState, t: Translate): Errors {
  return { ...validateDetails(kind, form, t), ...validateAccount(form, t) };
}

/* Premier champ en erreur, dans l'ordre de l'écran. */
export function firstInvalid(kind: Kind, errors: Errors): FieldName | undefined {
  return FIELD_ORDER[kind].find((name) => errors[name]);
}
