"use client";

import { useState } from "react";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Lock,
  Camera,
  ChevronDown,
} from "lucide-react";

const settingsNav = [
  { label: "Profile", icon: User, id: "profile" },
  { label: "Account", icon: Shield, id: "account" },
  { label: "Notifications", icon: Bell, id: "notifications" },
  { label: "Billing", icon: CreditCard, id: "billing" },
  { label: "Security", icon: Lock, id: "security" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

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
              Gerez vos informations personnelles et les details de votre etablissement.
            </p>
          </div>

          {/* Photo Section */}
          <div className="bg-surface-card rounded-md editorial-shadow p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="text-2xl font-bold text-on-primary-container">MR</span>
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors">
                  <Camera size={14} strokeWidth={1.5} />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-on-background">Photo de profil</p>
                <button className="text-xs text-primary font-medium mt-1 hover:underline">
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
                    defaultValue="Marc Rousseau"
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    defaultValue="marc@lecomptoir.fr"
                    disabled
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-surface-variant cursor-not-allowed opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Telephone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+33 6 12 34 56 78"
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Ville
                  </label>
                  <input
                    type="text"
                    defaultValue="Paris"
                    className="w-full px-4 py-2.5 bg-surface-low border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Details de l'Etablissement */}
            <div className="bg-surface-card rounded-md editorial-shadow p-6 space-y-5">
              <h2 className="text-sm font-bold font-[family-name:var(--font-manrope)] text-primary-dark">
                Details de l&apos;Etablissement
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Nom
                  </label>
                  <input
                    type="text"
                    defaultValue="Le Comptoir"
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
                        defaultValue="restaurant-bar"
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
                      Capacite
                    </label>
                    <input
                      type="number"
                      defaultValue={220}
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
                    defaultValue="42 Rue de Rivoli, 75001 Paris"
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
                defaultValue="Le Comptoir est un restaurant-bar branche situe au coeur de Paris, offrant une experience culinaire raffinee dans un cadre contemporain. Nos soirees thematiques et notre carte de cocktails signatures en font un lieu incontournable de la vie nocturne parisienne."
                className="w-full px-4 py-2.5 bg-surface-card border-none rounded-md text-sm text-on-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Horaires d&apos;ouverture
              </label>
              <input
                type="text"
                defaultValue="Mar-Sam: 19h00 - 02h00 | Dim: 12h00 - 16h00"
                className="w-full px-4 py-2.5 bg-surface-card border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Regles de consommation minimum
              </label>
              <input
                type="text"
                defaultValue="Table Standard: 500 EUR | Table VIP: 1,500 EUR | Carre VIP: 3,000 EUR"
                className="w-full px-4 py-2.5 bg-surface-card border-none rounded-md text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <button className="px-6 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:bg-primary-dark transition-colors">
              Enregistrer les modifications
            </button>
            <button className="px-4 py-2.5 text-sm font-medium text-error hover:text-error/80 transition-colors">
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
