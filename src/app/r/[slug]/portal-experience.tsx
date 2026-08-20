"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Check,
  ChevronLeft,
  Loader2,
  Users,
  Clock,
} from "lucide-react";

/* Style « widget de réservation » à la SevenRooms : carte blanche centrée,
   typographie noire, beaucoup d'air, une couleur d'accent par établissement,
   parcours en trois temps — couverts / date / créneau, puis coordonnées,
   puis confirmation. Mobile : pleine largeur ; desktop : carte ~480 px.
   L'accent signe aussi les détails du navigateur (sélection, caret, focus). */

type Portal = {
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

type Step = "slots" | "details" | "done" | "notfound" | "loading";

/* Créneaux depuis l'amplitude configurée — gère le passage de minuit
   (19:00 → 01:00) : les créneaux après minuit portent dayOffset 1. */
type Slot = { label: string; dayOffset: 0 | 1 };

function buildSlots(start: string, end: string, interval: number): Slot[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let t = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= t) endMin += 24 * 60;
  const out: Slot[] = [];
  while (t <= endMin) {
    const h = Math.floor(t / 60) % 24;
    const m = t % 60;
    out.push({
      label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      dayOffset: t >= 24 * 60 ? 1 : 0,
    });
    t += interval;
  }
  return out;
}

/* Instant réel d'un créneau pour un jour donné — un créneau « 00:30 » d'une
   amplitude 19:00 → 01:00 a lieu le lendemain matin. */
function slotDateTime(dayIso: string, slot: Slot): Date {
  const d = new Date(`${dayIso}T${slot.label}:00`);
  if (slot.dayOffset) d.setDate(d.getDate() + 1);
  return d;
}

function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

const DAY_LABELS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH_LABELS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* Les fonds proposés vont du grège au noir : la carte blanche flotte
   différemment selon la luminosité du fond. */
const isDarkHex = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};

