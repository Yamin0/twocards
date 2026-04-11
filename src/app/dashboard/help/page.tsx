"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  MessageCircle,
  Users,
  BarChart3,
  CalendarCheck,
  Banknote,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const glassCard =
  "backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl";

const faqItems = [
  {
    question: "Comment ajouter un nouveau RP a mon reseau ?",
    answer:
      "Rendez-vous dans la section Reseau depuis le menu lateral. Cliquez sur \"Inviter un RP\" et renseignez son adresse e-mail. Il recevra une invitation pour rejoindre votre etablissement sur TwoCards.",
  },
  {
    question: "Comment fonctionnent les commissions ?",
    answer:
      "Les commissions sont calculees automatiquement en fonction des reservations confirmees apportees par chaque RP. Vous pouvez consulter le detail et l'historique dans la section Commissions, et ajuster les taux depuis les parametres.",
  },
  {
    question: "Comment suivre mes reservations en temps reel ?",
    answer:
      "La section Reservations affiche toutes les reservations en cours, confirmees et passees. Vous pouvez filtrer par date, par RP ou par statut. Les nouvelles reservations apparaissent instantanement.",
  },
  {
    question: "Comment interpreter les donnees analytiques ?",
    answer:
      "Le tableau de bord Analytics presente vos indicateurs cles : chiffre d'affaires, nombre de couverts, taux de conversion et performance par RP. Utilisez les filtres de periode pour comparer vos resultats.",
  },
  {
    question: "Comment modifier les informations de mon etablissement ?",
    answer:
      "Allez dans Parametres > Etablissement pour mettre a jour le nom, l'adresse, les horaires d'ouverture, la capacite et la description de votre etablissement.",
  },
  {
    question: "Comment contacter un RP directement ?",
    answer:
      "Utilisez la section Messages pour envoyer un message direct a n'importe quel RP de votre reseau. Vous pouvez egalement envoyer des messages groupes pour communiquer une offre ou un evenement.",
  },
];

const quickLinks = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    desc: "Vue d'ensemble",
  },
  {
    label: "Reseau RP",
    href: "/dashboard/network",
    icon: Users,
    desc: "Gerer vos RP",
  },
  {
    label: "Reservations",
    href: "/dashboard/reservations",
    icon: CalendarCheck,
    desc: "Suivi en temps reel",
  },
  {
    label: "Commissions",
    href: "/dashboard/commissions",
    icon: Banknote,
    desc: "Paiements et historique",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    desc: "Performances",
  },
  {
    label: "Parametres",
    href: "/dashboard/settings",
    icon: Settings,
    desc: "Configuration",
  },
];

export default function HelpPage() {
  const { isLoading } = useAuthUser();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (isLoading) return <DashboardSkeleton />;

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <HelpCircle size={28} strokeWidth={1.5} className="text-blue-400" />
          <h1 className="text-2xl font-extrabold font-[family-name:var(--font-manrope)] text-white">
            Centre d&apos;aide
          </h1>
        </div>
        <p className="text-sm text-white/40 font-[family-name:var(--font-inter)]">
          Trouvez des reponses a vos questions et contactez notre equipe de
          support.
        </p>
      </div>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] text-white">
          Questions frequentes
        </h2>
        <div className={`${glassCard} divide-y divide-white/[0.06]`}>
          {faqItems.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
              >
                <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors font-[family-name:var(--font-inter)]">
                  {item.question}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-white/30 flex-shrink-0 ml-4 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-white/50 leading-relaxed font-[family-name:var(--font-inter)]">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact support */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] text-white">
          Contacter le support
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`${glassCard} p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                <Mail size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white font-[family-name:var(--font-manrope)]">
                  E-mail
                </p>
                <p className="text-xs text-white/30">Reponse sous 24h</p>
              </div>
            </div>
            <a
              href="mailto:support@twocards.io"
              className="text-sm text-blue-400 hover:underline font-[family-name:var(--font-inter)]"
            >
              support@twocards.io
            </a>
          </div>

          <div className={`${glassCard} p-6 relative overflow-hidden`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                <MessageCircle size={18} className="text-white/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-white font-[family-name:var(--font-manrope)]">
                  Chat en direct
                </p>
                <p className="text-xs text-white/30">
                  Assistance instantanee
                </p>
              </div>
            </div>
            <span className="inline-block text-xs text-white/20 bg-white/[0.05] border border-white/[0.08] px-3 py-1 rounded-full font-[family-name:var(--font-inter)]">
              Bientot disponible
            </span>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] text-white">
          Acces rapide
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${glassCard} p-4 hover:bg-white/[0.1] transition-colors group`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="text-blue-400 mb-2"
                />
                <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors font-[family-name:var(--font-manrope)]">
                  {link.label}
                </p>
                <p className="text-xs text-white/30 mt-0.5 font-[family-name:var(--font-inter)]">
                  {link.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
