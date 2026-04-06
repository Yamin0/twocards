"use client";

import { useState } from "react";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  ArrowLeft,
} from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Samy Benchekroun",
    initials: "SB",
    role: "RP Senior",
    venue: "Le Comptoir",
    lastMessage: "Je confirme la table VIP pour samedi soir, 8 personnes.",
    timestamp: "14:32",
    unread: true,
    messages: [
      { id: 1, sender: "them", text: "Salut, j'ai un groupe de 8 pour samedi soir.", time: "13:45", date: "Aujourd'hui" },
      { id: 2, sender: "me", text: "Salut Samy ! Bien sur, tu veux la table VIP habituelle ?", time: "13:52", date: "Aujourd'hui" },
      { id: 3, sender: "them", text: "Oui exactement, ils veulent la grande table pres de la piste.", time: "14:10", date: "Aujourd'hui" },
      { id: 4, sender: "me", text: "Parfait, c'est note. Consommation minimum de 2000 MAD pour le groupe, ca marche ?", time: "14:15", date: "Aujourd'hui" },
      { id: 5, sender: "them", text: "Je confirme la table VIP pour samedi soir, 8 personnes.", time: "14:32", date: "Aujourd'hui" },
    ],
  },
  {
    id: 2,
    name: "Yasmine El Idrissi",
    initials: "YE",
    role: "RP",
    venue: "L'Arc Casablanca",
    lastMessage: "Merci pour la confirmation, je transmets au client.",
    timestamp: "12:15",
    unread: true,
    messages: [
      { id: 1, sender: "me", text: "Yasmine, ta reservation pour vendredi est validee. Table 12.", time: "11:30", date: "Aujourd'hui" },
      { id: 2, sender: "them", text: "Merci pour la confirmation, je transmets au client.", time: "12:15", date: "Aujourd'hui" },
    ],
  },
  {
    id: 3,
    name: "Nadia Berrada",
    initials: "NB",
    role: "RP Junior",
    venue: "Chez Castel",
    lastMessage: "D'accord, je regarde les disponibilites et je reviens vers toi.",
    timestamp: "Hier",
    unread: false,
    messages: [
      { id: 1, sender: "them", text: "Salut, est-ce qu'il reste de la place pour un anniversaire le 15 ?", time: "18:20", date: "Hier" },
      { id: 2, sender: "me", text: "D'accord, je regarde les disponibilites et je reviens vers toi.", time: "18:45", date: "Hier" },
    ],
  },
  {
    id: 4,
    name: "Amine Tazi",
    initials: "AT",
    role: "RP Senior",
    venue: "Le Baron",
    lastMessage: "Les commissions de septembre sont bien arrivees, merci !",
    timestamp: "Lun",
    unread: false,
    messages: [
      { id: 1, sender: "them", text: "Tu as envoye les commissions de septembre ?", time: "10:00", date: "Lundi" },
      { id: 2, sender: "me", text: "Oui, le virement a ete fait vendredi.", time: "10:30", date: "Lundi" },
      { id: 3, sender: "them", text: "Les commissions de septembre sont bien arrivees, merci !", time: "14:00", date: "Lundi" },
    ],
  },
  {
    id: 5,
    name: "Reda Mohammedi",
    initials: "RM",
    role: "RP",
    venue: "Wanderlust",
    lastMessage: "On se voit demain pour discuter du partenariat ?",
    timestamp: "28 Sep",
    unread: false,
    messages: [
      { id: 1, sender: "them", text: "Je voulais te parler d'un potentiel partenariat pour la saison.", time: "16:00", date: "28 Septembre" },
      { id: 2, sender: "me", text: "Avec plaisir, quand es-tu dispo ?", time: "16:30", date: "28 Septembre" },
      { id: 3, sender: "them", text: "On se voit demain pour discuter du partenariat ?", time: "17:00", date: "28 Septembre" },
    ],
  },
];

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const selected = conversations.find((c) => c.id === selectedId);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group messages by date
  const groupedMessages = selected
    ? selected.messages.reduce<Record<string, typeof selected.messages>>((acc, msg) => {
        if (!acc[msg.date]) acc[msg.date] = [];
        acc[msg.date].push(msg);
        return acc;
      }, {})
    : {};

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversation List - Left Panel */}
      <div
        className={`w-full lg:w-[35%] bg-surface-card editorial-shadow flex flex-col ${
          selectedId !== null ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search
              size={18}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((convo) => {
            const isActive = convo.id === selectedId;
            return (
              <button
                key={convo.id}
                onClick={() => setSelectedId(convo.id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                  isActive
                    ? "bg-surface-low editorial-shadow"
                    : "hover:bg-surface-low/50"
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-xs font-bold text-on-primary-container">
                    {convo.initials}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-[family-name:var(--font-manrope)] ${
                        convo.unread
                          ? "font-bold text-on-background"
                          : "font-medium text-on-background"
                      }`}
                    >
                      {convo.name}
                    </span>
                    <span
                      className={`text-[11px] flex-shrink-0 ${
                        convo.unread
                          ? "font-bold text-primary"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {convo.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-on-surface-variant truncate">
                      {convo.lastMessage}
                    </p>
                    {convo.unread && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat View - Right Panel */}
      <div
        className={`flex-1 flex flex-col bg-surface ${
          selectedId === null ? "hidden lg:flex" : "flex"
        }`}
      >
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-surface-card editorial-shadow">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-1 text-on-surface-variant hover:text-on-background transition-colors"
                >
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-xs font-bold text-on-primary-container">
                    {selected.initials}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold font-[family-name:var(--font-manrope)] text-on-background">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {selected.role} &middot; {selected.venue}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md text-on-surface-variant hover:bg-surface-low transition-colors">
                  <Phone size={18} strokeWidth={1.5} />
                </button>
                <button className="p-2 rounded-md text-on-surface-variant hover:bg-surface-low transition-colors">
                  <Video size={18} strokeWidth={1.5} />
                </button>
                <button className="p-2 rounded-md text-on-surface-variant hover:bg-surface-low transition-colors">
                  <MoreVertical size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 bg-surface-mid rounded-full text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
                      {date}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {msgs.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === "me" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-md ${
                            msg.sender === "me"
                              ? "bg-primary-container text-white"
                              : "bg-surface-card editorial-shadow text-on-background"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.sender === "me"
                                ? "text-white/60"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 bg-surface-card editorial-shadow">
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-md text-on-surface-variant hover:bg-surface-low transition-colors">
                  <Paperclip size={18} strokeWidth={1.5} />
                </button>
                <input
                  type="text"
                  placeholder="Ecrire un message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button className="p-2 rounded-md text-on-surface-variant hover:bg-surface-low transition-colors">
                  <Smile size={18} strokeWidth={1.5} />
                </button>
                <button className="p-2.5 bg-primary-container text-white rounded-sm hover:bg-primary transition-colors">
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-on-surface-variant text-sm">
              Selectionnez une conversation pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
