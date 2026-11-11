import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { DepositCurrency } from "@/lib/booking/deposit";

export type { DepositCurrency };

/* Acompte en ligne du menu QR — côté serveur uniquement (clé secrète Stripe
   et clé service Supabase). Jamais importé par un composant client.

   Parcours :
   1. `/api/acompte/session` lit le devis en base (`qr_deposit_quote`), ouvre
      une session Stripe Checkout et y range la demande dans `metadata`.
   2. Le client paie sur la page Stripe.
   3. `fulfillDeposit` (appelée par le webhook ET par la page de retour,
      peu importe qui passe en premier) enregistre la réservation payée via
      `qr_record_paid_reservation`, idempotente. Si la base refuse la
      réservation (adresse retirée, débit…), l'acompte est remboursé aussitôt.

   Variables d'environnement : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
   SUPABASE_SERVICE_ROLE_KEY (+ NEXT_PUBLIC_SUPABASE_URL). */

export type DepositQuote = {
  /* per_vehicle : prestation à prix partenaire, acompte = marge twocards
     par véhicule (migration 20261113110000). */
  mode: "per_person" | "fixed" | "per_vehicle";
  /* Montant par personne, pour la réservation, ou par véhicule. */
  unit: number;
  /* Véhicules réservés (per_vehicle seulement). */
  units?: number;
  /* Reste à régler sur place au partenaire (per_vehicle seulement). */
  onSite?: number;
  /* Montant total à payer pour ce nombre de personnes. */
  amount: number;
  currency: DepositCurrency;
};

/* Demande telle qu'envoyée par la feuille de réservation. */
export type DepositRequest = {
  code: string;
  category: string;
  venue: string;
  slug: string;
  name: string;
  phone: string;
  date: string;
  time: string | null;
  party: number;
  notes: string | null;
  service: string | null;
};

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante");
  stripeClient ??= new Stripe(key, { appInfo: { name: "twocards" } });
  return stripeClient;
}

/* Client Supabase « service » : seul autorisé à enregistrer une réservation
   payée. Aucune session utilisateur n'est lue ni gardée. */
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const isDepositConfigured = () =>
  Boolean(process.env.STRIPE_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Montant en unités mineures Stripe (centimes) : MAD, EUR et USD ont deux décimales. */
export const toMinor = (amount: number) => Math.round(amount * 100);

export function parseQuote(value: unknown): DepositQuote | null {
  if (!value || typeof value !== "object") return null;
  const q = value as Record<string, unknown>;
  const amount = Number(q.amount);
  const unit = Number(q.unit);
  const currency = String(q.currency ?? "");
  const mode = String(q.mode ?? "");
  if (!(amount > 0) || !(unit > 0)) return null;
  if (currency !== "mad" && currency !== "eur" && currency !== "usd") return null;
  if (mode === "per_vehicle") {
    const units = Math.max(1, Math.round(Number(q.units) || 1));
    const onSite = Number(q.on_site);
    return { amount, unit, currency, mode, units, onSite: onSite > 0 ? onSite : undefined };
  }
  if (mode !== "per_person" && mode !== "fixed") return null;
  return { amount, unit, currency, mode };
}

/* ─── Lecture de la demande ──────────────────────────────────────────────── */

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valide le corps JSON reçu du navigateur ; null si inutilisable. Les mêmes
    contrôles sont refaits par la base au moment d'enregistrer. */
export function readDepositRequest(body: unknown): DepositRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const req: DepositRequest = {
    code: str(b.code, 32),
    category: str(b.category, 40),
    venue: str(b.venue, 120),
    slug: str(b.slug, 40),
    name: str(b.name, 120),
    phone: str(b.phone, 40),
    date: str(b.date, 10),
    time: str(b.time, 20) || null,
    party: Math.min(Math.max(Math.round(Number(b.party) || 2), 1), 50),
    notes: str(b.notes, 500) || null,
    service: str(b.service, 80) || null,
  };
  if (!req.code || !req.slug || !req.venue || !req.category || !req.name) return null;
  if (req.phone.replace(/\D/g, "").length < 6) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.date)) return null;
  return req;
}

/* La demande voyage dans les métadonnées de la session (500 caractères par
   valeur au plus, ce que respectent déjà les limites ci-dessus). */
