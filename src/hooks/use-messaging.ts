"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";

/* Messagerie temps réel établissement <-> concierge, sur les tables
   public.profiles / conversations / messages (RLS : seuls les deux
   participants d'une conversation la voient).

   Un seul hook pour les deux dashboards : la logique est identique, seul
   le « camp » change — il est déduit du rôle du compte connecté. */

export type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  venue_name: string | null;
  city: string | null;
};

export type ChatMessage = {
  id: number;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ConversationSummary = {
  id: string;
  venue_id: string;
  concierge_id: string;
  created_at: string;
  /* Le profil d'en face, déjà résolu selon le camp de l'utilisateur. */
  counterpart: Profile;
  lastMessage: ChatMessage | null;
  unread: number;
};

/* Nom affichable d'un profil : un établissement s'identifie par son
   enseigne, une personne par son nom. */
export function displayName(p: Profile | null | undefined): string {
  if (!p) return "Compte supprimé";
  return (
    (p.role === "etablissement" || p.role === "hotel"
      ? p.venue_name || p.full_name
      : p.full_name || p.venue_name) || "Sans nom"
  );
}

export function initialsOf(p: Profile | null | undefined): string {
  return displayName(p)
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* Heure pour aujourd'hui, date courte sinon. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type ConversationRow = {
  id: string;
  venue_id: string;
  concierge_id: string;
  created_at: string;
  venue: Profile | null;
  concierge: Profile | null;
};

/* Récupération pure (aucun setState) : les conversations de l'utilisateur,
   chacune résumée avec le profil d'en face, son dernier message et le
   nombre de non-lus. Renvoie null en cas d'échec réseau. */
async function fetchSummaries(
  userId: string,
  side: "venue" | "concierge"
): Promise<ConversationSummary[] | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, venue_id, concierge_id, created_at, venue:profiles!conversations_venue_id_fkey(id, full_name, role, venue_name, city), concierge:profiles!conversations_concierge_id_fkey(id, full_name, role, venue_name, city)"
    )
    .order("created_at", { ascending: false });

  if (error) return null;
  const rows = (data ?? []) as unknown as ConversationRow[];

  /* Dernier message et non-lus de chaque conversation, en une requête. */
  let allMessages: ChatMessage[] = [];
  if (rows.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in(
        "conversation_id",
        rows.map((r) => r.id)
      )
      .order("created_at", { ascending: true });
    allMessages = (msgs ?? []) as ChatMessage[];
  }

  const summaries: ConversationSummary[] = rows.map((r) => {
    const convMsgs = allMessages.filter((m) => m.conversation_id === r.id);
    return {
      id: r.id,
      venue_id: r.venue_id,
      concierge_id: r.concierge_id,
      created_at: r.created_at,
      counterpart: (side === "venue" ? r.concierge : r.venue) ?? {
        id: "",
        full_name: null,
        role: "",
        venue_name: null,
        city: null,
      },
      lastMessage: convMsgs[convMsgs.length - 1] ?? null,
      unread: convMsgs.filter((m) => m.sender_id !== userId && !m.read_at)
        .length,
    };
  });

  /* Conversations les plus actives en tête. */
  summaries.sort((a, b) =>
    (b.lastMessage?.created_at ?? b.created_at).localeCompare(
      a.lastMessage?.created_at ?? a.created_at
    )
  );

  return summaries;
}

