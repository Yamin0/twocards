"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2, Star } from "lucide-react";

type Context = {
  venue_name: string;
  reservation_date: string;
  already_rated: boolean;
};

type Phase = "loading" | "form" | "sending" | "done" | "invalid";

const RATING_LABELS = [
  "",
  "Décevante",
  "Moyenne",
  "Bien",
  "Très bien",
  "Exceptionnelle",
];

export function RatingExperience({
  reservationId,
}: {
  reservationId: string;
}) {
  const [context, setContext] = useState<Context | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    let cancelled = false;
    createClient()
      .rpc("qr_rating_context", { p_id: reservationId })
      .then(({ data, error }) => {
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) {
          setPhase("invalid");
          return;
        }
        setContext(row);
        setPhase(row.already_rated ? "done" : "form");
      });
    return () => {
      cancelled = true;
    };
  }, [reservationId]);

  const submit = async () => {
    if (rating === 0) return;
    setPhase("sending");
    const { error } = await createClient().rpc("qr_rate_reservation", {
      p_id: reservationId,
      p_rating: rating,
      p_comment: comment || null,
    });
    setPhase(error ? "form" : "done");
  };

  const active = hover || rating;

  return (
    <div className="min-h-screen relative bg-[#0a0c14] flex items-center justify-center px-4 py-10">
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/concierges-hero.jpg)" }}
      />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-[#10131f]/95 backdrop-blur-2xl p-8 text-center">
        {phase === "loading" && (
          <Loader2
            size={28}
            strokeWidth={1.5}
            className="mx-auto animate-spin text-white/50"
          />
        )}

        {phase === "invalid" && (
          <>
            <h1 className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
              Lien invalide
            </h1>
            <p className="mt-2 text-sm text-white/60 font-[family-name:var(--font-inter)]">
              Cette réservation est introuvable ou a été annulée.
            </p>
          </>
        )}

        {(phase === "form" || phase === "sending") && context && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 font-[family-name:var(--font-inter)]">
              Votre avis compte
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
              Comment était votre sortie chez {context.venue_name} ?
            </h1>
            <p className="mt-1 text-xs text-white/40 font-[family-name:var(--font-inter)]">
              {new Date(
                context.reservation_date + "T00:00:00"
              ).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>

            <div className="mt-7 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    strokeWidth={1.5}
                    className={
                      n <= active
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/25"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 h-5 text-sm font-medium text-amber-300 font-[family-name:var(--font-inter)]">
              {active > 0 ? RATING_LABELS[active] : ""}
            </p>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Un mot sur votre expérience ? (facultatif)"
              className="mt-4 w-full min-h-24 resize-none rounded-xl bg-white/[0.07] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/40 font-[family-name:var(--font-inter)]"
            />

            <button
              onClick={submit}
              disabled={rating === 0 || phase === "sending"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-black transition-colors hover:bg-white/90 disabled:opacity-40 font-[family-name:var(--font-manrope)]"
            >
              {phase === "sending" ? (
                <Loader2 size={16} strokeWidth={2} className="animate-spin" />
              ) : (
                "Envoyer mon avis"
              )}
            </button>
          </>
        )}

        {phase === "done" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/30">
              <Check size={30} strokeWidth={2} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
              Merci pour votre avis
            </h1>
            <p className="mt-2 text-sm text-white/60 font-[family-name:var(--font-inter)]">
              Il aide {context?.venue_name ?? "l'établissement"} et votre hôtel
              à rendre chaque sortie meilleure.
            </p>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-white/40">
          <span className="text-xs font-[family-name:var(--font-inter)]">
            Propulsé par
          </span>
          <Image
            src="/logo-header.png"
            alt="twocards."
            width={24}
            height={24}
            className="h-5 w-auto opacity-70 brightness-0 invert"
          />
        </div>
      </div>
    </div>
  );
}
