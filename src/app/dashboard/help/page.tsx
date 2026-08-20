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
  "backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl";

/* La FAQ décrit le produit tel qu'il est — chaque réponse correspond à une
   fonctionnalité réellement présente dans le dashboard. */
const faqItems = [
  {
    question: "D'où viennent mes réservations ?",
    answer:
      "De trois canaux : les QR codes des hôtels partenaires (badge « QR hôtel », commissionnés), votre portail de réservation directe (badge « direct », 0 % de commission) et les réservations que vous saisissez vous-même — téléphone ou walk-in (badge « maison », 0 % également). Le bouton « Nouvelle réservation » en haut de la page Réservations sert à saisir un appel.",
  },
  {
    question: "Comment fonctionnent les commissions ?",
    answer:
      "Quand vous saisissez le montant dépensé en fin de sortie, la commission de l'apporteur est calculée automatiquement (10 % du montant pour les apports hôtel ; les canaux direct et maison sont à 0 %). Le détail par sortie et par hôtel apporteur se trouve dans les sections Commissions et Réseau.",
  },
  {
    question: "Comment suivre mes réservations en temps réel ?",
    answer:
      "La page Réservations se met à jour en direct et se filtre par période (aujourd'hui, à venir, passées), par statut et par nom ou téléphone. Chaque ligne propose ses actions : confirmer, check-in à l'arrivée du client, no-show, annuler. Le plan de salle affiche les occupations du jour choisi, table par table.",
  },
  {
    question: "Comment marquer l'arrivée d'un client ou un no-show ?",
    answer:
      "Depuis la page Réservations (icônes d'action en bout de ligne) ou depuis le plan de salle en cliquant sur la table. Le check-in enregistre l'heure d'arrivée, visible de tous les postes ; le no-show libère le créneau sur votre portail de réservation.",
  },
  {
    question: "Comment interpréter les données analytiques ?",
    answer:
      "La page Analytics calcule vos indicateurs réels : chiffre d'affaires, couverts, panier moyen, taux de no-show, répartition par canal et meilleurs jours de la semaine. Le sélecteur de période (7 jours, 30 jours, 12 mois, tout) recalcule l'ensemble, et l'export CSV s'ouvre directement dans Excel.",
  },
  {
    question: "Comment modifier les informations de mon établissement ?",
    answer:
      "Dans Paramètres : téléphone, ville, adresse, description, capacité, horaires et préférences de notifications s'enregistrent réellement. Le nom d'établissement et son type sont gérés par twocards — contactez le support pour les modifier.",
  },
  {
    question: "Comment contacter un hôtel apporteur ?",
    answer:
      "Depuis la page Réseau, chaque carte d'apporteur propose un bouton « Message » qui ouvre la conversation directement dans la messagerie. Vous y voyez aussi combien de sorties, de couverts et de chiffre d'affaires chaque hôtel vous a apportés.",
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
    label: "Réseau apporteurs",
    href: "/dashboard/network",
    icon: Users,
    desc: "Vos hôtels partenaires",
  },
  {
    label: "Réservations",
    href: "/dashboard/reservations",
    icon: CalendarCheck,
    desc: "Suivi en temps réel",
  },
  {
    label: "Commissions",
    href: "/dashboard/commissions",
    icon: Banknote,
    desc: "Reversements et historique",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    desc: "Performances",
  },
  {
    label: "Paramètres",
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
          <h1 className="text-2xl font-extrabold text-white">
            Centre d&apos;aide
          </h1>
        </div>
        <p className="text-sm text-white/40 font-ui">
          Trouvez des réponses à vos questions et contactez notre équipe de
          support.
        </p>
      </div>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">
          Questions fréquentes
        </h2>
        <div className={`${glassCard} divide-y divide-white/[0.06]`}>
          {faqItems.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
              >
                <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors font-ui">
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
                  <p className="text-sm text-white/50 leading-relaxed font-ui">
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
        <h2 className="text-lg font-bold text-white">
          Contacter le support
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`${glassCard} p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center">
                <Mail size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white font-ui">
                  E-mail
                </p>
                <p className="text-xs text-white/30">Réponse sous 24 h</p>
              </div>
            </div>
            <a
              href="mailto:support@twocards.io"
              className="text-sm text-blue-400 hover:underline font-ui"
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
                <p className="text-sm font-medium text-white font-ui">
                  Chat en direct
                </p>
                <p className="text-xs text-white/30">
                  Assistance instantanée
                </p>
              </div>
            </div>
            <span className="inline-block text-xs text-white/20 bg-white/[0.05] border border-white/[0.08] px-3 py-1 rounded-full font-ui">
              Bientôt disponible
            </span>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">
          Accès rapide
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
                <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors font-ui">
                  {link.label}
                </p>
                <p className="text-xs text-white/30 mt-0.5 font-ui">
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
