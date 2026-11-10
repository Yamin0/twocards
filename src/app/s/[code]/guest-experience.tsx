"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildGuestMenu,
  CATEGORY_LABELS,
  type GuestCategory,
  type GuestCategoryKey,
  type GuestOffer,
  type GuestService,
  type OfferRow,
} from "@/lib/guest-catalog";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageCircle,
  Minus,
  Music,
  Palmtree,
  Phone,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

/* Menu client après scan — style « widget de réservation » à la SevenRooms :
   fond clair, blanc, typographie noire en Satoshi, une seule couleur
   d'accent (celle de l'hôtel), beaucoup d'air.

   Pas de photo de couverture : la page s'ouvre sur un titre, comme un
   guide, et les bandeaux de catégories qui suivent portent les images.

   Deux mises en page pour un même contenu. Sur téléphone (le QR est scanné
   avec), une colonne : titre, onglets collants, liste. Sur grand écran
   (lien reçu par e-mail ou WhatsApp, ouvert sur un ordinateur), une vraie
   page web : titre sur deux colonnes, navigation par catégories, recherche
   et contact, grille d'adresses.

   Parcours en trois temps — choisir une adresse, régler couverts / date /
   heure, laisser ses coordonnées — puis confirmation. Sans compte, sans
   paiement : l'établissement confirme par téléphone ou WhatsApp. */

const CATEGORY_ICONS = {
  restaurants: UtensilsCrossed,
  activites: Palmtree,
  clubs: Music,
  services: Sparkles,
} as const;

type HotelInfo = {
  label: string | null;
  hotelName: string | null;
  city: string | null;
  accent: string;
  background: string;
  welcome: string | null;
  reception: string | null;
  showPrices: boolean;
};

type MenuState = "loading" | "ready" | "inactive";

/* Une demande par session et par QR : évite le double comptage du scan
   (StrictMode, retours arrière) sans cookie ni consentement. */
function trackScanOnce(code: string) {
  const key = `qr-scan-${code}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* stockage indisponible : on compte quand même */
  }
  createClient()
    .rpc("qr_track_scan", { p_code: code })
    .then(() => undefined, () => undefined);
}

const HEX = /^#[0-9a-fA-F]{6}$/;

const isDarkHex = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return true;
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 140;
};

const waLink = (phone: string, text: string) => {
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = `+${d.slice(2)}`;
  if (d.startsWith("0") && d.length === 10) d = `+212${d.slice(1)}`;
  return `https://wa.me/${d.replace(/\+/g, "")}?text=${encodeURIComponent(text)}`;
};

