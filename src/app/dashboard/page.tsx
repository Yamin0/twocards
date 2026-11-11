"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useVenueQrReservations } from "@/hooks/use-venue-qr-reservations";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { StatStrip } from "@/components/shared/stat-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { MiniBars, weeklySeries } from "@/components/shared/mini-charts";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  CreditCard,
  MessageSquare,
  MoreHorizontal,
  QrCode,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

/* Accueil de l'établissement. Deux lectures d'un même écran : un restaurant
   ou un club parle de service et de couverts ; un loueur de quads ou un
   chauffeur parle de participants et de prestations. Dans les deux cas,
   l'essentiel d'abord — ce qui attend une réponse — et les sections rares
   derrière « Plus ». */

type ServiceRow = {
  id: string;
  name: string;
  duration: string;
  price: string;
  active: boolean;
};

type QuickLink = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
};

const getQuickRestaurant = (t: Translate): QuickLink[] => [
  {
    icon: QrCode,
    label: t("Réservations", "Reservations"),
    description: t("Clients envoyés par les hôtels, montants et avis", "Guests sent by hotels, amounts and reviews"),
    href: "/dashboard/reservations",
  },
  {
    icon: MessageSquare,
    label: t("Messages", "Messages"),
    description: t("Échanges avec les concierges et hôtels", "Conversations with concierges and hotels"),
    href: "/dashboard/messages",
  },
  {
    icon: CreditCard,
    label: t("Commissions", "Commissions"),
    description: t("Ce que vous reversez, réservation par réservation", "What you pay out, reservation by reservation"),
    href: "/dashboard/commissions",
  },
  {
    icon: MoreHorizontal,
    label: t("Plus", "More"),
    description: t("Événements, plan de salle, caisse, portail, clients", "Events, floor plan, till, portal, guests"),
    href: "/dashboard/plus",
  },
];

const getQuickActivity = (t: Translate): QuickLink[] => [
  {
    icon: QrCode,
    label: t("Réservations", "Reservations"),
    description: t("Demandes des clients d'hôtels, montants et avis", "Requests from hotel guests, amounts and reviews"),
    href: "/dashboard/reservations",
  },
  {
    icon: Tags,
    label: t("Prestations", "Services"),
    description: t("Ce que vos clients peuvent réserver, visible sur le menu", "What your guests can book, shown on the menu"),
    href: "/dashboard/prestations",
  },
  {
    icon: MessageSquare,
    label: t("Messages", "Messages"),
    description: t("Échanges avec les concierges et hôtels", "Conversations with concierges and hotels"),
    href: "/dashboard/messages",
  },
  {
    icon: MoreHorizontal,
    label: t("Plus", "More"),
    description: t("Réseau, commissions, analyses, portail, clients", "Network, commissions, analytics, portal, guests"),
    href: "/dashboard/plus",
  },
];

