import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  buildGuestMenu,
  type GuestCategory,
  type GuestCategoryKey,
  type OfferRow,
} from "@/lib/guest-catalog";
import { intlLocale, type Locale } from "@/lib/i18n";
import { safeHex } from "./color";
import { formatDeposit, isDepositCurrency, type OfferDeposit } from "./deposit";
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
    await attachDeposits(supabase, menu);
    await attachExtras(supabase, menu, locale);
    return { status: "ready", hotel, menu };
  } catch {
    return { status: "error" };
  }
});

/* Acompte en ligne : réglé par adresse du catalogue réseau. Lu à part pour
   ne pas toucher `qr_get_menu` ; si la lecture échoue (colonnes absentes
   avant la migration), le menu reste sans acompte, comme avant. Le montant
   qui fait foi est recalculé en base au moment de payer. */
async function attachDeposits(supabase: Awaited<ReturnType<typeof createClient>>, menu: GuestCategory[]) {
  const slugs = menu.flatMap((c) => c.offers.filter((o) => o.source === "reseau").map((o) => o.id));
  if (slugs.length === 0) return;
  const { data, error } = await supabase
    .from("catalog_offers")
    .select("slug, deposit_mode, deposit_amount, deposit_currency")
    .in("slug", slugs)
    .neq("deposit_mode", "none");
  if (error || !data?.length) return;
  const bySlug = new Map<string, OfferDeposit>();
  for (const row of data) {
    const unit = Number(row.deposit_amount);
    if ((row.deposit_mode === "per_person" || row.deposit_mode === "fixed") && unit > 0 && isDepositCurrency(row.deposit_currency)) {
      bySlug.set(row.slug, { mode: row.deposit_mode, unit, currency: row.deposit_currency });
    }
  }
  for (const category of menu) {
    for (const offer of category.offers) {
      const deposit = offer.source === "reseau" ? bySlug.get(offer.id) : undefined;
      if (deposit) offer.deposit = deposit;
    }
  }
}

/* Compléments du menu (`qr_menu_extras`, migration 20261113110000) :
   - prestations à prix partenaire : prix affiché et acompte par véhicule,
     calculés en base par `twocards_prix_client` (la règle n'existe qu'à cet
     endroit) ;
   - traductions anglaises du nom, de la description, de l'étiquette.
   Avant la migration, la RPC n'existe pas : le menu reste tel quel. */
type Translation = { name?: string; description?: string; tag?: string; duration?: string; model?: string };

const translationFor = (value: unknown, locale: Locale): Translation => {
  if (locale === "fr" || !value || typeof value !== "object") return {};
  const entry = (value as Record<string, unknown>)[locale];
  if (!entry || typeof entry !== "object") return {};
  const out: Translation = {};
  for (const key of ["name", "description", "tag", "duration", "model"] as const) {
    const text = (entry as Record<string, unknown>)[key];
    if (typeof text === "string" && text.trim()) out[key] = text.trim();
  }
  return out;
};

type ExtrasService = {
  id?: string;
  model?: string | null;
  translations?: unknown;
  seats?: number | null;
  currency?: string | null;
  client_price?: number | string | null;
  deposit?: number | string | null;
};

async function attachExtras(
  supabase: Awaited<ReturnType<typeof createClient>>,
  menu: GuestCategory[],
  locale: Locale
) {
  const slugs = menu.flatMap((c) => c.offers.filter((o) => o.source === "reseau").map((o) => o.id));
  if (slugs.length === 0) return;
  const { data, error } = await supabase.rpc("qr_menu_extras", { p_slugs: slugs });
  if (error || !data || typeof data !== "object") return;
  const extras = data as { offers?: { slug?: string; translations?: unknown }[]; services?: ExtrasService[] };

  const offerText = new Map<string, Translation>();
  for (const row of extras.offers ?? []) {
    if (row.slug) offerText.set(row.slug, translationFor(row.translations, locale));
  }
  const services = new Map<string, ExtrasService>();
  for (const row of extras.services ?? []) if (row.id) services.set(row.id, row);

  const money = (amount: number, currency: string) => formatDeposit(amount, currency, intlLocale(locale));

  for (const category of menu) {
    for (const offer of category.offers) {
      if (offer.source !== "reseau") continue;
      const text = offerText.get(offer.id);
      if (text?.name) offer.name = text.name;
      if (text?.description) offer.description = text.description;
      if (text?.tag) offer.tag = text.tag;

      let lowest: { amount: number; currency: string } | null = null;
      for (const service of offer.services) {
        const extra = services.get(service.id);
        if (!extra) continue;
        const own = translationFor(extra.translations, locale);
        if (own.name) service.name = own.name;
        if (own.description) service.description = own.description;
        if (own.duration) service.duration = own.duration;
        const model = own.model || (typeof extra.model === "string" ? extra.model.trim() : "");
        if (model) service.model = model;
        const seats = Number(extra.seats);
        if (seats > 0) service.seats = seats;
        const price = Number(extra.client_price);
        const deposit = Number(extra.deposit);
        const currency = isDepositCurrency(extra.currency) ? extra.currency : "mad";
        if (price > 0) {
          service.clientPrice = price;
          service.currency = currency;
          service.price = money(price, currency);
          if (!lowest || price < lowest.amount) lowest = { amount: price, currency };
        }
        if (price > 0 && deposit > 0) service.deposit = deposit;
      }
      /* La carte annonce le plus petit prix affiché des prestations. */
      if (lowest) {
        const from = money(lowest.amount, lowest.currency);
        offer.price = locale === "en" ? `from ${from}` : `dès ${from}`;
      }
    }
  }
}

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
