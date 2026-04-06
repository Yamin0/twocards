"use client";

import { useState } from "react";
import { MapPin, Star, ArrowRight, X, Check, Phone, Mail, Globe, Building2 } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";

const DEMO_VENUES = [
  { id: 1, name: "Le Comptoir Darna", city: "Marrakech", type: "Restaurant-Club", commission: "10%", covers: 68, rating: 4.8, active: true, phone: "+212 5 24 43 77 02", email: "contact@comptoirdarna.com", address: "Avenue Echouhada, Hivernage, Marrakech", hours: "20h – 3h" },
  { id: 2, name: "Sky Bar Casa", city: "Casablanca", type: "Rooftop Bar", commission: "10%", covers: 45, rating: 4.6, active: true, phone: "+212 5 22 43 88 10", email: "info@skybarcasa.ma", address: "Boulevard de la Corniche, Casablanca", hours: "18h – 2h" },
  { id: 3, name: "Le Lotus Club", city: "Tanger", type: "Club", commission: "10%", covers: 31, rating: 4.5, active: true, phone: "+212 5 39 33 22 11", email: "booking@lotusclub.ma", address: "Place du Petit Socco, Tanger", hours: "22h – 5h" },
  { id: 4, name: "Pacha Marrakech", city: "Marrakech", type: "Club", commission: "10%", covers: 22, rating: 4.7, active: true, phone: "+212 5 24 38 84 00", email: "vip@pachamarrakech.com", address: "Zone Hôtelière de l'Agdal, Marrakech", hours: "23h – 5h" },
  { id: 5, name: "La Mamounia Lounge", city: "Marrakech", type: "Lounge", commission: "10%", covers: 18, rating: 4.9, active: true, phone: "+212 5 24 38 86 00", email: "lounge@mamounia.com", address: "Avenue Bab Jdid, Marrakech", hours: "19h – 1h" },
  { id: 6, name: "Rick's Cafe", city: "Casablanca", type: "Restaurant", commission: "10%", covers: 12, rating: 4.4, active: false, phone: "+212 5 22 27 42 07", email: "info@rickscafe.ma", address: "Boulevard Sour Jdid, Casablanca", hours: "12h – 0h" },
];

export default function ConciergeVenuesPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast, showToast } = useToast();

  const venues = isDemoConcierge ? DEMO_VENUES : [];

  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold">
          Mes établissements
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Les établissements avec lesquels vous travaillez.
        </p>
      </div>

      <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {venues.map((venue) => (
          <div key={venue.id} className="bg-surface-card rounded-md editorial-shadow overflow-hidden hover:-translate-y-0.5 transition-transform group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-[family-name:var(--font-manrope)] font-bold text-lg text-on-background">
                      {venue.name}
                    </h3>
                    {!venue.active && (
                      <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full bg-surface-mid text-on-surface-variant">
                        inactif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} strokeWidth={1.5} />
                      {venue.city}
                    </span>
                    <span>{venue.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} strokeWidth={1.5} className="text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-on-background">{venue.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[0.625rem] uppercase tracking-wider text-on-surface-variant font-semibold">Commission</p>
                  <p className="text-on-background font-bold text-lg font-[family-name:var(--font-manrope)]">{venue.commission}</p>
                </div>
                <div>
                  <p className="text-[0.625rem] uppercase tracking-wider text-on-surface-variant font-semibold">Couverts ce mois</p>
                  <p className="text-on-background font-bold text-lg font-[family-name:var(--font-manrope)]">{venue.covers}</p>
                </div>
                <div className="flex items-end justify-end">
                  <button
                    onClick={() => setExpandedId(expandedId === venue.id ? null : venue.id)}
                    className="text-primary text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    {expandedId === venue.id ? "Fermer" : "Voir"}
                    <ArrowRight size={14} strokeWidth={1.5} className={`transition-transform ${expandedId === venue.id ? "rotate-90" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {expandedId === venue.id && (
              <div className="px-6 pb-6 pt-0 border-t border-outline-variant/10 mt-0 pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Phone size={14} strokeWidth={1.5} className="text-primary" />
                    <a href={`tel:${venue.phone}`} className="hover:text-primary transition-colors">{venue.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Mail size={14} strokeWidth={1.5} className="text-primary" />
                    <span className="truncate">{venue.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <MapPin size={14} strokeWidth={1.5} className="text-primary" />
                    <span>{venue.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Globe size={14} strokeWidth={1.5} className="text-primary" />
                    <span>Horaires : {venue.hours}</span>
                  </div>
                </div>
                <button
                  onClick={() => showToast(`Message envoyé à ${venue.name}`)}
                  className="w-full bg-primary text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition-opacity mt-2"
                >
                  Contacter l&apos;établissement
                </button>
              </div>
            )}
          </div>
        ))}
        {venues.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Building2 size={48} strokeWidth={1} className="mx-auto text-on-surface-variant/30 mb-4" />
            <p className="text-sm text-on-surface-variant">Aucun établissement partenaire</p>
          </div>
        )}
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
