"use client";

import { useState } from "react";
import { Bell, Building2, Lock, User, type LucideIcon } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useT } from "@/lib/i18n/client";
import {
  ErrorState,
  PageHeader,
  PageSkeleton,
  Segmented,
  cardClass,
  useNotify,
} from "@/components/app/ui";
import { NotificationsTab } from "@/components/venue/settings/notifications-tab";
import { ProfileTab } from "@/components/venue/settings/profile-tab";
import { SecurityTab } from "@/components/venue/settings/security-tab";
import type { SettingsTab } from "@/components/venue/settings/settings-lib";
import { useVenueSettings } from "@/components/venue/settings/use-venue-settings";
import { VenueTab } from "@/components/venue/settings/venue-tab";

function TabLabel({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <>
      <Icon size={15} strokeWidth={1.75} aria-hidden />
      {children}
    </>
  );
}

export default function SettingsPage() {
  const t = useT();
  const notify = useNotify();
  const { isLoading: authLoading } = useAuthUser();
  const settings = useVenueSettings();
  const [tab, setTab] = useState<SettingsTab>("profil");

  const tabs: { value: SettingsTab; label: React.ReactNode; subtitle: string }[] = [
    {
      value: "profil",
      label: <TabLabel icon={User}>{t("Profil", "Profile")}</TabLabel>,
      subtitle: t("Vos informations personnelles.", "Your personal details."),
    },
    {
      value: "etablissement",
      label: <TabLabel icon={Building2}>{t("Établissement", "Venue")}</TabLabel>,
      subtitle: t("Les détails de votre établissement.", "Your venue details."),
    },
    {
      value: "notifications",
      label: <TabLabel icon={Bell}>{t("Notifications", "Notifications")}</TabLabel>,
      subtitle: t("Les alertes que vous souhaitez recevoir.", "The alerts you want to receive."),
    },
    {
      value: "securite",
      label: <TabLabel icon={Lock}>{t("Sécurité", "Security")}</TabLabel>,
      subtitle: t("Votre mot de passe et la protection du compte.", "Your password and account protection."),
    },
  ];

  if (authLoading || settings.isLoading) return <PageSkeleton kpis={0} rows={5} />;

  const saveFailed = (message: string) =>
    notify(t(`Échec de l'enregistrement : ${message}`, `Could not save: ${message}`), "error");

  /* Profil et établissement partagent le même enregistrement. */
  const handleSave = async () => {
    /* Le lien d'avis Google est rendu tel quel sur une page publique : on
       n'accepte qu'une adresse https, jamais javascript: ou autre schéma. */
    const googleReviewUrl = settings.form.googleReviewUrl.trim();
    if (googleReviewUrl && !/^https:\/\/\S+$/i.test(googleReviewUrl)) {
      notify(
        t(
          "Le lien d'avis Google doit commencer par https://",
          "The Google review link must start with https://"
        ),
        "error"
      );
      return;
    }
    const failure = await settings.saveProfile();
    if (failure) saveFailed(failure);
    else notify(t("Modifications enregistrées", "Changes saved"));
  };

  const handleNotifsSave = async () => {
    const failure = await settings.saveNotifs();
    if (failure) saveFailed(failure);
    else notify(t("Préférences enregistrées", "Preferences saved"));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t("Paramètres", "Settings")}
        description={tabs.find((x) => x.value === tab)?.subtitle}
      />

      {settings.error ? (
        <div className={cardClass}>
          <ErrorState
            title={t("Vos réglages n'ont pas pu être chargés", "Your settings couldn't be loaded")}
            onRetry={settings.reload}
          />
        </div>
      ) : (
        <>
          <Segmented
            label={t("Rubriques des paramètres", "Settings sections")}
            options={tabs}
            value={tab}
            onChange={setTab}
          />
          {tab === "profil" && <ProfileTab settings={settings} onSave={handleSave} />}
          {tab === "etablissement" && <VenueTab settings={settings} onSave={handleSave} />}
          {tab === "notifications" && (
            <NotificationsTab settings={settings} onSave={handleNotifsSave} />
          )}
          {tab === "securite" && <SecurityTab settings={settings} />}
        </>
      )}
    </div>
  );
}
