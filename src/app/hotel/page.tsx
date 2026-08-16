"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useHotelReservations,
  type HotelReservation,
} from "@/hooks/use-hotel-reservations";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  QrCode,
  BedDouble,
  CalendarDays,
  CreditCard,
  Settings,
  ArrowRight,
  ScanLine,
  Users,
  TrendingUp,
} from "lucide-react";

const folders = [
  {
    label: "Chambres",
    description: "Un QR code et un menu de sorties par chambre",
    href: "/hotel/chambres",
    icon: BedDouble,
    iconColor: "text-blue-400",
    preview: [
      "Un QR par chambre, lobby ou spa",
      "Menu personnalisable par client",
    ],
  },
  {
    label: "Réservations",
    description: "Réservations issues de vos QR codes",
    href: "/hotel/reservations",
    icon: CalendarDays,
    iconColor: "text-green-400",
    preview: [
      "Suivi en temps réel des demandes",
      "Restaurants, activités, clubs et services",
    ],
  },
  {
    label: "Commissions",
    description: "Vos gains sur chaque réservation",
    href: "/hotel/commissions",
    icon: CreditCard,
    iconColor: "text-amber-400",
    preview: [
      "10 % du montant dépensé par le client",
      "Export CSV, versements mensuels",
    ],
  },
  {
    label: "Paramètres",
    description: "Profil de l'hôtel et préférences",
    href: "/hotel/settings",
    icon: Settings,
    iconColor: "text-purple-400",
    preview: ["Ville et catalogue proposé", "Informations de l'hôtel"],
  },
];

const STATUS_STYLES: Record<HotelReservation["status"], string> = {
  confirmée: "bg-emerald-500/15 text-emerald-400",
  "en attente": "bg-amber-500/15 text-amber-400",
  annulée: "bg-red-500/15 text-red-400",
};

const sameMonth = (iso: string) => {
  const d = new Date();
  const x = new Date(iso);
  return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
};

export default function HotelPage() {
  const { isLoading, fullName, venueName } = useAuthUser();
  const { reservations } = useHotelReservations();
  const [qr, setQr] = useState<{
    total: number;
    active: number;
    scans: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("hotel_qr_codes")
      .select("active, scans")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setQr({
          total: data.length,
          active: data.filter((row) => row.active).length,
          scans: data.reduce((sum, row) => sum + row.scans, 0),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || qr === null || reservations === null)
    return <DashboardSkeleton />;

  const pending = reservations.filter((r) => r.status === "en attente").length;
  const commissionsMonth = reservations
    .filter((r) => r.status !== "annulée" && sameMonth(r.created_at))
    .reduce((sum, r) => sum + r.commission, 0);

  const stats = [
    {
      label: "Scans totaux",
      value: String(qr.scans),
      icon: ScanLine,
      color: "text-blue-400",
    },
    {
      label:
        pending > 0
          ? `Réservations (${pending} en attente)`
          : "Réservations reçues",
      value: String(reservations.length),
      icon: Users,
      color: "text-green-400",
    },
    {
      label: "Commissions du mois",
      value: `${commissionsMonth.toLocaleString()} MAD`,
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      label: "Chambres actives",
      value: String(qr.active),
      icon: QrCode,
      color: "text-purple-400",
    },
  ];

  const latest = reservations.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <h1 className="text-xl font-bold text-white font-[family-name:var(--font-manrope)]">
          Bienvenue{fullName ? `, ${fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-1">
          {venueName ? `${venueName} — ` : ""}vos clients scannent, sortent, et
          vous touchez une commission sur chaque réservation.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <Icon size={18} strokeWidth={1.5} className={stat.color} />
              </div>
              <p className="text-2xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
                {stat.value}
              </p>
              <p className="text-xs text-white/50 font-[family-name:var(--font-inter)] mt-0.5">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Premier pas : uniquement tant qu'aucune chambre n'existe */}
      {qr.total === 0 && (
        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-400/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center shrink-0">
              <QrCode size={20} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-[family-name:var(--font-manrope)]">
                Commencez par créer vos chambres
              </h2>
              <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-0.5 max-w-xl">
                Générez un QR code par chambre ou par zone (lobby, spa,
                piscine), choisissez les sorties proposées, imprimez-le — vos
                clients accèdent aux meilleures adresses de la ville en un scan.
              </p>
            </div>
          </div>
          <Link
            href="/hotel/chambres"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all shrink-0 font-[family-name:var(--font-manrope)]"
          >
            Créer une chambre
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      )}

      {/* Dernières réservations : le pouls de l'activité, en temps réel */}
      {latest.length > 0 && (
        <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-manrope)]">
              Dernières réservations
            </h2>
            <Link
              href="/hotel/reservations"
              className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors font-[family-name:var(--font-inter)]"
            >
              Tout voir
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {latest.map((r) => (
              <li
                key={r.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-[family-name:var(--font-manrope)] truncate">
                    {r.guest_name}
                    <span className="text-white/40 font-normal font-[family-name:var(--font-inter)]">
                      {" "}
                      · {r.venue_name}
                    </span>
                  </p>
                  <p className="text-xs text-white/40 font-[family-name:var(--font-inter)]">
                    {r.qr_label ? `${r.qr_label} · ` : ""}
                    {new Date(
                      r.reservation_date + "T00:00:00"
                    ).toLocaleDateString("fr-FR")}
                    {r.reservation_time ? ` · ${r.reservation_time}` : ""} ·{" "}
                    {r.party_size} pers.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.commission > 0 && (
                    <span className="text-xs font-bold text-amber-400 font-[family-name:var(--font-manrope)]">
                      +{r.commission.toLocaleString()} MAD
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-inter)] whitespace-nowrap ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Folders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {folders.map((folder) => {
          const Icon = folder.icon;
          return (
            <Link
              key={folder.href}
              href={folder.href}
              className="group backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5 hover:bg-white/[0.1] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon size={18} strokeWidth={1.5} className={folder.iconColor} />
                </div>
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <h3 className="text-sm font-bold text-white font-[family-name:var(--font-manrope)]">
                {folder.label}
              </h3>
              <p className="text-xs text-white/50 font-[family-name:var(--font-inter)] mt-0.5 mb-3">
                {folder.description}
              </p>
              <ul className="space-y-1">
                {folder.preview.map((line) => (
                  <li
                    key={line}
                    className="text-xs text-white/40 font-[family-name:var(--font-inter)] flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
