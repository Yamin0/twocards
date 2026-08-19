"use client";

import { useState, useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { User, Mail, Phone, MapPin, Save, CheckCircle, Loader2 } from "lucide-react";

export default function ConciergeSettingsPage() {
  const { fullName, email, isDemoConcierge, isLoading } = useAuthUser();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    city: "",
  });
  const [saving, setSaving] = useState(false);
  /* Message plutôt que booléen : le formulaire et l'envoi de photo n'ont pas
     la même confirmation à afficher. */
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  /* Ajustement d'etat pendant le rendu plutot qu'un effet. */
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && !initialized) {
    setInitialized(true);
    if (isDemoConcierge) {
      setForm({ fullname: "Karim Bennani", email: "karim@prestige-marrakech.com", phone: "+212 6 12 34 56 78", city: "Marrakech" });
    } else {
      setForm({ fullname: fullName || "", email: email || "", phone: "", city: "" });
    }
  }

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    // Simulate save (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSaving(false);
    setNotice("Vos informations ont été enregistrées avec succès.");
  };

  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="bg-transparent min-h-screen">
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-white text-2xl font-extrabold">
          Paramètres
        </h1>
        <p className="text-white/60 mt-1 text-sm">
          Gérez votre profil et vos préférences.
        </p>
      </div>

      <div className="px-8 pb-8 max-w-2xl space-y-6">
        {notice && (
          <div className="flex items-center gap-2 rounded-sm bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle size={16} strokeWidth={1.5} />
            {notice}
          </div>
        )}

        <div className="bg-white/[0.07] rounded-md editorial-shadow p-8">
          <AvatarUploader onMessage={setNotice} />
        </div>

        <div className="bg-white/[0.07] rounded-md editorial-shadow p-8">
          <h2 className="text-sm font-semibold text-white mb-6">
            Informations personnelles
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-ui text-xs uppercase tracking-wider text-white/60">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.fullname}
                    onChange={(e) => updateForm("fullname", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border-none rounded-sm text-sm text-white font-ui focus:bg-white/[0.07] focus:ring-1 focus:ring-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-ui text-xs uppercase tracking-wider text-white/60">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} strokeWidth={1.5} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border-none rounded-sm text-sm text-white font-ui focus:bg-white/[0.07] focus:ring-1 focus:ring-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-ui text-xs uppercase tracking-wider text-white/60">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} strokeWidth={1.5} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border-none rounded-sm text-sm text-white font-ui focus:bg-white/[0.07] focus:ring-1 focus:ring-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-ui text-xs uppercase tracking-wider text-white/60">
                  Ville
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border-none rounded-sm text-sm text-white font-ui focus:bg-white/[0.07] focus:ring-1 focus:ring-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-6 py-2.5 rounded-sm hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Save size={16} strokeWidth={1.5} />
              )}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
