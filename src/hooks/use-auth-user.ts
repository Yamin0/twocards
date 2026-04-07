"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const DEMO_VENUE_EMAIL = "yaminbenhamou@gmail.com";
const DEMO_CONCIERGE_EMAIL = "adminconcierge@twocardspro.com";

export function useAuthUser() {
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? null);
        setFullName(data.user.user_metadata?.full_name ?? null);
        setRole(data.user.user_metadata?.role ?? null);
        setVenueName(data.user.user_metadata?.venue_name ?? null);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, []);

  const isDemoVenue = email === DEMO_VENUE_EMAIL;
  const isDemoConcierge = email === DEMO_CONCIERGE_EMAIL;

  return {
    email,
    fullName,
    role,
    venueName,
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
