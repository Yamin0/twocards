import type { OfferDeposit } from "@/lib/booking/deposit";
/* Catalogue présenté au client de l'hôtel après un scan de QR code.

   Les adresses vivent en base : le catalogue du réseau twocards
   (catalog_offers, tenu par l'administrateur) et les adresses maison de
   l'hôtel (hotel_offers). Ce module ne fait que les ranger par catégorie,
   filtrer par ville et appliquer les choix de l'hôtel : aucune adresse n'est
   écrite ici. */

import type { Locale } from "@/lib/i18n";

export type GuestCategoryKey = "restaurants" | "activites" | "clubs" | "services";

export const CATEGORY_KEYS: GuestCategoryKey[] = ["restaurants", "activites", "clubs", "services"];

/* Photos des bandeaux : Unsplash (licence libre, usage commercial permis),
   toutes à Marrakech et dans la même lumière chaude de fin de journée.
   Un hôtel peut les remplacer par les siennes (`category_images`). */
export const CATEGORY_META: Record<
  GuestCategoryKey,
  { label: string; tagline: string; image: string }
> = {
  restaurants: {
    label: "Restaurants",
    tagline: "Tables raffinées et dîners d'exception",
    image: "/images/menu/restaurants.jpg",
  },
  activites: {
    label: "Activités",
    tagline: "Vivez le meilleur de la destination",
    image: "/images/menu/activites.jpg",
  },
  clubs: {
    label: "Clubs",
    tagline: "Les nuits les plus courues du pays",
    image: "/images/menu/clubs-nuit.jpg",
  },
  services: {
    label: "Services",
    tagline: "Une conciergerie à votre écoute",
    image: "/images/menu/services.jpg",
  },
};

/* Libellés français : ce sont aussi ceux enregistrés en base avec chaque
   réservation (p_category). Ne pas les traduire ici. */
export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_KEYS.map((k) => [k, CATEGORY_META[k].label])
) as Record<GuestCategoryKey, string>;

/* Version anglaise des textes affichés ; l'image reste celle du français. */
const CATEGORY_META_EN: Record<GuestCategoryKey, { label: string; tagline: string }> = {
  restaurants: { label: "Restaurants", tagline: "Refined tables and exceptional dinners" },
  activites: { label: "Activities", tagline: "Experience the best of the destination" },
  clubs: { label: "Clubs", tagline: "The most sought-after nights in the country" },
  services: { label: "Services", tagline: "A concierge desk at your service" },
};

/* Libellé et accroche d'une catégorie dans la langue demandée. */
export function categoryMeta(key: GuestCategoryKey, locale: Locale = "fr") {
  return locale === "en" ? { ...CATEGORY_META[key], ...CATEGORY_META_EN[key] } : CATEGORY_META[key];
}

export function categoryLabel(key: GuestCategoryKey, locale: Locale = "fr") {
  return categoryMeta(key, locale).label;
}

/* Prestation tenue par l'établissement lui-même (venue_services) : une
   balade en quad d'une heure, un transfert aéroport… Le client la choisit
   en même temps que la date. */
export type ServiceRow = {
  id: string;
  name: string;
  description?: string | null;
  duration?: string | null;
  price?: string | null;
  image_url?: string | null;
};

export type GuestService = {
  id: string;
  /* Nom affiché, traduit en anglais si l'adresse l'a été. */
  name: string;
  /* Nom tel qu'en base (français) : c'est lui qui part avec la réservation
     et qui désigne la prestation au moment du devis d'acompte. */
  baseName: string;
  description: string;
  duration: string;
  price: string;
  image?: string;
  /* Prestation à prix partenaire (voir `qr_menu_extras`) : prix affiché,
     acompte par véhicule et places par véhicule, calculés par la base. */
  clientPrice?: number;
  deposit?: number;
  seats?: number;
  /* Modèle qui regroupe les durées (« Quad 300 cc ») : le client choisit
     d'abord le modèle, puis la durée. Absent : liste simple. */
  model?: string;
  currency?: OfferDeposit["currency"];
};

/* Ligne telle que renvoyée par la base (catalog_offers, hotel_offers ou le
   JSON de qr_get_menu). */
export type OfferRow = {
  slug: string;
  category: GuestCategoryKey | string;
  name: string;
  city?: string | null;
  tag?: string | null;
  description?: string | null;
  price?: string | null;
  image_url?: string | null;
  /* Photos suivant la couverture, dans l'ordre d'affichage. */
  images?: string[] | null;
  sort_order?: number | null;
  active?: boolean;
  /* Prestations actives de l'établissement, dans l'ordre choisi par lui. */
  services?: ServiceRow[] | null;
};

export type GuestOffer = {
  id: string;
  /* Nom affiché ; `baseName` est celui en base, enregistré avec la réservation. */
  name: string;
  baseName: string;
  city?: string;
  description: string;
  tag: string;
  price?: string;
  /* Couverture : la carte du menu et les dashboards n'affichent que celle-ci. */
  image: string;
  /* Galerie complète, couverture en tête : montrée dans la fiche au clic. */
  images: string[];
  /* réseau twocards ou adresse ajoutée par l'hôtel */
  source: "reseau" | "hotel";
  /* Vide pour un restaurant ou un club ; une balade, un transfert… pour
     une activité ou un service. */
  services: GuestService[];
  /* Acompte en ligne demandé à la réservation (adresses du réseau à prix
     fixe seulement). Absent : demande sans paiement, comme avant. */
  deposit?: OfferDeposit;
};

