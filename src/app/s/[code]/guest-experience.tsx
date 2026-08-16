"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  GUEST_CATEGORIES,
  type GuestCategory,
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
  Minus,
  Music,
  Palmtree,
  Phone,
  Plus,
  Sparkles,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";

const CATEGORY_ICONS = {
  restaurants: UtensilsCrossed,
  activites: Palmtree,
  clubs: Music,
  services: Sparkles,
} as const;

type SubmitState = "idle" | "sending" | "done" | "error";

/* Une demande par session et par QR : évite le double comptage du scan
   (StrictMode, retours arrière) sans cookie ni consentement. */
function trackScanOnce(code: string) {
  const key = `qr-scan-${code}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  createClient()
    .rpc("qr_track_scan", { p_code: code })
    .then(() => undefined, () => undefined);
}

export function GuestExperience({
  code,
  hotelName,
}: {
  code: string;
  hotelName: string | null;
}) {
  const [category, setCategory] = useState<GuestCategory | null>(null);
  const [offer, setOffer] = useState<GuestOffer | null>(null);

  useEffect(() => {
    trackScanOnce(code);
  }, [code]);

  /* Retour en haut à chaque changement de vue : sur mobile, la liste
     précédente peut laisser un scroll profond. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  return (
    <div className="min-h-screen relative bg-[#0a0c14]">
      {/* Fond zellige — même langage visuel que le reste de la plateforme */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/concierges-hero.jpg)" }}
      />
      <div className="fixed inset-0 bg-black/55" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      <div className="relative z-10 mx-auto w-full max-w-md px-4 pb-10 pt-8 sm:max-w-3xl sm:px-8 sm:pt-14 lg:max-w-6xl lg:pt-20">
        {category === null ? (
          <MenuView hotelName={hotelName} onPick={setCategory} />
        ) : (
          <CategoryView
            category={category}
            onBack={() => setCategory(null)}
            onReserve={setOffer}
          />
        )}

        <footer className="mt-10 flex items-center justify-center gap-2 text-white/40 sm:mt-16">
          <span className="text-xs font-[family-name:var(--font-inter)]">
            Propulsé par
          </span>
          <Image
            src="/logo-header.png"
            alt="twocards."
            width={24}
            height={24}
            className="h-6 w-auto opacity-70 brightness-0 invert"
          />
        </footer>
      </div>

      {offer && category && (
        <ReservationSheet
          code={code}
          category={category}
          offer={offer}
          onClose={() => setOffer(null)}
        />
      )}
    </div>
  );
}

/* ─── Menu principal ─────────────────────────────────────────────────────── */

function MenuView({
  hotelName,
  onPick,
}: {
  hotelName: string | null;
  onPick: (c: GuestCategory) => void;
}) {
  return (
    <div>
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 font-[family-name:var(--font-inter)] sm:text-xs lg:text-sm">
        Votre conciergerie
      </p>
      <h1 className="mt-2 text-center text-3xl font-extrabold text-white font-[family-name:var(--font-manrope)] sm:mt-3 sm:text-5xl lg:text-6xl">
        {hotelName ?? "Bienvenue"}
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-relaxed text-white/60 font-[family-name:var(--font-inter)] sm:mt-4 sm:max-w-lg sm:text-base lg:text-lg">
        Réservez vos plus belles sorties en quelques secondes — l&apos;hôtel
        s&apos;occupe du reste.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {GUEST_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => onPick(cat)}
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/15 text-left shadow-lg shadow-black/30 transition-transform hover:-translate-y-1 active:scale-[0.97] sm:rounded-[2rem]"
            >
              <Image
                src={cat.image}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md sm:mb-3 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <Icon
                    strokeWidth={1.5}
                    className="h-[18px] w-[18px] text-white sm:h-6 sm:w-6"
                  />
                </div>
                <p className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] sm:text-2xl">
                  {cat.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-white/60 font-[family-name:var(--font-inter)] sm:mt-1 sm:text-sm">
                  {cat.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Liste d'une catégorie ──────────────────────────────────────────────── */

function CategoryView({
  category,
  onBack,
  onReserve,
}: {
  category: GuestCategory;
  onBack: () => void;
  onReserve: (o: GuestOffer) => void;
}) {
  const Icon = CATEGORY_ICONS[category.key];
  return (
    <div>
      <div className="mb-6 flex items-center gap-3 sm:mb-10 sm:gap-5">
        <button
          onClick={onBack}
          aria-label="Retour au menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:h-14 sm:w-14"
        >
          <ArrowLeft strokeWidth={1.5} className="h-[18px] w-[18px] sm:h-6 sm:w-6" />
        </button>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-white font-[family-name:var(--font-manrope)] sm:gap-3 sm:text-4xl lg:text-5xl">
            <Icon
              strokeWidth={1.5}
              className="h-[18px] w-[18px] text-white/70 sm:h-8 sm:w-8"
            />
            {category.label}
          </h2>
          <p className="text-xs text-white/50 font-[family-name:var(--font-inter)] sm:mt-1 sm:text-base">
            {category.tagline}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {category.offers.map((o) => (
          <button
            key={o.id}
            onClick={() => onReserve(o)}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/12 bg-black/40 text-left backdrop-blur-xl transition-transform hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className="relative h-36 shrink-0 sm:h-48 lg:h-52">
              <Image
                src={o.image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md font-[family-name:var(--font-inter)]">
                {o.tag}
              </span>
              {o.price && (
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-black font-[family-name:var(--font-inter)]">
                  {o.price}
                </span>
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="line-clamp-2 text-base font-bold text-white font-[family-name:var(--font-manrope)] sm:text-lg">
                  {o.name}
                </p>
                {o.city && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/50 font-[family-name:var(--font-inter)] sm:text-xs">
                    <MapPin size={11} strokeWidth={1.5} />
                    {o.city}
                  </p>
                )}
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/60 font-[family-name:var(--font-inter)] sm:text-sm">
                  {o.description}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:translate-x-0.5 sm:h-11 sm:w-11">
                <ChevronRight size={16} strokeWidth={2} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Feuille de réservation ─────────────────────────────────────────────── */

function ReservationSheet({
  code,
  category,
  offer,
  onClose,
}: {
  code: string;
  category: GuestCategory;
  offer: GuestOffer;
  onClose: () => void;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* La feuille recouvre tout : on gèle le scroll de la page derrière. */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const { error } = await createClient().rpc("qr_create_reservation", {
      p_code: code,
      p_category: category.label,
      p_venue: offer.name,
      p_guest_name: name,
      p_guest_phone: phone,
      p_date: date,
      p_time: time || null,
      p_party_size: partySize,
      p_notes: notes || null,
    });
    if (error) {
      setErrorMsg(
        error.message.includes("introuvable")
          ? "Ce QR code n'est plus actif. Adressez-vous à la réception."
          : "Impossible d'envoyer votre demande pour le moment. Réessayez ou contactez la réception."
      );
      setState("error");
      return;
    }
    setState("done");
  };

  const field =
    "w-full rounded-xl bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/40 font-[family-name:var(--font-inter)]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/15 bg-[#10131f]/95 backdrop-blur-2xl sm:max-w-lg sm:rounded-3xl">
        {state === "done" ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/30">
              <Check size={30} strokeWidth={2} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
              Demande envoyée
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60 font-[family-name:var(--font-inter)]">
              Votre demande pour <span className="text-white">{offer.name}</span>{" "}
              le {new Date(date + "T00:00:00").toLocaleDateString("fr-FR")} a
              bien été transmise. Vous serez recontacté au{" "}
              <span className="text-white">{phone}</span> pour confirmation.
            </p>
            <button
              onClick={onClose}
              className="mt-8 w-full rounded-xl bg-white py-3 text-sm font-bold text-black transition-colors hover:bg-white/90 font-[family-name:var(--font-manrope)]"
            >
              Parfait
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)]">
                  {category.label}
                </p>
                <h3 className="mt-0.5 text-lg font-extrabold text-white font-[family-name:var(--font-manrope)]">
                  {offer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-lg p-1 text-white/40 transition-colors hover:text-white"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <User
                  size={15}
                  strokeWidth={1.5}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  className={`${field} pl-11`}
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </div>
              <div className="relative">
                <Phone
                  size={15}
                  strokeWidth={1.5}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  className={`${field} pl-11`}
                  type="tel"
                  placeholder="Téléphone (WhatsApp)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength={40}
                  autoComplete="tel"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar
                    size={15}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    className={`${field} pl-11 [color-scheme:dark]`}
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <Clock
                    size={15}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    className={`${field} pl-11 [color-scheme:dark]`}
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/[0.07] px-4 py-3">
                <span className="text-sm text-white/70 font-[family-name:var(--font-inter)]">
                  Personnes
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Moins de personnes"
                    onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <Minus size={14} strokeWidth={2} />
                  </button>
                  <span className="w-6 text-center text-base font-bold text-white font-[family-name:var(--font-manrope)]">
                    {partySize}
                  </span>
                  <button
                    type="button"
                    aria-label="Plus de personnes"
                    onClick={() => setPartySize((n) => Math.min(50, n + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <Plus size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <textarea
                className={`${field} min-h-20 resize-none`}
                placeholder="Une précision ? (occasion, allergies, table souhaitée…)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>

            {state === "error" && (
              <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-300 font-[family-name:var(--font-inter)]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black transition-colors hover:bg-white/90 disabled:opacity-60 font-[family-name:var(--font-manrope)]"
            >
              {state === "sending" ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                  Envoi…
                </>
              ) : (
                "Demander une réservation"
              )}
            </button>
            <p className="mt-3 text-center text-[11px] text-white/40 font-[family-name:var(--font-inter)]">
              Sans engagement — confirmation par téléphone ou WhatsApp.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