export function useMessaging() {
  const { userId, role, isLoading: authLoading } = useAuthUser();
  /* Un établissement parle à des concierges, et réciproquement. */
  const side: "venue" | "concierge" =
    role === "concierge" ? "concierge" : "venue";

  const [conversations, setConversations] = useState<
    ConversationSummary[] | null
  >(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  /* Le fil est étiqueté par sa conversation : « en chargement » se déduit
     d'un simple décalage entre l'étiquette et la conversation active, sans
     poser d'état à la main dans l'effet. */
  const [thread, setThread] = useState<{
    convId: string;
    items: ChatMessage[];
  } | null>(null);
  const [directory, setDirectory] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    fetchSummaries(userId, side).then((summaries) => {
      if (cancelled) return;
      if (summaries === null) {
        setError("Impossible de charger les conversations.");
        setConversations([]);
        return;
      }
      setConversations(summaries);
      setActiveId((prev) => prev ?? summaries[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, side]);

  /* Marque lus les messages reçus d'une conversation, en base et en local. */
  const markRead = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      setConversations((prev) =>
        prev
          ? prev.map((c) =>
              c.id === conversationId ? { ...c, unread: 0 } : c
            )
          : prev
      );
      const supabase = createClient();
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("read_at", null);
    },
    [userId]
  );

  /* Chargement des messages + abonnement temps réel de la conversation
     active. Le canal est recréé quand on change de conversation. */
  useEffect(() => {
    if (!activeId || !userId) return;
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setThread({ convId: activeId, items: (data ?? []) as ChatMessage[] });
        void markRead(activeId);
      });

    const channel = supabase
      .channel(`conv-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          /* L'insert local ajoute déjà le message : ne pas le doubler. */
          setThread((prev) =>
            !prev ||
            prev.convId !== msg.conversation_id ||
            prev.items.some((m) => m.id === msg.id)
              ? prev
              : { ...prev, items: [...prev.items, msg] }
          );
          setConversations((prev) =>
            prev
              ? prev.map((c) =>
                  c.id === msg.conversation_id ? { ...c, lastMessage: msg } : c
                )
              : prev
          );
          /* Le canal n'existe que pour la conversation active : un message
             reçu ici est donc lu sous les yeux de l'utilisateur. */
          if (msg.sender_id !== userId) {
            void markRead(activeId);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeId, userId, markRead]);

  const sendMessage = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text || !activeId || !userId) return;
      const supabase = createClient();
      const { data, error: sendError } = await supabase
        .from("messages")
        .insert({ conversation_id: activeId, sender_id: userId, body: text })
        .select()
        .single();
      if (sendError || !data) {
        setError("Le message n'a pas pu être envoyé.");
        return;
      }
      const msg = data as ChatMessage;
      setThread((prev) =>
        !prev ||
        prev.convId !== msg.conversation_id ||
        prev.items.some((m) => m.id === msg.id)
          ? prev
          : { ...prev, items: [...prev.items, msg] }
      );
      setConversations((prev) =>
        prev
          ? prev.map((c) => (c.id === activeId ? { ...c, lastMessage: msg } : c))
          : prev
      );
    },
    [activeId, userId]
  );

  /* Annuaire des interlocuteurs possibles : les rôles d'en face. */
  const loadDirectory = useCallback(async () => {
    const supabase = createClient();
    const targetRoles =
      side === "venue" ? ["concierge"] : ["etablissement", "hotel"];
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("role", targetRoles)
      .order("created_at", { ascending: true });
    setDirectory((data ?? []) as Profile[]);
  }, [side]);

  /* Ouvre (ou retrouve) la conversation avec un interlocuteur. */
  const startConversation = useCallback(
    async (counterpartId: string) => {
      if (!userId) return;
      const venue_id = side === "venue" ? userId : counterpartId;
      const concierge_id = side === "venue" ? counterpartId : userId;
      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from("conversations")
        .insert({ venue_id, concierge_id })
        .select("id")
        .single();

      let conversationId = data?.id as string | undefined;

      /* Conflit d'unicité : la conversation existe déjà, on la retrouve. */
      if (insertError) {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("venue_id", venue_id)
          .eq("concierge_id", concierge_id)
          .maybeSingle();
        conversationId = existing?.id;
      }

      if (!conversationId) {
        setError("Impossible d'ouvrir la conversation.");
        return;
      }
      const summaries = await fetchSummaries(userId, side);
      if (summaries) setConversations(summaries);
      setActiveId(conversationId);
    },
    [userId, side]
  );

  /* États dérivés du fil : voir le commentaire de `thread`. */
  const messages =
    thread && thread.convId === activeId ? thread.items : [];
  const messagesLoading =
    activeId !== null && (!thread || thread.convId !== activeId);

  return {
    /* Sans compte connecté (déconnexion en cours), rien à attendre. */
    isLoading: authLoading || (userId !== null && conversations === null),
    side,
    userId,
    conversations: conversations ?? [],
    activeId,
    setActiveId,
    messages,
    messagesLoading,
    sendMessage,
    directory,
    loadDirectory,
    startConversation,
    error,
    dismissError: () => setError(null),
  };
}
