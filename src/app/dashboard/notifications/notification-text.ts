import type { Locale } from "@/lib/i18n";

/* Les titres et les textes des notifications sont écrits en français par
   les triggers SQL (notify_new_reservation, notify_new_rating,
   notify_pos_unmatched dans supabase/schema.sql). On ne touche ni au SQL
   ni aux lignes : en anglais, on traduit À L'AFFICHAGE les parties fixes
   des gabarits, d'après `kind`. Tout ce qui ne correspond pas au gabarit
   connu (autre `kind`, titre modifié) est rendu tel quel. */

type Template = {
  /** Titre exact écrit par le trigger, et sa traduction. */
  title: [fr: string, en: string];
  /** Traduit les parties fixes du texte ; les données du client restent. */
  body: (fr: string) => string;
};

const TEMPLATES: Record<string, Template> = {
  /* « Nom · [prestation ·] JJ/MM · [heure ·] N pers. · portail | QR hôtel » */
  reservation: {
    title: ["Nouvelle réservation", "New reservation"],
    body: (fr) =>
      fr
        .replace(/ · (\d+) pers\.(?= · |$)/, (_m, n: string) => ` · ${n} ${n === "1" ? "guest" : "guests"}`)
        .replace(/ · portail$/, " · portal")
        .replace(/ · QR hôtel$/, " · hotel QR"),
  },
  /* « Nom — N/5 · « commentaire » » */
  rating: {
    title: ["Nouvel avis client", "New guest review"],
    body: (fr) => fr.replace(/ · « ([\s\S]*) »$/, " · “$1”"),
  },
  /* « Table X · N MAD · motif » : « Table » se dit pareil, le motif vient
     de la fonction de rapprochement et reste tel quel. */
  pos: {
    title: ["Ticket caisse non rapproché", "Unmatched till ticket"],
    body: (fr) => fr,
  },
};

export function notificationText(
  n: { kind: string; title: string; body: string },
  locale: Locale
): { title: string; body: string } {
  if (locale !== "en") return { title: n.title, body: n.body };
  const template = TEMPLATES[n.kind];
  if (!template) return { title: n.title, body: n.body };
  /* Le texte n'est traduit que si le titre est bien celui du gabarit :
     sinon la ligne vient d'ailleurs, on n'y touche pas. */
  if (n.title !== template.title[0]) return { title: n.title, body: n.body };
  return { title: template.title[1], body: n.body ? template.body(n.body) : n.body };
}