export function GuestExperience({
  code,
  fallbackHotelName,
  fallbackCity,
  preview = false,
}: {
  code: string;
  fallbackHotelName: string | null;
  fallbackCity: string | null;
  preview?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [state, setState] = useState<MenuState>("loading");
  const [info, setInfo] = useState<HotelInfo>({
    label: null,
    hotelName: fallbackHotelName,
    city: fallbackCity,
    accent: "#13305c",
    background: "#f4f3ef",
    welcome: null,
    reception: null,
    showPrices: true,
  });
  const [hidden, setHidden] = useState<string[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  /* Catalogue du réseau et adresses maison de l'hôtel, livrés avec le menu. */
  const [catalog, setCatalog] = useState<OfferRow[]>([]);
  const [hotelOffers, setHotelOffers] = useState<OfferRow[]>([]);
  const [categoryImages, setCategoryImages] = useState<Partial<Record<GuestCategoryKey, string>>>({});
  const [category, setCategory] = useState<GuestCategoryKey | "tous">("tous");
  const [search, setSearch] = useState("");
  const [offer, setOffer] = useState<{ offer: GuestOffer; category: GuestCategory } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!preview) trackScanOnce(code);
    let cancelled = false;
    createClient()
      .rpc("qr_get_menu", { p_code: code })
      .then(
        ({ data, error }) => {
          if (cancelled) return;
          const row = Array.isArray(data) ? data[0] : data;
          if (error || !row) {
            /* RPC injoignable : on garde les secours de l'URL et on affiche
               le catalogue de la ville. QR inactif : la RPC ne renvoie rien. */
            setState(error ? "ready" : "inactive");
            return;
          }
          setHidden(row.hidden_offers ?? []);
          setHiddenCategories(Array.isArray(row.hidden_categories) ? (row.hidden_categories as string[]) : []);
          setCatalog(Array.isArray(row.catalog) ? (row.catalog as OfferRow[]) : []);
          setHotelOffers(Array.isArray(row.hotel_offers) ? (row.hotel_offers as OfferRow[]) : []);
          setCategoryImages(
            row.category_images && typeof row.category_images === "object"
              ? (row.category_images as Partial<Record<GuestCategoryKey, string>>)
              : {}
          );
          setInfo({
            label: row.label ?? null,
            hotelName: row.hotel_name || fallbackHotelName,
            city: row.city || fallbackCity,
            accent: HEX.test(row.accent_color ?? "") ? row.accent_color : "#13305c",
            background: HEX.test(row.background_color ?? "") ? row.background_color : "#f4f3ef",
            welcome: row.welcome_message ?? null,
            reception: row.reception_phone ?? null,
            showPrices: row.show_prices ?? true,
          });
          setState("ready");
        },
        () => {
          if (!cancelled) setState("ready");
        }
      );
    return () => {
      cancelled = true;
    };
  }, [code, fallbackHotelName, fallbackCity, preview]);

  const menu = useMemo(
    () => buildGuestMenu({ city: info.city, hidden, catalog, hotelOffers, categoryImages, hiddenCategories, locale }),
    [info.city, hidden, catalog, hotelOffers, categoryImages, hiddenCategories, locale]
  );
  const total = menu.reduce((s, c) => s + c.offers.length, 0);
  const q = search.trim().toLowerCase();
  const visible = menu
    .filter((c) => category === "tous" || c.key === category)
    .map((c) => ({
      ...c,
      offers: q
        ? c.offers.filter(
            (o) =>
              o.name.toLowerCase().includes(q) ||
              o.tag.toLowerCase().includes(q) ||
              o.description.toLowerCase().includes(q)
          )
        : c.offers,
    }))
    .filter((c) => c.offers.length > 0);

  const darkAccent = isDarkHex(info.accent);
  const darkPage = isDarkHex(info.background);
  const themeStyle = {
    "--accent": info.accent,
    "--on-accent": darkAccent ? "#ffffff" : "#0a0a0a",
    "--page": info.background,
    "--on-page": darkPage ? "#ffffff" : "#171717",
    "--on-page-muted": darkPage ? "rgba(255,255,255,0.6)" : "rgba(23,23,23,0.55)",
    /* Filets du titre. */
    "--rule": darkPage ? "rgba(255,255,255,0.16)" : "rgba(23,23,23,0.16)",
    /* L'accent ne sert d'encre que s'il tranche sur le fond : un accent
       clair sur un fond clair (ou l'inverse) serait illisible. */
    "--accent-ink": darkAccent !== darkPage ? info.accent : "var(--on-page)",
  } as CSSProperties;

  const hotelName = info.hotelName ?? t("Votre hôtel", "Your hotel");
  const welcome =
    info.welcome ??
    (info.city
      ? t(
          `Les meilleures adresses de ${info.city}, réservées en quelques secondes, nous nous occupons du reste.`,
          `The best places in ${info.city}, booked in seconds. We take care of the rest.`
        )
      : t(
          "Réservez vos plus belles sorties en quelques secondes, nous nous occupons du reste.",
          "Book your finest outings in seconds. We take care of the rest."
        ));

  /* Ourlet du titre : le décompte n'apparaît qu'une fois le menu chargé,
     la provenance est toujours là — le bloc n'est donc jamais vide. */
  const counted = state === "ready" && total > 0;
  const metaItems = (
    state === "inactive"
      ? /* QR désactivé : annoncer une sélection qu'on ne montre pas serait absurde. */
        []
      : [
          counted ? t(`${total} adresse${total > 1 ? "s" : ""}`, `${total} place${total === 1 ? "" : "s"}`) : null,
          info.city,
          t("Sélection de l'hôtel", "Curated by the hotel"),
        ]
  ).filter((v): v is string => Boolean(v));

  const pick = (key: GuestCategoryKey | "tous") => {
    setCategory(key);
    setSearch("");
    /* La couverture est haute : à chaque changement de vue, on ramène la
       liste en haut de l'écran, sans repasser par la couverture. */
    if (listRef.current) {
      const top = listRef.current.getBoundingClientRect().top + window.scrollY - 12;
      if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div
      className="satoshi min-h-screen bg-[var(--page)] text-neutral-900 selection:bg-[var(--accent)] selection:text-[var(--on-accent)]"
      style={themeStyle}
    >
      {/* ─── Page de titre ───────────────────────────────────────────────────
          Pas de bannière : les photos des catégories, juste en dessous et
          presque bord à bord, font déjà tout le travail d'image. Ici on
          annonce : où l'on se trouve, chez qui, et ce que contient la
          sélection. */}
      <header className="relative mx-auto w-full max-w-[1800px] px-3 pt-9 pb-2 sm:px-4 sm:pt-12 lg:px-5 lg:pt-16">
        <LanguageSwitcher
          tone={darkPage ? "dark" : "light"}
          className="absolute right-3 top-2 sm:right-4 sm:top-4 lg:right-5"
        />
        {/* Le libellé du QR, tel que l'hôtel l'a saisi : « Chambre 129 », « Lobby »,
            « Suite 4 ». Le client sait tout de suite que la page est la sienne. */}
        {info.label && (
          <p className="text-sm font-bold text-[color:var(--accent-ink)] duration-700 animate-in fade-in sm:text-base">
            {info.label}
          </p>
        )}

        {/* Le nom pèse, le chapô respire : deux colonnes posées sur la même
            ligne de pied en grand écran, empilées sur téléphone. */}
        <div
          className={cn(
            "grid gap-x-12 gap-y-5 duration-700 animate-in fade-in slide-in-from-bottom-2 lg:grid-cols-12 lg:items-end lg:gap-y-0",
            info.label && "mt-2 sm:mt-3"
          )}
        >
          <h1 className="font-display text-[clamp(2.4rem,8.5vw,5.25rem)] font-black leading-[0.88] tracking-[-0.045em] text-[color:var(--on-page)] lg:col-span-7">
            {state === "loading" && !fallbackHotelName ? (
              <span className="inline-block h-[0.75em] w-[7ch] animate-pulse rounded-md bg-[color:var(--on-page)]/15 align-middle" />
            ) : (
              hotelName
            )}
          </h1>
          <p className="max-w-lg text-[15px] font-light leading-[1.6] text-[color:var(--on-page)]/80 sm:text-lg lg:col-span-5 lg:pb-[0.4em]">
            {welcome}
          </p>
        </div>

        {metaItems.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[color:var(--rule)] pt-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--on-page-muted)] duration-700 animate-in fade-in sm:mt-9 sm:text-[11px]">
            {metaItems.map((item, i) => (
              /* Au-delà de deux mentions ça passe à la ligne sur téléphone et
                 le losange se retrouve en tête de ligne : on garde l'essentiel. */
              <span key={item} className={cn("items-center gap-3", i > 1 ? "hidden sm:flex" : "flex")}>
                {i > 0 && <span aria-hidden className="h-[3px] w-[3px] rotate-45 bg-current opacity-45" />}
                <span className={cn(i === 0 && counted && "num text-[color:var(--accent-ink)]")}>{item}</span>
              </span>
            ))}
          </div>
        )}
      </header>

      {state === "inactive" ? (
        <Inactive reception={info.reception} hotelName={hotelName} />
      ) : (
        <div
          ref={listRef}
          className={cn(
            "mx-auto w-full pb-2 pt-3 sm:pt-6 lg:pt-8",
            /* Les bandeaux de catégories s'étirent presque bord à bord, sur
               la même gouttière que le titre pour tenir la ligne verticale ;
               les listes d'adresses gardent la largeur de lecture. */
            category === "tous"
              ? "max-w-[1800px] px-3 sm:px-4 lg:px-5"
              : "max-w-6xl px-3 sm:px-8 lg:px-10"
          )}
        >
          {state === "loading" ? (
            <div className="space-y-3 sm:space-y-4" aria-busy>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-black/10 sm:h-52 lg:h-64" />
              ))}
            </div>
          ) : category === "tous" ? (
            /* ─── Bandeaux de catégories ─────────────────────────────────── */
            <div className="space-y-3 sm:space-y-4">
              {menu.map((c, i) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => pick(c.key)}
                  className="group relative block h-40 w-full overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)] transition-transform active:scale-[0.99] sm:h-52 lg:h-64"
                >
                  {/* Les deux premiers bandeaux sont sous la couverture, donc
                      visibles dès l'ouverture : chargés sans attendre. */}
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    unoptimized={c.image.startsWith("http")}
                    priority={i < 2}
                    sizes="(max-width: 1800px) 100vw, 1800px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <span className="font-display text-xl font-bold uppercase tracking-[0.35em] [text-shadow:0_2px_14px_rgba(0,0,0,0.6)] sm:text-2xl lg:text-3xl">
                      {c.label}
                    </span>
                    <span className="num mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] sm:text-xs">
                      {t(
                        `${c.offers.length} adresse${c.offers.length > 1 ? "s" : ""}`,
                        `${c.offers.length} place${c.offers.length === 1 ? "" : "s"}`
                      )}
                    </span>
                  </div>
                </button>
              ))}
              {menu.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-12 text-center">
                  <p className="text-sm font-bold">{t("Aucune adresse proposée pour le moment", "No places available yet")}</p>
                  <p className="mt-1 text-sm text-neutral-500">{t("Adressez-vous à la réception.", "Please ask at reception.")}</p>
                </div>
              )}
            </div>
          ) : (
            /* ─── Une catégorie ──────────────────────────────────────────── */
            (() => {
              const current = menu.find((c) => c.key === category);
              const shown = visible[0];
              if (!current) return null;
              const Icon = CATEGORY_ICONS[current.key];
              return (
                <div>
                  <div className="relative h-36 overflow-hidden rounded-2xl text-white sm:h-44 lg:h-52">
                    <Image src={current.image} alt="" fill unoptimized={current.image.startsWith("http")} sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                    <button
                      type="button"
                      onClick={() => pick("tous")}
                      aria-label={t("Retour aux catégories", "Back to categories")}
                      className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow transition-colors hover:bg-white sm:left-4 sm:top-4"
                    >
                      <ArrowLeft size={18} strokeWidth={2.25} />
                    </button>
                    {/* Le calque du titre couvre tout le bandeau : il laisse passer les clics. */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <span className="font-display flex items-center gap-2 text-xl font-bold uppercase tracking-[0.35em] [text-shadow:0_2px_14px_rgba(0,0,0,0.6)] sm:text-2xl lg:text-3xl">
                        <Icon size={18} strokeWidth={2} className="hidden sm:block" />
                        {current.label}
                      </span>
                      <span className="mt-2 text-[11px] font-medium text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] sm:text-xs">
                        {current.tagline}
                      </span>
                    </div>
                  </div>

                  <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto py-1 sm:mt-4">
                    <CategoryChip active={false} onClick={() => pick("tous")} label={t("Tout", "All")} count={total} />
                    {menu.map((c) => (
                      <CategoryChip
                        key={c.key}
                        active={c.key === category}
                        onClick={() => pick(c.key)}
                        label={c.label}
                        count={c.offers.length}
                        icon={CATEGORY_ICONS[c.key]}
                      />
                    ))}
                  </div>

                  {current.offers.length > 4 && (
                    <div className="relative mt-3">
                      <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t(`Rechercher dans ${current.label.toLowerCase()}…`, `Search ${current.label.toLowerCase()}…`)}
                        className="h-11 w-full rounded-xl border border-black/[0.08] bg-white pl-10 pr-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                      />
                    </div>
                  )}

                  {!shown || shown.offers.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white px-6 py-12 text-center">
                      <p className="text-sm font-bold">{t("Aucune adresse ne correspond", "No matching places")}</p>
                      <p className="mt-1 text-sm text-neutral-500">{t("Essayez un autre mot.", "Try another word.")}</p>
                    </div>
                  ) : (
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                      {shown.offers.map((o) => (
                        <li key={o.id}>
                          <OfferCard offer={o} showPrice={info.showPrices} onPick={() => setOffer({ offer: o, category: current })} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-center lg:py-12">
        {info.reception && state !== "loading" && (
          <a
            href={waLink(info.reception, t(`Bonjour ${hotelName}, `, `Hello ${hotelName}, `))}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-bold text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            <MessageCircle size={15} strokeWidth={2} className="text-emerald-600" />
            {t("Écrire à la réception", "Message reception")}
          </a>
        )}
        <p className="text-xs leading-relaxed text-[var(--on-page-muted)]">
          {t(
            "Sans engagement, l'établissement confirme par téléphone ou WhatsApp.",
            "No commitment: the venue confirms by phone or WhatsApp."
          )}
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[var(--on-page-muted)]">
          <span className="text-[11px]">{t("Propulsé par", "Powered by")}</span>
          <Image src="/logo-header.png" alt="" width={16} height={16} className={cn("h-4 w-auto opacity-70", darkPage && "brightness-0 invert")} />
          <span className="text-xs font-black text-[var(--on-page)]">twocards.</span>
        </div>
      </footer>

      {offer && (
        <ReservationSheet
          code={code}
          category={offer.category}
          offer={offer.offer}
          hotelName={hotelName}
          accent={info.accent}
          preview={preview}
          onClose={() => setOffer(null)}
        />
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: typeof UtensilsCrossed;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition-colors",
        active ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[#f1f0ec] text-neutral-700 hover:bg-[#e9e7e2]"
      )}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {label}
      <span className={cn("num text-[11px] font-bold", active ? "opacity-70" : "text-neutral-400")}>{count}</span>
    </button>
  );
}

function OfferCard({ offer: o, showPrice, onPick }: { offer: GuestOffer; showPrice: boolean; onPick: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.45)] active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <Image
          src={o.image}
          alt=""
          fill
          unoptimized={o.image.startsWith("http")}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        {o.source === "hotel" && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--on-accent)]">
            {t("Par l'hôtel", "Hotel pick")}
          </span>
        )}
      </div>
      {/* Le nom seul : l'étiquette et la description attendent la fiche, qui
          s'ouvre au clic. */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5 sm:pb-4 sm:pt-4">
        <p className="font-display text-lg font-black leading-tight tracking-tight text-neutral-900 sm:text-xl">{o.name}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2.5">
          <span className="num text-sm font-light italic text-neutral-500">{showPrice && o.price ? o.price : ""}</span>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-xs font-bold text-[var(--on-accent)] transition-transform group-hover:translate-x-0.5">
            {t("Réserver", "Book")}
            <ChevronRight size={13} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}

/* Galerie de la fiche : la couverture, puis les autres photos de l'adresse.
   Une seule est visible à la fois, les autres restent montées pour que le
   navigateur les ait déjà en cache au changement. */
function Gallery({ images }: { images: string[] }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const go = (step: number) => setIndex((n) => (n + step + images.length) % images.length);
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-200">
      {images.map((src, n) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          unoptimized={src.startsWith("http")}
          priority={n === 0}
          sizes="(max-width: 640px) 100vw, 512px"
          className={cn("object-cover transition-opacity duration-300", n === index ? "opacity-100" : "opacity-0")}
        />
      ))}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("Photo précédente", "Previous photo")}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow transition-colors hover:bg-white"
          >
            <ChevronLeft size={17} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("Photo suivante", "Next photo")}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-neutral-900 shadow transition-colors hover:bg-white"
          >
            <ChevronRight size={17} strokeWidth={2.25} />
          </button>
          <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {images.map((src, n) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(n)}
                aria-label={t(`Photo ${n + 1} sur ${images.length}`, `Photo ${n + 1} of ${images.length}`)}
                aria-current={n === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  n === index ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/85"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Inactive({ hotelName, reception }: { hotelName: string; reception: string | null }) {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.06]">
        <X size={20} strokeWidth={2} className="text-[var(--on-page-muted)]" />
      </div>
      <h2 className="font-display text-xl font-bold tracking-tight text-[var(--on-page)]">
        {t("Ce menu n'est plus disponible", "This menu is no longer available")}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--on-page-muted)]">
        {t(
          "Ce QR code a été désactivé par l'hôtel. Adressez-vous à la réception pour réserver vos sorties.",
          "This QR code has been deactivated by the hotel. Please ask at reception to book your outings."
        )}
      </p>
      {reception && (
        <a
          href={waLink(reception, t(`Bonjour ${hotelName}, `, `Hello ${hotelName}, `))}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--on-accent)]"
        >
          <MessageCircle size={15} strokeWidth={2} />
          {t("Écrire à la réception", "Message reception")}
        </a>
      )}
    </main>
  );
}

