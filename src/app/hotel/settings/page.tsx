"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Hotel,
  BedDouble,
  Save,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function HotelSettingsPage() {
  const { fullName, email, venueName, city, phone, roomsCount, isLoading } =
    useAuthUser();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    hotelName: "",
    city: "",
    rooms: "",
  });
  const [saving, setSaving] = useState(false);
  /* Message plutôt que booléen : le formulaire et l'envoi de photo n'ont pas
     la même confirmation à afficher. */
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  /* Ajustement d'état pendant le rendu plutôt qu'un effet. */
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && !initialized) {
    setInitialized(true);
    setForm({
      fullname: fullName || "",
      email: email || "",
      phone: phone || "",
      hotelName: venueName || "",
      city: city || "",
      rooms: roomsCount ? String(roomsCount) : "",
    });
  }

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setNotice(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);

    /* Métadonnées utilisateur : la même source que le signup. La ville pilote
       le catalogue proposé aux clients et l'URL des QR codes. */
    const { error: saveError } = await createClient().auth.updateUser({
      data: {
        full_name: form.fullname.trim(),
        phone: form.phone.trim(),
        venue_name: form.hotelName.trim(),
        city: form.city.trim(),
        rooms_count: form.rooms ? Number(form.rooms) : null,
      },
    });

    setSaving(false);
    if (saveError) {
      setError("Impossible d'enregistrer. Réessayez dans un instant.");
      return;
    }
    setNotice("Vos informations ont été enregistrées avec succès.");
  };

  if (isLoading) return <DashboardSkeleton />;

  const inputClass =
    "w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border-none rounded-sm text-sm text-white font-ui focus:bg-white/[0.07] focus:ring-1 focus:ring-white/30 focus:outline-none transition-colors";
  const fieldLabelClass =
    "block font-ui text-xs uppercase tracking-wider text-white/60";
  const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-white/40";

  return (
    <div className="bg-transparent min-h-screen">
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-white font-ui text-2xl font-extrabold">
          Paramètres
        </h1>
        <p className="text-white/60 mt-1 text-sm">
          Gérez le profil de votre hôtel et vos préférences.
        </p>
      </div>

      <div className="px-8 pb-8 max-w-2xl space-y-6">
        {notice && (
          <div className="flex items-center gap-2 rounded-sm bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle size={16} strokeWidth={1.5} />
            {notice}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-sm bg-red-500/15 border border-red-400/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="bg-white/[0.07] rounded-md editorial-shadow p-8">
          <AvatarUploader onMessage={setNotice} label="Photo de l'hôtel" />
        </div>

        <div className="bg-white/[0.07] rounded-md editorial-shadow p-8">
          <h2 className="text-sm font-semibold text-white font-ui mb-6">
            Profil de l&apos;hôtel
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={fieldLabelClass}>Nom de l&apos;hôtel</label>
                <div className="relative">
                  <Hotel className={iconClass} size={16} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.hotelName}
                    onChange={(e) => updateForm("hotelName", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={fieldLabelClass}>Ville</label>
                <div className="relative">
                  <MapPin className={iconClass} size={16} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    placeholder="Marrakech"
                    className={inputClass}
                  />
                </div>
                <p className="text-[11px] text-white/40 font-ui">
                  Détermine le catalogue de sorties proposé à vos clients.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className={fieldLabelClass}>Nombre de chambres</label>
                <div className="relative">
                  <BedDouble className={iconClass} size={16} strokeWidth={1.5} />
                  <input
                    type="number"
                    min={1}
                    value={form.rooms}
                    onChange={(e) => updateForm("rooms", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={fieldLabelClass}>Nom du contact</label>
                <div className="relative">
                  <User className={iconClass} size={16} strokeWidth={1.5} />
                  <input
                    type="text"
                    value={form.fullname}
                    onChange={(e) => updateForm("fullname", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={fieldLabelClass}>Email</label>
                <div className="relative">
                  <Mail className={iconClass} size={16} strokeWidth={1.5} />
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className={`${inputClass} opacity-50 cursor-not-allowed`}
                  />
                </div>
                <p className="text-[11px] text-white/40 font-ui">
                  L&apos;email de connexion ne se change pas ici.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className={fieldLabelClass}>Téléphone</label>
                <div className="relative">
                  <Phone className={iconClass} size={16} strokeWidth={1.5} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className={inputClass}
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
