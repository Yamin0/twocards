"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Lock,
  Camera,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const settingsNav = [
  { label: "Profile", icon: User, id: "profile" },
  { label: "Account", icon: Shield, id: "account" },
  { label: "Notifications", icon: Bell, id: "notifications" },
  { label: "Billing", icon: CreditCard, id: "billing" },
  { label: "Security", icon: Lock, id: "security" },
];

export default function SettingsPage() {
  const { isDemoVenue, isLoading, fullName, email, venueName, initials } = useAuthUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast, showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    venueName: "",
    venueType: "restaurant",
    capacity: "",
    address: "",
    description: "",
    hours: "",
    minSpend: "",
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (!isLoading && !initialized.current) {
      initialized.current = true;
      if (isDemoVenue) {
        setForm({
          name: "Marc Rousseau",
          email: "marc@lecomptoir.fr",
          phone: "+33 6 12 34 56 78",
          city: "Paris",
          venueName: "Le Comptoir",
          venueType: "restaurant-bar",
          capacity: "220",
          address: "42 Rue de Rivoli, 75001 Paris",
          description:
            "Le Comptoir est un restaurant-bar branché situé au cœur de Paris, offrant une expérience culinaire raffinée dans un cadre contemporain. Nos soirées thématiques et notre carte de cocktails signatures en font un lieu incontournable de la vie nocturne parisienne.",
          hours: "Mar-Sam: 19h00 - 02h00 | Dim: 12h00 - 16h00",
          minSpend: "Table Standard: 500 MAD | Table VIP: 1,500 MAD | Carré VIP: 3,000 MAD",
        });
      } else {
        setForm((prev) => ({
          ...prev,
          name: fullName || "",
          email: email || "",
          venueName: venueName || "",
        }));
      }
    }
  }, [isLoading, isDemoVenue, fullName, email, venueName]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSuccess(false);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSaving(false);
    setSuccess(true);
    showToast("Modifications enregistrées avec succès");
  };

  if (isLoading) return <DashboardSkeleton />;

  const displayInitials = isDemoVenue ? "MR" : initials;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Sub-Nav */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-[family-name:var(--font-manrope)] transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-surface-card editorial-shadow text-primary font-bold"
                      : "text-on-surface-variant hover:text-on-background hover:bg-surface-low"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold font-[family-name:var(--font-manrope)] text-primary-dark">
              Votre Profil
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Gérez vos informations personnelles et les détails de votre établissement.
            </p>
          </div>

          {/* Photo Section */}
          <div className="bg-surface-card rounded-md editorial-shadow p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-2xl font-bold text-on-primary-container">{displayInitials}</span>
                </div>
                <button
                  onClick={() => showToast("Upload photo bientôt disponible")}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors"
                >
                  <Camera size={14} strokeWidth={1.5} />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-on-background">Photo de profil</p>
                <button onClick={() => showToast("Upload photo bientôt disponible")} className="text-xs text-primary font-medium mt-1 hover:underline">
                  Modifier la photo
                </button>
              </div>
            </div>
          </div>

          {/* Two Column Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations Personnelles */}
            <div className="bg-surface-card rounded-md editorial-shadow p-6 space-y-5">
              <h2 className="text-sm font-bold font-[family-name:var(--font-manrope)] text-primary-dark">
                Informations Personnelles
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-surface-variant cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Détails de l'Établissement */}
            <div className="bg-surface-card rounded-md editorial-shadow p-6 space-y-5">
              <h2 className="text-sm font-bold font-[family-name:var(--font-manrope)] text-primary-dark">
                Détails de l&apos;Établissement
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={form.venueName}
                    onChange={(e) => updateForm("venueName", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        value={form.venueType}
                        onChange={(e) => updateForm("venueType", e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="restaurant">Restaurant</option>
                        <option value="bar">Bar</option>
                        <option value="club">Club</option>
                        <option value="restaurant-bar">Restaurant-Bar</option>
                        <option value="lounge">Lounge</option>
                      </select>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                      Capacité
                    </label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => updateForm("capacity", e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Wide Section */}
          <div className="bg-surface-low rounded-md p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-card border-none rounded-md text-sm text-on-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Horaires d&apos;ouverture
              </label>
              <input
                type="text"
                value={form.hours}
                onChange={(e) => updateForm("hours", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-card border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Règles de consommation minimum
              </label>
              <input
                type="text"
                value={form.minSpend}
                onChange={(e) => updateForm("minSpend", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-card border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 text-sm font-medium text-error hover:text-error/80 transition-colors"
            >
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-card rounded-md editorial-shadow p-6 w-full max-w-sm mx-4 text-center">
            <h2 className="text-lg font-bold text-primary-dark font-[family-name:var(--font-manrope)] mb-2">
              Supprimer le compte ?
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Cette action est irréversible. Toutes vos données seront supprimées.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-surface-mid text-on-background rounded-sm text-sm font-medium hover:bg-surface-high transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  showToast("Demande de suppression envoyée");
                }}
                className="flex-1 px-4 py-2.5 bg-error text-white rounded-sm text-sm font-medium hover:bg-error/80 transition-colors"
              >
                Confirmer
              </button>
            </div>
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
