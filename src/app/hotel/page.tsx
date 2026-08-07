"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import {
  QrCode,
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
    label: "QR codes",
    description: "Créez et gérez vos QR codes par emplacement",
    href: "/hotel/qr-codes",
    icon: QrCode,
    iconColor: "text-blue-400",
    preview: [
      "Un QR par chambre, lobby ou spa",
      "Téléchargeables et imprimables",
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
      "Restaurants, rooftops et clubs partenaires",
    ],
  },
  {
    label: "Commissions",
    description: "Vos gains sur chaque réservation",
    href: "/hotel/commissions",
    icon: CreditCard,
    iconColor: "text-amber-400",
    preview: [
      "Commission sur chaque sortie réservée",
      "Versements mensuels",
    ],
  },
  {
    label: "Paramètres",
    description: "Profil de l'hôtel et préférences",
    href: "/hotel/settings",
    icon: Settings,
    iconColor: "text-purple-400",
    preview: ["Informations de l'hôtel", "Nombre de chambres"],
  },
];

export default function HotelPage() {
  const { isLoading, fullName, venueName } = useAuthUser();
  const [qr, setQr] = useState({ active: 0, scans: 0 });

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("hotel_qr_codes")
      .select("active, scans")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setQr({
          active: data.filter((row) => row.active).length,
          scans: data.reduce((sum, row) => sum + row.scans, 0),
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  /* Réservations et commissions restent à zéro tant qu'aucun scan n'est
     remonté : les valeurs viendront des données réelles, pas de chiffres
     décoratifs. */
  const stats = [
    { label: "Scans ce mois", value: String(qr.scans), icon: ScanLine, color: "text-blue-400" },
    { label: "Réservations via QR", value: "0", icon: Users, color: "text-green-400" },
    { label: "Commissions du mois", value: "0 MAD", icon: TrendingUp, color: "text-amber-400" },
    { label: "QR codes actifs", value: String(qr.active), icon: QrCode, color: "text-purple-400" },
  ];

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

      {/* Getting started banner */}
      <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-400/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/20 flex items-center justify-center shrink-0">
            <QrCode size={20} strokeWidth={1.5} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-manrope)]">
              Commencez par créer vos QR codes
            </h2>
            <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-0.5 max-w-xl">
              Générez un QR code par chambre ou par zone (lobby, spa, piscine),
              imprimez-le, et vos clients accèdent aux meilleures adresses de la
              ville en un scan.
            </p>
          </div>
        </div>
        <Link
          href="/hotel/qr-codes"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all shrink-0 font-[family-name:var(--font-manrope)]"
        >
          Créer un QR code
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>

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
