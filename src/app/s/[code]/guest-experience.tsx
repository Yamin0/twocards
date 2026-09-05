"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildGuestMenu,
  type GuestCategory,
  type GuestCategoryKey,
  type GuestOffer,
} from "@/lib/guest-catalog";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
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

/* Menu client après scan — style « widget de réservation » à la SevenRooms :
   fond clair, carte blanche centrée, typographie noire en Satoshi, une seule
   couleur d'accent (celle de l'hôtel), beaucoup d'air. Mobile d'abord : le
   QR est scanné avec un téléphone. Parcours en trois temps — choisir une
   adresse, régler couverts / date / heure, laisser ses coordonnées — puis
   confirmation. Sans compte, sans paiement : l'établissement confirme par
   téléphone ou WhatsApp. */

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
  const [state, setState] = useState<MenuState>("loading");
  const [info, setInfo] = useState<HotelInfo>({
    label: null,
    hotelName: fallbackHotelName,
    city: fallbackCity,
    accent: "#13305c",
    welcome: null,
    reception: null,
    showPrices: true,
  });
  const [hidden, setHidden] = useState<string[]>([]);
  const [category, setCategory] = useState<GuestCategoryKey | "tous">("tous");
  const [search, setSearch] = useState("");
  const [offer, setOffer] = useState<{ offer: GuestOffer; category: GuestCategory } | null>(null);

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
          setInfo({
            label: row.label ?? null,
            hotelName: row.hotel_name || fallbackHotelName,
            city: row.city || fallbackCity,
            accent: /^#[0-9a-fA-F]{6}$/.test(row.accent_color ?? "") ? row.accent_color : "#13305c",
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

  const menu = useMemo(() => buildGuestMenu({ city: info.city, hidden }), [info.city, hidden]);
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

  const dark = isDarkHex(info.accent);
  const themeStyle = {
    "--accent": info.accent,
    "--on-accent": dark ? "#ffffff" : "#0a0a0a",
  } as CSSProperties;

  const hotelName = info.hotelName ?? "Votre hôtel";

  return (
    <div className="satoshi min-h-screen bg-[#f4f3ef] text-neutral-900 selection:bg-[var(--accent)] selection:text-[var(--on-accent)]" style={themeStyle}>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col sm:py-8">
        <div className="flex flex-1 flex-col overflow-hidden bg-white sm:rounded-[1.75rem] sm:border sm:border-black/[0.06] sm:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
          {/* En-tête à la couleur de l'hôtel */}
          <header className="relative overflow-hidden px-6 pb-6 pt-7 text-[var(--on-accent)] sm:px-8 sm:pt-8" style={{ background: info.accent }}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] opacity-70">
                {state === "loading" ? "Conciergerie" : info.label ? `Conciergerie · ${info.label}` : "Conciergerie"}
              </p>
              <h1 className="font-display mt-2 text-[1.9rem] font-black leading-[1.05] tracking-tight sm:text-4xl">
                {state === "loading" && !fallbackHotelName ? <span className="inline-block h-9 w-48 animate-pulse rounded-lg bg-white/20" /> : hotelName}
              </h1>
              <p className="mt-3 max-w-sm text-[15px] leading-relaxed opacity-85">
                {info.welcome ??
                  (info.city
                    ? `Les meilleures adresses de ${info.city}, réservées en quelques secondes — nous nous occupons du reste.`
                    : "Réservez vos plus belles sorties en quelques secondes — nous nous occupons du reste.")}
              </p>
            </div>
          </header>

          {state === "inactive" ? (
            <Inactive hotelName={hotelName} reception={info.reception} />
          ) : (
            <>
              {/* Onglets de catégories, collants */}
              <div className="sticky top-0 z-20 border-b border-black/[0.06] bg-white/95 backdrop-blur">
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-3 sm:px-6">
                  <CategoryChip active={category === "tous"} onClick={() => setCategory("tous")} label="Tout" count={total} />
                  {menu.map((c) => (
                    <CategoryChip
                      key={c.key}
                      active={category === c.key}
                      onClick={() => setCategory(c.key)}
                      label={c.label}
                      count={c.offers.length}
                      icon={CATEGORY_ICONS[c.key]}
                    />
                  ))}
                </div>
              </div>

              <main className="flex-1 px-4 pb-8 pt-4 sm:px-6">
                {state === "loading" ? (
                  <ul className="space-y-3" aria-busy>
                    {[1, 2, 3, 4].map((i) => (
                      <li key={i} className="flex gap-3.5 rounded-2xl border border-black/[0.06] p-3">
                        <div className="h-[84px] w-[84px] shrink-0 animate-pulse rounded-xl bg-neutral-200" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
                          <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                          <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    {total > 6 && (
                      <div className="relative mb-4">
                        <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Rechercher une adresse, une envie…"
                          className="h-11 w-full rounded-xl border border-black/[0.08] bg-[#f7f6f3] pl-10 pr-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                        />
                      </div>
                    )}

                    {visible.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-black/10 px-6 py-12 text-center">
                        <p className="text-sm font-bold">Aucune adresse ne correspond</p>
                        <p className="mt-1 text-sm text-neutral-500">Essayez un autre mot ou une autre catégorie.</p>
                      </div>
                    ) : (
                      <div className="space-y-7">
                        {visible.map((c) => {
                          const Icon = CATEGORY_ICONS[c.key];
                          return (
                            <section key={c.key}>
                              {category === "tous" && (
                                <div className="mb-3 flex items-end justify-between">
                                  <h2 className="font-display flex items-center gap-2 text-lg font-bold tracking-tight">
                                    <Icon size={17} strokeWidth={2} className="text-[var(--accent)]" />
                                    {c.label}
                                  </h2>
                                  <button
                                    type="button"
                                    onClick={() => setCategory(c.key)}
                                    className="text-xs font-bold text-[var(--accent)]"
                                  >
                                    Voir tout
                                  </button>
                                </div>
                              )}
                              {category !== "tous" && <p className="mb-3 text-sm text-neutral-500">{c.tagline}</p>}
                              <ul className="space-y-3">
                                {(category === "tous" && !q ? c.offers.slice(0, 3) : c.offers).map((o) => (
                                  <li key={o.id}>
                                    <OfferRow offer={o} showPrice={info.showPrices} onPick={() => setOffer({ offer: o, category: c })} />
                                  </li>
                                ))}
                              </ul>
                              {category === "tous" && !q && c.offers.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setCategory(c.key)}
                                  className="mt-2 w-full rounded-xl border border-black/[0.08] py-2.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                                >
                                  {c.offers.length - 3} autre{c.offers.length - 3 > 1 ? "s" : ""} {c.label.toLowerCase()}
                                </button>
                              )}
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </main>
            </>
          )}

          <footer className="border-t border-black/[0.06] bg-[#fafaf8] px-6 py-5 text-center">
            {info.reception && state !== "loading" && (
              <a
                href={waLink(info.reception, `Bonjour ${hotelName}, `)}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-bold text-neutral-800 transition-colors hover:bg-neutral-50"
              >
                <MessageCircle size={15} strokeWidth={2} className="text-emerald-600" />
                Écrire à la réception
              </a>
            )}
            <p className="text-xs leading-relaxed text-neutral-500">
              Sans engagement — l&apos;établissement confirme par téléphone ou WhatsApp.
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-neutral-400">
              <span className="text-[11px]">Propulsé par</span>
              <Image src="/logo-header.png" alt="" width={16} height={16} className="h-4 w-auto opacity-60" />
              <span className="text-xs font-black text-neutral-600">twocards.</span>
            </div>
          </footer>
        </div>
      </div>

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

function OfferRow({ offer: o, showPrice, onPick }: { offer: GuestOffer; showPrice: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex w-full items-stretch gap-3.5 rounded-2xl border border-black/[0.06] bg-white p-3 text-left transition-all hover:border-black/[0.12] hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] active:scale-[0.99]"
    >
      <div className="relative w-[92px] shrink-0 self-stretch overflow-hidden rounded-xl bg-neutral-100 sm:w-[110px]">
        <Image src={o.image} alt="" fill sizes="110px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-display line-clamp-2 text-[15px] font-bold leading-snug tracking-tight">{o.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-neutral-500">
          <span className="font-medium text-neutral-700">{o.tag}</span>
          {o.city && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={11} strokeWidth={2} className="shrink-0" />
                {o.city}
              </span>
            </>
          )}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">{o.description}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="num text-xs font-bold text-neutral-800">{showPrice && o.price ? o.price : ""}</span>
          <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--accent)] px-3 text-xs font-bold text-[var(--on-accent)]">
            Réserver
            <ChevronRight size={13} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  );
}

function Inactive({ hotelName, reception }: { hotelName: string; reception: string | null }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
        <X size={20} strokeWidth={2} className="text-neutral-500" />
      </div>
      <h2 className="font-display text-xl font-bold tracking-tight">Ce menu n&apos;est plus disponible</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
        Ce QR code a été désactivé par l&apos;hôtel. Adressez-vous à la réception pour réserver vos sorties.
      </p>
      {reception && (
        <a
          href={waLink(reception, `Bonjour ${hotelName}, `)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--on-accent)]"
        >
          <MessageCircle size={15} strokeWidth={2} />
          Écrire à la réception
        </a>
      )}
    </main>
  );
}

/* ─── Feuille de réservation — trois temps ─────────────────────────────────── */

type Step = "details" | "contact" | "done";

const DAY_LABELS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_LABELS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
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
  const days = useMemo(() => {
    const out: Date[] = [];
    const t = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(t);
      d.setDate(t.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);
  const [step, setStep] = useState<Step>("details");
  const [partySize, setPartySize] = useState(2);
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
      p_category: category.label,
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
    });
    setSending(false);
    if (error) {
      setErrorMsg(
        error.message.includes("introuvable")
          ? "Ce QR code n'est plus actif. Adressez-vous à la réception."
          : "Impossible d'envoyer votre demande pour le moment. Réessayez ou contactez la réception."
      );
      return;
    }
    setStep("done");
  };

  const dark = isDarkHex(accent);
  const themeStyle = { "--accent": accent, "--on-accent": dark ? "#ffffff" : "#0a0a0a" } as CSSProperties;
  const field =
    "h-12 w-full rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

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
            <h3 className="font-display text-2xl font-black tracking-tight">Demande envoyée</h3>
            <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-neutral-600">
              <span className="font-bold text-neutral-900">{offer.name}</span>, {dateLabel}
              {chosenTime ? ` à ${chosenTime}` : ""}, pour {partySize} personne{partySize > 1 ? "s" : ""}.
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              L&apos;établissement vous confirme au <span className="num font-bold text-neutral-800">{phone}</span> par
              téléphone ou WhatsApp. {hotelName} est prévenu.
            </p>
            {preview && <p className="mt-3 text-xs font-bold text-amber-600">Aperçu : aucune demande n&apos;a été envoyée.</p>}
            <button
              type="button"
              onClick={onClose}
              className="mt-8 h-12 w-full rounded-xl bg-[var(--accent)] text-[15px] font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90"
            >
              Parfait
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col">
            {/* En-tête de la feuille */}
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/[0.06] bg-white/95 px-5 py-4 backdrop-blur">
              {step === "contact" ? (
                <button type="button" onClick={() => setStep("details")} aria-label="Retour" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                  <ArrowLeft size={16} strokeWidth={2.25} />
                </button>
              ) : (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <Image src={offer.image} alt="" fill sizes="44px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{category.label}</p>
                <h3 className="font-display truncate text-[17px] font-bold leading-tight tracking-tight">{offer.name}</h3>
              </div>
              <span className="num shrink-0 text-[11px] font-bold text-neutral-400">{step === "details" ? "1/2" : "2/2"}</span>
              <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {step === "details" && (
              <div className="space-y-6 px-5 pb-5 pt-5 sm:px-7">
                {/* Couverts */}
                <section>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    <Users size={12} strokeWidth={2.25} /> Personnes
                  </p>
                  <div className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-3 py-2">
                    <button type="button" aria-label="Moins de personnes" onClick={() => setPartySize((n) => Math.max(1, n - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
                      <Minus size={16} strokeWidth={2.25} />
                    </button>
                    <span className="num text-xl font-black">{partySize} <span className="text-sm font-medium text-neutral-500">personne{partySize > 1 ? "s" : ""}</span></span>
                    <button type="button" aria-label="Plus de personnes" onClick={() => setPartySize((n) => Math.min(50, n + 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm">
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
                            {i === 0 ? "auj." : i === 1 ? "dem." : DAY_LABELS[d.getDay()]}
                          </span>
                          <span className="num text-lg font-black leading-tight">{d.getDate()}</span>
                          <span className={cn("text-[10px] font-medium", active ? "opacity-80" : "text-neutral-400")}>{MONTH_LABELS[d.getMonth()]}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Heure */}
                <section>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    <Clock size={12} strokeWidth={2.25} /> Heure <span className="normal-case tracking-normal text-neutral-400">(facultatif)</span>
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
                      Autre
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
                  Continuer
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {step === "contact" && (
              <div className="space-y-4 px-5 pb-5 pt-5 sm:px-7">
                <div className="flex items-center justify-between rounded-xl bg-[#f7f6f3] px-4 py-3 text-sm">
                  <span className="text-neutral-600">
                    <span className="num font-bold text-neutral-900">{partySize}</span> pers. · {dateLabel}
                    {chosenTime ? ` · ${chosenTime}` : ""}
                  </span>
                  <button type="button" onClick={() => setStep("details")} className="text-xs font-bold text-[var(--accent)]">
                    Modifier
                  </button>
                </div>
                <div className="relative">
                  <User size={16} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input className={cn(field, "pl-11")} placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="name" autoFocus />
                </div>
                <div className="relative">
                  <Phone size={16} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input className={cn(field, "num pl-11")} type="tel" placeholder="Téléphone (WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={40} autoComplete="tel" inputMode="tel" />
                </div>
                <textarea
                  className="min-h-24 w-full resize-none rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  placeholder="Une précision ? Occasion, allergies, table souhaitée… (facultatif)"
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
                      <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> Envoi…
                    </>
                  ) : (
                    "Envoyer ma demande"
                  )}
                </button>
                <p className="text-center text-xs leading-relaxed text-neutral-500">
                  Sans engagement ni paiement — {hotelName} et l&apos;établissement sont prévenus, la confirmation arrive par téléphone ou WhatsApp.
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
