import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock, RotateCcw } from "lucide-react";
import { DEFAULT_ACCENT, DEFAULT_GUEST_BACKGROUND, loadGuestMenu } from "@/lib/booking/load";
import { inkOn, isDarkHex, onColor } from "@/lib/booking/color";
import { fromIsoDay, longDate } from "@/lib/booking/dates";
import { formatDeposit } from "@/lib/booking/deposit";
import { intlLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { fulfillDeposit, type FulfillResult } from "@/lib/stripe/deposit";

/* Retour de la page de paiement Stripe. On ne se fie pas à l'adresse : la
   session est relue chez Stripe, et la réservation enregistrée ici si le
   webhook n'est pas encore passé (l'enregistrement est idempotent). */

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DepositReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const [{ code }, { session_id }, locale, t] = await Promise.all([params, searchParams, getLocale(), getT()]);
  const intl = intlLocale(locale);

  let result: FulfillResult = { status: "invalid" };
  if (session_id && /^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    try {
      result = await fulfillDeposit(session_id);
    } catch (error) {
      console.error("[acompte] retour de paiement", error);
      result = { status: "invalid" };
    }
  }
  /* Une session d'un autre QR ne s'affiche pas ici. */
  if (result.status !== "invalid" && result.request && result.request.code !== code) result = { status: "invalid" };

  const menu = await loadGuestMenu(code, locale);
  const hotel = menu.status === "ready" ? menu.hotel : null;
  const accent = hotel?.accent ?? DEFAULT_ACCENT;
  const background = hotel?.background ?? DEFAULT_GUEST_BACKGROUND;
  const style = {
    "--accent": accent,
    "--on-accent": onColor(accent),
    "--page": background,
    "--accent-on-white": inkOn(accent, "#ffffff", "#171717"),
  } as CSSProperties;
  const darkPage = isDarkHex(background);
  const hotelName = hotel?.hotelName ?? t("l'hôtel", "the hotel");

  const req = result.status === "invalid" ? null : result.request;
  const n = req?.party ?? 0;
  const summary = req ? (
    <p className="mx-auto mt-3 max-w-xs text-base leading-relaxed text-neutral-700">
      <span className="font-bold text-neutral-900">{req.venue}</span>
      {req.service ? ` — ${req.service}` : ""}, {longDate(fromIsoDay(req.date), intl)}
      {t(
        `${req.time ? ` à ${req.time}` : ""}, pour ${n} personne${n > 1 ? "s" : ""}.`,
        `${req.time ? ` at ${req.time}` : ""}, for ${n} guest${n === 1 ? "" : "s"}.`
      )}
    </p>
  ) : null;

  let icon = <Clock size={30} strokeWidth={2.5} aria-hidden />;
  let tone = "bg-amber-50 text-amber-800";
  let title = t("Paiement non finalisé", "Payment not completed");
  let body = t(
    "Nous n'avons pas reçu la confirmation du paiement. Si vous avez été débité, la réservation apparaîtra dans quelques minutes ; sinon, revenez au menu pour réessayer.",
    "We haven't received payment confirmation. If you were charged, the booking will appear within a few minutes; otherwise go back to the menu to try again."
  );

  if (result.status === "confirmed") {
    icon = <Check size={30} strokeWidth={2.5} aria-hidden />;
    tone = "bg-emerald-50 text-emerald-700";
    title = t("Réservation confirmée", "Booking confirmed");
    body = t(
      `Acompte de ${formatDeposit(result.amount, result.currency, intl)} payé. L'établissement vous attend et vous contactera au ${result.request.phone} si besoin. ${hotelName} est prévenu.`,
      `Deposit of ${formatDeposit(result.amount, result.currency, intl)} paid. The venue is expecting you and will contact you on ${result.request.phone} if needed. ${hotelName} has been notified.`
    );
  } else if (result.status === "refunded") {
    icon = <RotateCcw size={28} strokeWidth={2.5} aria-hidden />;
    tone = "bg-sky-50 text-sky-800";
    title = t("Réservation impossible, acompte remboursé", "Booking unavailable, deposit refunded");
    body = t(
      `Cette réservation n'a pas pu être enregistrée. Votre acompte de ${formatDeposit(result.amount, result.currency, intl)} est remboursé sur votre carte (5 à 10 jours selon votre banque). Choisissez un autre créneau ou adressez-vous à la réception.`,
      `This booking couldn't be recorded. Your deposit of ${formatDeposit(result.amount, result.currency, intl)} is being refunded to your card (5–10 days depending on your bank). Pick another time or ask at reception.`
    );
  } else if (result.status === "invalid") {
    title = t("Lien de paiement inconnu", "Unknown payment link");
    body = t(
      "Ce lien ne correspond à aucun paiement. Revenez au menu pour réserver.",
      "This link doesn't match any payment. Go back to the menu to book."
    );
  }

  return (
    <main
      className="satoshi flex min-h-screen items-center justify-center bg-[var(--page)] px-4 py-10"
      style={style}
    >
      <div className={`w-full max-w-md rounded-[1.75rem] bg-white px-7 pb-10 pt-12 text-center text-neutral-900 shadow-xl ${darkPage ? "" : "ring-1 ring-black/[0.06]"}`} role="status">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${tone}`}>{icon}</div>
        <h1 className="font-display text-2xl font-black tracking-tight">{title}</h1>
        {summary}
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-neutral-600">{body}</p>
        <Link
          href={`/s/${encodeURIComponent(code)}`}
          className="mt-8 flex min-h-[3.25rem] w-full items-center justify-center rounded-xl bg-[var(--accent)] text-base font-bold text-[var(--on-accent)] transition-opacity hover:opacity-90"
        >
          {t("Retour au menu", "Back to the menu")}
        </Link>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
          {t("Paiement sécurisé par Stripe pour Twocards, LLC.", "Secure payment by Stripe for Twocards, LLC.")}
        </p>
      </div>
    </main>
  );
}
