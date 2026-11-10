"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/i18n";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

/* Avis post-sortie, même langage que le menu client : carte blanche, Satoshi,
   un seul geste — cinq étoiles, un mot facultatif. */

type Context = {
  venue_name: string;
  reservation_date: string;
  already_rated: boolean;
  /* Lien « Demander des avis » de la fiche Google de l'établissement, saisi
     dans ses réglages. Absent tant que la migration
     20261110120000_google_review_link n'est pas passée, ou si
     l'établissement ne l'a pas renseigné : l'invitation ne s'affiche pas. */
  google_review_url?: string | null;
};

/* Seul un lien https est rendu (le champ vient des réglages de
   l'établissement, jamais d'un schéma javascript: ou autre). */
const safeReviewUrl = (url?: string | null) =>
  url && /^https:\/\/\S+$/i.test(url) ? url : null;

type Phase = "loading" | "form" | "sending" | "done" | "invalid";

const getRatingLabels = (t: Translate) => [
  "",
  t("Décevante", "Disappointing"),
  t("Moyenne", "Average"),
  t("Bien", "Good"),
  t("Très bien", "Very good"),
  t("Exceptionnelle", "Exceptional"),
];

export function RatingExperience({ reservationId }: { reservationId: string }) {
  const t = useT();
  const intl = useIntlLocale();
  const RATING_LABELS = getRatingLabels(t);
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
    <div className="satoshi relative flex min-h-screen items-center justify-center bg-[#f4f3ef] px-4 py-10 text-neutral-900">
      <LanguageSwitcher tone="light" className="absolute right-4 top-4" />
      <div className="w-full max-w-md rounded-[1.75rem] border border-black/[0.06] bg-white p-8 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)]">
        {phase === "loading" && <Loader2 size={28} strokeWidth={1.75} className="mx-auto animate-spin text-neutral-400" />}

        {phase === "invalid" && (
          <>
            <h1 className="font-display text-2xl font-black tracking-tight">{t("Lien invalide", "Invalid link")}</h1>
            <p className="mt-2 text-sm text-neutral-500">
              {t("Cette réservation est introuvable ou a été annulée.", "This reservation could not be found or has been cancelled.")}
            </p>
          </>
        )}

        {(phase === "form" || phase === "sending") && context && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-neutral-400">{t("Votre avis compte", "Your review matters")}</p>
            <h1 className="font-display mt-3 text-[1.6rem] font-black leading-tight tracking-tight">
              {t(
                <>Comment était votre sortie chez {context.venue_name}&nbsp;?</>,
                <>How was your outing at {context.venue_name}?</>
              )}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              {new Date(context.reservation_date + "T00:00:00").toLocaleDateString(intl, { weekday: "long", day: "numeric", month: "long" })}
            </p>

            <div className="mt-7 flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={t(`${n} étoile${n > 1 ? "s" : ""}`, `${n} star${n === 1 ? "" : "s"}`)}
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
              placeholder={t("Un mot sur votre expérience ? (facultatif)", "A few words about your experience? (optional)")}
              className="mt-4 min-h-24 w-full resize-none rounded-xl border border-black/[0.08] bg-[#f7f6f3] px-4 py-3 text-[15px] placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />

            <button
              type="button"
              onClick={submit}
              disabled={rating === 0 || phase === "sending"}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === "sending" ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" /> : t("Envoyer mon avis", "Submit my review")}
            </button>
          </>
        )}

        {phase === "done" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={30} strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight">{t("Merci pour votre avis", "Thank you for your review")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              {t(
                <>Il aide {context?.venue_name ?? "l'établissement"} et votre hôtel à rendre chaque sortie meilleure.</>,
                <>It helps {context?.venue_name ?? "the venue"} and your hotel make every outing even better.</>
              )}
            </p>

            {/* Invitation Google proposée à tous les clients, quelle que soit
                leur note : la réserver aux 5 étoiles (« review gating ») est
                interdit par les règles d'avis de Google. */}
            {safeReviewUrl(context?.google_review_url) && (
              <div className="mt-7 rounded-2xl border border-black/[0.06] bg-[#f7f6f3] p-5">
                <p className="text-[15px] font-bold leading-snug">
                  {t("Partager votre expérience sur Google ?", "Share your experience on Google?")}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {t(
                    <>Votre avis aide d&apos;autres voyageurs à trouver {context?.venue_name ?? "cette adresse"}.</>,
                    <>Your review helps other travellers discover {context?.venue_name ?? "this place"}.</>
                  )}
                </p>
                <a
                  href={safeReviewUrl(context?.google_review_url)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-neutral-900 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
                >
                  {t("Laisser un avis Google", "Leave a Google review")}
                </a>
              </div>
            )}
          </>
        )}

        <div className="mt-8 flex items-center justify-center gap-1.5 text-neutral-400">
          <span className="text-[11px]">{t("Propulsé par", "Powered by")}</span>
          <Image src="/logo-header.png" alt="" width={16} height={16} className="h-4 w-auto opacity-60" />
          <span className="text-xs font-black text-neutral-600">twocards.</span>
        </div>
      </div>
    </div>
  );
}
