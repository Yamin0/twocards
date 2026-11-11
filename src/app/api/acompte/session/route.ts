import { NextResponse, type NextRequest } from "next/server";
import { getLocale } from "@/lib/i18n/server";
import { formatDeposit } from "@/lib/booking/deposit";
import {
  getStripe,
  isDepositConfigured,
  quoteDeposit,
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
    quote = await quoteDeposit(req.code, req.slug, req.party);
  } catch (error) {
    console.error("[acompte] devis impossible", error);
    return fail("Paiement indisponible", 503);
  }
  /* L'adresse ne demande pas (ou plus) d'acompte, ou le QR est inactif. */
  if (!quote) return fail("Adresse indisponible", 409);

  const locale = await getLocale();
  const origin = request.nextUrl.origin;
  const code = encodeURIComponent(req.code);
  const when = [req.date, req.time].filter(Boolean).join(" ");
  const guests = locale === "en" ? `${req.party} guest${req.party > 1 ? "s" : ""}` : `${req.party} pers.`;

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
              description: [req.service, when, guests].filter(Boolean).join(" · "),
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
