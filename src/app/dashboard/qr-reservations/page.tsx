"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useVenueQrReservations,
  type VenueQrReservation,
} from "@/hooks/use-venue-qr-reservations";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  QrCode,
  Users,
  Clock,
  Coins,
  Banknote,
  Check,
  Pencil,
  Loader2,
  Info,
} from "lucide-react";

const STATUS_STYLES: Record<VenueQrReservation["status"], string> = {
  confirmée: "bg-emerald-500/15 text-emerald-400",
  "en attente": "bg-amber-500/15 text-amber-400",
  annulée: "bg-red-500/15 text-red-400",
};

export default function VenueQrReservationsPage() {
  const { isLoading } = useAuthUser();
  const { reservations, isLoading: loadingData } = useVenueQrReservations();
  const { toast, showToast } = useToast();
  /* Saisie locale du montant, par réservation. Les mises à jour confirmées
     sont fusionnées dans `overrides` : la liste reste juste même si le
     canal temps réel tarde à répercuter l'UPDATE. */
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<
    Record<string, Partial<VenueQrReservation>>
  >({});

  if (isLoading || loadingData || reservations === null)
    return <TableSkeleton />;

  const rows = reservations.map((r) => ({ ...r, ...overrides[r.id] }));
  const awaiting = rows.filter(
    (r) => r.amount_spent === null && r.status !== "annulée"
  ).length;
  const revenue = rows.reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);
  const commissions = rows
    .filter((r) => r.status !== "annulée")
    .reduce((sum, r) => sum + r.commission, 0);

  const saveAmount = async (r: VenueQrReservation) => {
    const raw = (editing[r.id] ?? "").replace(",", ".").trim();
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount < 0) {
      showToast("Montant invalide");
      return;
    }
    setSavingId(r.id);
    /* Seules colonnes accordées à l'établissement : amount_spent et status.
       La commission est recalculée par le trigger, jamais envoyée. */
    const { data, error } = await createClient()
      .from("qr_reservations")
      .update({ amount_spent: amount, status: "confirmée" })
      .eq("id", r.id)
      .select("amount_spent, commission, status")
      .single();
    setSavingId(null);
    if (error || !data) {
      showToast("Impossible d'enregistrer le montant");
      return;
    }
    setOverrides((prev) => ({ ...prev, [r.id]: data }));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[r.id];
      return next;
    });
    showToast(`Montant enregistré — ${data.commission.toLocaleString()} MAD reversés`);
  };

  const stats = [
    {
      label: "Sorties reçues",
      value: String(rows.length),
      icon: QrCode,
      color: "text-blue-400",
    },
    {
      label: "En attente de montant",
      value: String(awaiting),
      icon: Clock,
      color: "text-amber-400",
    },
    {
      label: "CA saisi",
      value: `${revenue.toLocaleString()} MAD`,
      icon: Banknote,
      color: "text-emerald-400",
    },
    {
      label: "Commissions reversées",
      value: `${commissions.toLocaleString()} MAD`,
      icon: Coins,
      color: "text-purple-400",
    },
  ] as const;

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white font-[family-name:var(--font-manrope)]">
          Réservations QR
        </h1>
        <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-0.5">
          Clients envoyés par les hôtels partenaires — saisissez le montant en
          fin de sortie
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 pb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Table / empty state */}
      <div className="px-4 sm:px-6 pb-4">
        {rows.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
              Aucune réservation QR pour le moment
            </h2>
            <p className="text-sm text-white/50 font-[family-name:var(--font-inter)] max-w-md mx-auto">
              Quand un client d&apos;hôtel réserve chez vous via un QR code
              twocards, la réservation apparaît ici instantanément.
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Client", "Date", "Pers.", "Note", "Statut", "Montant dépensé", "Commission"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/50 font-[family-name:var(--font-inter)]"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isEditing =
                    editing[r.id] !== undefined || r.amount_spent === null;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-[family-name:var(--font-manrope)]">
                          {r.guest_name}
                        </p>
                        <p className="text-xs text-white/40 font-[family-name:var(--font-inter)]">
                          {r.guest_phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70 font-[family-name:var(--font-inter)] whitespace-nowrap">
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
                      <td className="px-4 py-3 text-xs text-white/50 font-[family-name:var(--font-inter)] max-w-[180px] truncate">
                        {r.notes ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-inter)] whitespace-nowrap ${STATUS_STYLES[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.status === "annulée" ? (
                          <span className="text-sm text-white/40">—</span>
                        ) : isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={editing[r.id] ?? ""}
                              onChange={(e) =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [r.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveAmount(r);
                              }}
                              className="w-24 px-3 py-1.5 bg-white/[0.07] rounded-lg text-sm text-white text-right font-[family-name:var(--font-inter)] placeholder:text-white/30 focus:ring-1 focus:ring-white/40 focus:outline-none"
                            />
                            <span className="text-xs text-white/40">MAD</span>
                            <button
                              onClick={() => saveAmount(r)}
                              disabled={savingId === r.id}
                              aria-label={`Valider le montant pour ${r.guest_name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                            >
                              {savingId === r.id ? (
                                <Loader2
                                  size={14}
                                  strokeWidth={2}
                                  className="animate-spin"
                                />
                              ) : (
                                <Check size={14} strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-[family-name:var(--font-manrope)]">
                              {(r.amount_spent ?? 0).toLocaleString()} MAD
                            </span>
                            <button
                              onClick={() =>
                                setEditing((prev) => ({
                                  ...prev,
                                  [r.id]: String(r.amount_spent ?? ""),
                                }))
                              }
                              aria-label={`Modifier le montant pour ${r.guest_name}`}
                              className="p-1 text-white/30 hover:text-white/70 transition-colors"
                            >
                              <Pencil size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-purple-300 font-[family-name:var(--font-manrope)] whitespace-nowrap">
                        {r.commission > 0
                          ? `${r.commission.toLocaleString()} MAD`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modèle énoncé */}
      <div className="px-4 sm:px-6 pb-8">
        <p className="flex items-start gap-2 text-xs text-white/40 font-[family-name:var(--font-inter)] max-w-2xl">
          <Info size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          Saisir le montant confirme la sortie et calcule automatiquement la
          commission reversée à l&apos;apporteur ({""}
          {rows[0] ? Math.round(rows[0].commission_rate * 100) : 10}&nbsp;% du
          montant). Le montant reste modifiable en cas d&apos;erreur.
        </p>
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
