"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Star, Search, Phone, MoreHorizontal, X, Check } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";

const DEMO_CLIENTS = [
  { id: 1, name: "Mehdi Alaoui", phone: "+212 6 12 34 56 78", email: "mehdi@email.com", visits: 12, totalSpent: "78 500 MAD", avgGroup: "6.2", lastVisit: "6 Avr. 2026", vip: true, tags: ["VIP", "Régulier"] },
  { id: 2, name: "Sarah Cohen", phone: "+212 6 23 45 67 89", email: "sarah@email.com", visits: 8, totalSpent: "52 000 MAD", avgGroup: "4.5", lastVisit: "5 Avr. 2026", vip: true, tags: ["VIP"] },
  { id: 3, name: "Omar Tazi", phone: "+212 6 34 56 78 90", email: "omar@email.com", visits: 5, totalSpent: "34 200 MAD", avgGroup: "8.0", lastVisit: "4 Avr. 2026", vip: false, tags: ["Groupe"] },
  { id: 4, name: "Lina Berrada", phone: "+212 6 45 67 89 01", email: "lina@email.com", visits: 4, totalSpent: "28 800 MAD", avgGroup: "5.5", lastVisit: "3 Avr. 2026", vip: false, tags: [] },
  { id: 5, name: "Youssef Fassi", phone: "+212 6 56 78 90 12", email: "youssef@email.com", visits: 3, totalSpent: "22 400 MAD", avgGroup: "10.0", lastVisit: "2 Avr. 2026", vip: false, tags: ["Groupe"] },
  { id: 6, name: "Amira Benjelloun", phone: "+212 6 67 89 01 23", email: "amira@email.com", visits: 7, totalSpent: "45 600 MAD", avgGroup: "3.8", lastVisit: "1 Avr. 2026", vip: true, tags: ["VIP", "Régulier"] },
  { id: 7, name: "Karim Idrissi", phone: "+212 6 78 90 12 34", email: "karim@email.com", visits: 15, totalSpent: "92 000 MAD", avgGroup: "4.0", lastVisit: "6 Avr. 2026", vip: true, tags: ["VIP", "Régulier", "Top client"] },
  { id: 8, name: "Nadia Hassani", phone: "+212 6 89 01 23 45", email: "nadia@email.com", visits: 2, totalSpent: "12 400 MAD", avgGroup: "6.0", lastVisit: "28 Mars 2026", vip: false, tags: ["Nouveau"] },
];

