import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/* Une demande par session et par QR : évite le double comptage du scan
   (StrictMode, retours arrière, changement de langue) sans cookie ni
   consentement. Le menu, lui, est chargé côté serveur : le suivi reste ici
   pour ne compter que les vraies ouvertures dans un navigateur. */
function trackScanOnce(code: string) {
  const key = `qr-scan-${code}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* stockage indisponible : on compte quand même */
  }
  createClient()
    .rpc("qr_track_scan", { p_code: code })
    .then(
      () => undefined,
      () => undefined
    );
}

/** Compte le scan une fois ; jamais en mode aperçu (l'hôtel qui prévisualise
    son menu n'est pas un client). */
export function useTrackScan(code: string, enabled: boolean) {
  useEffect(() => {
    if (enabled) trackScanOnce(code);
  }, [code, enabled]);
}
