"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* Portail de réservation directe de l'établissement connecté (table
   venue_portals, une ligne par compte — la RLS la limite au propriétaire). */

export type VenuePortal = {
  slug: string;
  display_name: string;
  tagline: string;
  accent_color: string;
  background_color: string;
  cover_url: string | null;
  party_max: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  active: boolean;
};

export const DEFAULT_PORTAL: VenuePortal = {
  slug: "",
  display_name: "",
  tagline: "",
  accent_color: "#13305c",
  background_color: "#f5f5f4",
  cover_url: null,
  party_max: 8,
  start_time: "19:00",
  end_time: "01:00",
  interval_minutes: 30,
  active: true,
};

const SELECT =
  "slug, display_name, tagline, accent_color, background_color, cover_url, party_max, start_time, end_time, interval_minutes, active";

/** Adresse publique : minuscules, chiffres et tirets, 40 caractères. */
export const slugifyPortal = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

type State =
  | { status: "loading" }
  | { status: "error" }
  /* portal null : aucun portail enregistré pour ce compte. */
  | { status: "ready"; portal: VenuePortal | null };

export type SavePortalResult = "ok" | "slug-taken" | "error";

export function useVenuePortal() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("venue_portals")
      .select(SELECT)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setState({ status: "error" });
        else setState({ status: "ready", portal: (data as VenuePortal | null) ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  /* Mêmes champs qu'avant, upsert sur owner_id. 23505 : adresse déjà prise. */
  const save = useCallback(async (form: VenuePortal): Promise<SavePortalResult> => {
    const { error } = await createClient()
      .from("venue_portals")
      .upsert(
        { ...form, display_name: form.display_name.trim() },
        { onConflict: "owner_id" }
      );
    if (error) return error.code === "23505" ? "slug-taken" : "error";
    return "ok";
  }, []);

  return {
    portal: state.status === "ready" ? state.portal : null,
    isLoading: state.status === "loading",
    error: state.status === "error",
    reload,
    save,
  };
}

/* Couverture : image redimensionnée en webp côté navigateur, envoyée dans
   le bucket avatars sous le dossier de l'utilisateur (mêmes règles que la
   photo de profil). Renvoie l'URL publique ; lève en cas d'échec. */
export async function uploadPortalCover(file: File, userId: string): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/webp", 0.85)
  );
  const supabase = createClient();
  const path = `${userId}/portal-cover-${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/webp" });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
