"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

const DEMO_VENUE_EMAILS = ["yaminbenhamou@gmail.com", "test@twocardspro.com"];
const DEMO_CONCIERGE_EMAIL = "adminconcierge@twocardspro.com";

type AuthSnapshot = {
  id: string | null;
  email: string | null;
  fullName: string | null;
  role: string | null;
  venueName: string | null;
};

/* Cache de module : l'utilisateur est demandé UNE fois au serveur Supabase,
   puis chaque page le lit de façon synchrone. Auparavant, chaque montage de
   page refaisait l'aller-retour réseau — d'où un squelette de chargement et
   une latence sensible à chaque clic de navigation.

   undefined = pas encore chargé (isLoading), null = non connecté. */
let snapshot: AuthSnapshot | null | undefined = undefined;
let started = false;
const listeners = new Set<() => void>();

function toSnapshot(
  user: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  } | null
): AuthSnapshot | null {
  if (!user) return null;
  return {
    id: user.id ?? null,
    email: user.email ?? null,
    fullName: (user.user_metadata?.full_name as string) ?? null,
    role:
      (user.app_metadata?.role as string) ??
      (user.user_metadata?.role as string) ??
      null,
    venueName: (user.user_metadata?.venue_name as string) ?? null,
  };
}

function notify() {
  for (const l of listeners) l();
}

function ensureStarted() {
  if (started) return;
  started = true;
  const supabase = createClient();

  supabase.auth
    .getUser()
    .then(({ data }) => {
      snapshot = toSnapshot(data.user ?? null);
      notify();
    })
    .catch(() => {
      snapshot = null;
      notify();
    });

  /* Connexion et déconnexion côté client invalident le cache sans recharger
     la page : on suit les changements de session. */
  supabase.auth.onAuthStateChange((_event, session) => {
    const next = toSnapshot(session?.user ?? null);
    const changed = JSON.stringify(next) !== JSON.stringify(snapshot ?? null);
    if (snapshot === undefined || changed) {
      snapshot = next;
      notify();
    }
  });
}

function subscribe(listener: () => void) {
  ensureStarted();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
/* Côté serveur : toujours « en chargement », comme avant. */
const getServerSnapshot = () => undefined;

export function useAuthUser() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isLoading = snap === undefined;
  const email = snap?.email ?? null;
  const fullName = snap?.fullName ?? null;

  const isDemoVenue = email !== null && DEMO_VENUE_EMAILS.includes(email);
  const isDemoConcierge = email === DEMO_CONCIERGE_EMAIL;

  return {
    userId: snap?.id ?? null,
    email,
    fullName,
    role: snap?.role ?? null,
    venueName: snap?.venueName ?? null,
    isLoading,
    isDemoVenue,
    isDemoConcierge,
    isDemo: isDemoVenue || isDemoConcierge,
    initials: fullName
      ? fullName
          .split(" ")
          .filter((n) => n.length > 0)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : email
        ? email[0].toUpperCase()
        : "U",
  };
}