const formatDay = (iso: string, intl = "fr-FR") =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(intl, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default function VenueDashboardPage() {
  const { isLoading, fullName, venueName, isActivityVenue } = useAuthUser();
  const t = useT();
  const intl = useIntlLocale();
  const { reservations } = useVenueQrReservations();
  const [services, setServices] = useState<ServiceRow[] | null>(null);

  /* Les prestations n'existent que pour une activité ou un service. */
  useEffect(() => {
    if (isLoading || !isActivityVenue) return;
    let cancelled = false;
    createClient()
      .from("venue_services")
      .select("id, name, duration, price, active")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setServices((data as ServiceRow[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isActivityVenue]);

  if (isLoading || reservations === null) return <DashboardSkeleton />;

  const active = reservations.filter(
    (r) => r.status !== "annulée" && r.status !== "no-show"
  );
  const pendingList = reservations
    .filter((r) => r.status === "en attente")
    .sort(
      (a, b) =>
        a.reservation_date.localeCompare(b.reservation_date) ||
        (a.reservation_time ?? "").localeCompare(b.reservation_time ?? "")
    );
  const pending = pendingList.length;
  const revenue = active.reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);
  const commissions = active.reduce((sum, r) => sum + r.commission, 0);
  const rated = reservations.filter((r) => r.rating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : null;
  /* Même définition du volume que les KPI : les annulées n'y figurent pas. */
  const weekly = weeklySeries(active.map((r) => r.created_at));
  const latest = reservations.slice(0, 5);

  /* Le jour même : ce que le manager veut savoir en ouvrant l'app. */
  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const today = active.filter((r) => r.reservation_date === todayIso);
  const todayPeople = today.reduce((s, r) => s + r.party_size, 0);
  const nextArrival = today
    .filter((r) => r.reservation_time && !r.arrived_at)
    .map((r) => r.reservation_time as string)
    .filter((t) => {
      const [h, m] = t.split(":").map(Number);
      const now = new Date();
      return h * 60 + m >= now.getHours() * 60 + now.getMinutes();
    })
    .sort()[0];

  const people = isActivityVenue
    ? t(`participant${todayPeople > 1 ? "s" : ""} attendus`, `participant${todayPeople === 1 ? "" : "s"} expected`)
    : t(`couvert${todayPeople > 1 ? "s" : ""} attendus`, `cover${todayPeople === 1 ? "" : "s"} expected`);
  const stats = [
    { label: t("CA apporté par twocards", "Revenue brought by twocards"), value: `${revenue.toLocaleString(intl)} MAD` },
    { label: t("Commissions reversées", "Commissions paid out"), value: `${commissions.toLocaleString(intl)} MAD` },
    {
      label: isActivityVenue ? t("Réservations reçues", "Reservations received") : t("Sorties reçues", "Outings received"),
      value: reservations.length,
      hint: pending > 0 ? t(`dont ${pending} en attente`, `${pending} pending`) : undefined,
    },
    {
      label: t("Satisfaction", "Satisfaction"),
      value:
        avgRating !== null ? t(`${avgRating.toFixed(1).replace(".", ",")}/5`, `${avgRating.toFixed(1)}/5`) : "—",
      hint:
        rated.length > 0
          ? t(`${rated.length} avis client${rated.length > 1 ? "s" : ""}`, `${rated.length} guest review${rated.length === 1 ? "" : "s"}`)
          : t("aucun avis pour le moment", "no reviews yet"),
    },
  ];

  const quickLinks = isActivityVenue ? getQuickActivity(t) : getQuickRestaurant(t);
  const activeServices = (services ?? []).filter((s) => s.active);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className=" bg-panel border border-line rounded-3xl p-6">
        <h1 className="font-display text-3xl font-light text-ink">
          {t("Bienvenue", "Welcome")}{fullName ? `, ${fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="font-ui text-sm text-ink-2 mt-2">
          {venueName ? `${venueName} · ` : ""}
          {t(
            <>
              vos chiffres réels :{" "}
              {isActivityVenue ? "réservations" : "sorties"} reçues, montants
              saisis, commissions et satisfaction.
            </>,
            <>
              your real numbers: {isActivityVenue ? "reservations" : "outings"}{" "}
              received, amounts entered, commissions and satisfaction.
            </>,
          )}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
          <span className="font-ui inline-flex items-center gap-1.5 text-sm text-ink-2">
            <CalendarDays size={14} strokeWidth={1.5} className="text-info" />
            {isActivityVenue ? t("Aujourd'hui :", "Today:") : t("Ce soir :", "Tonight:")}{" "}
            <span className="font-semibold text-ink">
              {t(
                `${today.length} réservation${today.length > 1 ? "s" : ""}`,
                `${today.length} reservation${today.length === 1 ? "" : "s"}`,
              )}
            </span>
          </span>
          <span className="font-ui inline-flex items-center gap-1.5 text-sm text-ink-2">
            <Users size={14} strokeWidth={1.5} className="text-info" />
            <span className="font-semibold text-ink">{todayPeople}</span>
            {people}
          </span>
          {nextArrival && (
            <span className="font-ui text-sm text-ink-2">
              {t("Prochaine arrivée :", "Next arrival:")}{" "}
              <span className="font-semibold text-ink">
                {nextArrival.slice(0, 5)}
              </span>
            </span>
          )}
          <Link
            href="/dashboard/reservations"
            className="font-ui ml-auto inline-flex items-center gap-1 text-xs font-medium text-info hover:text-info transition-colors"
          >
            {t("Voir les réservations", "View reservations")}
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* KPI */}
      <StatStrip stats={stats} />

      {/* Ce qui attend une réponse + le rythme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className=" bg-panel border border-line rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-normal text-ink">
              {t("En attente de réponse", "Awaiting reply")}
            </h2>
            {pending > 0 && (
              <span className="font-ui flex h-6 min-w-6 items-center justify-center rounded-full bg-warn px-2 text-xs font-bold text-ink">
                {pending}
              </span>
            )}
          </div>
          <p className="font-ui text-xs text-ink-3 mb-4">
            {t(
              "Le client attend votre confirmation par téléphone ou WhatsApp.",
              "The guest is waiting for your confirmation by phone or WhatsApp.",
            )}
          </p>
          {pendingList.length === 0 ? (
            <p className="font-ui text-sm text-ink-3 leading-relaxed">
              {t(
                "Rien en attente. Chaque nouvelle demande apparaît ici et vous est notifiée sur votre téléphone.",
                "Nothing pending. Every new request shows up here and is sent to your phone as a notification.",
              )}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {pendingList.slice(0, 5).map((r) => (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-ui text-sm text-ink truncate">
                      {r.guest_name}
                      {r.service_name && (
                        <span className="text-info"> · {r.service_name}</span>
                      )}
                    </p>
                    <p className="font-ui text-xs text-ink-3 mt-0.5 flex items-center gap-1.5">
                      <Clock size={11} strokeWidth={1.5} />
                      {formatDay(r.reservation_date, intl)}
                      {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                      <Users size={11} strokeWidth={1.5} className="ml-1" />
                      {r.party_size}
                    </p>
                  </div>
                  <a
                    href={`tel:${r.guest_phone.replace(/\s/g, "")}`}
                    className="font-ui shrink-0 rounded-full border border-line-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-fill-2 transition-colors"
                  >
                    {t("Appeler", "Call")}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/reservations"
            className="font-ui mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-medium text-info hover:text-info transition-colors"
          >
            {t("Confirmer ou refuser", "Confirm or decline")}
            <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
        </div>

        <div className=" bg-panel border border-line rounded-3xl p-6">
          <h2 className="font-display text-lg font-normal text-ink mb-1">
            {isActivityVenue
              ? t("Réservations par semaine", "Reservations per week")
              : t("Sorties par semaine", "Outings per week")}
          </h2>
          <p className="font-ui text-xs text-ink-3 mb-5">
            {t("8 dernières semaines", "Last 8 weeks")}
          </p>
          <MiniBars data={weekly} color="bg-plum-soft" />
        </div>
      </div>

      {/* Prestations : ce que le client voit sur le menu */}
      {isActivityVenue && services !== null && (
        <div className=" bg-panel border border-line rounded-3xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-normal text-ink">
              {t("Vos prestations", "Your services")}
            </h2>
            <Link
              href="/dashboard/prestations"
              className="font-ui flex items-center gap-1 text-xs font-medium text-info hover:text-info transition-colors"
            >
              {t("Gérer", "Manage")}
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
          <p className="font-ui text-xs text-ink-3 mb-4">
            {activeServices.length === 0
              ? t(
                  "Aucune prestation visible : votre fiche n'affiche que son nom.",
                  "No visible services: your listing only shows its name.",
                )
              : t(
                  `${activeServices.length} visible${activeServices.length > 1 ? "s" : ""} sur le menu des hôtels partenaires, mise à jour immédiate.`,
                  `${activeServices.length} visible on partner hotels' menus, updated instantly.`,
                )}
          </p>
          {activeServices.length === 0 ? (
            <Link
              href="/dashboard/prestations"
              className="font-ui inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-on-brand hover:bg-brand-strong transition-colors"
            >
              <Tags size={14} strokeWidth={1.75} />
              {t("Ajouter une prestation", "Add a service")}
            </Link>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeServices.slice(0, 6).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-fill px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-ui text-sm font-medium text-ink truncate">{s.name}</p>
                    {s.duration && (
                      <p className="font-ui text-xs text-ink-3">{s.duration}</p>
                    )}
                  </div>
                  <span className="font-display shrink-0 text-sm text-ink tabular-nums">
                    {s.price || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Dernières réservations */}
      {latest.length > 0 && (
        <div className=" bg-panel border border-line rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-normal text-ink">
              {t("Dernières réservations", "Latest reservations")}
            </h2>
            <Link
              href="/dashboard/reservations"
              className="font-ui flex items-center gap-1 text-xs font-medium text-info hover:text-info transition-colors"
            >
              {t("Tout voir", "View all")}
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {latest.map((r) => (
              <li
                key={r.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-ui text-sm text-ink truncate">
                    {r.guest_name}
                    <span className="text-ink-3">
                      {" "}· {r.service_name ?? r.category}
                    </span>
                  </p>
                  <p className="font-ui text-xs text-ink-3 mt-0.5 flex items-center gap-1.5">
                    <CalendarDays size={11} strokeWidth={1.5} />
                    {new Date(
                      r.reservation_date + "T00:00:00"
                    ).toLocaleDateString(intl)}
                    {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                    <Users size={11} strokeWidth={1.5} className="ml-1" />
                    {r.party_size}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.amount_spent !== null && (
                    <span className="font-display text-sm text-ink tabular-nums">
                      {r.amount_spent.toLocaleString(intl)} MAD
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accès rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              className="group bg-panel border border-line rounded-2xl p-5 hover:bg-fill transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-fill-2 flex items-center justify-center">
                  <Icon size={18} strokeWidth={1.5} className="text-ink-2" />
                </div>
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="text-ink-3 group-hover:text-ink-2 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <h3 className="text-sm font-semibold text-ink">
                {q.label}
              </h3>
              <p className="font-ui text-xs text-ink-3 mt-0.5">
                {q.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
