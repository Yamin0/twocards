"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import {
  displayName,
  formatTimestamp,
  initialsOf,
  useMessaging,
  type ConversationSummary,
  type Profile,
} from "@/hooks/use-messaging";
import { useLocale, useT } from "@/lib/i18n/client";

/* Messagerie réelle (Supabase + temps réel), partagée par les deux
   dashboards : le camp (établissement ou concierge) est déduit du rôle du
   compte connecté par useMessaging ; seuls les libellés changent. */

const panel =
  " bg-panel border border-line rounded-3xl";

export type MessengerLabels = {
  searchPlaceholder: string;
  counterpartHint: string;
  emptyHint: string;
  directoryEmpty: string;
};

export function Messenger({
  labels,
  initialCounterpartId = null,
}: {
  labels: MessengerLabels;
  /* Profil dont la conversation s'ouvre d'office (lien « Message »). */
  initialCounterpartId?: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const {
    isLoading,
    userId,
    conversations,
    activeId,
    setActiveId,
    messages,
    messagesLoading,
    sendMessage,
    directory,
    loadDirectory,
    startConversation,
    error,
    dismissError,
  } = useMessaging({ openWith: initialCounterpartId });

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  /* Mobile : la liste et le fil partagent l'écran ; on n'affiche que l'un. */
  const [mobileThread, setMobileThread] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (pickerOpen && directory === null) void loadDirectory();
  }, [pickerOpen, directory, loadDirectory]);

  if (isLoading) return null;

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const q = search.trim().toLowerCase();
  const visible = q
    ? conversations.filter((c) =>
        displayName(c.counterpart, locale).toLowerCase().includes(q)
      )
    : conversations;

  const handleSend = async () => {
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 lg:h-[calc(100vh-96px)]">
      {/* ── Liste des conversations ── */}
      <div
        className={`${panel} flex w-full flex-col overflow-hidden lg:w-80 lg:shrink-0 ${
          mobileThread ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="border-b border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-bold text-ink">
              Messages
            </h1>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-link px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-link-strong"
            >
              <Plus size={14} strokeWidth={2} />
              {t("Nouvelle", "New")}
            </button>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full rounded-xl border border-line bg-fill py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-4 focus:border-info/25 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fill">
                <MessageSquare size={20} className="text-ink-3" />
              </div>
              <p className="text-sm font-medium text-ink-2">
                {conversations.length === 0
                  ? t("Aucune conversation pour le moment", "No conversations yet")
                  : t("Aucun résultat", "No results")}
              </p>
              {conversations.length === 0 && (
                <p className="text-xs leading-relaxed text-ink-3">
                  {labels.emptyHint}
                </p>
              )}
            </div>
          )}
          {visible.map((c: ConversationSummary) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveId(c.id);
                setMobileThread(true);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-fill ${
                c.id === activeId ? "bg-fill-2" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-xs font-bold text-info">
                {initialsOf(c.counterpart, locale)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink">
                    {displayName(c.counterpart, locale)}
                  </p>
                  {c.lastMessage && (
                    <span className="shrink-0 text-xs text-ink-3">
                      {formatTimestamp(c.lastMessage.created_at, locale)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-ink-3">
                    {c.lastMessage?.body ?? t("Conversation ouverte", "Conversation started")}
                  </p>
                  {c.unread > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-link px-1 text-xs font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Fil de la conversation active ── */}
      <div
        className={`${panel} flex-1 flex-col overflow-hidden ${
          mobileThread ? "flex" : "hidden lg:flex"
        }`}
      >
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <button
                onClick={() => setMobileThread(false)}
                className="rounded-lg p-1 text-ink-3 hover:text-ink lg:hidden"
                aria-label={t("Retour aux conversations", "Back to conversations")}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-info-soft text-xs font-bold text-info">
                {initialsOf(active.counterpart, locale)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {displayName(active.counterpart, locale)}
                </p>
                <p className="text-xs text-ink-3">
                  {active.counterpart.city || labels.counterpartHint}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5 scrollbar-thin">
              {messagesLoading && (
                <p className="py-8 text-center text-xs text-ink-3">
                  {t("Chargement…", "Loading…")}
                </p>
              )}
              {!messagesLoading && messages.length === 0 && (
                <p className="py-8 text-center text-xs text-ink-3">
                  {t("Aucun message. Écrivez le premier.", "No messages yet. Write the first one.")}
                </p>
              )}
              {messages.map((m) => {
                const mine = m.sender_id === userId;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        mine
                          ? "rounded-br-md bg-link text-white"
                          : "rounded-bl-md bg-fill-2 text-ink"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {m.body}
                      </p>
                      <p
                        className={`mt-1 text-right text-xs ${
                          mine ? "text-ink-2" : "text-ink-3"
                        }`}
                      >
                        {formatTimestamp(m.created_at, locale)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="border-t border-line p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder={t("Votre message...", "Your message...")}
                  rows={1}
                  className="max-h-32 flex-1 resize-none rounded-xl border border-line bg-fill px-4 py-2.5 text-sm text-ink placeholder:text-ink-4 focus:border-info/25 focus:outline-none"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!input.trim()}
                  aria-label={t("Envoyer", "Send")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-link text-white transition-colors hover:bg-link-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fill">
              <MessageSquare size={24} className="text-ink-3" />
            </div>
            <p className="text-sm font-semibold text-ink-2">
              {t("Sélectionnez une conversation", "Select a conversation")}
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-ink-3">
              {labels.emptyHint}
            </p>
          </div>
        )}
      </div>

      {/* ── Choix d'un interlocuteur ── */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4">
          <div className={`${panel} w-full max-w-sm p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">
                {t("Nouvelle conversation", "New conversation")}
              </h2>
              <button
                onClick={() => setPickerOpen(false)}
                className="rounded-lg p-1 text-ink-3 hover:text-ink"
                aria-label={t("Fermer", "Close")}
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto scrollbar-thin">
              {directory === null && (
                <p className="py-6 text-center text-xs text-ink-3">
                  {t(<>Chargement de l&apos;annuaire…</>, <>Loading directory…</>)}
                </p>
              )}
              {directory?.length === 0 && (
                <p className="py-6 text-center text-xs text-ink-3">
                  {labels.directoryEmpty}
                </p>
              )}
              {directory?.map((p: Profile) => (
                <button
                  key={p.id}
                  onClick={async () => {
                    setPickerOpen(false);
                    setMobileThread(true);
                    await startConversation(p.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-fill"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-info-soft text-xs font-bold text-info">
                    {initialsOf(p, locale)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {displayName(p, locale)}
                    </p>
                    <p className="text-xs text-ink-3">
                      {p.city || labels.counterpartHint}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Erreur réseau ── */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
          <button
            onClick={dismissError}
            className="text-danger hover:text-danger"
            aria-label={t("Fermer l'erreur", "Dismiss error")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
