"use client";

import { Plus, Star } from "lucide-react";

const clients = [
  { id: 1, name: "Mehdi Alaoui", phone: "+212 6 12 34 56 78", visits: 12, totalSpent: "78 500 MAD", avgGroup: "6.2", lastVisit: "6 Avr. 2026", vip: true },
  { id: 2, name: "Sarah Cohen", phone: "+212 6 23 45 67 89", visits: 8, totalSpent: "52 000 MAD", avgGroup: "4.5", lastVisit: "5 Avr. 2026", vip: true },
  { id: 3, name: "Omar Tazi", phone: "+212 6 34 56 78 90", visits: 5, totalSpent: "34 200 MAD", avgGroup: "8.0", lastVisit: "4 Avr. 2026", vip: false },
  { id: 4, name: "Lina Berrada", phone: "+212 6 45 67 89 01", visits: 4, totalSpent: "28 800 MAD", avgGroup: "5.5", lastVisit: "3 Avr. 2026", vip: false },
  { id: 5, name: "Youssef Fassi", phone: "+212 6 56 78 90 12", visits: 3, totalSpent: "22 400 MAD", avgGroup: "10.0", lastVisit: "2 Avr. 2026", vip: false },
  { id: 6, name: "Amira Benjelloun", phone: "+212 6 67 89 01 23", visits: 7, totalSpent: "45 600 MAD", avgGroup: "3.8", lastVisit: "1 Avr. 2026", vip: true },
];

export default function ConciergeClientsPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold">
            Mes clients
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Votre carnet de contacts et historique client.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity">
          <Plus size={16} strokeWidth={1.5} />
          Ajouter un client
        </button>
      </div>

      {/* Client Cards */}
      <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-surface-card rounded-md editorial-shadow p-5 hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                    {client.name}
                  </h3>
                  {client.vip && (
                    <Star size={14} strokeWidth={1.5} className="text-amber-500 fill-amber-500" />
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">{client.phone}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                <span className="text-sm font-semibold text-on-primary-container">
                  {client.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <p className="text-[0.625rem] uppercase tracking-wider text-on-surface-variant font-semibold">Visites</p>
                <p className="text-on-background font-bold text-lg font-[family-name:var(--font-manrope)]">{client.visits}</p>
              </div>
              <div>
                <p className="text-[0.625rem] uppercase tracking-wider text-on-surface-variant font-semibold">Dépenses</p>
                <p className="text-on-background font-bold text-sm font-[family-name:var(--font-manrope)]">{client.totalSpent}</p>
              </div>
              <div>
                <p className="text-[0.625rem] uppercase tracking-wider text-on-surface-variant font-semibold">Grp. moy.</p>
                <p className="text-on-background font-bold text-lg font-[family-name:var(--font-manrope)]">{client.avgGroup}</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-outline-variant/20">
              Dernière visite : {client.lastVisit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
