/* Catalogue présenté au client de l'hôtel après un scan de QR code.

   Les adresses vivent en base : le catalogue du réseau twocards
   (catalog_offers, tenu par l'administrateur) et les adresses maison de
   l'hôtel (hotel_offers). Ce module ne fait que les ranger par catégorie,
   filtrer par ville et appliquer les choix de l'hôtel : aucune adresse n'est
   écrite ici. */

export type GuestCategoryKey = "restaurants" | "activites" | "clubs" | "services";

export const CATEGORY_KEYS: GuestCategoryKey[] = ["restaurants", "activites", "clubs", "services"];

export const CATEGORY_META: Record<
  GuestCategoryKey,
  { label: string; tagline: string; image: string }
> = {
  restaurants: {
    label: "Restaurants",
    tagline: "Tables raffinées et dîners d'exception",
    image: "/images/menu/restaurants.png",
  },
  activites: {
    label: "Activités",
    tagline: "Vivez le meilleur de la destination",
    image: "/images/carousel/05.jpg",
  },
  clubs: {
    label: "Clubs",
    tagline: "Les nuits les plus courues du pays",
    image: "/images/menu/clubs.jpg",
  },
  services: {
    label: "Services",
    tagline: "Une conciergerie à votre écoute",
    image: "/images/carousel/01.jpg",
  },
};

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_KEYS.map((k) => [k, CATEGORY_META[k].label])
) as Record<GuestCategoryKey, string>;

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
  name: string;
  description: string;
  duration: string;
  price: string;
  image?: string;
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
  name: string;
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
};

export type GuestCategory = {
  key: GuestCategoryKey;
  label: string;
  tagline: string;
  image: string;
  offers: GuestOffer[];
};

/* Photo de secours quand l'adresse n'en a pas : une image du carrousel,
   stable pour un slug donné. */
const CAROUSEL = Array.from({ length: 9 }, (_, i) => `/images/carousel/0${i + 1}.jpg`);

export function fallbackImage(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return CAROUSEL[h % CAROUSEL.length];
}

export function toOffer(row: OfferRow, source: GuestOffer["source"]): GuestOffer {
  const cover = row.image_url || fallbackImage(row.slug);
  const services: GuestService[] = (row.services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
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
    city: row.city ?? undefined,
    description: row.description ?? "",
    tag: row.tag || (source === "hotel" ? "Adresse de l'hôtel" : ""),
    price: row.price ?? (firstPrice ? `dès ${firstPrice}` : undefined),
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
}: {
  city: string | null;
  hidden: string[];
  catalog: OfferRow[];
  hotelOffers?: OfferRow[];
  /* Photos de bandeau choisies par l'hôtel ; sinon celles de twocards. */
  categoryImages?: Partial<Record<GuestCategoryKey, string>>;
}): GuestCategory[] {
  const hiddenSet = new Set(hidden);
  const hotelCity = city ? normalizeCity(city) : null;
  const byCategory = new Map<GuestCategoryKey, GuestOffer[]>(CATEGORY_KEYS.map((k) => [k, []]));

  const sorted = (rows: OfferRow[]) =>
    [...rows].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "fr")
    );

  for (const row of sorted(hotelOffers)) {
    if (!isKey(row.category) || row.active === false) continue;
    byCategory.get(row.category)!.push(toOffer(row, "hotel"));
  }
  for (const row of sorted(catalog)) {
    if (!isKey(row.category) || row.active === false) continue;
    if (row.city && hotelCity && normalizeCity(row.city) !== hotelCity) continue;
    byCategory.get(row.category)!.push(toOffer(row, "reseau"));
  }

  return CATEGORY_KEYS.map((key) => ({
    key,
    ...CATEGORY_META[key],
    image: categoryImages[key] || CATEGORY_META[key].image,
    offers: byCategory.get(key)!.filter((o) => !hiddenSet.has(o.id)),
  })).filter((cat) => cat.offers.length > 0);
}

/* Côté hôtel : le catalogue configurable est celui de sa ville, adresses
   maison comprises et offres masquées comprises : c'est là qu'il coche et
   décoche. */
export function cityCatalog(
  city: string | null,
  catalog: OfferRow[],
  hotelOffers: OfferRow[] = []
): GuestCategory[] {
  return buildGuestMenu({ city, hidden: [], catalog, hotelOffers });
}
