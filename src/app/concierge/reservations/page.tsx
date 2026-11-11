"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

const DEMO_RESERVATIONS = [
  { id: 1, venue: "Le Comptoir Darna", city: "Marrakech", client: "Mehdi Alaoui", guests: 8, table: "VIP 3", date: "6 Avr. 2026", time: "22:00", status: "confirmée", commission: "6 400 MAD" },
  { id: 2, venue: "Sky Bar Casa", city: "Casablanca", client: "Sarah Cohen", guests: 4, table: "Standard 7", date: "7 Avr. 2026", time: "21:00", status: "en attente", commission: "2 800 MAD" },
  { id: 3, venue: "Le Lotus Club", city: "Tanger", client: "Omar Tazi", guests: 12, table: "Carré VIP", date: "12 Avr. 2026", time: "23:00", status: "en attente", commission: "9 600 MAD" },
  { id: 4, venue: "Le Comptoir Darna", city: "Marrakech", client: "Lina Berrada", guests: 6, table: "VIP 1", date: "5 Avr. 2026", time: "21:30", status: "confirmée", commission: "4 200 MAD" },
  { id: 5, venue: "Pacha Marrakech", city: "Marrakech", client: "Youssef Fassi", guests: 10, table: "VIP 5", date: "4 Avr. 2026", time: "23:30", status: "refusée", commission: "—" },
];

const venues = ["Le Comptoir Darna", "Sky Bar Casa", "Le Lotus Club", "Pacha Marrakech", "La Mamounia Lounge"];

const statusIcon = (s: string) => {
  if (s === "confirmée") return <CheckCircle size={14} strokeWidth={1.5} className="text-ok" />;
  if (s === "en attente") return <Clock size={14} strokeWidth={1.5} className="text-warn" />;
  return <XCircle size={14} strokeWidth={1.5} className="text-danger" />;
};

/* Les valeurs restent en français (statuts, « À définir »…) ; seul
   l'affichage suit la langue. */
const statusLabel = (s: string, t: Translate) =>
  ({
    toutes: t("Toutes", "All"),
    "confirmée": t("Confirmée", "Confirmed"),
    "en attente": t("En attente", "Pending"),
    "refusée": t("Refusée", "Declined"),
  } as Record<string, string>)[s] ?? s;

const valueLabel = (v: string, t: Translate) => {
  if (v === "À définir") return t("À définir", "TBC");
  if (v === "À calculer") return t("À calculer", "To be calculated");
  if (v === "Carré VIP") return t("Carré VIP", "VIP area");
  return t(v, v.replace("Avr.", "Apr"));
};

const statusBadge = (s: string) => {
  if (s === "confirmée") return "bg-ok-soft text-emerald-800";
  if (s === "en attente") return "bg-warn-soft text-amber-800";
  return "bg-danger-soft text-red-800";
};

