import {
  Crown,
  Flame,
  Headphones,
  Heart,
  Mic2,
  Moon,
  Music,
  Palmtree,
  PartyPopper,
  Sparkles,
  Star,
  Sun,
  Wine,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BadgeTone } from "@/components/app/ui";
import type { Translate } from "@/lib/i18n";
import {
  DEFAULT_EVENT_GRADIENT,
  type DayReservation,
  type EventDate,
  type EventStatus,
  type VenueEvent,
} from "@/hooks/use-venue-events";

/* Constantes et fonctions pures de la page Événements. */

/* Classes Tailwind enregistrées telles quelles dans venue_events.gradient :
   elles doivent rester écrites en toutes lettres ici pour être générées. */
export const GRADIENTS = [
  DEFAULT_EVENT_GRADIENT,
  "from-blue-600 to-blue-900",
  "from-emerald-600 to-teal-900",
  "from-slate-600 to-slate-900",
  "from-amber-600 to-orange-900",
  "from-rose-600 to-pink-900",
  "from-cyan-600 to-sky-900",
  "from-fuchsia-600 to-purple-900",
];

/* L'ordre est celui de venue_events.icon_idx : ne pas le changer. */
export const ICONS: LucideIcon[] = [
  Sparkles, Music, Crown, Wine, Mic2, Headphones, PartyPopper,
  Star, Flame, Heart, Zap, Sun, Moon, Palmtree,
];

export const iconLabels = (t: Translate): string[] => [
  t("Étincelles", "Sparkles"),
  t("Musique", "Music"),
  t("Couronne", "Crown"),
  t("Cocktail", "Cocktail"),
  t("Micro", "Mic"),
  t("Casque", "Headphones"),
  t("Fête", "Party"),
  t("Étoile", "Star"),
  t("Flamme", "Flame"),
  t("Cœur", "Heart"),
  t("Éclair", "Lightning"),
  t("Soleil", "Sun"),
  t("Lune", "Moon"),
  t("Palmier", "Palm tree"),
];

export const gradientLabels = (t: Translate): string[] => [
  t("Violet", "Purple"),
  t("Bleu", "Blue"),
  t("Émeraude", "Emerald"),
  t("Ardoise", "Slate"),
  t("Ambre", "Amber"),
  t("Rose", "Rose"),
  t("Cyan", "Cyan"),
  t("Fuchsia", "Fuchsia"),
];

export const HOURS = [
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30",
  "06:00", "06:30", "07:00",
];

/* Banque d'images Unsplash. Les identifiants sont ceux de photos réelles
   servies par le CDN images.unsplash.com. Pas d'appel d'API : la recherche
   Unsplash exigerait une clé d'application, absente du projet. Ajouter une
   entrée ici suffit à enrichir la galerie. */
