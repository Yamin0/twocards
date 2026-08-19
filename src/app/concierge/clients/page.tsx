"use client";

import { useState, useEffect } from "react";
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

  /* Ajustement d'état pendant le rendu (patron React documenté) plutôt qu'un
     effet : la liste se remplit dès que l'authentification est résolue. */
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && !initialized) {
    setInitialized(true);
    if (isDemoConcierge) setClients(DEMO_CLIENTS);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("tous");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNewClient(false);
    };
    if (showNewClient) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [showNewClient]);

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
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-ui">
            Carnet de contacts
          </h1>
          <p className="text-sm text-white/60 font-ui mt-0.5">
            {clients.length} clients &middot; {clients.filter((c) => c.vip).length} VIP
          </p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-ui"
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder:text-white/40 font-ui focus:ring-1 focus:ring-white/30 focus:border-primary/30 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors font-ui ${
                filterTag === tag
                  ? "bg-white/15 text-white"
                  : "bg-white/[0.07] border border-white/10 text-white/60 hover:bg-white/[0.05]"
              }`}
            >
              {tag === "tous" ? "Tous" : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Client list - table style */}
      <div className="px-4 sm:px-6 pb-8">
        <div className="bg-white/[0.07] rounded-xl border border-white/10/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10/10">
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Client
                  </th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Contact
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Visites
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Dépenses
                  </th>
                  <th className="hidden sm:table-cell text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Grp. moy.
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60/60 font-ui">
                    Tags
                  </th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <tr
                    key={client.id}
                    className={`border-b border-white/10/5 hover:bg-white/[0.05]/50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-transparent/30"
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-white/70 font-ui">
                            {client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white font-ui">
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
                          <p className="text-[11px] text-white/60/60 font-ui">
                            Dernier : {client.lastVisit}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                        >
                          <Phone size={12} strokeWidth={1.5} />
                          {client.phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-white font-ui">
                        {client.visits}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-white font-ui">
                        {client.totalSpent}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3.5 text-center">
                      <span className="text-white/60 font-ui">
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
                                : "bg-white/[0.05] text-white/60"
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
                        className="p-1 rounded-lg text-white/60/40 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
                      >
                        <MoreHorizontal size={16} strokeWidth={1.5} />
                      </button>
                      {menuOpen === client.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-4 top-10 z-50 w-44 bg-white/[0.07] rounded-lg border border-white/10/10 shadow-lg py-1">
                            <button
                              onClick={() => handleMenuAction("vip", client.name)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/[0.05] transition-colors"
                            >
                              {client.vip ? "Retirer VIP" : "Marquer VIP"}
                            </button>
                            <button
                              onClick={() => handleMenuAction("call", client.name)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/[0.05] transition-colors"
                            >
                              Appeler
                            </button>
                            <button
                              onClick={() => handleMenuAction("email", client.name)}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/[0.05] transition-colors"
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
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-white/60">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white/[0.07] rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white font-ui">
                Nouveau client
              </h2>
              <button
                onClick={() => setShowNewClient(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1 font-ui">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Mohamed Tazi"
                  className="w-full px-3 py-2 text-sm bg-white/[0.05] border-none rounded-lg text-white placeholder:text-white/40 font-ui focus:ring-1 focus:ring-white/30 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1 font-ui">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+212 6 XX XX XX XX"
                  className="w-full px-3 py-2 text-sm bg-white/[0.05] border-none rounded-lg text-white placeholder:text-white/40 font-ui focus:ring-1 focus:ring-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1 font-ui">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 text-sm bg-white/[0.05] border-none rounded-lg text-white placeholder:text-white/40 font-ui focus:ring-1 focus:ring-white/30 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-white/15 text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Ajouter le client
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white/15-dark text-white px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
