"use client";

import { Info } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, InfoNote, Switch } from "@/components/app/ui";
import type { NotifPrefs, VenueSettings } from "./use-venue-settings";

/* Préférences de notification. Elles sont bien enregistrées sur le compte
   (métadonnée notif_prefs) mais aucun envoi ne les lit encore : la note en
   tête le dit sans détour. Les notifications affichées dans l'espace, elles,
   arrivent toujours. */
export function NotificationsTab({
  settings,
  onSave,
}: {
  settings: VenueSettings;
  onSave: () => void;
}) {
  const t = useT();
  const { notifs, toggleNotif, saving } = settings;

  const items: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    {
      key: "emailNotifs",
      label: t("Notifications par e-mail", "Email notifications"),
      desc: t("Résumés et alertes par e-mail.", "Summaries and alerts by email."),
    },
    {
      key: "smsAlerts",
      label: t("Alertes SMS", "SMS alerts"),
      desc: t("Alertes importantes par SMS.", "Important alerts by text message."),
    },
    {
      key: "commissionAlerts",
      label: t("Alertes commissions", "Commission alerts"),
      desc: t("À chaque nouvelle commission.", "For every new commission."),
    },
    {
      key: "newRpNotifs",
      label: t("Nouveaux RP", "New PRs"),
      desc: t("Quand un nouveau RP rejoint votre réseau.", "When a new PR joins your network."),
    },
    {
      key: "weeklyReport",
      label: t("Rapport hebdomadaire", "Weekly report"),
      desc: t("Un résumé chaque semaine.", "A summary every week."),
    },
  ];

  return (
    <div className="space-y-4">
      <InfoNote icon={Info} tone="amber">
        {t(
          "Ces réglages sont enregistrés sur votre compte, mais ils ne déclenchent encore aucun envoi : ni e-mail, ni SMS, ni rapport. Les notifications de votre espace (nouvelle réservation, avis, caisse) arrivent dans tous les cas.",
          "These settings are saved to your account, but they don't trigger anything yet: no email, no text message, no report. Notifications inside your workspace (new reservation, review, POS) always arrive."
        )}
      </InfoNote>

      <Card title={t("Vos préférences", "Your preferences")}>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{item.label}</p>
                <p className="mt-0.5 text-[13px] text-ink-3">{item.desc}</p>
              </div>
              <Switch
                checked={notifs[item.key]}
                onChange={(next) => toggleNotif(item.key, next)}
                label={item.label}
              />
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={onSave} loading={saving}>
            {saving ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
