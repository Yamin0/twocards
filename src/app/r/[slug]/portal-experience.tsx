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
   puis confirmation. Mobile : pleine largeur ; desktop : carte ~480 px. */

type Portal = {
  display_name: string;
  tagline: string;
  accent_color: string;
  party_max: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
};

type Step = "slots" | "details" | "done" | "notfound" | "loading";

/* Créneaux depuis l'amplitude configurée — gère le passage de minuit
   (19:00 → 01:00). */
function buildSlots(start: string, end: string, interval: number): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let t = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= t) endMin += 24 * 60;
  const out: string[] = [];
  while (t <= endMin) {
    const h = Math.floor(t / 60) % 24;
    const m = t % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    t += interval;
  }
  return out;
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
        setStep("slots");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const slots = useMemo(
    () =>
      portal
        ? buildSlots(portal.start_time, portal.end_time, portal.interval_minutes)
        : [],
    [portal]
  );
  const days = useMemo(() => nextDays(14), []);
  const accent = portal?.accent_color ?? "#13305c";

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
      className={`min-h-screen bg-neutral-100 text-neutral-900 ${
        embed ? "" : "sm:py-10"
      }`}
    >
      <div
        className={`mx-auto w-full bg-white ${
          embed
            ? "min-h-screen"
            : "min-h-screen sm:min-h-0 sm:max-w-[480px] sm:rounded-2xl sm:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.3)]"
        }`}
      >
        {/* En-tête établissement */}
        <div className="border-b border-neutral-200 px-6 pb-5 pt-7 text-center">
          <p
            className="font-ui text-[10px] font-bold uppercase tracking-[0.25em]"
            style={{ color: accent }}
          >
            Réservation
          </p>
          <h1 className="font-display mt-1 text-2xl font-normal">
            {step === "notfound" ? "Portail introuvable" : portal?.display_name ?? "…"}
          </h1>
          {portal?.tagline && step !== "notfound" && (
            <p className="font-ui mt-1 text-[13px] text-neutral-500">
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
            <p className="font-ui py-10 text-center text-sm text-neutral-500">
              Ce portail de réservation n&apos;existe pas ou a été désactivé.
            </p>
          )}

          {/* ── Étape 1 : couverts, date, créneau ── */}
          {step === "slots" && portal && (
            <>
              <p className="font-ui mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <Users size={12} strokeWidth={2} /> Nombre de personnes
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: portal.party_max }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setParty(n)}
                      aria-label={`${n} personne${n > 1 ? "s" : ""}`}
                      className="font-ui h-10 w-10 rounded-full border text-sm font-medium transition-colors"
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

              <p className="font-ui mb-2 mt-7 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <Calendar size={12} strokeWidth={2} /> Date
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {days.map((d) => {
                  const iso = isoDay(d);
                  const selected = iso === date;
                  return (
                    <button
                      key={iso}
                      onClick={() => setDate(iso)}
                      className="font-ui flex w-14 shrink-0 flex-col items-center rounded-xl border py-2.5 transition-colors"
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

              <p className="font-ui mb-2 mt-7 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <Clock size={12} strokeWidth={2} /> Heure
              </p>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTime(s)}
                    className="font-ui rounded-lg border py-2.5 text-[13px] font-medium transition-colors"
                    style={
                      time === s
                        ? { background: accent, borderColor: accent, color: "#fff" }
                        : { borderColor: "#e5e5e5", color: "#404040" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={() => time && setStep("details")}
                disabled={!time}
                className="font-ui mt-8 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-30"
                style={{ background: accent }}
              >
                Continuer
              </button>
            </>
          )}

          {/* ── Étape 2 : coordonnées ── */}
          {step === "details" && portal && (
            <form onSubmit={submit}>
              <button
                type="button"
                onClick={() => setStep("slots")}
                className="font-ui mb-4 flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-neutral-900"
              >
                <ChevronLeft size={15} strokeWidth={2} /> Retour
              </button>

              <div className="mb-6 rounded-xl bg-neutral-50 px-4 py-3">
                <p className="font-ui text-[13px] text-neutral-600">
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

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  required
                  maxLength={60}
                  autoComplete="given-name"
                  className="font-ui rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  required
                  maxLength={60}
                  autoComplete="family-name"
                  className="font-ui rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
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
                className="font-ui mt-3 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Occasion, allergies, demande particulière… (facultatif)"
                maxLength={500}
                className="font-ui mt-3 min-h-20 w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900"
              />

              {error && (
                <p className="font-ui mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="font-ui mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                style={{ background: accent }}
              >
                {sending ? (
                  <Loader2 size={16} strokeWidth={2} className="animate-spin" />
                ) : (
                  "Confirmer la réservation"
                )}
              </button>
              <p className="font-ui mt-3 text-center text-[11px] text-neutral-400">
                Sans prépaiement — confirmation par téléphone ou WhatsApp.
              </p>
            </form>
          )}

          {/* ── Étape 3 : confirmation ── */}
          {step === "done" && portal && (
            <div className="py-8 text-center">
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: `${accent}1a` }}
              >
                <Check size={30} strokeWidth={2} style={{ color: accent }} />
              </div>
              <h2 className="font-display text-2xl font-normal">
                Demande envoyée
              </h2>
              <p className="font-ui mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
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
                className="font-ui mt-8 text-[13px] font-medium underline-offset-4 hover:underline"
                style={{ color: accent }}
              >
                Faire une autre réservation
              </button>
            </div>
          )}
        </div>

        {/* Pied — présent aussi en embed : c'est la marque du réseau */}
        <div className="flex items-center justify-center gap-1.5 border-t border-neutral-100 py-4 text-neutral-400">
          <span className="font-ui text-[11px]">Propulsé par</span>
          <Image
            src="/logo-header.png"
            alt="twocards."
            width={18}
            height={18}
            className="h-4 w-auto opacity-60"
          />
          <span className="font-ui text-[11px] font-bold text-neutral-500">
            twocards.
          </span>
        </div>
      </div>
    </div>
  );
}
