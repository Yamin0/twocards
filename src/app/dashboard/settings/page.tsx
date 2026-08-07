"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  Shield,
  Bell,
  Lock,
  Check,
  Loader2,
  Building2,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  X,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { AvatarUploader } from "@/components/shared/avatar-uploader";

/* ------------------------------------------------------------------ */
/*  Nav items                                                          */
/* ------------------------------------------------------------------ */
const settingsNav = [
  { label: "Profil", icon: User, id: "profil" },
  { label: "Établissement", icon: Building2, id: "etablissement" },
  { label: "Notifications", icon: Bell, id: "notifications" },
  { label: "Sécurité", icon: Lock, id: "securite" },
];

/* ------------------------------------------------------------------ */
/*  Reusable glass classes                                             */
/* ------------------------------------------------------------------ */
const glassCard =
  "backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl";
const inputCls =
  "w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/40 transition-colors";
const labelCls =
  "block text-[0.625rem] text-white/30 uppercase tracking-wider mb-1.5";
const VENUE_TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  bar: "Bar",
  club: "Club",
  "restaurant-bar": "Restaurant-Bar",
  lounge: "Lounge",
};

/* ------------------------------------------------------------------ */
/*  Toggle component                                                   */
/* ------------------------------------------------------------------ */
function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? "bg-blue-500" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function SettingsPage() {
  const { isDemoVenue, isLoading, fullName, email, venueName } = useAuthUser();

  const [activeTab, setActiveTab] = useState("profil");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Toast : le minuteur vit dans un effet et non dans une ref — une ref lue
     par showToast serait tracée comme accès pendant le rendu. Reprogrammé à
     chaque nouveau message, nettoyé au démontage. */
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---- Profile form ---- */
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

  /* ---- Notifications toggles ---- */
  const [notifs, setNotifs] = useState({
    emailNotifs: true,
    smsAlerts: false,
    commissionAlerts: true,
    newRpNotifs: true,
    weeklyReport: true,
  });

  /* ---- Security ---- */
  const [security, setSecurity] = useState({
    currentPw: "",
    newPw: "",
    confirmPw: "",
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  /* isCurrent et non current : l'analyseur React prend une propriété nommée
     current pour une ref lue pendant le rendu. */
  const sessions = [
    {
      device: "Chrome - Windows",
      icon: Monitor,
      location: "Paris, France",
      isCurrent: true,
    },
    {
      device: "Safari - iPhone",
      icon: Smartphone,
      location: "Paris, France",
      isCurrent: false,
    },
  ];

  /* ---- Init form from auth ----
     Ajustement d'état pendant le rendu (patron React « adjusting state when
     a prop changes ») plutôt qu'un effet : le formulaire se remplit dès que
     l'authentification est résolue, sans rendu intermédiaire vide. */
  const [initialized, setInitialized] = useState(false);
  if (!isLoading && !initialized) {
    setInitialized(true);
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
          "Le Comptoir est un restaurant-bar branché situé au cœur de Paris, offrant une expérience culinaire raffinée dans un cadre contemporain.",
        hours: "Mar-Sam: 19h00 - 02h00 | Dim: 12h00 - 16h00",
        minSpend:
          "Table Standard: 500 MAD | Table VIP: 1,500 MAD | Carré VIP: 3,000 MAD",
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

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    showToast("Modifications enregistrées avec succès");
  };

  const handlePasswordSave = async () => {
    if (security.newPw !== security.confirmPw) {
      showToast("Les mots de passe ne correspondent pas");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSecurity({ currentPw: "", newPw: "", confirmPw: "" });
    showToast("Mot de passe modifié avec succès");
  };

  if (isLoading) return <DashboardSkeleton />;

  /* ---------------------------------------------------------------- */
  /*  Tab headers                                                      */
  /* ---------------------------------------------------------------- */
  const tabHeaders: Record<string, { title: string; subtitle: string }> = {
    profil: {
      title: "Profil",
      subtitle: "Gérez vos informations personnelles.",
    },
    etablissement: {
      title: "Établissement",
      subtitle: "Configurez les détails de votre établissement.",
    },
    notifications: {
      title: "Notifications",
      subtitle: "Choisissez les alertes que vous souhaitez recevoir.",
    },
    securite: {
      title: "Sécurité",
      subtitle: "Protégez votre compte avec un mot de passe fort.",
    },
  };

  const header = tabHeaders[activeTab];

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */
  const saveButton = (onClick?: () => void) => (
    <button
      onClick={onClick ?? handleSave}
      disabled={saving}
      className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {saving && <Loader2 size={16} className="animate-spin" />}
      {saving ? "Enregistrement..." : "Enregistrer"}
    </button>
  );

  /* ---- Profil tab ---- */
  const renderProfil = () => (
    <div className="space-y-6">
      {/* Avatar */}
      <div className={`${glassCard} p-6`}>
        <AvatarUploader onMessage={showToast} />
      </div>

      {/* Fields */}
      <div className={`${glassCard} p-6 space-y-5`}>
        <div>
          <label className={labelCls}>Nom complet</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            placeholder="Votre nom"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input
            type="email"
            value={form.email}
            disabled
            className={`${inputCls} opacity-40 cursor-not-allowed`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="+33 6 00 00 00 00"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateForm("city", e.target.value)}
              placeholder="Votre ville"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {saveButton()}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          Supprimer le compte
        </button>
      </div>
    </div>
  );

  /* ---- Etablissement tab ---- */
  const renderEtablissement = () => (
    <div className="space-y-6">
      <div className={`${glassCard} p-6 space-y-5`}>
        <div>
          <label className={labelCls}>Nom de l&apos;établissement</label>
          <input
            type="text"
            value={form.venueName}
            disabled
            className={`${inputCls} opacity-40 cursor-not-allowed`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Type</label>
            <input
              type="text"
              value={VENUE_TYPE_LABELS[form.venueType] ?? form.venueType}
              disabled
              className={`${inputCls} opacity-40 cursor-not-allowed`}
            />
          </div>
          <div>
            <label className={labelCls}>Capacité</label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => updateForm("capacity", e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Adresse</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateForm("address", e.target.value)}
            placeholder="Adresse complète"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            placeholder="Décrivez votre établissement..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls}>Horaires d&apos;ouverture</label>
          <input
            type="text"
            value={form.hours}
            onChange={(e) => updateForm("hours", e.target.value)}
            placeholder="Ex: Lun-Ven 19h-02h"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Consommation minimum</label>
          <input
            type="text"
            value={form.minSpend}
            onChange={(e) => updateForm("minSpend", e.target.value)}
            placeholder="Ex: Table Standard: 500 MAD"
            className={inputCls}
          />
        </div>
      </div>

      {saveButton()}
    </div>
  );

  /* ---- Notifications tab ---- */
  const notifItems: { key: keyof typeof notifs; label: string; desc: string }[] =
    [
      {
        key: "emailNotifs",
        label: "Notifications par e-mail",
        desc: "Recevez des résumés et alertes par e-mail.",
      },
      {
        key: "smsAlerts",
        label: "Alertes SMS",
        desc: "Recevez des alertes importantes par SMS.",
      },
      {
        key: "commissionAlerts",
        label: "Alertes commissions",
        desc: "Soyez notifié des nouvelles commissions.",
      },
      {
        key: "newRpNotifs",
        label: "Nouveaux RP",
        desc: "Notification lorsqu'un nouveau RP rejoint votre réseau.",
      },
      {
        key: "weeklyReport",
        label: "Rapport hebdomadaire",
        desc: "Recevez un résumé chaque semaine.",
      },
    ];

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className={`${glassCard} p-6 divide-y divide-white/[0.06]`}>
        {notifItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p className="text-sm text-white font-medium">{item.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
            </div>
            <Toggle
              enabled={notifs[item.key]}
              onToggle={() =>
                setNotifs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
              }
            />
          </div>
        ))}
      </div>

      {saveButton()}
    </div>
  );

  /* ---- Securite tab ---- */
  const renderSecurite = () => (
    <div className="space-y-6">
      {/* Password */}
      <div className={`${glassCard} p-6 space-y-5`}>
        <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
          Changer le mot de passe
        </h3>
        <div>
          <label className={labelCls}>Mot de passe actuel</label>
          <div className="relative">
            <input
              type={showCurrentPw ? "text" : "password"}
              value={security.currentPw}
              onChange={(e) =>
                setSecurity((s) => ({ ...s, currentPw: e.target.value }))
              }
              placeholder="••••••••"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
            >
              {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={security.newPw}
                onChange={(e) =>
                  setSecurity((s) => ({ ...s, newPw: e.target.value }))
                }
                placeholder="••••••••"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Confirmer</label>
            <input
              type="password"
              value={security.confirmPw}
              onChange={(e) =>
                setSecurity((s) => ({ ...s, confirmPw: e.target.value }))
              }
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
        </div>
        {saveButton(handlePasswordSave)}
      </div>

      {/* 2FA */}
      <div className={`${glassCard} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-medium">
              Authentification à deux facteurs
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              Ajoutez une couche de sécurité supplémentaire.
            </p>
          </div>
          <Toggle enabled={twoFA} onToggle={() => setTwoFA(!twoFA)} />
        </div>
      </div>

      {/* Sessions */}
      <div className={`${glassCard} p-6 space-y-4`}>
        <h3 className="text-sm font-semibold text-white font-[family-name:var(--font-manrope)]">
          Sessions actives
        </h3>
        {sessions.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center">
                  <Icon size={16} className="text-white/40" />
                </div>
                <div>
                  <p className="text-sm text-white">{s.device}</p>
                  <p className="text-xs text-white/30">{s.location}</p>
                </div>
              </div>
              {s.isCurrent ? (
                <span className="text-[0.625rem] text-green-400 uppercase tracking-wider">
                  Session actuelle
                </span>
              ) : (
                <button
                  onClick={() => showToast("Session révoquée")}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Révoquer
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ---- Tab router ---- */
  const renderTab = () => {
    switch (activeTab) {
      case "profil":
        return renderProfil();
      case "etablissement":
        return renderEtablissement();
      case "notifications":
        return renderNotifications();
      case "securite":
        return renderSecurite();
      default:
        return null;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="lg:w-56 flex-shrink-0">
          <nav
            className={`${glassCard} p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible`}
          >
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-[family-name:var(--font-manrope)] transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white/[0.1] text-blue-400 font-bold"
                      : "text-white/40 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold font-[family-name:var(--font-manrope)] text-white">
              {header.title}
            </h1>
            <p className="text-sm text-white/40 mt-1">{header.subtitle}</p>
          </div>

          {/* Active tab content */}
          {renderTab()}
        </div>
      </div>

      {/* ---- Delete confirmation modal ---- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`${glassCard} p-6 w-full max-w-sm mx-4 text-center relative`}
          >
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-400/20 flex items-center justify-center mx-auto mb-4">
              <Shield size={20} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
              Supprimer le compte ?
            </h2>
            <p className="text-sm text-white/40 mb-6">
              Cette action est irréversible. Toutes vos données seront
              définitivement supprimées.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-white/[0.07] border border-white/[0.12] text-white rounded-xl text-sm font-medium hover:bg-white/[0.1] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  showToast("Demande de suppression envoyée");
                }}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Toast ---- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl">
          <Check size={16} strokeWidth={2} className="text-blue-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
