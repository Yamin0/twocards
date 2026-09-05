"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

/* Avis post-sortie, même langage que le menu client : carte blanche, Satoshi,
   un seul geste — cinq étoiles, un mot facultatif. */

type Context = {
  venue_name: string;
  reservation_date: string;
  already_rated: boolean;
};

type Phase = "loading" | "form" | "sending" | "done" | "invalid";

const RATING_LABELS = ["", "Décevante", "Moyenne", "Bien", "Très bien", "Exceptionnelle"];

export function RatingExperience({ reservationId }: { reservationId: string }) {
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
    <div className="satoshi flex min-h-screen items-center justify-center bg-[#f4f3ef] px-4 py-10 text-neutral-900">
      <div className="w-full max-w-md rounded-[1.75rem] border border-black/[0.06] bg-white p-8 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
        {phase === "loading" && <Loader2 size={28} strokeWidth={1.75} className="mx-auto animate-spin text-neutral-400" />}

        {phase === "invalid" && (
          <>
            <h1 className="font-display text-2xl font-black tracking-tight">Lien invalide</h1>
            <p className="mt-2 text-sm text-neutral-500">Cette réservation est introuvable ou a été annulée.</p>
          </>
        )}

        {(phase === "form" || phase === "sending") && context && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-400">Votre avis compte</p>
            <h1 className="font-display mt-3 text-[1.6rem] font-black leading-tight tracking-tight">
              Comment était votre sortie chez {context.venue_name}&nbsp;?
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              {new Date(context.reservation_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            <div className="mt-7 flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star size={38} strokeWidth={1.5} className={cn(n <= active ? "fill-amber-400 text-amber-400" : "text-neutral-200")} />
                </button>
              ))}
            </div>
            <p className="mt-2 h-5 text-sm font-bold text-amber-600">{active > 0 ? RATING_LABELS[active] : ""}</p>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Un mot sur votre expérience ? (facultatif)"
              className="mt-4 min-h-24 w-full resize-none rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-4 py-3 text-[15px] placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />

            <button
              type="button"
              onClick={submit}
              disabled={rating === 0 || phase === "sending"}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "sending" ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : "Envoyer mon avis"}
            </button>
          </>
        )}

        {phase === "done" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={30} strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight">Merci pour votre avis</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Il aide {context?.venue_name ?? "l'établissement"} et votre hôtel à rendre chaque sortie meilleure.
            </p>
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-1.5 text-neutral-400">
          <span className="text-[11px]">Propulsé par</span>
          <Image src="/logo-header.png" alt="" width={16} height={16} className="h-4 w-auto opacity-60" />
          <span className="text-xs font-black text-neutral-600">twocards.</span>
        </div>
      </div>
    </div>
  );
}
