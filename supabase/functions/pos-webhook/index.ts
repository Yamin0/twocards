// Webhook universel POS → twocards.
//
// La caisse (Lightspeed, Square, Tiller, L'Addition, Zelty… directement ou
// via Zapier/Make) POSTe chaque ticket fermé :
//
//   POST /functions/v1/pos-webhook
//   Header  x-twocards-key: tc_live_…       (clé générée dans le dashboard)
//   Body    { "table": "12", "amount": 4500, "ticket_id": "T-981",
//             "closed_at": "2026-08-17T23:45:00Z" }        (closed_at optionnel)
//
// Rapprochement : le libellé `table` doit correspondre à une table du plan
// de salle twocards ; la réservation assignée à cette table (fenêtre J-1 à
// J+1, montant non renseigné) reçoit le montant — la commission est dérivée
// par trigger. Tout appel est journalisé dans pos_events, rapproché ou non.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-twocards-key",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "POST attendu" });

  const key = req.headers.get("x-twocards-key");
  if (!key) return json(401, { error: "En-tête x-twocards-key manquant" });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: integration } = await sb
    .from("venue_integrations")
    .select("owner_id, provider, status")
    .eq("api_key_hash", await sha256Hex(key))
    .eq("status", "active")
    .maybeSingle();
  if (!integration) return json(401, { error: "Clé invalide ou révoquée" });
  const owner = integration.owner_id as string;

  let payload: {
    table?: unknown;
    amount?: unknown;
    ticket_id?: unknown;
    closed_at?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Corps JSON invalide" });
  }

  const tableLabel = String(payload.table ?? "").trim();
  const amount = Number(payload.amount);
  const ticketId = payload.ticket_id ? String(payload.ticket_id).slice(0, 80) : null;
  if (!tableLabel || !Number.isFinite(amount) || amount < 0) {
    return json(400, {
      error: "Champs requis : table (texte) et amount (nombre ≥ 0)",
    });
  }

  const log = (
    status: "matched" | "unmatched" | "duplicate",
    reason: string | null,
    reservationId: string | null = null
  ) =>
    sb.from("pos_events").insert({
      owner_id: owner,
      provider: integration.provider,
      ticket_id: ticketId,
      table_label: tableLabel,
      amount,
      status,
      reason,
      reservation_id: reservationId,
    });

  await sb
    .from("venue_integrations")
    .update({ last_event_at: new Date().toISOString() })
    .eq("owner_id", owner);

  // Idempotence : ticket déjà rapproché → on ne réécrit rien.
  if (ticketId) {
    const { data: dup } = await sb
      .from("pos_events")
      .select("id")
      .eq("owner_id", owner)
      .eq("ticket_id", ticketId)
      .eq("status", "matched")
      .maybeSingle();
    if (dup) {
      await log("duplicate", "Ticket déjà traité");
      return json(200, { status: "duplicate", message: "Ticket déjà traité" });
    }
  }

  // 1. La table du plan de salle portant ce libellé.
  const { data: table } = await sb
    .from("venue_tables")
    .select("id, label")
    .eq("owner_id", owner)
    .eq("label", tableLabel)
    .maybeSingle();
  if (!table) {
    await log(
      "unmatched",
      `Aucune table « ${tableLabel} » dans le plan de salle`
    );
    return json(202, {
      status: "unmatched",
      message: `Aucune table « ${tableLabel} » — vérifiez que les libellés de votre caisse correspondent au plan de salle twocards`,
    });
  }

  // 2. La réservation assignée à cette table, fenêtre J-1 → J+1 (un ticket
  //    fermé après minuit appartient à la réservation de la veille).
  const base = payload.closed_at ? new Date(String(payload.closed_at)) : new Date();
  const ref = Number.isNaN(base.getTime()) ? new Date() : base;
  const dayBefore = new Date(ref);
  dayBefore.setDate(ref.getDate() - 1);
  const dayAfter = new Date(ref);
  dayAfter.setDate(ref.getDate() + 1);

  const { data: resa } = await sb
    .from("qr_reservations")
    .select("id, guest_name")
    .eq("table_id", table.id)
    .is("amount_spent", null)
    .neq("status", "annulée")
    .gte("reservation_date", isoDay(dayBefore))
    .lte("reservation_date", isoDay(dayAfter))
    .order("reservation_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!resa) {
    await log(
      "unmatched",
      `Table ${tableLabel} : aucune réservation twocards ouverte sur la période`
    );
    return json(202, {
      status: "unmatched",
      message: `Aucune réservation ouverte sur la table ${tableLabel} — le ticket est journalisé`,
    });
  }

  // 3. Montant posé, commission dérivée par le trigger en base.
  const { data: updated, error } = await sb
    .from("qr_reservations")
    .update({
      amount_spent: amount,
      status: "confirmée",
      amount_source: "pos",
      pos_ticket_id: ticketId,
    })
    .eq("id", resa.id)
    .select("commission")
    .single();
  if (error || !updated) {
    await log("unmatched", "Écriture refusée");
    return json(500, { status: "error", message: "Écriture refusée" });
  }

  await log("matched", null, resa.id);
  return json(200, {
    status: "matched",
    reservation_id: resa.id,
    guest: resa.guest_name,
    amount,
    commission: updated.commission,
  });
});
