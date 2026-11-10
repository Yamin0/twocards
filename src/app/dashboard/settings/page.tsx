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
  AlertCircle,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { createClient } from "@/lib/supabase/client";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  Nav items                                                          */
/* ------------------------------------------------------------------ */
const getSettingsNav = (t: Translate) => [
  { label: t("Profil", "Profile"), icon: User, id: "profil" },
  { label: t("Établissement", "Venue"), icon: Building2, id: "etablissement" },
  { label: t("Notifications", "Notifications"), icon: Bell, id: "notifications" },
  { label: t("Sécurité", "Security"), icon: Lock, id: "securite" },
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
const managedNoteCls = "text-[0.6875rem] text-white/25 mt-1.5";
const getManagedNote = (t: Translate) =>
  t(
    "Géré par twocards, contactez le support pour le modifier.",
    "Managed by twocards. Contact support to change it."
  );
const getVenueTypeLabels = (t: Translate): Record<string, string> => ({
  restaurant: "Restaurant",
  bar: "Bar",
  club: "Club",
  "restaurant-bar": t("Restaurant-Bar", "Restaurant & bar"),
  lounge: "Lounge",
  rooftop: "Rooftop",
  "beach-club": "Beach club",
  "hotel-riad": t("Hôtel / Riad", "Hotel / Riad"),
  activite: t("Activité", "Activity"),
  service: "Service",
});

const getDeleteMailto = (t: Translate) =>
  `mailto:support@twocards.io?subject=${encodeURIComponent(
    t("Suppression de compte", "Account deletion")
  )}&body=${encodeURIComponent(
    t(
      "Bonjour,\n\nJe souhaite supprimer mon compte twocards ainsi que les données associées.\n\nMerci.",
      "Hello,\n\nI would like to delete my twocards account and the associated data.\n\nThank you."
    )
  )}`;

/* ------------------------------------------------------------------ */
/*  Toggle component                                                   */
/* ------------------------------------------------------------------ */
function Toggle({
  enabled,
  onToggle,
  disabled = false,
}: {
  enabled: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? "bg-blue-500" : "bg-white/10"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
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
type ToastState = { message: string; type: "success" | "error" };

export default function SettingsPage() {
  const { isLoading } = useAuthUser();
  const t = useT();
  const settingsNav = getSettingsNav(t);
  const MANAGED_NOTE = getManagedNote(t);
  const VENUE_TYPE_LABELS = getVenueTypeLabels(t);
  const DELETE_MAILTO = getDeleteMailto(t);

  const [activeTab, setActiveTab] = useState("profil");
  const [saving, setSaving] = useState(false);

  /* Toast : le minuteur vit dans un effet et non dans une ref — une ref lue
     par showToast serait tracée comme accès pendant le rendu. Reprogrammé à
     chaque nouveau message, nettoyé au démontage. */
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
    },
    []
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      toast.type === "error" ? 5000 : 3000
    );
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---- Profile form ---- */
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    venueName: "",
    venueType: "",
    capacity: "",
    address: "",
    description: "",
    hours: "",
    minSpend: "",
    googleReviewUrl: "",
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
  const [security, setSecurity] = useState({ newPw: "", confirmPw: "" });
  const [showNewPw, setShowNewPw] = useState(false);

  /* ---- Init form from Supabase user metadata ----
     Le hook useAuthUser n'expose qu'un sous-ensemble des metadata : on relit
     l'utilisateur complet pour pré-remplir tous les champs persistés. */
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      const str = (key: string) =>
        typeof meta[key] === "string" ? (meta[key] as string) : "";
      setForm({
        name: str("full_name"),
        email: data.user.email ?? "",
        phone: str("phone"),
        city: str("city"),
        venueName: str("venue_name"),
        venueType: str("venue_type"),
        capacity:
          meta.capacity !== undefined && meta.capacity !== null
            ? String(meta.capacity)
            : "",
        address: str("address"),
        description: str("description"),
        hours: str("hours"),
        minSpend: str("min_spend"),
        googleReviewUrl: str("google_review_url"),
      });
      const prefs = meta.notif_prefs;
      if (prefs && typeof prefs === "object") {
        setNotifs((prev) => ({
          ...prev,
          ...(prefs as Partial<typeof prev>),
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateForm = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ---- Persistance réelle : profil + établissement ---- */
  const handleSave = async () => {
    /* Le lien d'avis Google est rendu tel quel sur une page publique : on
       n'accepte qu'une adresse https, jamais javascript: ou autre schéma. */
    const googleReviewUrl = form.googleReviewUrl.trim();
    if (googleReviewUrl && !/^https:\/\/\S+$/i.test(googleReviewUrl)) {
      showToast(
        t(
          "Le lien d'avis Google doit commencer par https://",
          "The Google review link must start with https://"
        ),
        "error"
      );
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        capacity: form.capacity.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        hours: form.hours.trim(),
        min_spend: form.minSpend.trim(),
        google_review_url: googleReviewUrl,
      },
    });
    setSaving(false);
    if (error) {
      showToast(
        t(`Échec de l'enregistrement : ${error.message}`, `Could not save: ${error.message}`),
        "error"
      );
    } else {
      showToast(t("Modifications enregistrées avec succès", "Changes saved"));
    }
  };

  /* ---- Persistance réelle : préférences de notifications ---- */
  const handleNotifsSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { notif_prefs: notifs },
    });
    setSaving(false);
    if (error) {
      showToast(
        t(`Échec de l'enregistrement : ${error.message}`, `Could not save: ${error.message}`),
        "error"
      );
    } else {
      showToast(t("Préférences de notifications enregistrées", "Notification preferences saved"));
    }
  };

  /* ---- Changement de mot de passe réel via Supabase Auth ---- */
  const handlePasswordSave = async () => {
    if (security.newPw.length < 8) {
      showToast(
        t(
          "Le mot de passe doit contenir au moins 8 caractères",
          "Your password must be at least 8 characters"
        ),
        "error"
      );
      return;
    }
    if (security.newPw !== security.confirmPw) {
      showToast(t("Les mots de passe ne correspondent pas", "Passwords do not match"), "error");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: security.newPw,
    });
    setSaving(false);
    if (error) {
      showToast(
        t(
          `Échec du changement de mot de passe : ${error.message}`,
          `Could not change password: ${error.message}`
        ),
        "error"
      );
    } else {
      setSecurity({ newPw: "", confirmPw: "" });
      showToast(t("Mot de passe modifié avec succès", "Password updated"));
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  /* ---------------------------------------------------------------- */
  /*  Tab headers                                                      */
  /* ---------------------------------------------------------------- */
  const tabHeaders: Record<string, { title: string; subtitle: string }> = {
    profil: {
      title: t("Profil", "Profile"),
      subtitle: t("Gérez vos informations personnelles.", "Manage your personal details."),
    },
    etablissement: {
      title: t("Établissement", "Venue"),
      subtitle: t("Configurez les détails de votre établissement.", "Set up your venue details."),
    },
    notifications: {
      title: t("Notifications", "Notifications"),
      subtitle: t("Choisissez les alertes que vous souhaitez recevoir.", "Choose which alerts you receive."),
    },
    securite: {
      title: t("Sécurité", "Security"),
      subtitle: t("Protégez votre compte avec un mot de passe fort.", "Protect your account with a strong password."),
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
      {saving ? t("Enregistrement...", "Saving...") : t("Enregistrer", "Save")}
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
          <label className={labelCls}>{t("Nom complet", "Full name")}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            placeholder={t("Votre nom", "Your name")}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("E-mail", "Email")}</label>
          <input
            type="email"
            value={form.email}
            disabled
            className={`${inputCls} opacity-40 cursor-not-allowed`}
          />
          <p className={managedNoteCls}>{MANAGED_NOTE}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("Téléphone", "Phone")}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="+212 6 00 00 00 00"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t("Ville", "City")}</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateForm("city", e.target.value)}
              placeholder={t("Votre ville", "Your city")}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Langue de l'interface (visible aussi dans l'app mobile) */}
      <div className={`${glassCard} p-6 flex items-center justify-between gap-4`}>
        <div>
          <p className="text-sm text-white font-medium">Language / Langue</p>
          <p className="text-xs text-white/40 mt-0.5">
            {t(
              "Langue de votre espace twocards.",
              "The language of your twocards workspace."
            )}
          </p>
        </div>
        <LanguageSwitcher tone="dark" />
      </div>

      <div className="flex items-start justify-between gap-4">
        {saveButton()}
        <div className="text-right">
          <a
            href={DELETE_MAILTO}
            className="px-4 py-2.5 inline-block text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            {t("Supprimer le compte", "Delete account")}
          </a>
          <p className="text-[0.6875rem] text-white/25 max-w-[16rem]">
            {t(
              "La demande est envoyée à notre support et traitée sous 30 jours.",
              "Your request goes to our support team and is handled within 30 days."
            )}
          </p>
        </div>
      </div>
    </div>
  );

  /* ---- Etablissement tab ---- */
  const renderEtablissement = () => (
    <div className="space-y-6">
      <div className={`${glassCard} p-6 space-y-5`}>
        <div>
          <label className={labelCls}>{t(<>Nom de l&apos;établissement</>, <>Venue name</>)}</label>
          <input
            type="text"
            value={form.venueName}
            disabled
            className={`${inputCls} opacity-40 cursor-not-allowed`}
          />
          <p className={managedNoteCls}>{MANAGED_NOTE}</p>
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
            <p className={managedNoteCls}>{MANAGED_NOTE}</p>
          </div>
          <div>
            <label className={labelCls}>{t("Capacité", "Capacity")}</label>
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
          <label className={labelCls}>{t("Adresse", "Address")}</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateForm("address", e.target.value)}
            placeholder={t("Adresse complète", "Full address")}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("Description", "Description")}</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            placeholder={t("Décrivez votre établissement...", "Describe your venue...")}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls}>{t(<>Horaires d&apos;ouverture</>, <>Opening hours</>)}</label>
          <input
            type="text"
            value={form.hours}
            onChange={(e) => updateForm("hours", e.target.value)}
            placeholder={t("Ex: Lun-Ven 19h-02h", "e.g. Mon–Fri 7pm–2am")}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>{t("Consommation minimum", "Minimum spend")}</label>
          <input
            type="text"
            value={form.minSpend}
            onChange={(e) => updateForm("minSpend", e.target.value)}
            placeholder={t("Ex: Table Standard: 500 MAD", "e.g. Standard table: 500 MAD")}
            className={inputCls}
          />
        </div>

        {/* Lien « Demander des avis » de la fiche Google : proposé à chaque
            client après sa note, sur la page /avis/[id]. */}
        <div>
          <label className={labelCls}>{t(<>Lien d&apos;avis Google</>, <>Google review link</>)}</label>
          <input
            type="url"
            inputMode="url"
            value={form.googleReviewUrl}
            onChange={(e) => updateForm("googleReviewUrl", e.target.value)}
            placeholder="https://g.page/r/…/review"
            className={inputCls}
          />
          <p className={managedNoteCls}>
            {t(
              "Dans votre fiche Google Business Profile, « Demander des avis », puis copiez le lien. Après avoir noté sa soirée, chaque client est invité à laisser un avis Google.",
              "In your Google Business Profile, open “Ask for reviews” and copy the link. After rating their evening, each guest is invited to leave a Google review."
            )}
          </p>
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
        label: t("Notifications par e-mail", "Email notifications"),
        desc: t("Recevez des résumés et alertes par e-mail.", "Get summaries and alerts by email."),
      },
      {
        key: "smsAlerts",
        label: t("Alertes SMS", "SMS alerts"),
        desc: t("Recevez des alertes importantes par SMS.", "Get important alerts by text message."),
      },
      {
        key: "commissionAlerts",
        label: t("Alertes commissions", "Commission alerts"),
        desc: t("Soyez notifié des nouvelles commissions.", "Be notified of new commissions."),
      },
      {
        key: "newRpNotifs",
        label: t("Nouveaux RP", "New PRs"),
        desc: t(
          "Notification lorsqu'un nouveau RP rejoint votre réseau.",
          "Be notified when a new PR joins your network."
        ),
      },
      {
        key: "weeklyReport",
        label: t("Rapport hebdomadaire", "Weekly report"),
        desc: t("Recevez un résumé chaque semaine.", "Get a summary every week."),
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

      {saveButton(handleNotifsSave)}
    </div>
  );

  /* ---- Securite tab ---- */
  const renderSecurite = () => (
    <div className="space-y-6">
      {/* Password */}
      <div className={`${glassCard} p-6 space-y-5`}>
        <h3 className="text-sm font-semibold text-white">
          {t("Changer le mot de passe", "Change password")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{t("Nouveau mot de passe", "New password")}</label>
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
                aria-label={
                  showNewPw
                    ? t("Masquer le mot de passe", "Hide password")
                    : t("Afficher le mot de passe", "Show password")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>{t("Confirmer", "Confirm")}</label>
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
        <p className="text-xs text-white/40">
          {t(
            <>
              8 caractères minimum. Le changement s&apos;applique immédiatement à
              votre compte.
            </>,
            <>At least 8 characters. The change applies to your account immediately.</>
          )}
        </p>
        {saveButton(handlePasswordSave)}
      </div>

      {/* Sécurité avancée — pas encore de backend, on l'affiche honnêtement */}
      <div className={`${glassCard} p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield size={16} className="text-white/40" />
            <h3 className="text-sm font-semibold text-white">
              {t("Sécurité avancée", "Advanced security")}
            </h3>
          </div>
          <span className="text-[0.625rem] uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-400/20 px-2.5 py-1 rounded-full">
            {t("Bientôt disponible", "Coming soon")}
          </span>
        </div>
        <p className="text-xs text-white/40">
          {t(
            <>
              L&apos;authentification à deux facteurs et la gestion des sessions
              actives arrivent prochainement.
            </>,
            <>Two-factor authentication and active session management are coming soon.</>
          )}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] opacity-60">
          <div>
            <p className="text-sm text-white font-medium">
              {t("Authentification à deux facteurs", "Two-factor authentication")}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {t("Ajoutez une couche de sécurité supplémentaire.", "Add an extra layer of security.")}
            </p>
          </div>
          <Toggle enabled={false} disabled />
        </div>
      </div>

      {/* Delete account */}
      <div className={`${glassCard} p-6 flex items-start justify-between gap-4`}>
        <div>
          <p className="text-sm text-white font-medium">
            {t("Supprimer le compte", "Delete account")}
          </p>
          <p className="text-xs text-white/40 mt-0.5 max-w-md">
            {t(
              "Envoyez votre demande à notre support, la suppression est traitée sous 30 jours.",
              "Send your request to our support team. Deletion is handled within 30 days."
            )}
          </p>
        </div>
        <a
          href={DELETE_MAILTO}
          className="flex-shrink-0 px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          {t("Contacter le support", "Contact support")}
        </a>
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-ui transition-all whitespace-nowrap ${
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
            <h1 className="text-2xl font-extrabold text-white">
              {header.title}
            </h1>
            <p className="text-sm text-white/40 mt-1">{header.subtitle}</p>
          </div>

          {/* Active tab content */}
          {renderTab()}
        </div>
      </div>

      {/* ---- Toast ---- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl">
          {toast.type === "error" ? (
            <AlertCircle size={16} strokeWidth={2} className="text-red-400" />
          ) : (
            <Check size={16} strokeWidth={2} className="text-blue-400" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
