"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Building2, Check, MessageSquare } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  from: "me" | "venue";
  text: string;
  time: string;
}

const DEMO_CONVERSATIONS = [
  {
    id: 1,
    venue: "Le Comptoir Darna",
    city: "Marrakech",
    lastMessage: "Table VIP 3 confirmée pour ce soir. Bienvenue !",
    time: "14:32",
    unread: 2,
    messages: [
      { id: 1, from: "venue" as const, text: "Bonjour, nous avons bien reçu la demande pour 8 couverts ce soir.", time: "14:10" },
      { id: 2, from: "me" as const, text: "Parfait, le client souhaite la table VIP 3 avec vue terrasse.", time: "14:15" },
      { id: 3, from: "venue" as const, text: "Table VIP 3 confirmée pour ce soir. Bienvenue !", time: "14:32" },
    ],
  },
  {
    id: 2,
    venue: "Sky Bar Casa",
    city: "Casablanca",
    lastMessage: "Nous avons une soirée spéciale samedi, places limitées.",
    time: "12:15",
    unread: 1,
    messages: [
      { id: 1, from: "venue" as const, text: "Bonjour ! Nous avons une soirée spéciale samedi, places limitées. Intéressé pour vos clients ?", time: "12:15" },
    ],
  },
  {
    id: 3,
    venue: "Le Lotus Club",
    city: "Tanger",
    lastMessage: "Merci pour la réservation. Commission traitée.",
    time: "Hier",
    unread: 0,
    messages: [
      { id: 1, from: "me" as const, text: "La réservation pour Omar Tazi est confirmée ?", time: "16:00" },
      { id: 2, from: "venue" as const, text: "Oui, carré VIP réservé. 12 couverts.", time: "16:45" },
      { id: 3, from: "me" as const, text: "Super, merci !", time: "16:50" },
      { id: 4, from: "venue" as const, text: "Merci pour la réservation. Commission traitée.", time: "Hier" },
    ],
  },
  {
    id: 4,
    venue: "Pacha Marrakech",
    city: "Marrakech",
    lastMessage: "Le carré VIP est disponible vendredi soir.",
    time: "Lun.",
    unread: 0,
    messages: [
      { id: 1, from: "venue" as const, text: "Le carré VIP est disponible vendredi soir. Voulez-vous réserver ?", time: "Lun." },
    ],
  },
];

export default function ConciergeMessagesPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState<Record<number, Message[]>>({});
  const [inputValue, setInputValue] = useState("");
  const { toast, showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const conversations = isDemoConcierge ? DEMO_CONVERSATIONS : [];

  useEffect(() => {
    if (!isLoading && !initialized.current) {
      initialized.current = true;
      if (isDemoConcierge && DEMO_CONVERSATIONS.length > 0) {
        setActiveConv(DEMO_CONVERSATIONS[0].id);
      }
    }
  }, [isLoading, isDemoConcierge]);

  const activeConvData = activeConv !== null ? conversations.find((c) => c.id === activeConv) : undefined;
  const allMessages = [
    ...(activeConvData?.messages || []),
    ...(activeConv !== null ? (localMessages[activeConv] || []) : []),
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length, activeConv]);

  const handleSend = () => {
    if (!inputValue.trim() || activeConv === null) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newMsg: Message = {
      id: Date.now(),
      from: "me",
      text: inputValue.trim(),
      time: timeStr,
    };
    setLocalMessages((prev) => ({
      ...prev,
      [activeConv]: [...(prev[activeConv] || []), newMsg],
    }));
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold">
          Messages
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Échangez avec vos établissements partenaires.
        </p>
      </div>

      <div className="px-8 pb-8">
        <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden grid grid-cols-1 lg:grid-cols-3" style={{ height: "calc(100vh - 200px)" }}>
          {/* Conversation list */}
          <div className="border-r border-outline-variant/20 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <MessageSquare size={32} strokeWidth={1} className="text-on-surface-variant/30 mb-3" />
                <p className="text-sm text-on-surface-variant">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const extraMessages = localMessages[conv.id] || [];
                const lastMsg = extraMessages.length > 0
                  ? extraMessages[extraMessages.length - 1].text
                  : conv.lastMessage;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      activeConv === conv.id ? "bg-primary/5" : "hover:bg-surface-low"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                          <Building2 size={14} strokeWidth={1.5} className="text-on-primary-container" />
                        </div>
                        <div>
                          <p className="font-[family-name:var(--font-manrope)] font-bold text-sm text-on-background">
                            {conv.venue}
                          </p>
                          <p className="text-[0.625rem] text-on-surface-variant">{conv.city}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[0.625rem] text-on-surface-variant">{conv.time}</span>
                        {conv.unread > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[0.625rem] font-bold flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate mt-1 ml-10">
                      {lastMsg}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2 flex flex-col">
            {!activeConvData ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <MessageSquare size={40} strokeWidth={1} className="text-on-surface-variant/30 mb-3" />
                <p className="text-sm text-on-surface-variant">Sélectionnez une conversation</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                    <Building2 size={18} strokeWidth={1.5} className="text-on-primary-container" />
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                      {activeConvData.venue}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {activeConvData.city}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {allMessages.map((msg) => (
                    <div
                      key={`${msg.from}-${msg.id}`}
                      className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          msg.from === "me"
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-surface-low text-on-background rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p
                          className={`text-[0.625rem] mt-1 ${
                            msg.from === "me" ? "text-white/60" : "text-on-surface-variant/60"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Écrire un message..."
                      className="flex-1 px-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary-container focus:outline-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className="p-2.5 bg-primary text-white rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Send size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
