"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* Intégration caisse de l'établissement connecté : la ligne
   venue_integrations, les dix derniers pos_events et les libellés de
   venue_tables (correspondance des tables). La clé d'API n'est jamais
   relue : elle n'existe en clair qu'au retour de pos_rotate_key. */

export const POS_WEBHOOK_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pos-webhook`;

export type PosIntegration = {
  provider: string;
  status: string;
  last_event_at: string | null;
};

export type PosEvent = {
  id: number;
  ticket_id: string | null;
  table_label: string | null;
  amount: number | null;
  status: "matched" | "unmatched" | "duplicate";
  reason: string | null;
  created_at: string;
};

type PosData = {
  integration: PosIntegration | null;
  events: PosEvent[];
  tables: string[];
};

async function fetchPos(): Promise<PosData | null> {
  const sb = createClient();
  const [integration, events, tables] = await Promise.all([
    sb.from("venue_integrations").select("provider, status, last_event_at").maybeSingle(),
    sb
      .from("pos_events")
      .select("id, ticket_id, table_label, amount, status, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    sb.from("venue_tables").select("label").order("label"),
  ]);
  if (integration.error || events.error || tables.error) return null;
  return {
    integration: (integration.data as PosIntegration | null) ?? null,
    events: (events.data as PosEvent[] | null) ?? [],
    tables: ((tables.data as { label: string }[] | null) ?? []).map((row) => row.label),
  };
}

export type PosTestResult =
  | { ok: true; status: string | number; commission?: number | string }
  | { ok: false };

export function usePosIntegration() {
  const [data, setData] = useState<PosData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPos().then((next) => {
      if (cancelled) return;
      if (next) setData(next);
      else setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /* Réessayer après un échec du chargement initial. */
  const reload = useCallback(() => {
    setError(false);
    setAttempt((n) => n + 1);
  }, []);

  /* Relecture à la demande (bouton, après une clé ou un test). En cas
     d'échec, ce qui est affiché reste en place et l'appelant est prévenu. */
  const refresh = useCallback(async () => {
    const next = await fetchPos();
    if (next) setData(next);
    return next !== null;
  }, []);

  /* Génère (ou régénère, ce qui révoque l'ancienne) la clé d'API. Renvoie
     la clé en clair, une seule fois, ou null en cas d'échec. */
  const rotateKey = useCallback(
    async (provider: string) => {
      const { data: key, error: err } = await createClient().rpc("pos_rotate_key", {
        p_provider: provider,
      });
      if (err || !key) return null;
      refresh();
      return key as string;
    },
    [refresh]
  );

  /* Ticket de test envoyé au webhook, sur la première table du plan. */
  const sendTest = useCallback(
    async (key: string): Promise<PosTestResult> => {
      const table = data?.tables[0];
      if (!table) return { ok: false };
      let result: PosTestResult;
      try {
        const res = await fetch(POS_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-twocards-key": key,
          },
          body: JSON.stringify({
            table,
            amount: 1234,
            ticket_id: `TEST-${Date.now()}`,
          }),
        });
        const body = await res.json();
        result = { ok: true, status: body.status ?? res.status, commission: body.commission };
      } catch {
        result = { ok: false };
      }
      refresh();
      return result;
    },
    [data, refresh]
  );

  return {
    integration: data?.integration ?? null,
    events: data?.events ?? [],
    tables: data?.tables ?? [],
    isLoading: data === null && !error,
    error: error && data === null,
    reload,
    refresh,
    rotateKey,
    sendTest,
  };
}
