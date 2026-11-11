"use client";

import { useMemo, useState } from "react";
import { useNotify } from "@/components/app/ui";
import { qrPerformance } from "@/lib/hotel/analytics";
import { useConciergeSpace, type ConciergeLink } from "@/lib/concierge/space";
import { useT } from "@/lib/i18n/client";

/* Les liens du concierge et leurs gestes : créer, renommer, activer,
   supprimer. Les écritures sont celles du store (table hotel_qr_codes),
   toujours déclenchées par un clic ; chaque geste rend compte par un toast,
   y compris quand il échoue. */
export function useConciergeLinks() {
  const t = useT();
  const notify = useNotify();
  const space = useConciergeSpace();
  const { qrCodes, reservations, create, update, remove } = space;
  const [busy, setBusy] = useState(false);

  /* Scans, réservations, montant et commission de chaque lien. */
  const rows = useMemo(() => qrPerformance(qrCodes, reservations), [qrCodes, reservations]);

  const createLink = async (label: string) => {
    const row = await create(label);
    if (!row) {
      notify(t("Le lien n'a pas pu être créé. Réessayez.", "The link couldn't be created. Try again."), "error");
      return false;
    }
    notify(t(`Lien « ${row.label} » créé`, `Link “${row.label}” created`));
    return true;
  };

  const renameLink = async (link: ConciergeLink, label: string) => {
    const next = label.trim();
    if (!next || next === link.label) return true;
    const ok = await update(link.id, { label: next });
    if (!ok) {
      notify(t("Le nom n'a pas pu être enregistré.", "The name couldn't be saved."), "error");
      return false;
    }
    notify(t(`Lien renommé « ${next} »`, `Link renamed “${next}”`));
    return true;
  };

  const toggleLink = async (link: ConciergeLink) => {
    const ok = await update(link.id, { active: !link.active });
    if (!ok) return notify(t("Échec de la mise à jour", "Update failed"), "error");
    notify(
      link.active
        ? t(`« ${link.label} » désactivé : le lien n'ouvre plus le menu`, `“${link.label}” deactivated: the link no longer opens the menu`)
        : t(`« ${link.label} » activé`, `“${link.label}” activated`)
    );
  };

  const deleteLink = async (link: ConciergeLink) => {
    setBusy(true);
    const ok = await remove([link.id]);
    setBusy(false);
    if (!ok) {
      notify(t("Échec de la suppression", "Delete failed"), "error");
      return false;
    }
    notify(
      ok.kept > 0
        ? t(
            `« ${link.label} » a des réservations : il est désactivé, pas supprimé, pour garder leur historique.`,
            `“${link.label}” has reservations: it was deactivated, not deleted, to keep their history.`
          )
        : t(`Lien « ${link.label} » supprimé`, `Link “${link.label}” deleted`)
    );
    return true;
  };

  return { ...space, rows, busy, createLink, renameLink, toggleLink, deleteLink };
}
