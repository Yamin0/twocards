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
  /* « test » : ticket de test du dashboard, jamais rapproché. */
  status: "matched" | "unmatched" | "duplicate" | "test";
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

/* Issue d'un ticket de test. Le test n'envoie jamais de table ni de
   montant : quelle que soit la version de la fonction déployée, il ne peut
   pas se rapprocher d'une réservation.
   - "confirmed"   : la fonction gère le mode test et l'a confirmé
                     (logged : l'appel figure dans le journal) ;
   - "outdated"    : la clé est acceptée, mais la fonction déployée ignore
                     le mode test et a refusé le corps (400) sans rien écrire ;
   - "invalid_key" : clé inconnue ou révoquée (401) ;
   - "failed"      : réseau ou réponse inattendue. */
export type PosTestResult =
  | { outcome: "confirmed"; logged: boolean }
  | { outcome: "outdated" | "invalid_key" | "failed" };

/* Corps du ticket de test : uniquement le drapeau et un identifiant. Une
   fonction qui ne connaît pas `test` répond « table et amount requis » (400)
   avant toute écriture. */
const testBody = () => JSON.stringify({ test: true, ticket_id: `TEST-${Date.now()}` });

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

  /* Ticket de test : vérifie la clé et la liaison avec le webhook, sans
     jamais écrire sur une réservation. Le succès n'est annoncé que si la
     fonction confirme explicitement le mode test. */
  const sendTest = useCallback(
    async (key: string): Promise<PosTestResult> => {
      let result: PosTestResult;
      try {
        const res = await fetch(POS_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-twocards-key": key,
          },
          body: testBody(),
        });
        const body = (await res.json().catch(() => null)) as {
          status?: unknown;
          test_mode?: unknown;
          logged?: unknown;
        } | null;
        if (res.ok && body?.status === "test" && body.test_mode === true) {
          result = { outcome: "confirmed", logged: body.logged !== false };
        } else if (res.status === 401) {
          result = { outcome: "invalid_key" };
        } else if (res.status === 400) {
          result = { outcome: "outdated" };
        } else {
          result = { outcome: "failed" };
        }
      } catch {
        result = { outcome: "failed" };
      }
      refresh();
      return result;
    },
    [refresh]
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