export function toMetadata(req: DepositRequest, quote: DepositQuote): Stripe.MetadataParam {
  return {
    kind: "qr_deposit",
    code: req.code,
    category: req.category,
    venue: req.venue,
    slug: req.slug,
    name: req.name,
    phone: req.phone,
    date: req.date,
    time: req.time ?? "",
    party: String(req.party),
    notes: req.notes ?? "",
    service: req.service ?? "",
    amount: String(quote.amount),
    currency: quote.currency,
  };
}

function fromMetadata(m: Stripe.Metadata | null): (DepositRequest & { amount: number; currency: string }) | null {
  if (!m || m.kind !== "qr_deposit") return null;
  return {
    code: m.code ?? "",
    category: m.category ?? "",
    venue: m.venue ?? "",
    slug: m.slug ?? "",
    name: m.name ?? "",
    phone: m.phone ?? "",
    date: m.date ?? "",
    time: m.time || null,
    party: Number(m.party) || 2,
    notes: m.notes || null,
    service: m.service || null,
    amount: Number(m.amount) || 0,
    currency: m.currency ?? "mad",
  };
}

/* ─── Devis ──────────────────────────────────────────────────────────────── */

export async function quoteDeposit(
  code: string,
  slug: string,
  party: number,
  service: string | null
): Promise<DepositQuote | null> {
  const base = { p_code: code, p_venue_slug: slug, p_party_size: party };
  const client = serviceClient();
  let { data, error } = await client.rpc("qr_deposit_quote", service ? { ...base, p_service: service } : base);
  /* Avant la migration 20261113110000, la fonction n'a que trois arguments
     (PostgREST : PGRST202, fonction introuvable) : on redemande sans la
     prestation. */
  if (error?.code === "PGRST202" && service) {
    ({ data, error } = await client.rpc("qr_deposit_quote", base));
  }
  if (error) throw new Error(error.message);
  return parseQuote(data);
}

/* ─── Enregistrement après paiement ──────────────────────────────────────── */

export type FulfillResult =
  | { status: "confirmed"; reservationId: string; request: DepositRequest; amount: number; currency: string }
  | { status: "refunded"; request: DepositRequest | null; amount: number; currency: string; reason: string }
  | { status: "unpaid"; request: DepositRequest | null }
  | { status: "invalid" };

/** Enregistre la réservation d'une session payée. Idempotente : le webhook et
    la page de retour peuvent l'appeler tous les deux, dans n'importe quel
    ordre, y compris en même temps (verrou côté base). */
export async function fulfillDeposit(sessionId: string): Promise<FulfillResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const meta = fromMetadata(session.metadata);
  if (!meta) return { status: "invalid" };
  const { amount, currency, ...request } = meta;
  if (session.payment_status !== "paid") return { status: "unpaid", request };

  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? "";
  /* Montant réellement encaissé, pas celui des métadonnées. */
  const paid = (session.amount_total ?? toMinor(amount)) / 100;

  const { data, error } = await serviceClient().rpc("qr_record_paid_reservation", {
    p_session_id: session.id,
    p_payment_intent: paymentIntent,
    p_amount: paid,
    p_currency: session.currency ?? currency,
    p_code: request.code,
    p_category: request.category,
    p_venue: request.venue,
    p_guest_name: request.name,
    p_guest_phone: request.phone,
    p_date: request.date,
    p_time: request.time,
    p_party_size: request.party,
    p_notes: request.notes,
    p_venue_slug: request.slug,
    p_service: request.service,
  });

  if (!error && data) {
    return { status: "confirmed", reservationId: data, request, amount: paid, currency: session.currency ?? currency };
  }

  /* Refus de la base (adresse retirée entre-temps, débit, date…) : le client
     a payé une réservation qui n'existe pas, on le rembourse tout de suite.
     La clé d'idempotence évite un double remboursement si le webhook et la
     page de retour échouent tous les deux. */
  const reason = error?.message ?? "Réservation refusée";
  if (paymentIntent) {
    await stripe.refunds.create(
      { payment_intent: paymentIntent, reason: "requested_by_customer", metadata: { motif: reason.slice(0, 450) } },
      { idempotencyKey: `qr-deposit-refund-${session.id}` }
    );
  }
  return { status: "refunded", request, amount: paid, currency: session.currency ?? currency, reason };
}

/** Note le remboursement fait depuis le tableau de bord Stripe. */
export async function markRefunded(paymentIntent: string) {
  const { error } = await serviceClient().rpc("qr_mark_deposit_refunded", { p_payment_intent: paymentIntent });
  if (error) throw new Error(error.message);
}