export const UNSPLASH_PHOTOS: { id: string; alt: string; altEn: string }[] = [
  { id: "photo-1493225457124-a3eb161ffa5f", alt: "Club, jeux de lumière", altEn: "Club light show" },
  { id: "photo-1516450360452-9312f5e86fc7", alt: "Foule en concert", altEn: "Concert crowd" },
  { id: "photo-1519671482749-fd09be7ccebf", alt: "Scène et public", altEn: "Stage and audience" },
  { id: "photo-1424298397478-4bd87a6a0f0c", alt: "DJ aux platines", altEn: "DJ on the decks" },
  { id: "photo-1470224114660-3f6686c562eb", alt: "Set DJ en soirée", altEn: "Evening DJ set" },
  { id: "photo-1555396273-367ea4eb4db5", alt: "Ambiance de club", altEn: "Club atmosphere" },
  { id: "photo-1514933651103-005eec06c04b", alt: "Bar de nuit", altEn: "Late-night bar" },
  { id: "photo-1566737236500-c8ac43014a67", alt: "Cocktails au bar", altEn: "Cocktails at the bar" },
  { id: "photo-1533174072545-7a4b6ad7a6c3", alt: "Cocktail signature", altEn: "Signature cocktail" },
  { id: "photo-1492684223066-81342ee5ff30", alt: "Confettis et fête", altEn: "Confetti and celebration" },
  { id: "photo-1530103862676-de8c9debad1d", alt: "Soirée dansante", altEn: "Dance night" },
  { id: "photo-1544148103-0773bf10d330", alt: "Célébration", altEn: "Celebration" },
  { id: "photo-1517457373958-b7bdd4587205", alt: "Dîner entre convives", altEn: "Dinner with friends" },
  { id: "photo-1528605248644-14dd04022da1", alt: "Table dressée", altEn: "Table set for dinner" },
  { id: "photo-1414235077428-338989a2e8c0", alt: "Salle gastronomique", altEn: "Fine-dining room" },
  { id: "photo-1517248135467-4c7edcad34c4", alt: "Restaurant chaleureux", altEn: "Cosy restaurant" },
  { id: "photo-1552566626-52f8b828add9", alt: "Intérieur de restaurant", altEn: "Restaurant interior" },
  { id: "photo-1559339352-11d035aa65de", alt: "Service en salle", altEn: "Table service" },
  { id: "photo-1592861956120-e524fc739696", alt: "Terrasse", altEn: "Terrace" },
  { id: "photo-1551632436-cbf8dd35adfa", alt: "Rooftop au crépuscule", altEn: "Rooftop at dusk" },
  { id: "photo-1574391884720-bbc3740c59d1", alt: "Piscine et transats", altEn: "Pool and loungers" },
  { id: "photo-1470337458703-46ad1756a187", alt: "Verre au comptoir", altEn: "Drink at the counter" },
];

/* Vignette légère pour la grille, rendu large pour la couverture retenue. */
export const unsplashThumb = (id: string) =>
  `https://images.unsplash.com/${id}?q=60&w=240&h=160&auto=format&fit=crop`;
export const unsplashFull = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;

/* ─── Statuts ───────────────────────────────────────────────────────────── */

export const STATUS_TONE: Record<EventStatus, BadgeTone> = {
  Ouvert: "ok",
  "Bientôt complet": "warn",
  Fermé: "neutral",
  Brouillon: "info",
};

/** Libellé affiché d'un statut (la valeur en base reste en français). */
export function eventStatusLabel(status: EventStatus, t: Translate) {
  switch (status) {
    case "Ouvert":
      return t("Ouvert", "Open");
    case "Bientôt complet":
      return t("Bientôt complet", "Almost full");
    case "Fermé":
      return t("Fermé", "Closed");
    case "Brouillon":
      return t("Brouillon", "Draft");
    default:
      return status;
  }
}