export function PortalExperience({
  slug,
  embed,
}: {
  slug: string;
  embed: boolean;
}) {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [party, setParty] = useState(2);
  const [date, setDate] = useState<string>(isoDay(new Date()));
  const [time, setTime] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Créneaux complets pour la date affichée : toutes les tables du plan de
     salle y portent déjà une réservation. Ils ne sont pas proposés. */
  const [fullSlots, setFullSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    createClient()
      .rpc("portal_get", { p_slug: slug })
      .then(({ data }) => {
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          setStep("notfound");
          return;
        }
        setPortal(row);
        /* Si tous les créneaux du jour sont déjà passés, ouvrir sur demain
           plutôt que sur une grille entièrement grisée. */
        const todayIso = isoDay(new Date());
        const s = buildSlots(row.start_time, row.end_time, row.interval_minutes);
        if (s.length && s.every((sl) => slotDateTime(todayIso, sl) < new Date())) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setDate(isoDay(tomorrow));
        }
        setStep("slots");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* La disponibilité se recharge à chaque changement de date. En cas
     d'échec réseau, on montre tout plutôt que de bloquer la vente. */
  useEffect(() => {
    let cancelled = false;
    createClient()
      .rpc("portal_full_slots", { p_slug: slug, p_date: date })
      .then(({ data }) => {
        if (cancelled) return;
        const full = new Set(
          ((data as { slot: string }[] | null) ?? []).map((r) => r.slot)
        );
        setFullSlots(full);
        setTime((t) => (t && full.has(t) ? null : t));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, date]);

  const slots = useMemo(
    () =>
      portal
        ? buildSlots(portal.start_time, portal.end_time, portal.interval_minutes)
        : [],
    [portal]
  );
  const openSlots = useMemo(
    () => slots.filter((s) => !fullSlots.has(s.label)),
    [slots, fullSlots]
  );
  const days = useMemo(() => nextDays(14), []);
  const accent = portal?.accent_color ?? "#13305c";
  const darkBg = portal ? isDarkHex(portal.background_color) : false;

  const now = new Date();
  /* Plus rien à proposer : tout est passé, ou complet. */
  const noSlotLeft =
    slots.length > 0 &&
    (openSlots.length === 0 ||
      openSlots.every((s) => slotDateTime(date, s) < now));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;
    setSending(true);
    setError(null);
    const { error: err } = await createClient().rpc(
      "portal_create_reservation",
      {
        p_slug: slug,
        p_guest_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        p_guest_phone: phone,
        p_date: date,
        p_time: time,
        p_party_size: party,
        p_notes: notes || null,
      }
    );
    setSending(false);
    if (err) {
      setError(
        "Impossible d'envoyer votre demande pour le moment. Réessayez dans un instant."
      );
      return;
    }
    setStep("done");
  };

  const selectedDate = days.find((d) => isoDay(d) === date) ?? days[0];

  return (
    <div
      data-portal=""
      className={`min-h-screen text-neutral-900 ${embed ? "" : "sm:py-10"}`}
      style={{
        background: portal?.background_color ?? "#f5f5f4",
        fontFamily: "var(--font-portal-ui), sans-serif",
        ["--portal-accent" as string]: accent,
      }}
    >
      {/* L'accent de l'établissement signe jusqu'aux détails du navigateur. */}
      <style>{`
        [data-portal] ::selection { background: var(--portal-accent); color: #fff; }
        [data-portal] :focus-visible { outline: 2px solid var(--portal-accent); outline-offset: 2px; }
        [data-portal] input, [data-portal] textarea { caret-color: var(--portal-accent); }
        [data-portal] .portal-rail { scrollbar-width: thin; scrollbar-color: #e5e5e5 transparent; }
        [data-portal] .portal-rail::-webkit-scrollbar { height: 4px; }
        [data-portal] .portal-rail::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 2px; }
        [data-portal] .portal-rail::-webkit-scrollbar-track { background: transparent; }
        @keyframes portal-pop { from { opacity: 0; transform: scale(0.82); } }
      `}</style>
      <div
        className={`mx-auto w-full bg-white ${
          embed
            ? "min-h-screen"
            : `min-h-screen sm:min-h-0 sm:max-w-[480px] sm:rounded-2xl ${
                darkBg
                  ? "sm:shadow-[0_32px_90px_-24px_rgba(0,0,0,0.85)]"
                  : "sm:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.3)]"
              }`
        }`}
      >
        {/* Photo de couverture importée par l'établissement — fondue dans
            l'en-tête pour que la maison ouvre la page, pas le widget. */}
        {portal?.cover_url && step !== "notfound" && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portal.cover_url}
              alt=""
              className={`h-48 w-full object-cover sm:h-52 ${
                embed ? "" : "sm:rounded-t-2xl"
              }`}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
          </div>
        )}

        {/* En-tête établissement */}
        <div className="border-b border-neutral-200 px-6 pb-5 pt-7 text-center">
          {/* Sans photo, un simple trait d'accent tient lieu de signature. */}
          {portal && !portal.cover_url && (
            <div
              className="mx-auto mb-4 h-[3px] w-8 rounded-full"
              style={{ background: accent }}
            />
          )}
          <h1 className="font-[family-name:var(--font-portal-display)] text-balance break-words text-[26px] font-normal tracking-wide">
            {step === "notfound" ? "Portail introuvable" : portal?.display_name ?? "…"}
          </h1>
          {portal?.tagline && step !== "notfound" && (
            <p className="mt-1 text-[13px] text-neutral-500">
              {portal.tagline}
            </p>
          )}
        </div>

        <div className="px-6 py-6">
          {step === "loading" && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-neutral-300" size={28} strokeWidth={1.5} />
            </div>
          )}

          {step === "notfound" && (
            <p className="py-10 text-center text-sm text-neutral-500">
              Ce portail de réservation n&apos;existe pas ou a été désactivé.
            </p>
          )}

          {/* ── Étape 1 : couverts, date, créneau ── */}
          {step === "slots" && portal && (
            <>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <Users size={12} strokeWidth={2} /> Nombre de personnes
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: portal.party_max }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setParty(n)}
                      aria-label={`${n} personne${n > 1 ? "s" : ""}`}
                      aria-pressed={party === n}
                      className="h-11 w-11 rounded-full border text-sm font-medium transition-colors"
                      style={
                        party === n
                          ? { background: accent, borderColor: accent, color: "#fff" }
                          : { borderColor: "#d4d4d4", color: "#404040" }
                      }
                    >
                      {n}
                    </button>
                  )
                )}
              </div>

              <p className="mb-2 mt-7 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <Calendar size={12} strokeWidth={2} /> Date
              </p>
              <div className="portal-rail -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {days.map((d) => {
                  const iso = isoDay(d);
                  const selected = iso === date;
                  return (
                    <button
                      key={iso}
                      onClick={() => {
                        setDate(iso);
                        /* Un créneau choisi peut être déjà passé sur la
                           nouvelle date (retour sur aujourd'hui). */
                        if (time) {
                          const sl = slots.find((s) => s.label === time);
                          if (sl && slotDateTime(iso, sl) < new Date())
                            setTime(null);
                        }
                      }}
                      aria-pressed={selected}
                      className="flex w-14 shrink-0 flex-col items-center rounded-xl border py-2.5 transition-colors"
                      style={
                        selected
                          ? { background: accent, borderColor: accent, color: "#fff" }
                          : { borderColor: "#e5e5e5", color: "#404040" }
                      }
                    >
                      <span className="text-[10px] uppercase opacity-80">
                        {DAY_LABELS[d.getDay()]}
                      </span>
                      <span className="text-lg font-semibold leading-6">
                        {d.getDate()}
                      </span>
                      <span className="text-[10px] opacity-80">
                        {MONTH_LABELS[d.getMonth()]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mb-2 mt-7 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <Clock size={12} strokeWidth={2} /> Heure
              </p>
              <div className="grid grid-cols-4 gap-2">
                {openSlots.map((s) => {
                  const past = slotDateTime(date, s) < now;
                  const selected = time === s.label;
                  return (
                    <button
                      key={s.label}
                      onClick={() => setTime(s.label)}
                      disabled={past}
                      aria-pressed={selected}
                      className="rounded-lg border py-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed"
                      style={
                        selected
                          ? { background: accent, borderColor: accent, color: "#fff" }
                          : past
                            ? { borderColor: "#f5f5f5", color: "#d4d4d4" }
                            : { borderColor: "#e5e5e5", color: "#404040" }
                      }
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {noSlotLeft && (
                <p className="mt-3 text-center text-[13px] text-neutral-500">
                  {openSlots.length === 0
                    ? "Complet pour cette date — choisissez un autre jour."
                    : "Plus de créneau disponible pour cette date — choisissez un autre jour."}
                </p>
              )}

              <button
                onClick={() => time && setStep("details")}
                disabled={!time}
                className="mt-8 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-30"
                style={{ background: accent }}
              >
                {time
                  ? `Continuer — ${DAY_LABELS[selectedDate.getDay()]} ${selectedDate.getDate()} ${MONTH_LABELS[selectedDate.getMonth()]} · ${time}`
                  : "Continuer"}
              </button>
              <p className="mt-3 text-center text-[11px] text-neutral-400">
                Sans prépaiement — l&apos;établissement confirme par téléphone
                ou WhatsApp.
              </p>
            </>
          )}

          {/* ── Étape 2 : coordonnées ── */}
          {step === "details" && portal && (
            <form onSubmit={submit}>
              <button
                type="button"
                onClick={() => setStep("slots")}
                className="mb-4 flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-neutral-900"
              >
                <ChevronLeft size={15} strokeWidth={2} /> Retour
              </button>

              <div className="mb-2 rounded-xl bg-neutral-50 px-4 py-3">
                <p className="text-[13px] text-neutral-600">
                  <span className="font-semibold text-neutral-900">
                    {portal.display_name}
                  </span>{" "}
                  — {party} pers. ·{" "}
                  {selectedDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  · {time}
                </p>
              </div>
              {/* La promesse avant l'effort : on demande un numéro, on dit
                  tout de suite pourquoi et ce qui n'est pas demandé. */}
              <p className="mb-6 px-1 text-[12px] leading-relaxed text-neutral-400">
                Sans prépaiement — l&apos;établissement vous confirme par
                téléphone ou WhatsApp.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  required
                  maxLength={60}
                  autoComplete="given-name"
                  className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  required
                  maxLength={60}
                  autoComplete="family-name"
                  className="rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
                />
              </div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Téléphone"
                type="tel"
                required
                maxLength={40}
                autoComplete="tel"
                className="mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Occasion, allergies, demande particulière… (facultatif)"
                maxLength={500}
                className="mt-3 min-h-20 w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
              />

              {error && (
                <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                style={{ background: accent }}
              >
                {sending ? (
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                ) : (
                  "Confirmer la réservation"
                )}
              </button>
            </form>
          )}

          {/* ── Étape 3 : confirmation ── */}
          {step === "done" && portal && (
            <div className="py-8 text-center">
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background: `${accent}1a`,
                  animation: "portal-pop 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
                }}
              >
                <Check size={30} strokeWidth={2} style={{ color: accent }} />
              </div>
              <h2 className="font-[family-name:var(--font-portal-display)] text-2xl font-normal">
                Demande envoyée
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
                {portal.display_name} vous recontactera au{" "}
                <span className="font-medium text-neutral-900">{phone}</span>{" "}
                pour confirmer votre table de {party} le{" "}
                {selectedDate.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}{" "}
                à {time}.
              </p>
              <button
                onClick={() => {
                  setStep("slots");
                  setTime(null);
                  setFirstName("");
                  setLastName("");
                  setPhone("");
                  setNotes("");
                }}
                className="mt-8 text-[13px] font-medium underline-offset-4 hover:underline"
                style={{ color: accent }}
              >
                Faire une autre réservation
              </button>
            </div>
          )}
        </div>

        {/* Pied — présent aussi en embed : c'est la marque du réseau */}
        <div className="flex items-center justify-center gap-1.5 border-t border-neutral-100 py-4 text-neutral-400">
          <span className="text-[11px]">Propulsé par</span>
          <Image
            src="/logo-header.png"
            alt="twocards."
            width={18}
            height={18}
            className="h-4 w-auto opacity-60"
          />
          <span className="text-[11px] font-bold text-neutral-500">
            twocards.
          </span>
        </div>
      </div>
    </div>
  );
}