export type GuestCategory = {
  key: GuestCategoryKey;
  label: string;
  tagline: string;
  image: string;
  offers: GuestOffer[];
};

const CAROUSEL = Array.from({ length: 9 }, (_, i) => `/images/carousel/0${i + 1}.jpg`);

/* Photo de secours d'une adresse sans photo : celle de sa catégorie quand on
   la connaît (un spa sans photo montre la cour du riad, pas un cocktail),
   sinon une image du carrousel, stable pour un slug donné. */
export function fallbackImage(slug: string, category?: string | null) {
  if (category && isKey(category)) return CATEGORY_META[category].image;
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return CAROUSEL[h % CAROUSEL.length];
}

/* Étiquette par défaut d'une adresse maison : « Adresse de l'hôtel » chez un
   hôtel, « Coup de cœur » chez un concierge (rien n'y parle d'hôtel). */
function defaultHouseTag(locale: Locale, ownerKind: "hotel" | "concierge") {
  if (ownerKind === "concierge") return locale === "en" ? "Top pick" : "Coup de cœur";
  return locale === "en" ? "Hotel pick" : "Adresse de l'hôtel";
}

export function toOffer(
  row: OfferRow,
  source: GuestOffer["source"],
  locale: Locale = "fr",
  ownerKind: "hotel" | "concierge" = "hotel"
): GuestOffer {
  const cover = row.image_url || fallbackImage(row.slug, row.category);
  const services: GuestService[] = (row.services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    baseName: s.name,
    description: s.description ?? "",
    duration: s.duration ?? "",
    price: s.price ?? "",
    image: s.image_url ?? undefined,
  }));
  /* Sans prix de fiche, la carte annonce la première prestation — c'est
     l'établissement qui décide de l'ordre, donc de ce qui s'affiche. */
  const firstPrice = services.find((s) => s.price)?.price;
  return {
    id: row.slug,
    name: row.name,
    baseName: row.name,
    city: row.city ?? undefined,
    description: row.description ?? "",
    tag: row.tag || (source === "hotel" ? defaultHouseTag(locale, ownerKind) : ""),
    price: row.price ?? (firstPrice ? (locale === "en" ? `from ${firstPrice}` : `dès ${firstPrice}`) : undefined),
    image: cover,
    images: [cover, ...(row.images ?? []).filter(Boolean)],
    source,
    services,
  };
}

/* Comparaison de villes tolérante : la ville de l'hôtel est saisie librement
   au signup (« marrakech », « Marrakech  »…). */
export const normalizeCity = (c: string) =>
  c
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

const isKey = (c: string): c is GuestCategoryKey =>
  (CATEGORY_KEYS as string[]).includes(c);

/* Catalogue vu par un client donné : les offres du réseau d'une autre ville
   que celle de l'hôtel sont écartées (celles sans ville sont disponibles
   partout), les adresses maison viennent en tête de leur catégorie, puis
   l'hôtel retire ce qu'il ne veut pas proposer sur ce QR précis. Les
   catégories vidées disparaissent du menu. */
export function buildGuestMenu({
  city,
  hidden,
  catalog,
  hotelOffers = [],
  categoryImages = {},
  hiddenCategories = [],
  locale = "fr",
  ownerKind = "hotel",
}: {
  city: string | null;
  hidden: string[];
  catalog: OfferRow[];
  hotelOffers?: OfferRow[];
  /* Photos de bandeau choisies par l'hôtel ; sinon celles de twocards. */
  categoryImages?: Partial<Record<GuestCategoryKey, string>>;
  /* Catégories entières retirées de ce QR (une famille sans clubs…). */
  hiddenCategories?: string[];
  /* Langue des libellés affichés (catégories, étiquettes par défaut). */
  locale?: Locale;
  /* Propriétaire du QR : change l'étiquette par défaut des adresses maison. */
  ownerKind?: "hotel" | "concierge";
}): GuestCategory[] {
  const hiddenSet = new Set(hidden);
  const hiddenCats = new Set(hiddenCategories);
  const hotelCity = city ? normalizeCity(city) : null;
  const byCategory = new Map<GuestCategoryKey, GuestOffer[]>(CATEGORY_KEYS.map((k) => [k, []]));

  const sorted = (rows: OfferRow[]) =>
    [...rows].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, locale)
    );

  for (const row of sorted(hotelOffers)) {
    if (!isKey(row.category) || row.active === false) continue;
    byCategory.get(row.category)!.push(toOffer(row, "hotel", locale, ownerKind));
  }
  for (const row of sorted(catalog)) {
    if (!isKey(row.category) || row.active === false) continue;
    if (row.city && hotelCity && normalizeCity(row.city) !== hotelCity) continue;
    byCategory.get(row.category)!.push(toOffer(row, "reseau", locale));
  }

  return CATEGORY_KEYS.map((key) => ({
    key,
    ...categoryMeta(key, locale),
    image: categoryImages[key] || CATEGORY_META[key].image,
    offers: byCategory.get(key)!.filter((o) => !hiddenSet.has(o.id)),
  })).filter((cat) => cat.offers.length > 0 && !hiddenCats.has(cat.key));
}

/* Côté hôtel : le catalogue configurable est celui de sa ville, adresses
   maison comprises et offres masquées comprises : c'est là qu'il coche et
   décoche. */
export function cityCatalog(
  city: string | null,
  catalog: OfferRow[],
  hotelOffers: OfferRow[] = [],
  locale: Locale = "fr"
): GuestCategory[] {
  return buildGuestMenu({ city, hidden: [], catalog, hotelOffers, locale });
}