export default function ConciergeClientsPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const [clients, setClients] = useState<typeof DEMO_CLIENTS>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isLoading && !initialized.current) {
      initialized.current = true;
      if (isDemoConcierge) {
        setClients(DEMO_CLIENTS);
      }
    }
  }, [isLoading, isDemoConcierge]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("tous");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const { toast, showToast } = useToast();

  const allTags = ["tous", "VIP", "Régulier", "Groupe", "Nouveau", "Top client"];

  const filtered = clients.filter((c) => {
    const matchSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
      : true;
    const matchTag =
      filterTag === "tous" ? true : c.tags.includes(filterTag) || (filterTag === "VIP" && c.vip);
    return matchSearch && matchTag;
  });

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newClient = {
      id: Date.now(),
      name: newName.trim(),
      phone: newPhone.trim() || "—",
      email: newEmail.trim() || "—",
      visits: 0,
      totalSpent: "0 MAD",
      avgGroup: "0",
      lastVisit: "—",
      vip: false,
      tags: ["Nouveau"] as string[],
    };
    setClients((prev) => [newClient, ...prev]);
    setShowNewClient(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    showToast(`${newClient.name} ajouté au carnet`);
  };

  const handleMenuAction = (action: string, clientName: string) => {
    setMenuOpen(null);
    if (action === "vip") {
      setClients((prev) =>
        prev.map((c) =>
          c.name === clientName
            ? { ...c, vip: !c.vip, tags: c.vip ? c.tags.filter((t) => t !== "VIP") : [...c.tags, "VIP"] }
            : c
        )
      );
      showToast(`Statut VIP mis à jour pour ${clientName}`);
    } else if (action === "call") {
      showToast(`Appel vers ${clientName}`);
    } else if (action === "email") {
      showToast(`Email vers ${clientName}`);
    }
  };

  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-background font-[family-name:var(--font-manrope)]">
            Carnet de contacts
          </h1>
          <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mt-0.5">
            {clients.length} clients &middot; {clients.filter((c) => c.vip).length} VIP
          </p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-[family-name:var(--font-inter)]"
        >
          <Plus size={16} strokeWidth={1.5} />
          Nouveau client
        </button>
      </div>

      {/* Search + Filters */}
      <div className="px-4 sm:px-6 pb-4 space-y-3">
        <div className="relative max-w-md">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
          />
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-outline-variant/20 rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:border-primary/30 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors font-[family-name:var(--font-inter)] ${
                filterTag === tag
                  ? "bg-primary text-white"
                  : "bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-surface-low"
              }`}
            >
              {tag === "tous" ? "Tous" : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Client list - table style */}
      <div className="px-4 sm:px-6 pb-8">
        <div className="bg-white rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Contact
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Visites
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Dépenses
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Grp. moy.
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Tags
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <tr
                    key={client.id}
                    className={`border-b border-outline-variant/5 hover:bg-surface-low/50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-surface/30"
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-on-primary-container font-[family-name:var(--font-manrope)]">
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                              {client.name}
                            </span>
                            {client.vip && (
                              <Star
                                size={12}
                                strokeWidth={1.5}
                                className="text-amber-500 fill-amber-500"
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                            Dernier : {client.lastVisit}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Phone size={12} strokeWidth={1.5} />
                          {client.phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-on-background font-[family-name:var(--font-manrope)]">
                        {client.visits}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                        {client.totalSpent}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-on-surface-variant font-[family-name:var(--font-inter)]">
                        {client.avgGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {client.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              tag === "VIP"
                                ? "bg-amber-100 text-amber-800"
                                : tag === "Top client"
                                ? "bg-emerald-100 text-emerald-800"
                                : tag === "Nouveau"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-surface-low text-on-surface-variant"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === client.id ? null : client.id)}
                        className="p-1 rounded-lg text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-surface-low transition-colors"
                      >
                        <MoreHorizontal size={16} strokeWidth={1.5} />
                      </button>
                      {menuOpen === client.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-4 top-10 z-50 w-44 bg-white rounded-lg border border-outline-variant/10 shadow-lg py-1">
                            <button
                              onClick={() => handleMenuAction("vip", client.name)}
                              className="w-full text-left px-4 py-2 text-sm text-on-background hover:bg-surface-low transition-colors"
                            >
                              {client.vip ? "Retirer VIP" : "Marquer VIP"}
                            </button>
                            <button
                              onClick={() => handleMenuAction("call", client.name)}
                              className="w-full text-left px-4 py-2 text-sm text-on-background hover:bg-surface-low transition-colors"
                            >
                              Appeler
                            </button>
                            <button
                              onClick={() => handleMenuAction("email", client.name)}
                              className="w-full text-left px-4 py-2 text-sm text-on-background hover:bg-surface-low transition-colors"
                            >
                              Envoyer un email
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                      Aucun client trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      {showNewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)]">
                Nouveau client
              </h2>
              <button
                onClick={() => setShowNewClient(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-low transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1 font-[family-name:var(--font-inter)]">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Mohamed Tazi"
                  className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1 font-[family-name:var(--font-inter)]">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+212 6 XX XX XX XX"
                  className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1 font-[family-name:var(--font-inter)]">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-sm bg-surface-low border-none rounded-lg text-on-background placeholder:text-on-surface-variant/50 font-[family-name:var(--font-inter)] focus:ring-1 focus:ring-primary/30 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Ajouter le client
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
