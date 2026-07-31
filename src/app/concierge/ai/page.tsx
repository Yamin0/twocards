"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  time: string;
}

const DEMO_MESSAGES: Message[] = [
  {
    id: 1,
    role: "ai",
    text: "Bonjour ! Je suis votre assistant IA twocards. Je peux vous aider à gérer vos réservations, clients, commissions et établissements. Que souhaitez-vous faire ?",
    time: "20:00",
  },
  {
    id: 2,
    role: "user",
    text: "Mes commissions de ce mois ?",
    time: "20:01",
  },
  {
    id: 3,
    role: "ai",
    text: "Ce mois, vous avez généré 24 850 MAD de commissions. 16 430 MAD ont été versés, 8 420 MAD sont en attente de validation. Votre meilleur établissement est Le Comptoir avec 12 400 MAD.",
    time: "20:01",
  },
];

const SUGGESTED_ACTIONS = [
  "Nouvelle réservation",
  "Mes commissions",
  "Clients VIP disponibles",
  "Événements de la semaine",
  "Contacter un établissement",
];

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("réservation") || lower.includes("reservation") || lower.includes("nouvelle"))
    return "Pour créer une réservation, j'ai besoin de l'établissement, du nom du client, du nombre de couverts et de la date. Quel établissement souhaitez-vous ?";
  if (lower.includes("commission") || lower.includes("gain"))
    return "Ce mois, vous avez généré 24 850 MAD de commissions. 16 430 MAD ont été versés, 8 420 MAD sont en attente de validation. Votre meilleur établissement est Le Comptoir avec 12 400 MAD.";
  if (lower.includes("client") || lower.includes("vip"))
    return "Vous avez 45 clients actifs dont 12 VIP. Les plus réguliers : Famille Tazi (8 visites), M. Alaoui (6 visites), Sarah Bennis (5 visites). Voulez-vous créer une réservation pour l'un d'eux ?";
  if (lower.includes("événement") || lower.includes("evenement") || lower.includes("semaine"))
    return "Cette semaine : Soirée VIP au Comptoir (Ven. 18), Opening Night chez Nobu (Sam. 19), Brunch Jazz à L'Éclipse (Dim. 20). Voulez-vous réserver des tables ?";
  if (lower.includes("contacter") || lower.includes("établissement") || lower.includes("etablissement"))
    return "Vos établissements partenaires : Le Comptoir (Marrakech), Sky Bar (Casablanca), L'Éclipse (Paris), Nobu (Marrakech). Lequel souhaitez-vous contacter ?";
  return "Bien sûr, je peux vous aider avec ça. Pourriez-vous me donner plus de détails ?";
}

export default function ConciergeAIPage() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const now = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      text: text.trim(),
      time: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: getAIResponse(text),
        time: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)] flex flex-col">
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08]">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center">
            <Sparkles size={20} strokeWidth={1.5} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)]">
              Assistant IA
            </h2>
            <p className="text-xs text-white/40">
              twocards AI &middot; Toujours disponible
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[0.6875rem] text-green-400/70">En ligne</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="flex-shrink-0 mr-3 mt-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Bot size={16} strokeWidth={1.5} className="text-blue-400" />
                  </div>
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-500/20 border border-blue-400/15 rounded-2xl rounded-br-md"
                    : "bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-md"
                }`}
              >
                {msg.role === "ai" && (
                  <p className="text-[0.625rem] font-semibold text-blue-400/70 mb-1 font-[family-name:var(--font-manrope)]">
                    Assistant IA
                  </p>
                )}
                <p
                  className={`text-sm leading-relaxed font-[family-name:var(--font-inter)] ${
                    msg.role === "user" ? "text-white/90" : "text-white/70"
                  }`}
                >
                  {msg.text}
                </p>
                <span
                  className={`block text-[0.5625rem] mt-1.5 ${
                    msg.role === "user" ? "text-blue-300/40 text-right" : "text-white/20"
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested actions */}
        <div className="px-5 py-3 border-t border-white/[0.06]">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-blue-400/30 rounded-xl text-xs text-white/60 hover:text-white transition-all font-[family-name:var(--font-inter)]"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-5 py-3.5 border-t border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Demandez quelque chose..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              className="flex-1 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/30 transition-colors font-[family-name:var(--font-inter)]"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="p-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-white/[0.06] disabled:text-white/15 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(96,165,250,0.2)] disabled:shadow-none"
            >
              <Send size={17} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
