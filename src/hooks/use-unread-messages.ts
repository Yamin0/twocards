"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";

/* Nombre de messages reçus non lus, tous fils confondus — la pastille des
   barres latérales. La RLS borne la requête aux conversations de
   l'utilisateur, et borne aussi la livraison temps réel : tout événement
   reçu concerne forcément l'un de ses fils, on recompte alors.

   Un recomptage (head + count, aucune ligne transférée) plutôt qu'une
   arithmétique locale : l'ouverture d'un fil marque plusieurs messages lus
   d'un coup, le delta serait fragile. */
export function useUnreadMessages(): number {
  const { userId, isLoading } = useAuthUser();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isLoading || !userId) return;
    const supabase = createClient();
    let cancelled = false;

    const refresh = () => {
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", userId)
        .is("read_at", null)
        .then(({ count: fresh }) => {
          if (!cancelled) setCount(fresh ?? 0);
        });
    };

    refresh();

    /* INSERT : un message arrive. UPDATE : des messages passent lus. */
    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        refresh
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isLoading, userId]);

  return count;
}
