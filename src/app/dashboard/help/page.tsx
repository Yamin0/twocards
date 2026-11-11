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
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

const glassCard =
  " bg-panel border border-line rounded-3xl";

/* La FAQ décrit le produit tel qu'il est — chaque réponse correspond à une
   fonctionnalité réellement présente dans le dashboard. */
const getFaqItems = (t: Translate) => [
  {
    question: t("D'où viennent mes réservations ?", "Where do my reservations come from?"),
    answer: t(
      "De trois canaux : les QR codes des hôtels partenaires (badge « QR hôtel », commissionnés), votre portail de réservation directe (badge « direct », 0 % de commission) et les réservations que vous saisissez vous-même, téléphone ou walk-in (badge « maison », 0 % également). Le bouton « Nouvelle réservation » en haut de la page Réservations sert à saisir un appel.",
      "From three channels: partner hotels' QR codes (“hotel QR” badge, commissionable), your direct booking portal (“direct” badge, 0% commission) and reservations you enter yourself, by phone or walk-in (“in-house” badge, also 0%). Use the “New reservation” button at the top of the Reservations page to log a call."
    ),
  },
  {
    question: t("Comment fonctionnent les commissions ?", "How do commissions work?"),
    answer: t(
      "Quand vous saisissez le montant dépensé en fin de sortie, la commission de l'apporteur est calculée automatiquement (10 % du montant pour les apports hôtel ; les canaux direct et maison sont à 0 %). Le détail par sortie et par hôtel apporteur se trouve dans les sections Commissions et Réseau.",
      "When you enter the amount spent at the end of an outing, the referrer's commission is calculated automatically (10% of the amount for hotel referrals; direct and in-house channels are at 0%). The breakdown by outing and by referring hotel is in the Commissions and Network sections."
    ),
  },
  {
    question: t("Comment suivre mes réservations en temps réel ?", "How do I track my reservations in real time?"),
    answer: t(
      "La page Réservations se met à jour en direct et se filtre par période (aujourd'hui, à venir, passées), par statut et par nom ou téléphone. Chaque ligne propose ses actions : confirmer, check-in à l'arrivée du client, no-show, annuler. Le plan de salle affiche les occupations du jour choisi, table par table.",
      "The Reservations page updates live and can be filtered by period (today, upcoming, past), by status and by name or phone. Each row has its own actions: confirm, check in when the guest arrives, no-show, cancel. The floor plan shows the chosen day's bookings, table by table."
    ),
  },
  {
    question: t("Comment marquer l'arrivée d'un client ou un no-show ?", "How do I mark a guest's arrival or a no-show?"),
    answer: t(
      "Depuis la page Réservations (icônes d'action en bout de ligne) ou depuis le plan de salle en cliquant sur la table. Le check-in enregistre l'heure d'arrivée, visible de tous les postes ; le no-show libère le créneau sur votre portail de réservation.",
      "From the Reservations page (action icons at the end of each row) or from the floor plan by clicking the table. Check-in records the arrival time, visible on every device; a no-show frees up the slot on your booking portal."
    ),
  },
  {
    question: t("Comment interpréter les données analytiques ?", "How should I read the analytics?"),
    answer: t(
      "La page Analytics calcule vos indicateurs réels : chiffre d'affaires, couverts, panier moyen, taux de no-show, répartition par canal et meilleurs jours de la semaine. Le sélecteur de période (7 jours, 30 jours, 12 mois, tout) recalcule l'ensemble, et l'export CSV s'ouvre directement dans Excel.",
      "The Analytics page calculates your actual figures: revenue, covers, average spend, no-show rate, split by channel and best days of the week. The period selector (7 days, 30 days, 12 months, all) recalculates everything, and the CSV export opens straight in Excel."
    ),
  },
  {
    question: t("Comment modifier les informations de mon établissement ?", "How do I update my venue details?"),
    answer: t(
      "Dans Paramètres : téléphone, ville, adresse, description, capacité, horaires et préférences de notifications s'enregistrent réellement. Le nom d'établissement et son type sont gérés par twocards, contactez le support pour les modifier.",
      "In Settings: phone, city, address, description, capacity, opening hours and notification preferences are all saved. The venue name and type are managed by twocards; contact support to change them."
    ),
  },
  {
    question: t("Comment contacter un hôtel apporteur ?", "How do I contact a referring hotel?"),
    answer: t(
      "Depuis la page Réseau, chaque carte d'apporteur propose un bouton « Message » qui ouvre la conversation directement dans la messagerie. Vous y voyez aussi combien de sorties, de couverts et de chiffre d'affaires chaque hôtel vous a apportés.",
      "On the Network page, each referrer card has a “Message” button that opens the conversation straight in your inbox. You can also see how many outings, covers and how much revenue each hotel has brought you."
    ),
  },
];

