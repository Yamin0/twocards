import { venues } from "@/lib/constants";

/* Catalogue présenté au client de l'hôtel après un scan de QR code.
   Restaurants et clubs proviennent des venues partenaires (constants.ts) ;
   activités et services sont une sélection éditoriale en attendant que ces
   partenaires soient gérés en base. */

export type GuestCategoryKey = "restaurants" | "activites" | "clubs" | "services";

export type GuestOffer = {
  id: string;
  name: string;
  city?: string;
  description: string;
  tag: string;
  price?: string;
  image: string;
};

export type GuestCategory = {
  key: GuestCategoryKey;
  label: string;
  tagline: string;
  image: string;
  offers: GuestOffer[];
};

/* Les photos des venues (public/venues/*.jpg) ne sont pas dans le repo :
   on pioche dans le carrousel existant, de façon stable par venue. */
const CAROUSEL = Array.from(
  { length: 9 },
  (_, i) => `/images/carousel/0${i + 1}.jpg`
);

const venueImage = (id: string) => {
  const n = Number(id.replace(/\D/g, "")) || 0;
  return CAROUSEL[n % CAROUSEL.length];
};

const fromVenues = (types: string[], tag: string): GuestOffer[] =>
  venues
    .filter((v) => types.includes(v.type))
    .map((v) => ({
      id: v.id,
      name: v.name,
      city: v.city,
      description: v.description,
      tag,
      image: venueImage(v.id),
    }));

export const GUEST_CATEGORIES: GuestCategory[] = [
  {
    key: "restaurants",
    label: "Restaurants",
    tagline: "Tables raffinées et dîners d'exception",
    image: "/images/carousel/07.jpg",
    offers: fromVenues(["restaurant", "lounge"], "Restaurant"),
  },
  {
    key: "activites",
    label: "Activités",
    tagline: "Vivez le meilleur de la destination",
    image: "/images/carousel/05.jpg",
    offers: [
      {
        id: "act-1",
        name: "Montgolfière au lever du soleil",
        city: "Marrakech",
        description:
          "Survol du désert d'Agafay et des palmeraies, petit-déjeuner berbère inclus.",
        tag: "Aventure",
        price: "dès 1 100 MAD",
        image: "/images/carousel/02.jpg",
      },
      {
        id: "act-2",
        name: "Quad & dromadaire dans la Palmeraie",
        city: "Marrakech",
        description:
          "Randonnée guidée entre pistes et palmiers, pause thé à la menthe au campement.",
        tag: "Aventure",
        price: "dès 450 MAD",
        image: "/images/carousel/04.jpg",
      },
      {
        id: "act-3",
        name: "Hammam & spa traditionnel",
        description:
          "Rituel complet : gommage au savon noir, enveloppement au ghassoul, massage à l'huile d'argan.",
        tag: "Bien-être",
        price: "dès 600 MAD",
        image: "/images/carousel/06.jpg",
      },
      {
        id: "act-4",
        name: "Cours de cuisine marocaine",
        description:
          "Marché aux épices, tajine et pâtisseries avec une dada — repas dégusté ensemble.",
        tag: "Culture",
        price: "dès 500 MAD",
        image: "/images/carousel/08.jpg",
      },
      {
        id: "act-5",
        name: "Excursion vallée de l'Ourika",
        city: "Atlas",
        description:
          "Villages berbères, cascades et déjeuner au bord de l'oued, transport privé.",
        tag: "Excursion",
        price: "dès 700 MAD",
        image: "/images/carousel/09.jpg",
      },
    ],
  },
  {
    key: "clubs",
    label: "Clubs",
    tagline: "Les nuits les plus courues du pays",
    image: "/images/carousel/03.jpg",
    offers: fromVenues(["club", "bar"], "Club"),
  },
  {
    key: "services",
    label: "Services",
    tagline: "Une conciergerie à votre écoute",
    image: "/images/carousel/01.jpg",
    offers: [
      {
        id: "srv-1",
        name: "Chauffeur privé & transferts",
        description:
          "Berline avec chauffeur pour vos sorties, transferts aéroport et excursions.",
        tag: "Transport",
        image: "/images/carousel/01.jpg",
      },
      {
        id: "srv-2",
        name: "Photographe privé",
        description:
          "Séance photo lifestyle dans les plus beaux décors de la ville, clichés retouchés sous 48 h.",
        tag: "Lifestyle",
        price: "dès 900 MAD",
        image: "/images/carousel/03.jpg",
      },
      {
        id: "srv-3",
        name: "Baby-sitting de confiance",
        description:
          "Intervenantes vérifiées, français et anglais parlés, à l'hôtel ou en villa.",
        tag: "Famille",
        image: "/images/carousel/05.jpg",
      },
      {
        id: "srv-4",
        name: "Demande sur mesure",
        description:
          "Fleurs, anniversaire, demande spéciale… Dites-nous tout, on s'occupe du reste.",
        tag: "Conciergerie",
        image: "/images/carousel/07.jpg",
      },
    ],
  },
];
