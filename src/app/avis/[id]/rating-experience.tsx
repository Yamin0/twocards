"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { LanguageToggle } from "@/components/booking/language-toggle";
import { PoweredBy } from "@/components/booking/powered-by";
import { RetryPanel } from "@/components/booking/retry-panel";
import { fromIsoDay, longDate } from "@/lib/booking/dates";
import { isNetworkError } from "@/lib/booking/errors";
import { createClient } from "@/lib/supabase/client";
import type { Translate } from "@/lib/i18n";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { StarRating } from "./_components/star-rating";

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
const safeReviewUrl = (url?: string | null) => (url && /^https:\/\/\S+$/i.test(url) ? url : null);

/* « invalid » : la base a répondu, la réservation n'existe pas (ou plus).
   « offline » : la base n'a pas répondu — on propose de réessayer. */
type Phase = "loading" | "form" | "sending" | "done" | "invalid" | "offline";

const getRatingLabels = (t: Translate) => [
  "",
  t("Décevante", "Disappointing"),
  t("Moyenne", "Average"),
  t("Bien", "Good"),
  t("Très bien", "Very good"),
  t("Exceptionnelle", "Exceptional"),
];

type RpcFailure = { message?: string | null; code?: string | null };

export function RatingExperience({ reservationId }: { reservationId: string }) {
  const t = useT();
  const intl = useIntlLocale();
  const titleId = useId();
  const commentId = useId();
  const errorId = useId();
  const [context, setContext] = useState<Context | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [failure, setFailure] = useState<RpcFailure | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const settle = (row: Context | null, error: RpcFailure | null) => {
      if (cancelled) return;
      if (error && (isNetworkError(error) || !error.code)) {
        setPhase("offline");
      } else if (error || !row) {
        setPhase("invalid");
      } else {
        setContext(row);
        setPhase(row.already_rated ? "done" : "form");
      }
    };
    createClient()
      .rpc("qr_rating_context", { p_id: reservationId })
      .then(
        ({ data, error }) => settle((Array.isArray(data) ? data[0] : data) ?? null, error),
        (e: unknown) => settle(null, { message: e instanceof Error ? e.message : "Failed to fetch" })
      );
    return () => {
      cancelled = true;
    };
  }, [reservationId, attempt]);

  const reload = useCallback(() => {
    setPhase("loading");
    setAttempt((n) => n + 1);
  }, []);

  const submit = async () => {
    if (rating === 0 || phase === "sending") return;
    setPhase("sending");
    setFailure(null);
    let error: RpcFailure | null = null;
    try {
      const res = await createClient().rpc("qr_rate_reservation", {
        p_id: reservationId,
        p_rating: rating,
        p_comment: comment || null,
      });
      error = res.error;
    } catch (e) {
      error = { message: e instanceof Error ? e.message : "Failed to fetch" };
    }
    if (error) {
      setFailure(error);
      setPhase("form");
      return;
    }
    setPhase("done");
  };

  /* Pourquoi l'envoi a échoué, et quoi faire : la note reste en place. */
  const failureMessage = !failure
    ? null
    : (failure.message ?? "").includes("déjà notée")
      ? t(
          "Cette sortie a déjà été notée, ou la réservation n'existe plus. Votre note n'a pas été enregistrée une seconde fois.",
          "This outing has already been rated, or the reservation no longer exists. Your rating was not recorded a second time."
        )
      : (failure.message ?? "").includes("Sortie à venir")
        ? t(
            "Vous pourrez laisser votre avis à partir du jour de votre sortie.",
            "You'll be able to leave your review from the day of your outing."
          )
        : isNetworkError(failure)
        ? t(
            "Pas de connexion : votre avis n'est pas parti. Vérifiez votre réseau puis réessayez.",
            "No connection: your review was not sent. Check your network and try again."
          )
        : t(
            "Votre avis n'a pas pu être enregistré. Votre note est conservée : réessayez dans un instant.",
            "Your review could not be saved. Your rating is kept: please try again in a moment."
          );

  const reviewUrl = safeReviewUrl(context?.google_review_url);

  return (
    <div className="satoshi relative flex min-h-screen items-center justify-center bg-[#f4f3ef] px-4 py-14 text-neutral-900">
      <LanguageToggle tone="light" className="absolute right-2 top-2" />
      <main className="w-full max-w-md rounded-[1.75rem] border border-black/[0.06] bg-white p-7 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] sm:p-8">
        {phase === "loading" && (
          <p role="status" className="py-6">
            <Loader2 size={28} strokeWidth={1.75} className="mx-auto animate-spin text-neutral-500" aria-hidden />
            <span className="sr-only">{t("Chargement…", "Loading…")}</span>
          </p>
        )}

        {phase === "offline" && (
          <RetryPanel title={t("La page ne s'est pas chargée", "The page didn't load")} onRetry={reload} className="px-0 py-4">
            {t(
              "La connexion a été interrompue. Vérifiez votre réseau puis réessayez.",
              "The connection was interrupted. Check your network and try again."
            )}
          </RetryPanel>
        )}

        {phase === "invalid" && (
          <>
            <h1 className="font-display text-2xl font-black tracking-tight">{t("Lien invalide", "Invalid link")}</h1>
            <p className="mt-2 text-base text-neutral-700">
              {t("Cette réservation est introuvable ou a été annulée.", "This reservation could not be found or has been cancelled.")}
            </p>
          </>
        )}

        {(phase === "form" || phase === "sending") && context && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <h1 id={titleId} className="font-display text-[1.6rem] font-black leading-tight tracking-tight">
              {t(
                <>Comment était votre sortie chez {context.venue_name}&nbsp;?</>,
                <>How was your outing at {context.venue_name}?</>
              )}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-600">{longDate(fromIsoDay(context.reservation_date), intl)}</p>

            <StarRating value={rating} onChange={setRating} labels={getRatingLabels(t)} labelledBy={titleId} disabled={phase === "sending"} />

            <label htmlFor={commentId} className="mb-1.5 mt-4 block text-left text-sm font-bold text-neutral-800">
              {t("Un mot sur votre expérience ?", "A few words about your experience?")}{" "}
              <span className="font-medium text-neutral-600">{t("(facultatif)", "(optional)")}</span>
            </label>
            <textarea
              id={commentId}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              className="min-h-24 w-full resize-none rounded-xl border border-black/[0.14] bg-[#f7f6f3] px-4 py-3 text-base text-neutral-900 focus:border-neutral-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />

            {failureMessage && (
              <p id={errorId} role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-left text-sm leading-relaxed text-red-800">
                {failureMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={rating === 0 || phase === "sending"}
              aria-describedby={failureMessage ? errorId : undefined}
              className="mt-5 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-45"
            >
              {phase === "sending" ? (
                <>
                  <Loader2 size={17} strokeWidth={2.5} className="animate-spin" aria-hidden /> {t("Envoi…", "Sending…")}
                </>
              ) : failureMessage ? (
                t("Réessayer", "Try again")
              ) : (
                t("Envoyer mon avis", "Submit my review")
              )}
            </button>
            {rating === 0 && (
              <p className="mt-2 text-sm text-neutral-600">{t("Touchez une étoile pour noter.", "Tap a star to rate.")}</p>
            )}
          </form>
        )}

        {phase === "done" && (
          <div role="status">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Check size={30} strokeWidth={2.5} aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight">{t("Merci pour votre avis", "Thank you for your review")}</h1>
            <p className="mt-2 text-base leading-relaxed text-neutral-700">
              {t(
                <>Il aide {context?.venue_name ?? "l'établissement"} et votre hôtel à rendre chaque sortie meilleure.</>,
                <>It helps {context?.venue_name ?? "the venue"} and your hotel make every outing even better.</>
              )}
            </p>

            {/* Invitation Google proposée à tous les clients, quelle que soit
                leur note : la réserver aux 5 étoiles (« review gating ») est
                interdit par les règles d'avis de Google. */}
            {reviewUrl && (
              <div className="mt-7 rounded-2xl border border-black/[0.08] bg-[#f7f6f3] p-5">
                <p className="text-base font-bold leading-snug">{t("Partager votre expérience sur Google ?", "Share your experience on Google?")}</p>
                <p className="mt-1 text-sm text-neutral-700">
                  {t(
                    <>Votre avis aide d&apos;autres voyageurs à trouver {context?.venue_name ?? "cette adresse"}.</>,
                    <>Your review helps other travellers discover {context?.venue_name ?? "this place"}.</>
                  )}
                </p>
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-neutral-900 text-base font-bold text-white transition-opacity hover:opacity-90"
                >
                  {t("Laisser un avis Google", "Leave a Google review")}
                </a>
              </div>
            )}
          </div>
        )}

        <PoweredBy className="mt-8" />
      </main>
    </div>
  );
}