const getQuickLinks = (t: Translate) => [
  {
    label: t("Tableau de bord", "Dashboard"),
    href: "/dashboard",
    icon: LayoutDashboard,
    desc: t("Vue d'ensemble", "Overview"),
  },
  {
    label: t("Réseau apporteurs", "Referral network"),
    href: "/dashboard/network",
    icon: Users,
    desc: t("Vos hôtels partenaires", "Your partner hotels"),
  },
  {
    label: t("Réservations", "Reservations"),
    href: "/dashboard/reservations",
    icon: CalendarCheck,
    desc: t("Suivi en temps réel", "Real-time tracking"),
  },
  {
    label: t("Commissions", "Commissions"),
    href: "/dashboard/commissions",
    icon: Banknote,
    desc: t("Reversements et historique", "Payouts and history"),
  },
  {
    label: t("Analytics", "Analytics"),
    href: "/dashboard/analytics",
    icon: BarChart3,
    desc: t("Performances", "Performance"),
  },
  {
    label: t("Paramètres", "Settings"),
    href: "/dashboard/settings",
    icon: Settings,
    desc: t("Configuration", "Setup"),
  },
];

export default function HelpPage() {
  const { isLoading } = useAuthUser();
  const t = useT();
  const faqItems = getFaqItems(t);
  const quickLinks = getQuickLinks(t);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (isLoading) return <DashboardSkeleton />;

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <HelpCircle size={28} strokeWidth={1.5} className="text-info" />
          <h1 className="text-2xl font-extrabold text-ink">
            {t(<>Centre d&apos;aide</>, <>Help centre</>)}
          </h1>
        </div>
        <p className="text-sm text-ink-3 font-ui">
          {t(
            "Trouvez des réponses à vos questions et contactez notre équipe de support.",
            "Find answers to your questions and get in touch with our support team."
          )}
        </p>
      </div>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">
          {t("Questions fréquentes", "Frequently asked questions")}
        </h2>
        <div className={`${glassCard} divide-y divide-line`}>
          {faqItems.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
              >
                <span className="text-sm font-medium text-ink group-hover:text-info transition-colors font-ui">
                  {item.question}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-ink-3 flex-shrink-0 ml-4 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-ink-3 leading-relaxed font-ui">
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
        <h2 className="text-lg font-bold text-ink">
          {t("Contacter le support", "Contact support")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`${glassCard} p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-info-soft border border-info/25 flex items-center justify-center">
                <Mail size={18} className="text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink font-ui">
                  {t("E-mail", "Email")}
                </p>
                <p className="text-xs text-ink-3">{t("Réponse sous 24 h", "Reply within 24 hrs")}</p>
              </div>
            </div>
            <a
              href="mailto:support@twocards.io"
              className="text-sm text-info hover:underline font-ui"
            >
              support@twocards.io
            </a>
          </div>

          <div className={`${glassCard} p-6 relative overflow-hidden`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-fill border border-line flex items-center justify-center">
                <MessageCircle size={18} className="text-ink-3" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink font-ui">
                  {t("Chat en direct", "Live chat")}
                </p>
                <p className="text-xs text-ink-3">
                  {t("Assistance instantanée", "Instant support")}
                </p>
              </div>
            </div>
            <span className="inline-block text-xs text-ink-4 bg-fill border border-line px-3 py-1 rounded-full font-ui">
              {t("Bientôt disponible", "Coming soon")}
            </span>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink">
          {t("Accès rapide", "Quick links")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${glassCard} p-4 hover:bg-fill-2 transition-colors group`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="text-info mb-2"
                />
                <p className="text-sm font-medium text-ink group-hover:text-info transition-colors font-ui">
                  {link.label}
                </p>
                <p className="text-xs text-ink-3 mt-0.5 font-ui">
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
