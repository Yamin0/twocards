"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";

export type VenueNotificationKind = "reservation" | "rating" | "pos";

export type VenueNotification = {
  id: number;
  kind: VenueNotificationKind;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
};

const SELECT = "id, kind, title, body, href, read, created_at";

/* Le hook est monté à la fois par le layout (pastille) et par la page :
   chaque instance a besoin de son propre canal, le client Supabase du
   navigateur étant un singleton qui refuse deux canaux du même nom. */
let channelSeq = 0;

/* Notifications de l'établissement connecté — la RLS ne laisse passer que
   les siennes, à la lecture comme à la livraison temps réel. Le client ne
   crée jamais de notification (triggers en base) : il lit, coche « lu »
   et purge, rien d'autre. Toute erreur laisse unreadCount à 0 : le layout
   qui monte ce hook ne doit jamais casser. */
export function useVenueNotifications() {
  const { userId, isLoading: authLoading } = useAuthUser();
  const [notifications, setNotifications] = useState<
    VenueNotification[] | null
  >(null);

  /* Instantané courant pour les retours arrière optimistes. */
  const currentRef = useRef<VenueNotification[] | null>(null);
  currentRef.current = notifications;

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    const load = () => {
      supabase
        .from("venue_notifications")
        .select(SELECT)
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data }) => {
          if (cancelled) return;
          setNotifications((data as VenueNotification[] | null) ?? []);
        });
    };

    load();
    const channel = supabase
      .channel(`venue-notifications-${++channelSeq}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "venue_notifications" },
        load
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [authLoading, userId]);

  const markRead = useCallback(async (id: number) => {
    const before = currentRef.current;
    if (!before?.some((n) => n.id === id && !n.read)) return;
    setNotifications(
      before.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const { error } = await createClient()
      .from("venue_notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) setNotifications(before);
  }, []);

  const markAllRead = useCallback(async () => {
    const before = currentRef.current;
    if (!before?.some((n) => !n.read)) return;
    setNotifications(before.map((n) => (n.read ? n : { ...n, read: true })));
    const { error } = await createClient()
      .from("venue_notifications")
      .update({ read: true })
      .eq("read", false);
    if (error) setNotifications(before);
  }, []);

  const clearAll = useCallback(async () => {
    const before = currentRef.current;
    if (!before || before.length === 0) return;
    if (
      !window.confirm(
        "Supprimer définitivement toutes les notifications ?"
      )
    ) {
      return;
    }
    setNotifications([]);
    const { error } = await createClient()
      .from("venue_notifications")
      .delete()
      .gte("id", 0);
    if (error) setNotifications(before);
  }, []);

  return {
    notifications,
    unreadCount: notifications?.filter((n) => !n.read).length ?? 0,
    isLoading: authLoading || (userId !== null && notifications === null),
    markRead,
    markAllRead,
    clearAll,
  };
}
