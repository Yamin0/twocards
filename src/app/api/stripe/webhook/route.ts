import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { fulfillDeposit, getStripe, markRefunded } from "@/lib/stripe/deposit";

/* Webhook Stripe (Twocards, LLC). À déclarer dans le tableau de bord Stripe
   → Développeurs → Webhooks, sur https://<site>/api/stripe/webhook, avec
   les événements :
     checkout.session.completed
     checkout.session.async_payment_succeeded
     charge.refunded
   Le secret de signature va dans STRIPE_WEBHOOK_SECRET. */

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "signature" }, { status: 400 });

  /* Le corps brut, tel quel : la signature porte sur ces octets-là. */
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(payload, signature, secret);
  } catch (error) {
    console.error("[stripe] signature de webhook refusée", error);
    return NextResponse.json({ error: "signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.metadata?.kind === "qr_deposit") await fulfillDeposit(session.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const intent = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        /* Remboursement total seulement : un geste partiel ne change pas la commission. */
        if (intent && charge.refunded) await markRefunded(intent);
        break;
      }
    }
  } catch (error) {
    console.error(`[stripe] échec du traitement de ${event.type} (${event.id})`, error);
    /* 500 : Stripe renverra l'événement plus tard (jusqu'à 3 jours). */
    return NextResponse.json({ error: "traitement" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
