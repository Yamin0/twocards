"use client";

import { useState, useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { User, Mail, Phone, MapPin, Save, CheckCircle, Loader2, Languages } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export default function ConciergeSettingsPage() {
  const { fullName, email, isDemoConcierge, isLoading } = useAuthUser();
  const t = useT();
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
      const timer = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(timer);
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
    setNotice(t("Vos informations ont été enregistrées avec succès.", "Your details have been saved."));
  };

  if (isLoading) return <ConciergeSkeleton />;

  return (
    <div className="bg-transparent min-h-screen">
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-ink text-2xl font-extrabold">
          {t("Paramètres", "Settings")}
        </h1>
        <p className="text-ink-2 mt-1 text-sm">
          {t("Gérez votre profil et vos préférences.", "Manage your profile and preferences.")}
        </p>
      </div>

      <div className="px-8 pb-8 max-w-2xl space-y-6">
        {notice && (
          <div className="flex items-center gap-2 rounded-sm bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle size={16} strokeWidth={1.5} />
            {notice}
          </div>
        )}

        <div className="bg-fill-2 rounded-md editorial-shadow p-8">
          <AvatarUploader onMessage={setNotice} />
        </div>

        {/* Langue de l'interface : aussi visible dans l'app mobile, où la
            barre latérale est masquée. */}
        <div className="bg-fill-2 rounded-md editorial-shadow p-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Languages size={18} strokeWidth={1.5} className="text-ink-2" />
            <div>
              <h2 className="text-sm font-semibold text-ink">{t("Langue", "Language")}</h2>
              <p className="text-xs text-ink-3 mt-0.5">
                {t("Langue de l'interface", "Interface language")}
              </p>
            </div>
          </div>
          <LanguageSwitcher tone="dark" />
        </div>

        <div className="bg-fill-2 rounded-md editorial-shadow p-8">
          <h2 className="text-sm font-semibold text-ink mb-6">
            {t("Informations personnelles", "Personal details")}
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-ui text-xs text-ink-2">
                  {t("Nom complet", "Full name")}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.fullname}
                    onChange={(e) => updateForm("fullname", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-fill border-none rounded-sm text-sm text-ink font-ui focus:bg-fill-2 focus:ring-1 focus:ring-line-2 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-ui text-xs text-ink-2">
                  {t("Email", "Email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} strokeWidth={1.5} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-fill border-none rounded-sm text-sm text-ink font-ui focus:bg-fill-2 focus:ring-1 focus:ring-line-2 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-ui text-xs text-ink-2">
                  {t("Téléphone", "Phone")}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} strokeWidth={1.5} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-fill border-none rounded-sm text-sm text-ink font-ui focus:bg-fill-2 focus:ring-1 focus:ring-line-2 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-ui text-xs text-ink-2">
                  {t("Ville", "City")}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-fill border-none rounded-sm text-sm text-ink font-ui focus:bg-fill-2 focus:ring-1 focus:ring-line-2 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-fill-3 text-ink text-sm font-medium px-6 py-2.5 rounded-sm hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Save size={16} strokeWidth={1.5} />
              )}
              {saving ? t("Enregistrement...", "Saving...") : t("Enregistrer", "Save")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
