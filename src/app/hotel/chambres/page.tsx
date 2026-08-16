"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadSvg, guestUrl } from "@/lib/qr";
import {
  QrCode,
  Plus,
  Download,
  Trash2,
  ScanLine,
  MapPin,
  Power,
  X,
  Check,
  ChartLine,
} from "lucide-react";

type QrItem = {
  id: string;
  label: string;
  code: string;
  active: boolean;
  scans: number;
  /* Agrégat PostgREST : nombre de réservations rattachées à ce QR. */
  qr_reservations?: { count: number }[];
};

const SUGGESTED_LABELS = ["Lobby", "Réception", "Spa", "Piscine", "Chambre 101"];

export default function HotelChambresPage() {
  const { isLoading, venueName, city } = useAuthUser();
  const { toast, showToast } = useToast();
  const [items, setItems] = useState<QrItem[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("hotel_qr_codes")
      .select("id, label, code, active, scans, qr_reservations(count)")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setItems([]);
          showToast("Impossible de charger vos QR codes");
          return;
        }
        setItems(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  if (isLoading || items === null) return <TableSkeleton />;

  /* URL encodée dans le QR : ouvre l'expérience client /s/[code], tracée
     par ce code. Dérivée au rendu (jamais côté serveur : la grille
     n'apparaît qu'une fois l'auth chargée, donc côté client uniquement). */
  const qrUrl = (code: string) => guestUrl(code, venueName, city);

  const addQr = async (rawLabel: string) => {
    const trimmed = rawLabel.trim();
    if (!trimmed) return;
    const code = crypto.randomUUID().slice(0, 8);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("hotel_qr_codes")
      .insert({ label: trimmed, code })
      .select("id, label, code, active, scans")
      .single();
    if (error || !data) {
      showToast("Échec de la création du QR code");
      return;
    }
    setItems((prev) => [...(prev ?? []), data]);
    setLabel("");
    setFormOpen(false);
    showToast(`QR code « ${trimmed} » créé`);
  };

  const toggleActive = async (id: string) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const { error } = await createClient()
      .from("hotel_qr_codes")
      .update({ active: !current.active })
      .eq("id", id);
    if (error) {
      showToast("Échec de la mise à jour");
      return;
    }
    setItems((prev) =>
      (prev ?? []).map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  const removeQr = async (id: string) => {
    const { error } = await createClient()
      .from("hotel_qr_codes")
      .delete()
      .eq("id", id);
    if (error) {
      showToast("Échec de la suppression");
      return;
    }
    setItems((prev) => (prev ?? []).filter((item) => item.id !== id));
  };

  const activeCount = items.filter((i) => i.active).length;
  const totalScans = items.reduce((sum, i) => sum + i.scans, 0);

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-[family-name:var(--font-manrope)]">
            Chambres
          </h1>
          <p className="text-sm text-white/60 font-[family-name:var(--font-inter)] mt-0.5">
            Un QR code par chambre — chaque client scanne, découvre votre
            sélection et réserve ses sorties
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors font-[family-name:var(--font-manrope)]"
        >
          <Plus size={16} strokeWidth={1.5} />
          Nouvelle chambre
        </button>
      </div>

      {/* Stats cards */}
      <div className="px-4 sm:px-6 pb-6 grid grid-cols-3 gap-3">
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <QrCode size={16} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              QR actifs
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {activeCount}
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <MapPin size={16} strokeWidth={1.5} className="text-purple-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              Chambres
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {items.length}
          </p>
        </div>
        <div className="bg-white/[0.07] rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <ScanLine size={16} strokeWidth={1.5} className="text-green-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 font-[family-name:var(--font-inter)]">
              Scans totaux
            </span>
          </div>
          <p className="text-xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
            {totalScans}
          </p>
        </div>
      </div>

      {/* Create form */}
      {formOpen && (
        <div className="px-4 sm:px-6 pb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addQr(label);
            }}
            className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white font-[family-name:var(--font-manrope)]">
                Nouvelle chambre
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Fermer"
                className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex : Chambre 204, Lobby, Rooftop..."
                autoFocus
                required
                className="flex-1 px-4 py-2.5 bg-white/[0.05] rounded-xl text-sm text-white font-[family-name:var(--font-inter)] placeholder:text-white/30 focus:bg-white/[0.07] focus:ring-1 focus:ring-white/30 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors font-[family-name:var(--font-manrope)]"
              >
                <Plus size={16} strokeWidth={1.5} />
                Générer
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_LABELS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addQr(suggestion)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors font-[family-name:var(--font-inter)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* QR grid / empty state */}
      <div className="px-4 sm:px-6 pb-8">
        {items.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto mb-5">
              <QrCode size={26} strokeWidth={1.5} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
              Aucune chambre pour le moment
            </h2>
            <p className="text-sm text-white/50 font-[family-name:var(--font-inter)] max-w-md mx-auto mb-6">
              Créez un QR code par chambre ou par zone de l&apos;hôtel. Une fois
              imprimé, chaque scan ouvre le menu de sorties que vous avez
              choisi — et chaque réservation vous rapporte une commission.
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors font-[family-name:var(--font-manrope)]"
            >
              <Plus size={16} strokeWidth={1.5} />
              Créer ma première chambre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl p-5 transition-opacity ${
                  item.active ? "" : "opacity-50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white font-[family-name:var(--font-manrope)] truncate">
                      {item.label}
                    </h3>
                    <p className="text-xs text-white/40 font-[family-name:var(--font-inter)] mt-0.5">
                      Code {item.code} · {item.scans} scan
                      {item.scans > 1 ? "s" : ""} ·{" "}
                      {item.qr_reservations?.[0]?.count ?? 0} résa
                      {(item.qr_reservations?.[0]?.count ?? 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-[family-name:var(--font-inter)] ${
                      item.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {item.active ? "Actif" : "Inactif"}
                  </span>
                </div>

                <div
                  id={`qr-${item.id}`}
                  className="bg-white rounded-xl p-4 flex items-center justify-center mb-4"
                >
                  <QRCode value={qrUrl(item.code)} size={140} />
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/hotel/chambres/${item.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 text-xs font-medium px-3 py-2 rounded-lg transition-colors font-[family-name:var(--font-manrope)]"
                  >
                    <ChartLine size={14} strokeWidth={1.5} />
                    Menu &amp; suivi
                  </Link>
                  <button
                    onClick={() => {
                      if (downloadSvg(`qr-${item.id}`, item.label)) {
                        showToast("QR code téléchargé");
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors font-[family-name:var(--font-manrope)]"
                  >
                    <Download size={14} strokeWidth={1.5} />
                    SVG
                  </button>
                  <button
                    onClick={() => toggleActive(item.id)}
                    aria-label={item.active ? `Désactiver ${item.label}` : `Activer ${item.label}`}
                    className="flex items-center justify-center bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <Power size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => removeQr(item.id)}
                    aria-label={`Supprimer ${item.label}`}
                    className="flex items-center justify-center bg-white/[0.05] hover:bg-red-500/15 text-white/40 hover:text-red-400 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
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
