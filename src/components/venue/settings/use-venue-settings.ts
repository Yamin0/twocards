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

export type NotifPrefs = {
  emailNotifs: boolean;
  smsAlerts: boolean;
  commissionAlerts: boolean;
  newRpNotifs: boolean;
  weeklyReport: boolean;
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

const DEFAULT_NOTIFS: NotifPrefs = {
  emailNotifs: true,
  smsAlerts: false,
  commissionAlerts: true,
  newRpNotifs: true,
  weeklyReport: true,
};

/** Résultat d'une écriture : `null` si elle a réussi, sinon le message du serveur. */
export type SaveResult = string | null;

export function useVenueSettings() {
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [notifs, setNotifs] = useState<NotifPrefs>(DEFAULT_NOTIFS);
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
        if (prefs && typeof prefs === "object") {
          setNotifs((prev) => ({ ...prev, ...(prefs as Partial<NotifPrefs>) }));
        }
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

  const saveNotifs = useCallback(() => write({ data: { notif_prefs: notifs } }), [notifs, write]);

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