/* ─── Dates ─────────────────────────────────────────────────────────────── */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Sam. 14 nov. » dans la langue courante ; chaîne vide sans date. */
export function formatEventDate(d: EventDate | null | undefined, intl: string) {
  if (!d) return "";
  return cap(
    new Date(d.year, d.month, d.day).toLocaleDateString(intl, {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  );
}

export function monthLabel(year: number, month: number, intl: string) {
  return cap(new Date(year, month, 1).toLocaleDateString(intl, { month: "long", year: "numeric" }));
}

/** Les sept jours, lundi d'abord, en abrégé. */
export function weekdayLabels(intl: string) {
  /* Le 1er janvier 2024 est un lundi. */
  return Array.from({ length: 7 }, (_, i) =>
    cap(new Date(2024, 0, 1 + i).toLocaleDateString(intl, { weekday: "short" }).replace(".", ""))
  );
}

/** Cases d'un mois, lundi d'abord : null pour les cases vides du début. */
export function monthCells(year: number, month: number): (number | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

export const sameDate = (a: EventDate | null | undefined, b: EventDate) =>
  Boolean(a) && a!.day === b.day && a!.month === b.month && a!.year === b.year;

/* ─── Chiffres du jour ──────────────────────────────────────────────────── */

export type DisplayEvent = VenueEvent & {
  /** Vrai quand les chiffres viennent des réservations du jour. */
  live: boolean;
};

/* Les réservations ne sont pas rattachées à un événement : ce qu'on sait
   compter, ce sont TOUTES les réservations non annulées du jour de
   l'événement. Les chiffres sont donc libellés « ce jour-là ». Sans
   réservation ce jour-là (ou sans date), les valeurs enregistrées restent. */
export function withDayCounts(
  e: VenueEvent,
  dayReservations: DayReservation[],
  intl: string
): DisplayEvent {
  if (!e.dateObj) return { ...e, live: false };
  const iso = `${e.dateObj.year}-${String(e.dateObj.month + 1).padStart(2, "0")}-${String(e.dateObj.day).padStart(2, "0")}`;
  const rows = dayReservations.filter((r) => r.reservation_date === iso);
  if (rows.length === 0) return { ...e, live: false };
  const covers = rows.reduce((sum, r) => sum + r.party_size, 0);
  const revenue = rows.reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);
  return {
    ...e,
    live: true,
    reservations: rows.length,
    spots: Math.max(0, e.totalSpots - covers),
    revenue: `${revenue.toLocaleString(intl)} MAD`,
  };
}

/** Part des places prises, de 0 à 100 ; 0 sans capacité. */
export const fillPercent = (e: VenueEvent) =>
  e.totalSpots > 0 ? Math.round(((e.totalSpots - e.spots) / e.totalSpots) * 100) : 0;

export const fillBarClass = (percent: number) =>
  percent >= 90 ? "bg-warn" : percent >= 50 ? "bg-link" : "bg-ink-4";

/* ─── Formulaire ────────────────────────────────────────────────────────── */

export type EventForm = {
  title: string;
  venue: string;
  dateObj: EventDate | null;
  timeOpen: string;
  timeClose: string;
  status: EventStatus;
  /** Genres séparés par des virgules. */
  genre: string;
  totalSpots: number;
  description: string;
  gradient: string;
  iconIdx: number;
  coverImage: string | null;
};

export function emptyForm(): EventForm {
  return {
    title: "",
    venue: "",
    dateObj: null,
    timeOpen: "",
    timeClose: "",
    status: "Brouillon",
    genre: "",
    totalSpots: 100,
    description: "",
    gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
    iconIdx: Math.floor(Math.random() * ICONS.length),
    coverImage: null,
  };
}

export function eventToForm(ev: VenueEvent): EventForm {
  const [open = "", close = ""] = ev.time.split(" - ");
  return {
    title: ev.title,
    venue: ev.venue,
    dateObj: ev.dateObj ?? null,
    timeOpen: open,
    timeClose: close,
    status: ev.status,
    genre: ev.genre.join(", "),
    totalSpots: ev.totalSpots,
    description: ev.description,
    gradient: ev.gradient,
    iconIdx: ev.iconIdx,
    coverImage: ev.coverImage,
  };
}

const formGenres = (form: EventForm) =>
  form.genre
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

const formTime = (form: EventForm) =>
  form.timeOpen && form.timeClose ? `${form.timeOpen} - ${form.timeClose}` : form.timeOpen || "";

/** Nouvel événement : compteurs à zéro, toutes les places libres. */
export function formToDraft(form: EventForm): Omit<VenueEvent, "id"> {
  return {
    title: form.title,
    venue: form.venue,
    dateObj: form.dateObj ?? undefined,
    time: formTime(form),
    status: form.status,
    genre: formGenres(form),
    gradient: form.gradient,
    iconIdx: form.iconIdx,
    coverImage: form.coverImage,
    spots: form.totalSpots,
    totalSpots: form.totalSpots,
    reservations: 0,
    revenue: "0 MAD",
    rpCount: 0,
    closed: false,
    description: form.description,
  };
}

/** Événement existant mis à jour : une date ou une heure vidée garde l'ancienne. */
export function applyForm(existing: VenueEvent, form: EventForm): VenueEvent {
  return {
    ...existing,
    title: form.title,
    venue: form.venue,
    dateObj: form.dateObj ?? existing.dateObj,
    time: formTime(form) || existing.time,
    status: form.status,
    genre: formGenres(form),
    totalSpots: form.totalSpots,
    spots: Math.max(0, form.totalSpots - existing.reservations),
    description: form.description,
    gradient: form.gradient,
    iconIdx: form.iconIdx,
    coverImage: form.coverImage,
    /* closed suit le statut choisi : modifier un titre ne rouvre pas un
       événement fermé. */
    closed: form.status === "Fermé",
  };
}
