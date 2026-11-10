"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useT, useIntlLocale } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  time: string;
}

const getWelcomeMessage = (t: Translate): Message => ({
  id: 1,
  role: "ai",
  text: t(
    "Bonjour ! Je suis votre assistant IA twocards. Je peux vous aider à gérer vos réservations, clients, commissions et établissements. Que souhaitez-vous faire ?",
    "Hello! I'm your twocards AI assistant. I can help you manage your reservations, guests, commissions and venues. What would you like to do?",
  ),
  time: "20:00",
});

const getDemoMessages = (t: Translate): Message[] => [
  getWelcomeMessage(t),
  {
    id: 2,
    role: "user",
    text: t("Mes commissions de ce mois ?", "My commissions this month?"),
    time: "20:01",
  },
  {
    id: 3,
    role: "ai",
    text: t(
      "Ce mois, vous avez généré 24 850 MAD de commissions. 16 430 MAD ont été versés, 8 420 MAD sont en attente de validation. Votre meilleur établissement est Le Comptoir avec 12 400 MAD.",
      "This month you've earned 24,850 MAD in commissions. 16,430 MAD has been paid out and 8,420 MAD is awaiting approval. Your top venue is Le Comptoir with 12,400 MAD.",
    ),
    time: "20:01",
  },
];

const getSuggestedActions = (t: Translate) => [
  t("Nouvelle réservation", "New reservation"),
  t("Mes commissions", "My commissions"),
  t("Clients VIP disponibles", "Available VIP guests"),
  t("Événements de la semaine", "This week's events"),
  t("Contacter un établissement", "Contact a venue"),
];

/* Réponses scriptées : mots-clés français et anglais, réponse dans la
   langue de l'interface. */
function getAIResponse(input: string, isDemo: boolean, t: Translate): string {
  const lower = input.toLowerCase();
  if (lower.includes("réservation") || lower.includes("reservation") || lower.includes("nouvelle") || lower.includes("book"))
    return t(
      "Pour créer une réservation, j'ai besoin de l'établissement, du nom du client, du nombre de couverts et de la date. Quel établissement souhaitez-vous ?",
      "To create a reservation, I need the venue, the guest's name, the number of covers and the date. Which venue would you like?",
    );
  /* Les chiffres ne sont cités que sur le compte de démonstration : un
     compte réel n'a pas encore de données, l'assistant ne doit rien inventer. */
  if (lower.includes("commission") || lower.includes("gain") || lower.includes("earning"))
    return isDemo
      ? t(
          "Ce mois, vous avez généré 24 850 MAD de commissions. 16 430 MAD ont été versés, 8 420 MAD sont en attente de validation. Votre meilleur établissement est Le Comptoir avec 12 400 MAD.",
          "This month you've earned 24,850 MAD in commissions. 16,430 MAD has been paid out and 8,420 MAD is awaiting approval. Your top venue is Le Comptoir with 12,400 MAD.",
        )
      : t(
          "Vous n'avez pas encore de commissions enregistrées. Elles apparaîtront ici dès votre première réservation confirmée.",
          "You don't have any commissions yet. They'll appear here as soon as your first reservation is confirmed.",
        );
  if (lower.includes("client") || lower.includes("vip") || lower.includes("guest"))
    return isDemo
      ? t(
          "Vous avez 45 clients actifs dont 12 VIP. Les plus réguliers : Famille Tazi (8 visites), M. Alaoui (6 visites), Sarah Bennis (5 visites). Voulez-vous créer une réservation pour l'un d'eux ?",
          "You have 45 active guests, 12 of them VIP. Your most loyal: the Tazi family (8 visits), Mr Alaoui (6 visits), Sarah Bennis (5 visits). Would you like to book for one of them?",
        )
      : t(
          "Votre base clients est encore vide. Ajoutez vos premiers clients depuis l'onglet CRM Clients.",
          "Your guest list is still empty. Add your first guests from the Guest CRM tab.",
        );
  if (lower.includes("événement") || lower.includes("evenement") || lower.includes("semaine") || lower.includes("event") || lower.includes("week"))
    return isDemo
      ? t(
          "Cette semaine : Soirée VIP au Comptoir (Ven. 18), Opening Night chez Nobu (Sam. 19), Brunch Jazz à L'Éclipse (Dim. 20). Voulez-vous réserver des tables ?",
          "This week: VIP Night at Le Comptoir (Fri 18), Opening Night at Nobu (Sat 19), Jazz Brunch at L'Éclipse (Sun 20). Would you like to book tables?",
        )
      : t(
          "Aucun événement à venir pour le moment. Les événements de vos établissements partenaires apparaîtront ici.",
          "No upcoming events yet. Events from your partner venues will appear here.",
        );
  if (lower.includes("contacter") || lower.includes("établissement") || lower.includes("etablissement") || lower.includes("contact") || lower.includes("venue"))
    return isDemo
      ? t(
          "Vos établissements partenaires : Le Comptoir (Marrakech), Sky Bar (Casablanca), L'Éclipse (Paris), Nobu (Marrakech). Lequel souhaitez-vous contacter ?",
          "Your partner venues: Le Comptoir (Marrakech), Sky Bar (Casablanca), L'Éclipse (Paris), Nobu (Marrakech). Which one would you like to contact?",
        )
      : t(
          "Vous n'avez pas encore d'établissement partenaire. Explorez le réseau depuis l'onglet Établissements.",
          "You don't have any partner venues yet. Explore the network from the Venues tab.",
        );
  return t(
    "Bien sûr, je peux vous aider avec ça. Pourriez-vous me donner plus de détails ?",
    "Of course, I can help with that. Could you give me a few more details?",
  );
}

export default function ConciergeAIPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const t = useT();
  const intl = useIntlLocale();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* Ajustement d'état pendant le rendu plutôt qu'un effet : la conversation
     pré-remplie n'existe que sur le compte de démonstration. */
  if (!isLoading && messages === null) {
    setMessages(isDemoConcierge ? getDemoMessages(t) : [getWelcomeMessage(t)]);
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /* Identifiant dérivé du dernier message plutôt que Date.now() : stable,
     sans appel impur, et deux messages ne peuvent pas partager un id. */
  const appendMessage = (role: Message["role"], text: string) => {
    const time = new Date().toLocaleTimeString(intl, {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...(prev ?? []),
      { id: ((prev ?? [])[(prev ?? []).length - 1]?.id ?? 0) + 1, role, text, time },
    ]);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    appendMessage("user", text.trim());
    setInput("");
    setTimeout(
      () => appendMessage("ai", getAIResponse(text, isDemoConcierge, t)),
      600
    );
  };

  if (isLoading || messages === null) return <ConciergeSkeleton />;

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)] flex flex-col">
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08]">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center">
            <Sparkles size={20} strokeWidth={1.5} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {t("Assistant IA", "AI assistant")}
            </h2>
            <p className="text-xs text-white/40">
              twocards AI &middot; {t("Toujours disponible", "Always available")}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[0.6875rem] text-green-400/70">{t("En ligne", "Online")}</span>
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
                  <p className="text-[0.625rem] font-semibold text-blue-400/70 mb-1 font-ui">
                    {t("Assistant IA", "AI assistant")}
                  </p>
                )}
                <p
                  className={`text-sm leading-relaxed font-ui ${
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
            {getSuggestedActions(t).map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-blue-400/30 rounded-xl text-xs text-white/60 hover:text-white transition-all font-ui"
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
              placeholder={t("Demandez quelque chose...", "Ask me anything...")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              className="flex-1 px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/30 transition-colors font-ui"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              aria-label={t("Envoyer", "Send")}
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
