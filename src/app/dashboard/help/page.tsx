"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import { Badge, Card, PageHeader, cardClass } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* La FAQ décrit le produit tel qu'il est : chaque réponse correspond à
   une fonction réellement présente dans l'espace établissement. Aucun
   taux n'est écrit en dur : il est porté par chaque réservation. */
const getFaqItems = (t: Translate) => [
  {
    question: t("D'où viennent mes réservations ?", "Where do my reservations come from?"),
    answer: t(
      "De trois canaux : les QR codes des hôtels partenaires (commissionnés), votre portail de réservation directe (sans commission) et les réservations que vous saisissez vous-même, par téléphone ou sur place (sans commission). La page Réservations indique le canal de chaque ligne.",
      "From three channels: partner hotels' QR codes (commissionable), your direct booking portal (commission-free) and reservations you enter yourself, by phone or walk-in (commission-free). The Reservations page shows the channel of each row."
    ),
  },
  {
    question: t("Comment sont calculées les commissions ?", "How are commissions calculated?"),
    answer: t(
      "Quand vous saisissez l'addition, la commission de l'apporteur est calculée automatiquement, au taux porté par la réservation. Le portail direct et vos propres saisies sont à 0 %. Le détail par réservation et par hôtel se trouve dans Commissions et Réseau.",
      "When you enter the bill, the referrer's commission is calculated automatically, at the rate carried by the reservation. The direct portal and your own entries are at 0%. The breakdown by reservation and by hotel is in Commissions and Network."
    ),
  },
  {
    question: t("Comment suivre mes réservations en direct ?", "How do I track my reservations live?"),
    answer: t(
      "La page Réservations se met à jour en direct et se filtre par période, par statut et par nom ou téléphone. Chaque réservation porte ses actions : confirmer, marquer arrivé, no-show, annuler. Le plan de salle montre l'occupation du jour choisi, table par table.",
      "The Reservations page updates live and can be filtered by period, by status and by name or phone. Each reservation has its own actions: confirm, mark arrived, no-show, cancel. The floor plan shows the chosen day's occupancy, table by table."
    ),
  },
  {
    question: t(
      "Comment marquer une arrivée ou un no-show ?",
      "How do I mark an arrival or a no-show?"
    ),
    answer: t(
      "Depuis la page Réservations, ou depuis le plan de salle en choisissant la table. L'arrivée enregistre l'heure, visible sur tous vos postes ; le no-show libère le créneau sur votre portail.",
      "From the Reservations page, or from the floor plan by selecting the table. Marking an arrival records the time, visible on all your devices; a no-show frees the slot on your portal."
    ),
  },
  {
    question: t("Que montrent les analyses ?", "What do the analytics show?"),
    answer: t(
      "Vos chiffres réels : chiffre d'affaires, couverts, panier moyen, taux de no-show, répartition par canal et meilleurs jours de la semaine. Le choix de la période (7 jours, 30 jours, 12 mois, tout) recalcule l'ensemble, et l'export CSV s'ouvre dans Excel.",
      "Your actual figures: revenue, covers, average spend, no-show rate, split by channel and best days of the week. The period selector (7 days, 30 days, 12 months, all) recalculates everything, and the CSV export opens in Excel."
    ),
  },
  {
    question: t(
      "Comment modifier les informations de mon établissement ?",
      "How do I update my venue details?"
    ),
    answer: t(
      "Dans Paramètres : téléphone, ville, adresse, description, capacité et horaires. Le nom de l'établissement et son type sont gérés par twocards : écrivez au support pour les changer.",
      "In Settings: phone, city, address, description, capacity and opening hours. The venue name and type are managed by twocards: email support to change them."
    ),
  },
  {
    question: t("Qui m'envoie des clients ?", "Who sends me guests?"),
    answer: t(
      "La page Réseau liste vos apporteurs, avec les sorties, les couverts et le chiffre d'affaires que chacun vous a apportés.",
      "The Network page lists your referrers, with the outings, covers and revenue each has brought you."
    ),
  },
];

const getQuickLinks = (t: Translate) => [
  { label: t("Aujourd'hui", "Today"), href: "/dashboard", icon: LayoutDashboard },
  { label: t("Réservations", "Reservations"), href: "/dashboard/reservations", icon: CalendarCheck },
  { label: t("Réseau", "Network"), href: "/dashboard/network", icon: Users },
  { label: t("Commissions", "Commissions"), href: "/dashboard/commissions", icon: Banknote },
  { label: t("Analyses", "Analytics"), href: "/dashboard/analytics", icon: BarChart3 },
  { label: t("Paramètres", "Settings"), href: "/dashboard/settings", icon: Settings },
];

export default function HelpPage() {
  const t = useT();
  const faqId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={t("Aide", "Help")}
        description={t("Les réponses courantes, et comment nous joindre.", "Common answers, and how to reach us.")}
      />

      <Card title={t("Questions fréquentes", "Frequently asked questions")} padded={false}>
        <ul className="divide-y divide-line border-t border-line">
          {getFaqItems(t).map((item, i) => {
            const open = openIndex === i;
            return (
              <li key={i}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`${faqId}-${i}`}
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-3 text-left text-sm font-bold text-ink transition-colors hover:bg-fill sm:px-6"
                  >
                    {item.question}
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      aria-hidden
                      className={cn("shrink-0 text-ink-3 transition-transform", open && "rotate-180")}
                    />
                  </button>
                </h3>
                <div id={`${faqId}-${i}`} hidden={!open} className="px-5 pb-4 sm:px-6">
                  <p className="max-w-2xl text-sm leading-relaxed text-ink-2">{item.answer}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-ink">{t("Nous joindre", "Contact us")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={cn(cardClass, "flex items-center gap-3 p-5")}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-soft">
              <Mail size={18} strokeWidth={1.75} className="text-info" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{t("E-mail", "Email")}</p>
              <a
                href="mailto:support@twocards.io"
                className="rounded text-sm text-link underline-offset-2 hover:underline"
              >
                support@twocards.io
              </a>
              <p className="text-xs text-ink-3">{t("Réponse sous 24 h", "Reply within 24 hours")}</p>
            </div>
          </div>
          <div className={cn(cardClass, "flex items-center gap-3 p-5")}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fill-2">
              <MessageCircle size={18} strokeWidth={1.75} className="text-ink-3" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{t("Chat en direct", "Live chat")}</p>
              <Badge className="mt-1">{t("Bientôt disponible", "Coming soon")}</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-ink">{t("Accès rapide", "Quick links")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {getQuickLinks(t).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                cardClass,
                "flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-line-2 hover:bg-fill"
              )}
            >
              <link.icon size={18} strokeWidth={1.75} className="shrink-0 text-link" aria-hidden />
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
