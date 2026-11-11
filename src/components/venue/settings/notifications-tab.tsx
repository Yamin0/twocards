"use client";

import { Smartphone } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Card, InfoNote, Switch } from "@/components/app/ui";
import type { NotifPrefs, VenueSettings } from "./use-venue-settings";

/* Préférences de notification : un interrupteur par notification push que
   twocards envoie réellement sur le téléphone de l'établissement. La cloche
   de l'espace reçoit toujours tout ; seul le push est coupé. Aucun e-mail ni
   SMS n'est envoyé aux établissements : aucun réglage ne le laisse croire.

   Le respect de ces réglages par la base vient de la migration
   20261112140000_preferences_de_notification.sql, appliquée en production. */
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
      key: "pushReservations",
      label: t("Nouvelle réservation", "New reservation"),
      desc: t(
        "Une demande arrive par le QR d'un hôtel, d'un concierge ou par votre portail.",
        "A request comes in through a hotel's or concierge's QR code, or through your portal."
      ),
    },
    {
      key: "pushRatings",
      label: t("Nouvel avis client", "New guest review"),
      desc: t("Un client note sa sortie.", "A guest rates their outing."),
    },
    {
      key: "pushPos",
      label: t("Ticket de caisse non rapproché", "Unmatched till ticket"),
      desc: t(
        "Un ticket reçu de votre caisse ne correspond à aucune réservation.",
        "A ticket received from your till matches no reservation."
      ),
    },
    {
      key: "pushMessages",
      label: t("Nouveau message", "New message"),
      desc: t("Un message arrive dans votre messagerie.", "A message arrives in your inbox."),
    },
  ];

  return (
    <div className="space-y-4">
      <InfoNote icon={Smartphone}>
        {t(
          "Ces réglages concernent les notifications sur votre téléphone (application twocards). Dans votre espace, la cloche affiche toujours tout.",
          "These settings apply to notifications on your phone (twocards app). In your workspace, the bell always shows everything."
        )}
      </InfoNote>

      <Card title={t("Notifications sur le téléphone", "Phone notifications")}>
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
