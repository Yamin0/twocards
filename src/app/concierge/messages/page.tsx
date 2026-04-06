"use client";

import { useState } from "react";
import { Send, Building2 } from "lucide-react";

const conversations = [
  {
    id: 1,
    venue: "Le Comptoir Darna",
    city: "Marrakech",
    lastMessage: "Table VIP 3 confirmée pour ce soir. Bienvenue !",
    time: "14:32",
    unread: 2,
  },
  {
    id: 2,
    venue: "Sky Bar Casa",
    city: "Casablanca",
    lastMessage: "Nous avons une soirée spéciale samedi, places limitées.",
    time: "12:15",
    unread: 1,
  },
  {
    id: 3,
    venue: "Le Lotus Club",
    city: "Tanger",
    lastMessage: "Merci pour la réservation. Commission traitée.",
    time: "Hier",
    unread: 0,
  },
  {
    id: 4,
    venue: "Pacha Marrakech",
    city: "Marrakech",
    lastMessage: "Le carré VIP est disponible vendredi soir.",
    time: "Lun.",
    unread: 0,
  },
];

export default function ConciergeMessagesPage() {
  const [activeConv, setActiveConv] = useState(1);

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
            {conversations.map((conv) => (
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
                  {conv.lastMessage}
                </p>
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                <Building2 size={18} strokeWidth={1.5} className="text-on-primary-container" />
              </div>
              <div>
                <p className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                  {conversations.find((c) => c.id === activeConv)?.venue}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {conversations.find((c) => c.id === activeConv)?.city}
                </p>
              </div>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center">
              <p className="text-sm text-on-surface-variant">Les messages s&apos;afficheront ici.</p>
            </div>

            <div className="p-4 border-t border-outline-variant/20">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2.5 bg-surface-low border-none rounded-sm text-sm text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary-container focus:outline-none"
                />
                <button className="p-2.5 bg-primary text-white rounded-sm hover:opacity-90 transition-opacity">
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
