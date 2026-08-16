"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadSvg, guestUrl } from "@/lib/qr";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Coins,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  ScanLine,
  Users,
} from "lucide-react";

type QrItem = {
  id: string;
  label: string;
  code: string;
  active: boolean;
  scans: number;
};

type QrReservation = {
  id: string;
  category: string;
  venue_name: string;
  guest_name: string;
  guest_phone: string;
  reservation_date: string;
  reservation_time: string | null;
  party_size: number;
  status: "en attente" | "confirmée" | "annulée";
  commission: number;
  created_at: string;
};

const STATUS_STYLES: Record<QrReservation["status"], string> = {
  confirmée: "bg-emerald-500/15 text-emerald-400",
  "en attente": "bg-amber-500/15 text-amber-400",
  annulée: "bg-red-500/15 text-red-400",
};

export default function HotelQrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isLoading, venueName } = useAuthUser();
  const { toast, showToast } = useToast();
  const [qr, setQr] = useState<QrItem | null | undefined>(undefined);
  const [reservations, setReservations] = useState<QrReservation[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("hotel_qr_codes")
      .select("id, label, code, active, scans")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setQr(data ?? null);
      });

    /* La table n'existe qu'après la migration qr_guest_experience :
       en cas d'erreur, la page reste utilisable avec zéro réservation. */
    supabase
      .from("qr_reservations")
      .select(
        "id, category, venue_name, guest_name, guest_phone, reservation_date, reservation_time, party_size, status, commission, created_at"
      )
      .eq("qr_code_id", id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setReservations(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading || qr === undefined) return <TableSkeleton />;

  if (qr === null) {
    return (
      <div className="px-4 sm:px-6 py-12 text-center">
        <p className="text-sm text-white/60 font-[family-name:var(--font-inter)]">
          Ce QR code n&apos;existe pas ou ne vous appartient pas.
        </p>
        <Link
          href="/hotel/qr-codes"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 font-[family-name:var(--font-manrope)]"
        >
          <ArrowLeft size={15} strokeWidth={1.5} />
          Retour aux QR codes
        </Link>
      </div>
    );
  }

  const link = guestUrl(qr.code, venueName);
  const active = reservations.filter((r) => r.status !== "annulée");
  const commissionTotal = active.reduce((sum, r) => sum + (r.commission ?? 0), 0);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Impossible de copier le lien");
    }
  };

  const stats = [
    {
      label: "Scans",
      value: qr.scans,
      icon: ScanLine,
      color: "text-green-400",
    },
    {
      label: "Réservations",
      value: reservations.length,
      icon: CalendarDays,
      color: "text-blue-400",
    },
    {
      label: "Commissions",
      value: `${commissionTotal.toLocaleString()} MAD`,
      icon: Coins,
      color: "text-amber-400",
    },
  ] as const;

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex items-center gap-3">
        <Link
          href="/hotel/qr-codes"
          aria-label="Retour aux QR codes"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </Link>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-white font-[family-name:var(--font-manrope)]">
            <span className="truncate">{qr.label}</span>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-inter)] ${
                qr.active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {qr.active ? "Actif" : "Inactif"}
            </span>
          </h1>
          <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-0.5">
            Code {qr.code} — suivi des scans, réservations et commissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 pb-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white/[0.07] rounded-xl border border-white/10 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <s.icon size={16} strokeWidth={1.5} className={s.color} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
                {s.label}
              </span>
            </div>
            <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Lien unique + QR */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5 flex flex-col sm:flex-row gap-5">
          <div
            id={`qr-${qr.id}`}
            className="bg-white rounded-xl p-4 flex items-center justify-center self-center sm:self-start"
          >
            <QRCode value={link} size={120} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white font-[family-name:var(--font-manrope)]">
              Lien unique de ce QR code
            </h2>
            <p className="text-xs text-white/50 font-[family-name:var(--font-inter)] mt-1">
              Chaque scan et chaque réservation passée par ce lien est
              rattachée à « {qr.label} ».
            </p>
            <p className="mt-3 truncate rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs text-white/70 font-mono">
              {link}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={copyLink}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors font-[family-name:var(--font-manrope)]"
              >
                {copied ? (
                  <Check size={14} strokeWidth={2} className="text-emerald-400" />
                ) : (
                  <Copy size={14} strokeWidth={1.5} />
                )}
                {copied ? "Copié" : "Copier le lien"}
              </button>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors font-[family-name:var(--font-manrope)]"
              >
                <ExternalLink size={14} strokeWidth={1.5} />
                Ouvrir
              </a>
              <button
                onClick={() => {
                  if (downloadSvg(`qr-${qr.id}`, qr.label)) {
                    showToast("QR code téléchargé");
                  }
                }}
                className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors font-[family-name:var(--font-manrope)]"
              >
                <Download size={14} strokeWidth={1.5} />
                SVG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Réservations */}
      <div className="px-4 sm:px-6 pb-8">
        {reservations.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
              Aucune réservation via ce QR
            </h2>
            <p className="text-sm text-white/50 font-[family-name:var(--font-inter)] max-w-md mx-auto">
              Dès qu&apos;un client scanne « {qr.label} » et demande une
              réservation, elle apparaît ici avec sa commission.
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    "Client",
                    "Téléphone",
                    "Catégorie",
                    "Établissement",
                    "Date",
                    "Pers.",
                    "Statut",
                    "Commission",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    <td className="px-4 py-3 text-sm text-white font-[family-name:var(--font-manrope)]">
                      {r.guest_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {r.guest_phone}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {r.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {r.venue_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {new Date(
                        r.reservation_date + "T00:00:00"
                      ).toLocaleDateString("fr-FR")}
                      {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} strokeWidth={1.5} />
                        {r.party_size}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-inter)] ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)]">
                      {r.commission > 0
                        ? `${r.commission.toLocaleString()} MAD`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/15 text-white px-4 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
