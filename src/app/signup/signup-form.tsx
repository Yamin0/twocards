"use client";

import type { Translate } from "@/lib/i18n";
import {
  AUTH_PHOTO,
} from "@/components/landing/auth-shell";

/* Demande d'accès : métiers proposés, champs par métier et contrôles de
   saisie. Les valeurs envoyées à Supabase sont celles d'origine. */

export type Kind = "hotel" | "etablissement" | "concierge" | "influenceur";
export type Step = 1 | 2 | 3;

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
   plus : c'est un métier à part, choisi au premier écran. Les valeurs
   envoyées pour les autres types sont inchangées. */
export const getVenueTypes = (t: Translate) =>
  [
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
  ] as const;

export const getConciergeTypes = (t: Translate) =>
  [
    { value: "hotel", label: t("Concierge d'hôtel", "Hotel concierge") },
    { value: "private", label: t("Conciergerie privée", "Private concierge") },
    { value: "rp", label: t("RP / promoteur", "PR / promoter") },
  ] as const;

export const getAudienceSizes = (t: Translate) =>
  [
    { value: "lt10k", label: t("Moins de 10 k", "Under 10k") },
    { value: "10-50k", label: t("10 à 50 k", "10k–50k") },
    { value: "50-200k", label: t("50 à 200 k", "50k–200k") },
    { value: "gt200k", label: t("Plus de 200 k", "Over 200k") },
  ] as const;

export const getStep2 = (t: Translate): Record<Kind, { title: string; intro: string }> => ({
  hotel: {
    title: t("Votre hôtel", "Your hotel"),
    intro: t("Pour préparer vos QR codes et votre espace.", "So we can prepare your QR codes and your workspace."),
  },
  etablissement: {
    title: t("Votre établissement", "Your venue"),
    intro: t("Ce que les clients verront dans le menu des hôtels.", "What guests will see in the hotels’ menu."),
  },
  concierge: {
    title: t("Votre activité", "Your work"),
    intro: t("Pour vous présenter aux établissements du réseau.", "So we can introduce you to venues in the network."),
  },
  influenceur: {
    title: t("Votre audience", "Your audience"),
    intro: t("Pour vous proposer les adresses qui lui ressemblent.", "So we can suggest places that suit your audience."),
  },
});

/* Ramène toute saisie à l'identifiant seul : « @Karim », « Karim » ou une URL
   de profil collée donnent tous « karim ». Normaliser à l'envoi plutôt qu'à
   la frappe évite de déplacer le curseur pendant que l'utilisateur écrit. */
export function normalizeInstagram(raw: string): string | null {
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
  return handle || null;
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/* Identifiant Instagram : lettres, chiffres, points et tirets bas, 30 au plus. */
export const INSTAGRAM = /^[a-z0-9._]{1,30}$/;

export type FormState = {
  venueName: string;
  city: string;
  rooms: string;
  organization: string;
  instagram: string;
  fullname: string;
  email: string;
  phone: string;
  password: string;
};
export type FieldName = keyof FormState;
export type Errors = Partial<Record<FieldName, string>>;

/* Ordre des champs à l'écran : sert à poser le focus sur la première erreur. */
export const FIELD_IDS: [FieldName, string][] = [
  ["venueName", "venue-name"],
  ["city", "city"],
  ["rooms", "rooms"],
  ["organization", "organization"],
  ["instagram", "instagram"],
  ["fullname", "fullname"],
  ["email", "email"],
  ["phone", "phone"],
  ["password", "password"],
];

export function validateDetails(kind: Kind, form: FormState, t: Translate): Errors {
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

export function validateAccount(form: FormState, t: Translate): Errors {
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

export function Choices<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-[14px] font-medium">
        {label}
        {hint && <span className="text-[13px] font-normal text-[var(--landing-mute)]">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="inline-block rounded-full border border-black/20 bg-white px-4 py-2 text-[14px] text-[var(--landing-ink)]/80 transition-colors hover:border-black/40 peer-checked:border-[var(--landing-ink)] peer-checked:bg-[var(--landing-ink)] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--landing-ink)] peer-focus-visible:ring-offset-2">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
