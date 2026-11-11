import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  buildGuestMenu,
  type GuestCategory,
  type GuestCategoryKey,
  type OfferRow,
} from "@/lib/guest-catalog";
import type { Locale } from "@/lib/i18n";
import { safeHex } from "./color";
import { hostKind, type HostKind } from "./host";

/* Chargement côté serveur des deux pages clients (menu QR, portail direct).
   Les RPC sont les mêmes que celles appelées jusqu'ici par le navigateur
   (`qr_get_menu`, `portal_get`), avec les mêmes paramètres : la page arrive
   simplement déjà remplie. `cache` évite un second appel entre
   `generateMetadata` et la page.

   Trois issues distinctes, pour ne plus confondre une panne avec une
   absence : « ready », « inactive » / « notfound » (la base a répondu : rien),
   « error » (la base n'a pas répondu). */

export const DEFAULT_ACCENT = "#13305c";
export const DEFAULT_GUEST_BACKGROUND = "#f4f3ef";
export const DEFAULT_PORTAL_BACKGROUND = "#f5f5f4";

/* ─── Menu QR ─────────────────────────────────────────────────────────────── */

export type GuestHotel = {
  /* Hôtel ou concierge : décide du vocabulaire du menu (voir `./host`). */
  kind: HostKind;
  /* Libellé du QR tel que l'hôtel l'a saisi : « Chambre 129 », « Lobby ».
     Pour un concierge, c'est un nom de canal interne (« Instagram ») : il
     n'est pas montré au client. */
  label: string | null;
  hotelName: string | null;
  city: string | null;
  accent: string;
  background: string;
  welcome: string | null;
  reception: string | null;
  showPrices: boolean;
};

export type GuestMenuResult =
  | { status: "ready"; hotel: GuestHotel; menu: GuestCategory[] }
  | { status: "inactive" }
  | { status: "error" };

const asRows = (value: unknown): OfferRow[] => (Array.isArray(value) ? (value as OfferRow[]) : []);
const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

export const loadGuestMenu = cache(async (code: string, locale: Locale): Promise<GuestMenuResult> => {
  /* La RPC refuse les codes de plus de 32 caractères : inutile d'appeler. */
  if (!code || code.length > 32) return { status: "inactive" };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("qr_get_menu", { p_code: code });
    if (error) return { status: "error" };
    const row = Array.isArray(data) ? data[0] : data;
    /* QR inconnu ou désactivé : la RPC ne renvoie aucune ligne. */
    if (!row) return { status: "inactive" };

    /* `owner_role` n'existe qu'après la migration 20261112100000 : absent,
       le menu reste exactement celui d'un hôtel. */
    const kind = hostKind(row.owner_role);
    const hotel: GuestHotel = {
      kind,
      label: row.label ?? null,
      hotelName: row.hotel_name || null,
      city: row.city || null,
      accent: safeHex(row.accent_color, DEFAULT_ACCENT),
      background: safeHex(row.background_color, DEFAULT_GUEST_BACKGROUND),
      welcome: row.welcome_message || null,
      reception: row.reception_phone || null,
      showPrices: row.show_prices ?? true,
    };
    /* Le menu est rangé ici (ville, masquages, langue) : le navigateur ne
       reçoit que ce qu'il affiche, pas le catalogue de toutes les villes. */
    const menu = buildGuestMenu({
      city: hotel.city,
      hidden: asStrings(row.hidden_offers),
      catalog: asRows(row.catalog),
      hotelOffers: asRows(row.hotel_offers),
      categoryImages:
        row.category_images && typeof row.category_images === "object"
          ? (row.category_images as Partial<Record<GuestCategoryKey, string>>)
          : {},
      hiddenCategories: asStrings(row.hidden_categories),
      locale,
      ownerKind: kind,
    });
    return { status: "ready", hotel, menu };
  } catch {
    return { status: "error" };
  }
});

/* ─── Portail direct ──────────────────────────────────────────────────────── */

export type Portal = {
  display_name: string;
  tagline: string;
  accent_color: string;
  background_color: string;
  cover_url: string | null;
  party_max: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
};

export type PortalResult =
  | { status: "ready"; portal: Portal }
  | { status: "notfound" }
  | { status: "error" };

export const loadPortal = cache(async (slug: string): Promise<PortalResult> => {
  /* Même garde que la RPC (slug de 40 caractères au plus). */
  if (!slug || slug.length > 40) return { status: "notfound" };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("portal_get", { p_slug: slug });
    if (error) return { status: "error" };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { status: "notfound" };
    return {
      status: "ready",
      portal: {
        display_name: row.display_name ?? "",
        tagline: row.tagline ?? "",
        accent_color: safeHex(row.accent_color, DEFAULT_ACCENT),
        background_color: safeHex(row.background_color, DEFAULT_PORTAL_BACKGROUND),
        cover_url: row.cover_url || null,
        party_max: Math.max(1, Number(row.party_max) || 1),
        start_time: row.start_time ?? "",
        end_time: row.end_time ?? "",
        interval_minutes: Number(row.interval_minutes) || 30,
      },
    };
  } catch {
    return { status: "error" };
  }
});
