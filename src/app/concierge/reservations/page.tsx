"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Check,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";

const DEMO_RESERVATIONS = [
  { id: 1, venue: "Le Comptoir Darna", city: "Marrakech", client: "Mehdi Alaoui", guests: 8, table: "VIP 3", date: "6 Avr. 2026", time: "22:00", status: "confirmée", commission: "6 400 MAD" },
  { id: 2, venue: "Sky Bar Casa", city: "Casablanca", client: "Sarah Cohen", guests: 4, table: "Standard 7", date: "7 Avr. 2026", time: "21:00", status: "en attente", commission: "2 800 MAD" },
  { id: 3, venue: "Le Lotus Club", city: "Tanger", client: "Omar Tazi", guests: 12, table: "Carré VIP", date: "12 Avr. 2026", time: "23:00", status: "en attente", commission: "9 600 MAD" },
  { id: 4, venue: "Le Comptoir Darna", city: "Marrakech", client: "Lina Berrada", guests: 6, table: "VIP 1", date: "5 Avr. 2026", time: "21:30", status: "confirmée", commission: "4 200 MAD" },
  { id: 5, venue: "Pacha Marrakech", city: "Marrakech", client: "Youssef Fassi", guests: 10, table: "VIP 5", date: "4 Avr. 2026", time: "23:30", status: "refusée", commission: "—" },
];

const venues = ["Le Comptoir Darna", "Sky Bar Casa", "Le Lotus Club", "Pacha Marrakech", "La Mamounia Lounge"];

const statusIcon = (s: string) => {
  if (s === "confirmée") return <CheckCircle size={14} strokeWidth={1.5} className="text-emerald-600" />;
  if (s === "en attente") return <Clock size={14} strokeWidth={1.5} className="text-amber-600" />;
  return <XCircle size={14} strokeWidth={1.5} className="text-red-500" />;
};

const statusBadge = (s: string) => {
  if (s === "confirmée") return "bg-emerald-100 text-emerald-800";
  if (s === "en attente") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
};

export default function ConciergeReservationsPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const [reservations, setReservations] = useState<typeof DEMO_RESERVATIONS>([]);
  const initialized = useRef(false);
  const [filter, setFilter] = useState("toutes");

  useEffect(() => {
    if (!isLoading && !initialized.current) {
      initialized.current = true;
      if (isDemoConcierge) {
        setReservations(DEMO_RESERVATIONS);
      }
    }
  }, [isLoading, isDemoConcierge]);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newVenue, setNewVenue] = useState(venues[0]);
  const [newGuests, setNewGuests] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const { toast, showToast } = useToast();

  const filtered = filter === "toutes" ? reservations : reservations.filter((r) => r.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newVenue) return;
    const venueCity: Record<string, string> = {
      "Le Comptoir Darna": "Marrakech",
      "Sky Bar Casa": "Casablanca",
      "Le Lotus Club": "Tanger",
      "Pacha Marrakech": "Marrakech",
      "La Mamounia Lounge": "Marrakech",
    };
    const newRes = {
      id: Date.now(),
      venue: newVenue,
      city: venueCity[newVenue] || "—",
      client: newClient.trim(),
      guests: parseInt(newGuests) || 2,
      table: "À définir",
      date: newDate || "À définir",
      time: newTime || "À définir",
      status: "en attente",
      commission: "À calculer",
    };
    setReservations((prev) => [newRes, ...prev]);
    setShowModal(false);
    setNewClient("");
    setNewGuests("");
    setNewDate("");
    setNewTime("");
    showToast(`Réservation créée pour ${newRes.client}`);
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold">
            Mes réservations
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Suivez et gérez toutes vos réservations.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} strokeWidth={1.5} />
          Nouvelle réservation
        </button>
      </div>

      {/* Filters */}
      <div className="px-8 pb-6 flex items-center gap-3">
        {["toutes", "confirmée", "en attente", "refusée"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f ? "bg-primary text-white" : "bg-surface-low text-on-surface-variant hover:bg-surface-mid"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="px-8 pb-8">
        <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-low">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Établissement</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Client</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Couverts</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Table</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Statut</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Commission</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res, i) => (
                  <tr key={res.id} className={i % 2 === 0 ? "bg-surface-card" : "bg-surface-low/50"}>
                    <td className="px-6 py-3.5">
                      <p className="text-on-background font-medium">{res.venue}</p>
                      <p className="text-xs text-on-surface-variant">{res.city}</p>
                    </td>
                    <td className="px-6 py-3.5 text-on-background">{res.client}</td>
                    <td className="px-6 py-3.5 text-on-background">{res.guests}</td>
                    <td className="px-6 py-3.5 text-on-background">{res.table}</td>
                    <td className="px-6 py-3.5 text-on-surface-variant">{res.date} - {res.time}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${statusBadge(res.status)}`}>
                        {statusIcon(res.status)}
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-on-background font-medium">{res.commission}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                      Aucune réservation trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)]">
                Nouvelle réservation
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-low transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Établissement *
                </label>
                <select
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                >
                  {venues.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                  Nom du client *
                </label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Ex: Mohamed Tazi"
                  className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Couverts
                  </label>
                  <input
                    type="number"
                    value={newGuests}
                    onChange={(e) => setNewGuests(e.target.value)}
                    placeholder="4"
                    min="1"
                    className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="12 Avr."
                    className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">
                    Heure
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="22:00"
                    className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Créer la réservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
