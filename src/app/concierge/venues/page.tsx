"use client";

import { MapPin, Star, ArrowRight } from "lucide-react";

const venues = [
  { id: 1, name: "Le Comptoir Darna", city: "Marrakech", type: "Restaurant-Club", commission: "10%", covers: 68, rating: 4.8, active: true },
  { id: 2, name: "Sky Bar Casa", city: "Casablanca", type: "Rooftop Bar", commission: "10%", covers: 45, rating: 4.6, active: true },
  { id: 3, name: "Le Lotus Club", city: "Tanger", type: "Club", commission: "10%", covers: 31, rating: 4.5, active: true },
  { id: 4, name: "Pacha Marrakech", city: "Marrakech", type: "Club", commission: "10%", covers: 22, rating: 4.7, active: true },
  { id: 5, name: "La Mamounia Lounge", city: "Marrakech", type: "Lounge", commission: "10%", covers: 18, rating: 4.9, active: true },
  { id: 6, name: "Rick's Cafe", city: "Casablanca", type: "Restaurant", commission: "10%", covers: 12, rating: 4.4, active: false },
];

export default function ConciergeVenuesPage() {
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
          <div key={venue.id} className="bg-surface-card rounded-md editorial-shadow p-6 hover:-translate-y-0.5 transition-transform group">
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
                <span className="text-primary text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  Voir
                  <ArrowRight size={14} strokeWidth={1.5} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
