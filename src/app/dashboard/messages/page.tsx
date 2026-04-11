"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  ArrowLeft,
  MessageSquare,
  Check,
  CheckCheck,
} from "lucide-react";

/* ── types ── */

interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  date: string;
}

interface Conversation {
  id: number;
  name: string;
  initials: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  online: boolean;
  messages: Message[];
}

/* ── demo data ── */

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: "Liam Hamza",
    initials: "LH",
    role: "Jota Conciergerie",
    lastMessage: "Je confirme la table VIP pour samedi soir, 8 personnes.",
    timestamp: "14:32",
    unread: true,
    online: true,
    messages: [
      { id: 1, sender: "them", text: "Salut, j'ai un groupe de 8 pour samedi soir.", time: "13:45", date: "Aujourd'hui" },
      { id: 2, sender: "me", text: "Salut Liam ! Bien sûr, tu veux la table VIP habituelle ?", time: "13:52", date: "Aujourd'hui" },
      { id: 3, sender: "them", text: "Oui exactement, ils veulent la grande table près de la piste.", time: "14:10", date: "Aujourd'hui" },
      { id: 4, sender: "me", text: "Parfait, c'est noté. Consommation minimum de 2000 MAD pour le groupe, ça marche ?", time: "14:15", date: "Aujourd'hui" },
      { id: 5, sender: "them", text: "Je confirme la table VIP pour samedi soir, 8 personnes.", time: "14:32", date: "Aujourd'hui" },
    ],
  },
  {
    id: 2,
    name: "Karim Bennani",
    initials: "KB",
    role: "Atlas Concierge",
    lastMessage: "Merci pour la confirmation, je transmets au client.",
    timestamp: "12:15",
    unread: true,
    online: true,
    messages: [
      { id: 1, sender: "me", text: "Karim, ta réservation pour vendredi est validée. Table 12.", time: "11:30", date: "Aujourd'hui" },
      { id: 2, sender: "them", text: "Merci pour la confirmation, je transmets au client.", time: "12:15", date: "Aujourd'hui" },
    ],
  },
  {
    id: 3,
    name: "Sofia Alaoui",
    initials: "SA",
    role: "Jota Conciergerie",
    lastMessage: "D'accord, je regarde les disponibilités et je reviens vers toi.",
    timestamp: "Hier",
    unread: false,
    online: false,
    messages: [
      { id: 1, sender: "them", text: "Salut, est-ce qu'il reste de la place pour un anniversaire le 15 ?", time: "18:20", date: "Hier" },
      { id: 2, sender: "me", text: "D'accord, je regarde les disponibilités et je reviens vers toi.", time: "18:45", date: "Hier" },
    ],
  },
  {
    id: 4,
    name: "Youssef El Idrissi",
    initials: "YE",
    role: "Noctis VIP",
    lastMessage: "Les commissions de septembre sont bien arrivées, merci !",
    timestamp: "Lun",
    unread: false,
    online: false,
    messages: [
      { id: 1, sender: "them", text: "Tu as envoyé les commissions de septembre ?", time: "10:00", date: "Lundi" },
      { id: 2, sender: "me", text: "Oui, le virement a été fait vendredi.", time: "10:30", date: "Lundi" },
      { id: 3, sender: "them", text: "Les commissions de septembre sont bien arrivées, merci !", time: "14:00", date: "Lundi" },
    ],
  },
  {
    id: 5,
    name: "Hind Fassi",
    initials: "HF",
    role: "Prestige Access",
    lastMessage: "On se voit demain pour discuter du partenariat ?",
    timestamp: "28 Mar",
    unread: false,
    online: true,
    messages: [
      { id: 1, sender: "them", text: "Je voulais te parler d'un potentiel partenariat pour la saison.", time: "16:00", date: "28 Mars" },
      { id: 2, sender: "me", text: "Avec plaisir, quand es-tu dispo ?", time: "16:30", date: "28 Mars" },
      { id: 3, sender: "them", text: "On se voit demain pour discuter du partenariat ?", time: "17:00", date: "28 Mars" },
    ],
  },
];

/* ── component ── */