function ConciergeReservations() {
  /* Arrivee depuis l'annuaire de l'accueil : ?new=1 ouvre le modal,
     ?venue= preselectionne l'etablissement (ajoute aux choix s'il n'y
     figure pas — l'annuaire reel deborde de la liste de demonstration). */
  const params = useSearchParams();
  const requestedVenue = params.get("venue");
  const venueOptions =
    requestedVenue && !venues.includes(requestedVenue)
      ? [requestedVenue, ...venues]
      : venues;

  const { isDemoConcierge, isLoading } = useAuthUser();
  const t = useT();
  const [reservations, setReservations] = useState<typeof DEMO_RESERVATIONS>([]);
  const [filter, setFilter] = useState("toutes");

  /* Ajustement d'etat pendant le rendu (patron React documente) plutot
     qu'un effet : la liste se remplit des que l'authentification est
     resolue, sans rendu intermediaire vide. */
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && !initialized) {
    setInitialized(true);
    if (isDemoConcierge) setReservations(DEMO_RESERVATIONS);
  }
  const [showModal, setShowModal] = useState(params.get("new") === "1");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    if (showModal) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [showModal]);

  const [newClient, setNewClient] = useState("");
  const [newVenue, setNewVenue] = useState(requestedVenue ?? venues[0]);
  const [newGuests, setNewGuests] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast, showToast } = useToast();

  const filtered = filter === "toutes" ? reservations : reservations.filter((r) => r.status === filter);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!newClient.trim()) newErrors.client = t("Le nom du client est requis", "Guest name is required");
    if (!newVenue) newErrors.venue = t("L'établissement est requis", "Venue is required");
    if (newGuests && parseInt(newGuests) < 1) newErrors.guests = t("Minimum 1 personne", "Minimum 1 guest");
    if (!newDate.trim()) newErrors.date = t("La date est requise", "Date is required");
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

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
    setErrors({});
    setNewClient("");
    setNewGuests("");
    setNewDate("");
    setNewTime("");
    showToast(t(`Réservation créée pour ${newRes.client}`, `Reservation created for ${newRes.client}`));
  };

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="bg-transparent min-h-screen">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-ink text-2xl font-extrabold">
            {t("Mes réservations", "My reservations")}
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            {t("Suivez et gérez toutes vos réservations.", "Track and manage all your reservations.")}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-fill-3 text-ink text-sm font-medium px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} strokeWidth={1.5} />
          {t("Nouvelle réservation", "New reservation")}
        </button>
      </div>

      {/* Filters */}
      <div className="px-8 pb-6 flex items-center gap-3">
        {["toutes", "confirmée", "en attente", "refusée"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f ? "bg-fill-3 text-ink" : "bg-fill text-ink-2 hover:bg-fill"
            }`}
          >
            {statusLabel(f, t)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="px-8 pb-8">
        <div className="bg-fill-2 rounded-md editorial-shadow overflow-hidden">
          <div className="tc-stack overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fill">
                  <th className="text-left px-6 py-3 text-xs font-bold text-ink-2">{t("Établissement", "Venue")}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-ink-2">{t("Client", "Guest")}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-ink-2">{t("Couverts", "Covers")}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-ink-2">{t("Table", "Table")}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-ink-2">{t("Date", "Date")}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-ink-2">{t("Statut", "Status")}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-ink-2">{t("Commission", "Commission")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res, i) => (
                  <tr key={res.id} className={i % 2 === 0 ? "bg-fill-2" : "bg-fill/50"}>
                    <td data-head className="px-6 py-3.5">
                      <p className="text-ink font-medium">{res.venue}</p>
                      <p className="text-xs text-ink-2">{res.city}</p>
                    </td>
                    <td data-label={t("Client", "Guest")} className="px-6 py-3.5 text-ink">{res.client}</td>
                    <td data-label={t("Couverts", "Covers")} className="px-6 py-3.5 text-ink">{res.guests}</td>
                    <td data-label={t("Table", "Table")} className="px-6 py-3.5 text-ink">{valueLabel(res.table, t)}</td>
                    <td data-label={t("Date", "Date")} className="px-6 py-3.5 text-ink-2">{valueLabel(res.date, t)} - {valueLabel(res.time, t)}</td>
                    <td data-label={t("Statut", "Status")} className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(res.status)}`}>
                        {statusIcon(res.status)}
                        {statusLabel(res.status, t)}
                      </span>
                    </td>
                    <td data-label={t("Commission", "Commission")} className="px-6 py-3.5 text-ink font-medium">{valueLabel(res.commission, t)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-ink-2">
                      {t("Aucune réservation trouvée", "No reservations found")}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim">
          <div className="bg-fill-2 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-ink">
                {t("Nouvelle réservation", "New reservation")}
              </h2>
              <button
                onClick={() => { setShowModal(false); setErrors({}); }}
                aria-label={t("Fermer", "Close")}
                className="p-1 rounded-lg text-ink-2 hover:text-ink hover:bg-fill transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  {t("Établissement *", "Venue *")}
                </label>
                <select
                  value={newVenue}
                  onChange={(e) => {
                    setNewVenue(e.target.value);
                    clearError("venue");
                  }}
                  className="w-full px-3 py-2 text-sm bg-fill border-none rounded-lg text-ink font-ui focus:ring-1 focus:ring-line-2 focus:outline-none"
                >
                  {venueOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                {errors.venue && <p className="text-xs text-danger mt-1">{errors.venue}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">
                  {t("Nom du client *", "Guest name *")}
                </label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => {
                    setNewClient(e.target.value);
                    clearError("client");
                  }}
                  placeholder={t("Ex: Mohamed Tazi", "e.g. Mohamed Tazi")}
                  className="w-full px-3 py-2 text-sm bg-fill border-none rounded-lg text-ink placeholder:text-ink-4/50 font-ui focus:ring-1 focus:ring-line-2 focus:outline-none"
                />
                {errors.client && <p className="text-xs text-danger mt-1">{errors.client}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">
                    {t("Couverts", "Covers")}
                  </label>
                  <input
                    type="number"
                    value={newGuests}
                    onChange={(e) => {
                      setNewGuests(e.target.value);
                      clearError("guests");
                    }}
                    placeholder="4"
                    min="1"
                    className="w-full px-3 py-2 text-sm bg-fill border-none rounded-lg text-ink placeholder:text-ink-4/50 font-ui focus:ring-1 focus:ring-line-2 focus:outline-none"
                  />
                  {errors.guests && <p className="text-xs text-danger mt-1">{errors.guests}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">
                    {t("Date", "Date")}
                  </label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      clearError("date");
                    }}
                    placeholder={t("12 Avr.", "12 Apr")}
                    className="w-full px-3 py-2 text-sm bg-fill border-none rounded-lg text-ink placeholder:text-ink-4/50 font-ui focus:ring-1 focus:ring-line-2 focus:outline-none"
                  />
                  {errors.date && <p className="text-xs text-danger mt-1">{errors.date}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">
                    {t("Heure", "Time")}
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="22:00"
                    className="w-full px-3 py-2 text-sm bg-fill border-none rounded-lg text-ink placeholder:text-ink-4/50 font-ui focus:ring-1 focus:ring-line-2 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-fill-3 text-ink text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                {t("Créer la réservation", "Create reservation")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-fill-3-dark text-ink px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}

export default function ConciergeReservationsPage() {
  /* useSearchParams exige une frontiere Suspense au prerendu. */
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ConciergeReservations />
    </Suspense>
  );
}