/* ─── Feuille de réservation — trois temps ─────────────────────────────────── */

type Step = "details" | "contact" | "done";

const DAY_LABELS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_LABELS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* Créneaux proposés selon la catégorie : un restaurant se réserve à midi et
   le soir, un club la nuit, une activité le matin et l'après-midi. */
const SLOTS: Record<GuestCategoryKey, string[]> = {
  restaurants: ["12:30", "13:00", "13:30", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"],
  clubs: ["22:30", "23:00", "23:30", "00:00", "00:30", "01:00"],
  activites: ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
  services: ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
};

function ReservationSheet({
  code,
  category,
  offer,
  hotelName,
  accent,
  preview,
  onClose,
}: {
  code: string;
  category: GuestCategory;
  offer: GuestOffer;
  hotelName: string;
  accent: string;
  preview: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const dayLabels = t(DAY_LABELS, DAY_LABELS_EN);
  const monthLabels = t(MONTH_LABELS, MONTH_LABELS_EN);
  const days = useMemo(() => {
    const out: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);
  const [step, setStep] = useState<Step>("details");
  const [partySize, setPartySize] = useState(2);
  /* La première prestation est proposée d'office : c'est l'établissement
     qui a choisi l'ordre, et le client peut en changer d'un geste. */
  const [service, setService] = useState<GuestService | null>(offer.services[0] ?? null);
  const [date, setDate] = useState(isoDay(days[0]));
  const [time, setTime] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const slots = SLOTS[category.key];
  const nowIso = isoDay(new Date());
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isPast = (slot: string) => {
    if (date !== nowIso) return false;
    const [h, m] = slot.split(":").map(Number);
    const min = (h < 5 ? h + 24 : h) * 60 + m;
    return min <= nowMin + 30;
  };
  const chosenTime = time === "autre" ? customTime : time;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) {
      setStep("done");
      return;
    }
    setSending(true);
    setErrorMsg("");
    const { error } = await createClient().rpc("qr_create_reservation", {
      p_code: code,
      /* Libellé français enregistré en base, quelle que soit la langue affichée. */
      p_category: CATEGORY_LABELS[category.key],
      p_venue: offer.name,
      p_guest_name: name,
      p_guest_phone: phone,
      p_date: date,
      p_time: chosenTime || null,
      p_party_size: partySize,
      p_notes: notes || null,
      /* Slug du catalogue : relie la réservation au compte de
         l'établissement, qui saisira le montant dépensé. */
      p_venue_slug: offer.id,
      /* La prestation choisie, telle que l'établissement la nomme. */
      p_service: service?.name ?? null,
    });
    setSending(false);
    if (error) {
      setErrorMsg(
        error.message.includes("introuvable")
          ? t(
              "Ce QR code n'est plus actif. Adressez-vous à la réception.",
              "This QR code is no longer active. Please ask at reception."
            )
          : t(
              "Impossible d'envoyer votre demande pour le moment. Réessayez ou contactez la réception.",
              "We couldn't send your request right now. Please try again or contact reception."
            )
      );
      return;
    }
    setStep("done");
  };

  const dark = isDarkHex(accent);
  const themeStyle = { "--accent": accent, "--on-accent": dark ? "#ffffff" : "#0a0a0a" } as CSSProperties;
  const field =
    "h-12 w-full rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(intl, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="satoshi fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" style={themeStyle}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[94dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-[1.75rem] bg-white text-neutral-900 shadow-2xl animate-in slide-in-from-bottom-4 sm:rounded-[1.75rem]"
      >
        {step === "done" ? (
          <div className="px-7 py-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={30} strokeWidth={2.5} />
            </div>
            <h3 className="font-display text-2xl font-black tracking-tight">{t("Demande envoyée", "Request sent")}</h3>
            <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-neutral-600">
              <span className="font-bold text-neutral-900">{offer.name}</span>
              {service ? ` — ${service.name}` : ""}, {dateLabel}
              {t(
                `${chosenTime ? ` à ${chosenTime}` : ""}, pour ${partySize} personne${partySize > 1 ? "s" : ""}.`,
                `${chosenTime ? ` at ${chosenTime}` : ""}, for ${partySize} guest${partySize === 1 ? "" : "s"}.`
              )}
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {t(
                <>
                  L&apos;établissement vous confirme au <span className="num font-bold text-neutral-800">{phone}</span> par
                  téléphone ou WhatsApp. {hotelName} est prévenu.
                </>,
                <>
                  The venue will confirm on <span className="num font-bold text-neutral-800">{phone}</span> by phone or
                  WhatsApp. {hotelName} has been notified.
                </>
              )}
            </p>
            {preview && <p className="mt-3 text-xs font-bold text-amber-600">{t("Aperçu : aucune demande n'a été envoyée.", "Preview: no request was sent.")}</p>}
            <button
              type="button"
              onClick={onClose}
              className="mt-8 h-12 w-full rounded-xl bg-[var(--accent)] text-[15px] font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90"
            >
              {t("Parfait", "Perfect")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col">
            {/* En-tête de la feuille */}
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/[0.06] bg-white/95 px-5 py-4 backdrop-blur">
              {step === "contact" ? (
                <button type="button" onClick={() => setStep("details")} aria-label={t("Retour", "Back")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                  <ArrowLeft size={16} strokeWidth={2.25} />
                </button>
              ) : (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <Image src={offer.image} alt="" fill unoptimized={offer.image.startsWith("http")} sizes="44px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{category.label}</p>
                <h3 className="font-display truncate text-[17px] font-bold leading-tight tracking-tight">{offer.name}</h3>
              </div>
              <span className="num shrink-0 text-[11px] font-bold text-neutral-400">{step === "details" ? "1/2" : "2/2"}</span>
              <button type="button" onClick={onClose} aria-label={t("Fermer", "Close")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {step === "details" && (
              <div className="space-y-6 px-5 pb-5 pt-5 sm:px-7">
                {/* L'adresse en un coup d'œil : photo, étiquette, prix, description. */}
                <section className="overflow-hidden rounded-2xl bg-[#f7f6f3]">
                  <Gallery images={offer.images} />
                  <div className="px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-neutral-400">{offer.tag}</p>
                      {offer.price && <p className="num text-sm font-light italic text-neutral-500">{offer.price}</p>}
                    </div>
                    {offer.description && (
                      <p className="mt-1.5 text-[15px] leading-relaxed text-neutral-700">{offer.description}</p>
                    )}
                  </div>
                </section>

                {/* Prestation : quad ou buggy, une heure ou une demi-journée */}
                {offer.services.length > 0 && (
                  <section>
                    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                      <Sparkles size={12} strokeWidth={2.25} /> {t("Prestation", "Service")}
                    </p>
                    <div className="space-y-2">
                      {offer.services.map((s) => {
                        const active = service?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setService(s)}
                            aria-pressed={active}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                              active
                                ? "border-[var(--accent)] bg-white ring-1 ring-[var(--accent)]"
                                : "border-black/[0.08] bg-white hover:bg-neutral-50"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-bold leading-tight text-neutral-900">{s.name}</p>
                              {(s.duration || s.description) && (
                                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                                  {[s.duration, s.description].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                            {s.price && <span className="num shrink-0 text-sm font-bold text-neutral-900">{s.price}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Couverts */}
                <section>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    <Users size={12} strokeWidth={2.25} /> {t("Personnes", "Guests")}
                  </p>
                  <div className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-3 py-2">
                    <button type="button" aria-label={t("Moins de personnes", "Fewer guests")} onClick={() => setPartySize((n) => Math.max(1, n - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                      <Minus size={16} strokeWidth={2.25} />
                    </button>
                    <span className="num text-xl font-black">{partySize} <span className="text-sm font-medium text-neutral-500">{t(`personne${partySize > 1 ? "s" : ""}`, `guest${partySize === 1 ? "" : "s"}`)}</span></span>
                    <button type="button" aria-label={t("Plus de personnes", "More guests")} onClick={() => setPartySize((n) => Math.min(50, n + 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                      <Plus size={16} strokeWidth={2.25} />
                    </button>
                  </div>
                </section>

                {/* Date */}
                <section>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    <Calendar size={12} strokeWidth={2.25} /> Date
                  </p>
                  <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-7 sm:px-7">
                    {days.map((d, i) => {
                      const iso = isoDay(d);
                      const active = iso === date;
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => {
                            setDate(iso);
                            setTime(null);
                          }}
                          aria-pressed={active}
                          className={cn(
                            "flex w-[60px] shrink-0 flex-col items-center rounded-xl border py-2.5 transition-colors",
                            active ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]" : "border-black/[0.08] bg-white text-neutral-800 hover:bg-neutral-50"
                          )}
                        >
                          <span className={cn("text-[10px] font-bold uppercase", active ? "opacity-80" : "text-neutral-400")}>
                            {i === 0 ? t("auj.", "Today") : i === 1 ? t("dem.", "Tmrw") : dayLabels[d.getDay()]}
                          </span>
                          <span className="num text-lg font-black leading-tight">{d.getDate()}</span>
                          <span className={cn("text-[10px] font-medium", active ? "opacity-80" : "text-neutral-400")}>{monthLabels[d.getMonth()]}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Heure */}
                <section>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    <Clock size={12} strokeWidth={2.25} /> {t("Heure", "Time")}{" "}
                    <span className="normal-case tracking-normal text-neutral-400">{t("(facultatif)", "(optional)")}</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {slots.map((s) => {
                      const past = isPast(s);
                      const active = time === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={past}
                          onClick={() => setTime(active ? null : s)}
                          aria-pressed={active}
                          className={cn(
                            "num h-10 rounded-xl border text-sm font-bold transition-colors",
                            active
                              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                              : past
                                ? "border-transparent bg-neutral-50 text-neutral-300 line-through"
                                : "border-black/[0.08] bg-white text-neutral-800 hover:bg-neutral-50"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setTime(time === "autre" ? null : "autre")}
                      aria-pressed={time === "autre"}
                      className={cn(
                        "h-10 rounded-xl border text-sm font-bold transition-colors",
                        time === "autre" ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]" : "border-black/[0.08] bg-white text-neutral-800 hover:bg-neutral-50"
                      )}
                    >
                      {t("Autre", "Other")}
                    </button>
                  </div>
                  {time === "autre" && (
                    <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className={cn(field, "mt-2")} autoFocus />
                  )}
                </section>

                <button
                  type="button"
                  onClick={() => setStep("contact")}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-[15px] font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90"
                >
                  {t("Continuer", "Continue")}
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {step === "contact" && (
              <div className="space-y-4 px-5 pb-5 pt-5 sm:px-7">
                <div className="flex items-center justify-between rounded-xl bg-[#f7f6f3] px-4 py-3 text-sm">
                  <span className="text-neutral-600">
                    {service ? `${service.name} · ` : ""}
                    <span className="num font-bold text-neutral-900">{partySize}</span>{" "}
                    {t("pers.", partySize === 1 ? "guest" : "guests")} · {dateLabel}
                    {chosenTime ? ` · ${chosenTime}` : ""}
                  </span>
                  <button type="button" onClick={() => setStep("details")} className="text-xs font-bold text-[var(--accent)]">
                    {t("Modifier", "Edit")}
                  </button>
                </div>
                <div className="relative">
                  <User size={16} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input className={cn(field, "pl-11")} placeholder={t("Votre nom", "Your name")} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" autoFocus />
                </div>
                <div className="relative">
                  <Phone size={16} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input className={cn(field, "num pl-11")} type="tel" placeholder={t("Téléphone (WhatsApp)", "Phone (WhatsApp)")} value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={40} autoComplete="tel" inputMode="tel" />
                </div>
                <textarea
                  className="min-h-24 w-full resize-none rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  placeholder={t(
                    "Une précision ? Occasion, allergies, table souhaitée… (facultatif)",
                    "Anything to add? Occasion, allergies, preferred table… (optional)"
                  )}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                />
                {errorMsg && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 text-[15px] font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> {t("Envoi…", "Sending…")}
                    </>
                  ) : (
                    t("Envoyer ma demande", "Send my request")
                  )}
                </button>
                <p className="text-center text-xs leading-relaxed text-neutral-500">
                  {t(
                    <>
                      Sans engagement ni paiement : {hotelName} et l&apos;établissement sont prévenus, la confirmation arrive par téléphone ou WhatsApp.
                    </>,
                    <>
                      No commitment, no payment: {hotelName} and the venue are notified, and confirmation comes by phone or WhatsApp.
                    </>
                  )}
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
