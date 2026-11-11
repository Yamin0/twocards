/* Ce qui part vers Supabase à la création du compte. Fichier sans import
   exécutable : il se charge tel quel dans Node pour être comparé à
   l'ancienne version (REFONTE/outils/signup-payload.mjs).

   Les clés et les valeurs sont celles d'origine. Les influenceurs ont un
   compte concierge (même espace, même lien de réservation) : leur profil est
   noté à part dans `signup_profile`. La base n'accepte que etablissement /
   hotel / concierge (sync_role_to_app_metadata). */

export type Kind = "hotel" | "etablissement" | "concierge" | "influenceur";

export const KIND_VALUES: readonly Kind[] = ["hotel", "etablissement", "concierge", "influenceur"];

export type VenueType =
  | "restaurant"
  | "rooftop"
  | "club"
  | "lounge"
  | "bar"
  | "beach-club"
  | "activite"
  | "service";
export type ConciergeType = "hotel" | "private" | "rp";
export type AudienceSize = "lt10k" | "10-50k" | "50-200k" | "gt200k";

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

export type ChoiceState = {
  venueType: VenueType;
  conciergeType: ConciergeType | null;
  audienceSize: AudienceSize | null;
};

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

/* Argument de `supabase.auth.signUp`. `origin` est `window.location.origin`. */
export function buildSignUp(kind: Kind, form: FormState, choices: ChoiceState, origin: string) {
  const hasVenue = kind === "hotel" || kind === "etablissement";
  return {
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.fullname,
        phone: form.phone,
        instagram: normalizeInstagram(form.instagram),
        role: kind === "influenceur" ? "concierge" : kind,
        signup_profile: kind,
        venue_name: hasVenue ? form.venueName : null,
        venue_type: kind === "etablissement" ? choices.venueType : null,
        city: hasVenue ? form.city : null,
        rooms_count: kind === "hotel" && form.rooms ? Number(form.rooms) : null,
        organization: kind === "concierge" ? form.organization.trim() || null : null,
        concierge_type: kind === "concierge" ? choices.conciergeType : null,
        audience_size: kind === "influenceur" ? choices.audienceSize : null,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  };
}
