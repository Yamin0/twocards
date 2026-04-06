"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Minus,
  Plus,
  ChevronDown,
  Send,
  CalendarDays,
  Users,
  MapPin,
  Sparkles,
  Check,
} from "lucide-react";

const zones = [
  { name: "VIP", minSpend: "2 500 MAD" },
  { name: "Standard", minSpend: "800 MAD" },
  { name: "Bar", minSpend: "0 MAD" },
];

export default function NewReservationPage() {
  const [partySize, setPartySize] = useState(4);
  const [entryType, setEntryType] = useState<"table" | "guestlist">("table");
  const [selectedZone, setSelectedZone] = useState(0);
  const [formData, setFormData] = useState({
    venue: "",
    event: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    specialRequests: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const { toast, showToast } = useToast(3000);

  const currentZone = zones[selectedZone];
  const commission = entryType === "table" ? "250 MAD" : "80 MAD";

  const handleSubmit = () => {
    if (!formData.clientName || !formData.venue) {
      showToast("Veuillez remplir le nom du client et l'établissement");
      return;
    }
    setSubmitted(true);
    showToast("Réservation envoyée avec succès !");
  };

  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form (60%) */}
          <div className="lg:col-span-3">
            <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold mb-6">
              Nouvelle Réservation
            </h1>

            {/* Venue & Event */}
            <div className="bg-surface-card rounded-md editorial-shadow p-6 mb-4">
              <label className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold block mb-2">
                Établissement
              </label>
              <div className="relative mb-4">
                <Search
                  size={14}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  placeholder="Rechercher un établissement..."
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="w-full bg-surface-low border-none text-sm pl-9 pr-4 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>

              <label className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold block mb-2">
                Événement / Date
              </label>
              <div className="relative">
                <CalendarDays
                  size={14}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  placeholder="Sélectionner un événement ou une date..."
                  value={formData.event}
                  onChange={(e) =>
                    setFormData({ ...formData, event: e.target.value })
                  }
                  className="w-full bg-surface-low border-none text-sm pl-9 pr-4 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-surface-card rounded-md editorial-shadow p-6 mb-4">
              <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-4">
                Informations client
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-on-surface-variant mb-1 block">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    placeholder="Jean Dupont"
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData({ ...formData, clientName: e.target.value })
                    }
                    className="w-full bg-surface-low border-none text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={formData.clientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, clientPhone: e.target.value })
                    }
                    className="w-full bg-surface-low border-none text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="jean@exemple.fr"
                    value={formData.clientEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, clientEmail: e.target.value })
                    }
                    className="w-full bg-surface-low border-none text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>
              </div>
            </div>

            {/* Party Size + Entry Type */}
            <div className="bg-surface-card rounded-md editorial-shadow p-6 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                {/* Party size counter */}
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
                    Taille du groupe
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPartySize(Math.max(1, partySize - 1))}
                      className="w-9 h-9 rounded-sm bg-surface-mid flex items-center justify-center hover:bg-surface-high transition-colors"
                    >
                      <Minus size={16} strokeWidth={1.5} className="text-on-background" />
                    </button>
                    <span className="text-on-background font-[family-name:var(--font-manrope)] font-extrabold text-2xl w-10 text-center">
                      {partySize}
                    </span>
                    <button
                      onClick={() => setPartySize(partySize + 1)}
                      className="w-9 h-9 rounded-sm bg-surface-mid flex items-center justify-center hover:bg-surface-high transition-colors"
                    >
                      <Plus size={16} strokeWidth={1.5} className="text-on-background" />
                    </button>
                  </div>
                </div>

                {/* Entry type toggle */}
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-2">
                    Type d&apos;entrée
                  </p>
                  <div className="flex rounded-sm overflow-hidden">
                    <button
                      onClick={() => setEntryType("table")}
                      className={`flex-1 text-sm font-medium px-4 py-2.5 transition-colors ${
                        entryType === "table"
                          ? "bg-primary text-white"
                          : "bg-surface-mid text-on-background hover:bg-surface-high"
                      }`}
                    >
                      Réservation Table
                    </button>
                    <button
                      onClick={() => setEntryType("guestlist")}
                      className={`flex-1 text-sm font-medium px-4 py-2.5 transition-colors ${
                        entryType === "guestlist"
                          ? "bg-primary text-white"
                          : "bg-surface-mid text-on-background hover:bg-surface-high"
                      }`}
                    >
                      Liste d&apos;invités
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Details (shown when entry type is table) */}
            {entryType === "table" && (
              <div className="bg-surface-low rounded-md p-6 mb-4">
                <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-4">
                  Détails de la table
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">
                      Zone
                    </label>
                    <div className="relative">
                      <select
                        value={selectedZone}
                        onChange={(e) =>
                          setSelectedZone(Number(e.target.value))
                        }
                        className="w-full bg-surface-card border-none text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none cursor-pointer"
                      >
                        {zones.map((zone, i) => (
                          <option key={i} value={i}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-on-surface-variant mb-1 block">
                      Minimum de consommation
                    </label>
                    <div className="bg-surface-card rounded-sm px-4 py-2.5">
                      <span className="text-on-background font-[family-name:var(--font-manrope)] font-bold text-lg">
                        {currentZone.minSpend}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Special Requests */}
            <div className="bg-surface-card rounded-md editorial-shadow p-6 mb-6">
              <label className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold block mb-2">
                Demandes spéciales
              </label>
              <textarea
                placeholder="Anniversaire, allergies, préférences de placement..."
                value={formData.specialRequests}
                onChange={(e) =>
                  setFormData({ ...formData, specialRequests: e.target.value })
                }
                rows={3}
                className="w-full bg-surface-low border-none text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitted}
              className={`flex items-center gap-2 text-white text-sm font-medium px-6 py-3 rounded-sm w-full sm:w-auto justify-center transition-all ${submitted ? "bg-emerald-600 cursor-default" : "bg-primary hover:opacity-90"}`}
            >
              {submitted ? <Check size={16} strokeWidth={1.5} /> : <Send size={16} strokeWidth={1.5} />}
              {submitted ? "Réservation envoyée" : "Envoyer la réservation"}
            </button>
          </div>

          {/* Right: Summary Sidebar (40%) */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <div className="bg-surface-card rounded-md editorial-shadow p-6">
                <div className="mb-5">
                  <div className="w-10 h-1 bg-primary rounded-full mb-3" />
                  <h2 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold">
                    Résumé de la réservation
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                      Établissement
                    </p>
                    <p className="text-on-background text-sm mt-0.5">
                      {formData.venue || "Non sélectionné"}
                    </p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                      Événement
                    </p>
                    <p className="text-on-background text-sm mt-0.5">
                      {formData.event || "Non selectionne"}
                    </p>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                      Client
                    </p>
                    <p className="text-on-background text-sm mt-0.5">
                      {formData.clientName || "Non renseigné"}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                        Taille
                      </p>
                      <p className="text-on-background text-sm mt-0.5 flex items-center gap-1">
                        <Users size={13} strokeWidth={1.5} />
                        {partySize} pers.
                      </p>
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                        Type
                      </p>
                      <span
                        className={`inline-block mt-0.5 text-[0.6875rem] font-semibold px-2.5 py-0.5 rounded-full ${
                          entryType === "table"
                            ? "bg-primary/10 text-primary-dark"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {entryType === "table" ? "Table" : "Guest List"}
                      </span>
                    </div>
                  </div>

                  {entryType === "table" && (
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                        Zone
                      </p>
                      <p className="text-on-background text-sm mt-0.5 flex items-center gap-1">
                        <MapPin size={13} strokeWidth={1.5} />
                        {currentZone.name}
                      </p>
                    </div>
                  )}

                  {entryType === "table" && (
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-1">
                        Minimum de consommation
                      </p>
                      <p className="text-on-background font-[family-name:var(--font-manrope)] font-extrabold text-3xl">
                        {currentZone.minSpend}
                      </p>
                    </div>
                  )}
                </div>

                {/* Commission box */}
                <div className="mt-6 border-l-2 border-primary bg-surface-low rounded-r-sm p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={13} strokeWidth={1.5} className="text-primary-dark" />
                    <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                      Commission estimée
                    </p>
                  </div>
                  <p className="text-primary-dark font-[family-name:var(--font-manrope)] font-extrabold text-2xl">
                    {commission}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
