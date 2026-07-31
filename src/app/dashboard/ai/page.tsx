"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

/* ── types ── */

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  time: string;
}

/* ── demo data ── */

const DEMO_MESSAGES: Message[] = [
  {
    id: 1,
    role: "ai",
    text: "Bonjour ! Je suis votre assistant IA twocards. Je peux vous aider \u00e0 g\u00e9rer vos \u00e9v\u00e9nements, r\u00e9servations, entr\u00e9es et commissions. Que souhaitez-vous faire ?",
    time: "20:00",
  },
  {
    id: 2,
    role: "user",
    text: "Combien de r\u00e9servations ce soir ?",
    time: "20:01",
  },
  {
    id: 3,
    role: "ai",
    text: "Ce soir, vous avez 47 r\u00e9servations confirm\u00e9es pour un total de 156 couverts. 34 sont confirm\u00e9es, 8 en attente et 5 annul\u00e9es. Voulez-vous voir le d\u00e9tail par RP ?",
    time: "20:01",
  },
];

const SUGGESTED_ACTIONS = [
  "Cr\u00e9er un \u00e9v\u00e9nement",
  "Voir les r\u00e9servations du soir",
  "Confirmer les entr\u00e9es",
  "D\u00e9clarer un no-show",
  "R\u00e9sum\u00e9 de la soir\u00e9e",
];

/* ── AI response simulator ── */

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("événement") || lower.includes("evenement") || lower.includes("créer"))
    return "Pour cr\u00e9er un \u00e9v\u00e9nement, j\u2019ai besoin du nom, de la date et de la capacit\u00e9 souhait\u00e9e. Quel est le nom de l\u2019\u00e9v\u00e9nement ?";
  if (lower.includes("réservation") || lower.includes("reservation") || lower.includes("soir"))
    return "Ce soir, vous avez 47 r\u00e9servations confirm\u00e9es pour un total de 156 couverts. 34 sont confirm\u00e9es, 8 en attente et 5 annul\u00e9es. Voulez-vous voir le d\u00e9tail par RP ?";
  if (lower.includes("entrée") || lower.includes("entree") || lower.includes("confirmer"))
    return "Vous avez 23 entr\u00e9es confirm\u00e9es sur 47 r\u00e9servations. 24 invit\u00e9s sont encore attendus. Voulez-vous envoyer un rappel aux RP concern\u00e9s ?";
  if (lower.includes("no-show") || lower.includes("noshow") || lower.includes("déclarer"))
    return "Pour d\u00e9clarer un no-show, veuillez me donner le nom de l\u2019invit\u00e9 ou le num\u00e9ro de r\u00e9servation. Je mettrai \u00e0 jour le statut et notifierai le RP.";
  if (lower.includes("résumé") || lower.includes("resume") || lower.includes("soirée") || lower.includes("soiree"))
    return "Voici le r\u00e9sum\u00e9 de la soir\u00e9e : 47 r\u00e9servations, 156 couverts pr\u00e9vus, 23 arriv\u00e9es, 2 no-shows. Chiffre d\u2019affaires estim\u00e9 : 45 000 MAD. Commission RP totale : 6 750 MAD.";
  return "Bien s\u00fbr, je peux vous aider avec \u00e7a. Pourriez-vous me donner plus de d\u00e9tails sur ce que vous souhaitez faire ?";
}

/* ── component ── */

export default function AIAssistantPage() {
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

    // Simulate AI response with a short delay
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
      {/* Main card */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
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

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* AI avatar */}
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

        {/* ── Suggested actions ── */}
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

        {/* ── Input area ── */}
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
