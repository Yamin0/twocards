"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* Prestations de l'établissement connecté (table venue_services, limitée au
   propriétaire par la RLS). Lecture avec état d'erreur, et les quatre
   écritures de la page : enregistrer, afficher/masquer, réordonner,
   supprimer. Chaque écriture renvoie true si la base l'a acceptée. */

export type VenueService = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

export type VenueServiceDraft = Omit<VenueService, "id" | "sort_order">;

export const EMPTY_SERVICE: VenueServiceDraft = {
  name: "",
  description: "",
  duration: "",
  price: "",
  image_url: null,
  active: true,
};

const SELECT = "id, name, description, duration, price, image_url, active, sort_order";

const fetchServices = () =>
  createClient()
    .from("venue_services")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

export function useVenueServices(enabled: boolean) {
  const [services, setServices] = useState<VenueService[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchServices().then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(true);
        return;
      }
      setServices((data as VenueService[] | null) ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  /* Réessayer après un échec du chargement initial. */
  const reload = useCallback(() => {
    setError(false);
    setAttempt((n) => n + 1);
  }, []);

  /* Relecture silencieuse après une écriture : en cas d'échec, la liste
     affichée reste en place. */
  const refresh = useCallback(async () => {
    const { data, error: err } = await fetchServices();
    if (!err) setServices((data as VenueService[] | null) ?? []);
  }, []);

  const save = useCallback(
    async (id: string | null, draft: VenueServiceDraft, ownerId: string) => {
      const supabase = createClient();
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        duration: draft.duration.trim(),
        price: draft.price.trim(),
        image_url: draft.image_url,
        active: draft.active,
      };
      const { error: err } = id
        ? await supabase.from("venue_services").update(payload).eq("id", id)
        : await supabase.from("venue_services").insert({
            ...payload,
            owner_id: ownerId,
            sort_order: (services?.at(-1)?.sort_order ?? 0) + 10,
          });
      if (err) return false;
      refresh();
      return true;
    },
    [services, refresh]
  );

  /* Optimiste, avec retour arrière si l'écriture échoue. */
  const setActive = useCallback(async (s: VenueService, next: boolean) => {
    const apply = (active: boolean) =>
      setServices((prev) => prev?.map((x) => (x.id === s.id ? { ...x, active } : x)) ?? prev);
    apply(next);
    const { error: err } = await createClient()
      .from("venue_services")
      .update({ active: next })
      .eq("id", s.id);
    if (err) {
      apply(s.active);
      return false;
    }
    return true;
  }, []);

  /* Monter ou descendre : on échange les rangs des deux voisines. */
  const move = useCallback(
    async (s: VenueService, dir: -1 | 1) => {
      if (!services) return true;
      const i = services.findIndex((x) => x.id === s.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= services.length) return true;
      const a = services[i];
      const b = services[j];
      /* Deux rangs égaux (import, anciennes lignes) ne se distingueraient
         pas : on réattribue des rangs espacés. */
      const ra =
        a.sort_order === b.sort_order ? b.sort_order + (dir > 0 ? 10 : -10) : b.sort_order;
      const rb = a.sort_order;
      const next = [...services];
      next[i] = { ...b, sort_order: rb };
      next[j] = { ...a, sort_order: ra };
      setServices(next);
      const supabase = createClient();
      const [r1, r2] = await Promise.all([
        supabase.from("venue_services").update({ sort_order: ra }).eq("id", a.id),
        supabase.from("venue_services").update({ sort_order: rb }).eq("id", b.id),
      ]);
      if (r1.error || r2.error) {
        refresh();
        return false;
      }
      return true;
    },
    [services, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await createClient().from("venue_services").delete().eq("id", id);
      if (err) return false;
      refresh();
      return true;
    },
    [refresh]
  );

  return {
    services,
    isLoading: services === null && !error,
    error: error && services === null,
    reload,
    save,
    setActive,
    move,
    remove,
  };
}
