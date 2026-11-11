"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* Réglages du compte établissement. Tout vit dans les métadonnées de
   l'utilisateur Supabase (auth.updateUser) : aucune table. Les clés
   enregistrées sont celles d'origine (full_name, phone, city, capacity,
   address, description, hours, min_spend, google_review_url, notif_prefs). */

export type SettingsForm = {
  name: string;
  email: string;
  phone: string;
  city: string;
  venueName: string;
  venueType: string;
  capacity: string;
  address: string;
  description: string;
  hours: string;
  minSpend: string;
  googleReviewUrl: string;
};

/* Un interrupteur par envoi push réel (voir la migration
   20261112140000_preferences_de_notification.sql) :
   - pushReservations : nouvelle réservation (venue_notifications « reservation ») ;
   - pushRatings      : nouvel avis client (« rating ») ;
   - pushPos          : ticket de caisse non rapproché (« pos ») ;
   - pushMessages     : nouveau message (push_new_message).
   Absente en base = activée. Les anciennes clés (emailNotifs, smsAlerts,
   commissionAlerts, newRpNotifs, weeklyReport) ne correspondaient à aucun
   envoi : elles ne sont plus affichées, mais restent enregistrées telles
   quelles dans notif_prefs. */
export type NotifPrefs = {
  pushReservations: boolean;
  pushRatings: boolean;
  pushPos: boolean;
  pushMessages: boolean;
};

const EMPTY_FORM: SettingsForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  venueName: "",
  venueType: "",
  capacity: "",
  address: "",
  description: "",
  hours: "",
  minSpend: "",
  googleReviewUrl: "",
};

/* Même valeur par défaut que la base : tout est envoyé tant que
   l'établissement n'a rien coupé. */
const DEFAULT_NOTIFS: NotifPrefs = {
  pushReservations: true,
  pushRatings: true,
  pushPos: true,
  pushMessages: true,
};

const NOTIF_KEYS = Object.keys(DEFAULT_NOTIFS) as (keyof NotifPrefs)[];

/* Ne retient d'un notif_prefs enregistré que les booléens des clés
   affichées (comme la base, qui ne coupe que sur la valeur false). */
function readNotifs(raw: Record<string, unknown>): NotifPrefs {
  const next = { ...DEFAULT_NOTIFS };
  for (const key of NOTIF_KEYS) {
    if (typeof raw[key] === "boolean") next[key] = raw[key];
  }
  return next;
}

/** Résultat d'une écriture : `null` si elle a réussi, sinon le message du serveur. */
export type SaveResult = string | null;

export function useVenueSettings() {
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [notifs, setNotifs] = useState<NotifPrefs>(DEFAULT_NOTIFS);
  /* notif_prefs tel qu'enregistré, anciennes clés comprises : réécrit en
     entier à chaque enregistrement pour n'en effacer aucune. */
  const [storedPrefs, setStoredPrefs] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  /* Le hook useAuthUser n'expose qu'un sous-ensemble des métadonnées : on
     relit l'utilisateur complet pour pré-remplir tous les champs. */
  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err || !data.user) {
          setError(true);
          return;
        }
        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        const str = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string) : "");
        setForm({
          name: str("full_name"),
          email: data.user.email ?? "",
          phone: str("phone"),
          city: str("city"),
          venueName: str("venue_name"),
          venueType: str("venue_type"),
          capacity:
            meta.capacity !== undefined && meta.capacity !== null ? String(meta.capacity) : "",
          address: str("address"),
          description: str("description"),
          hours: str("hours"),
          minSpend: str("min_spend"),
          googleReviewUrl: str("google_review_url"),
        });
        const prefs = meta.notif_prefs;
        const stored =
          prefs && typeof prefs === "object" && !Array.isArray(prefs)
            ? (prefs as Record<string, unknown>)
            : {};
        setStoredPrefs(stored);
        setNotifs(readNotifs(stored));
        setError(false);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const reload = useCallback(() => {
    setError(false);
    setTick((n) => n + 1);
  }, []);

  const updateForm = useCallback(
    (field: keyof SettingsForm, value: string) => setForm((prev) => ({ ...prev, [field]: value })),
    []
  );

  const toggleNotif = useCallback(
    (key: keyof NotifPrefs, next: boolean) => setNotifs((prev) => ({ ...prev, [key]: next })),
    []
  );

  const write = useCallback(async (attributes: Parameters<
    ReturnType<typeof createClient>["auth"]["updateUser"]
  >[0]): Promise<SaveResult> => {
    setSaving(true);
    const { error: err } = await createClient().auth.updateUser(attributes);
    setSaving(false);
    return err ? err.message : null;
  }, []);

  /* Profil et établissement : un seul enregistrement, comme à l'origine. */
  const saveProfile = useCallback(
    () =>
      write({
        data: {
          full_name: form.name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          capacity: form.capacity.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          hours: form.hours.trim(),
          min_spend: form.minSpend.trim(),
          google_review_url: form.googleReviewUrl.trim(),
        },
      }),
    [form, write]
  );

  /* auth.updateUser remplace notif_prefs d'un bloc : on repart de l'objet
     enregistré pour conserver les clés qui ne sont plus affichées. */
  const saveNotifs = useCallback(async (): Promise<SaveResult> => {
    const next = { ...storedPrefs, ...notifs };
    const failure = await write({ data: { notif_prefs: next } });
    if (!failure) setStoredPrefs(next);
    return failure;
  }, [notifs, storedPrefs, write]);

  const savePassword = useCallback((password: string) => write({ password }), [write]);

  return {
    form,
    notifs,
    isLoading: !loaded && !error,
    error: error && !loaded,
    reload,
    saving,
    updateForm,
    toggleNotif,
    saveProfile,
    saveNotifs,
    savePassword,
  };
}

export type VenueSettings = ReturnType<typeof useVenueSettings>;