export default function MessagesPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const conversations = isDemoVenue ? DEMO_CONVERSATIONS : [];

  const [selectedId, setSelectedId] = useState<number | null>(isDemoVenue ? 1 : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<number, Message[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedId, localMessages, scrollToBottom]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedId) return;
    const newMsg: Message = {
      id: Date.now(),
      sender: "me",
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      date: "Aujourd'hui",
    };
    setLocalMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg],
    }));
    setMessageInput("");
  };

  const selected = conversations.find((c) => c.id === selectedId);
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allMessages = selected
    ? [...selected.messages, ...(localMessages[selected.id] || [])]
    : [];

  const groupedMessages = allMessages.reduce<Record<string, Message[]>>((acc, msg) => {
    if (!acc[msg.date]) acc[msg.date] = [];
    acc[msg.date].push(msg);
    return acc;
  }, {});

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)]">
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl h-full flex overflow-hidden">
        {/* ── Conversation List ── */}
        <div
          className={`w-full md:w-[340px] lg:w-[360px] border-r border-white/[0.08] flex-shrink-0 ${
            selectedId !== null ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          {/* Header */}
          <div className="p-4 pb-3">
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] mb-3">
              Messages
            </h2>
            <div className="relative">
              <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/30 transition-colors"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <MessageSquare size={28} strokeWidth={1} className="text-white/10 mb-2" />
                <p className="text-xs text-white/20">Aucune conversation</p>
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isActive = convo.id === selectedId;
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedId(convo.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all ${
                      isActive
                        ? "bg-white/[0.08] border-l-2 border-l-blue-400"
                        : "hover:bg-white/[0.04] border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-blue-400/20" : "bg-white/[0.08]"}`}>
                        <span className={`text-xs font-semibold ${isActive ? "text-blue-400" : "text-white/60"}`}>
                          {convo.initials}
                        </span>
                      </div>
                      {convo.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a0a0f]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-[family-name:var(--font-manrope)] ${convo.unread ? "font-bold text-white" : "font-medium text-white/70"}`}>
                          {convo.name}
                        </span>
                        <span className={`text-[0.625rem] flex-shrink-0 ${convo.unread ? "font-semibold text-blue-400" : "text-white/25"}`}>
                          {convo.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-xs truncate ${convo.unread ? "text-white/50" : "text-white/25"}`}>
                          {convo.lastMessage}
                        </p>
                        {convo.unread && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat View ── */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            selectedId === null ? "hidden md:flex" : "flex"
          }`}
        >
          {selected ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all mr-1"
                  >
                    <ArrowLeft size={18} strokeWidth={1.5} />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-400/15 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-400">{selected.initials}</span>
                    </div>
                    {selected.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a0a0f]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
                      {selected.name}
                    </h3>
                    <p className="text-[0.6875rem] text-white/30">
                      {selected.role} {selected.online && <span className="text-green-400">· En ligne</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => showToast("Appel en cours...")} className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/[0.08] transition-all">
                    <Phone size={17} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => showToast("Appel vidéo en cours...")} className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/[0.08] transition-all">
                    <Video size={17} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => showToast("Options bientôt disponibles")} className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/[0.08] transition-all">
                    <MoreVertical size={17} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-3">
                      <span className="px-3 py-1 bg-white/[0.05] rounded-full text-[0.5625rem] font-medium text-white/20 uppercase tracking-wider">
                        {date}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {msgs.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 ${
                              msg.sender === "me"
                                ? "bg-blue-500/20 border border-blue-400/15 rounded-2xl rounded-br-md"
                                : "bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-md"
                            }`}
                          >
                            <p className={`text-sm leading-relaxed ${msg.sender === "me" ? "text-white/90" : "text-white/70"}`}>
                              {msg.text}
                            </p>
                            <div className={`flex items-center gap-1 mt-1 ${msg.sender === "me" ? "justify-end" : ""}`}>
                              <span className={`text-[0.5625rem] ${msg.sender === "me" ? "text-blue-300/40" : "text-white/20"}`}>
                                {msg.time}
                              </span>
                              {msg.sender === "me" && (
                                <CheckCheck size={11} strokeWidth={1.5} className="text-blue-300/40" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="px-5 py-3.5 border-t border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => showToast("Pièce jointe bientôt disponible")} className="p-2 rounded-xl text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all">
                    <Paperclip size={18} strokeWidth={1.5} />
                  </button>
                  <input
                    type="text"
                    placeholder="Écrire un message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/30 transition-colors"
                  />
                  <button onClick={() => showToast("Emojis bientôt disponibles")} className="p-2 rounded-xl text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-all">
                    <Smile size={18} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-white/[0.06] disabled:text-white/15 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(96,165,250,0.2)] disabled:shadow-none"
                  >
                    <Send size={17} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-3">
                <MessageSquare size={24} strokeWidth={1.5} className="text-white/15" />
              </div>
              <p className="text-sm text-white/30 font-[family-name:var(--font-manrope)]">
                {conversations.length === 0 ? "Aucune conversation" : "Sélectionnez une conversation"}
              </p>
              <p className="text-xs text-white/15 mt-1">pour commencer à discuter</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-xl">
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
