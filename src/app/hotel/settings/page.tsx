"use client";

import { Suspense } from "react";
import { PageHeader, PageSkeleton, Segmented } from "@/components/app/ui";
import { AccountTab } from "@/components/hotel/settings/account-tab";
import { HotelTab } from "@/components/hotel/settings/hotel-tab";
import { MenuTab } from "@/components/hotel/settings/menu-tab";
import { useSettingsForm, type SettingsTab } from "@/lib/hotel/use-settings-form";
import { useT } from "@/lib/i18n/client";

export default function HotelSettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={0} rows={5} />}>
      <SettingsContent />
    </Suspense>
  );
}

/* Paramètres : l'hôtel (nom, ville), le menu client (photos, couleurs,
   textes) et le compte. ?onglet=hotel|menu|compte ouvre l'onglet voulu. */
function SettingsContent() {
  const t = useT();
  const form = useSettingsForm();

  if (form.isLoading) return <PageSkeleton kpis={0} rows={5} />;

  return (
    <>
      <PageHeader
        title={t("Paramètres", "Settings")}
        description={t(
          "Ce que voient vos clients quand ils scannent, et ce que voit twocards de votre établissement.",
          "What your guests see when they scan, and what twocards sees of your property."
        )}
      />

      <Segmented<SettingsTab>
        label={t("Rubrique des paramètres", "Settings section")}
        value={form.tab}
        onChange={form.setTab}
        className="self-start"
        options={[
          { value: "hotel", label: t("Hôtel", "Hotel") },
          { value: "menu", label: t("Menu client", "Guest menu") },
          { value: "compte", label: t("Compte", "Account") },
        ]}
      />

      {form.tab === "hotel" && <HotelTab form={form} />}
      {form.tab === "menu" && <MenuTab form={form} />}
      {form.tab === "compte" && <AccountTab form={form} />}
    </>
  );
}
