import { NextResponse, type NextRequest } from "next/server";
import { getLocale } from "@/lib/i18n/server";
import { formatDeposit } from "@/lib/booking/deposit";
import {
  getStripe,
  isDepositConfigured,
  quoteDeposit,
  describeLines,
  quoteDepositLines,
  readDepositRequest,
  toMetadata,
  toMinor,
} from "@/lib/stripe/deposit";

/* Ouvre la page de paiement Stripe pour l'acompte d'une réservation du menu
   QR. Le montant vient de la base, jamais du navigateur. Rien n'est écrit
   en base ici : la réservation n'existe qu'une fois l'acompte payé. */

/* Réponses d'erreur au format des RPC ({ message }) : la feuille de
   réservation les range avec `bookingErrorKind`. */
const fail = (message: string, status: number) => NextResponse.json({ message }, { status });

export async function POST(request: NextRequest) {
  if (!isDepositConfigured()) return fail("Paiement indisponible", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Demande invalide", 400);
  }
  const req = readDepositRequest(body);
  if (!req) return fail("Demande invalide", 400);

  let quote;
  try {
    quote = req.lines
      ? await quoteDepositLines(req.code, req.slug, req.lines)
      : await quoteDeposit(req.code, req.slug, req.party, req.service);
  } catch (error) {
    console.error("[acompte] devis impossible", error);
    return fail("Paiement indisponible", 503);
  }
  /* L'adresse ne demande pas (ou plus) d'acompte, ou le QR est inactif. */
  if (!quote) return fail("Adresse indisponible", 409);

  /* Panier : la prestation enregistrée est le résumé calculé par la base. */
  if (quote.mode === "lines" && quote.lines) {
    const described = describeLines(quote.lines, req.notes);
    req.service = described.service;
    req.notes = described.notes;
  }

  const locale = await getLocale();
  const origin = request.nextUrl.origin;
  const code = encodeURIComponent(req.code);
  const when = [req.date, req.time].filter(Boolean).join(" ");
  const guests = locale === "en" ? `${req.party} guest${req.party > 1 ? "s" : ""}` : `${req.party} pers.`;
  /* Prestation à prix partenaire : nombre de véhicules et reste payé sur place.
     Un panier (véhicules ou entrées à la personne) porte déjà les quantités
     dans son résumé : « 2 × Day pass adulte, 1 × Day pass enfant ». */
  const vehicles =
    quote.mode === "per_vehicle" && quote.units
      ? locale === "en"
        ? `${quote.units} vehicle${quote.units > 1 ? "s" : ""}`
        : `${quote.units} véhicule${quote.units > 1 ? "s" : ""}`
      : null;
  const onSite =
    (quote.mode === "per_vehicle" || quote.mode === "lines") && quote.onSite
      ? locale === "en"
        ? `${formatDeposit(quote.onSite, quote.currency, "en-GB")} paid on site`
        : `${formatDeposit(quote.onSite, quote.currency, "fr-FR")} à régler sur place`
      : null;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      locale: locale === "en" ? "en" : "fr",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: quote.currency,
            unit_amount: toMinor(quote.amount),
            product_data: {
              name: locale === "en" ? `Booking deposit · ${req.venue}` : `Acompte de réservation · ${req.venue}`,
              description: [req.service, when, guests, vehicles, onSite].filter(Boolean).join(" · "),
            },
          },
        },
      ],
      metadata: toMetadata(req, quote),
      payment_intent_data: {
        description: `Acompte ${req.venue} — ${when} — ${req.party} pers. (${formatDeposit(quote.amount, quote.currency, "fr-FR")})`,
        metadata: { kind: "qr_deposit", code: req.code, slug: req.slug },
      },
      /* Une demi-heure pour payer ; au-delà la session expire sans rien créer. */
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${origin}/s/${code}/acompte?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/s/${code}`,
    });
    if (!session.url) return fail("Paiement indisponible", 502);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[acompte] session Stripe impossible", error);
    return fail("Paiement indisponible", 502);
  }
}
