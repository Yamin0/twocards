"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coins, Info, Link2, Plus, Printer, QrCode, ScanLine } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  InfoNote,
  KpiGrid,
  LinkButton,
  PageHeader,
  PageSkeleton,
} from "@/components/app/ui";
import { LinkCard } from "@/components/concierge/link-card";
import { LinkNameDialog } from "@/components/concierge/link-name-dialog";
import { ConciergeLoadError } from "@/components/concierge/states";
import { loadFailed } from "@/components/hotel/states";
import type { ConciergeLink } from "@/lib/concierge/space";
import { useConciergeLinks } from "@/lib/concierge/use-links";
import { formatMad, formatNumber, formatPercent, plural } from "@/lib/hotel/format";
import { useLocale, useT } from "@/lib/i18n/client";

export default function ConciergeLinksPage() {
  /* useSearchParams exige une frontière Suspense au prérendu. */
  return (
    <Suspense fallback={<PageSkeleton kpis={4} rows={4} />}>
      <LinksContent />
    </Suspense>
  );
}

type Dialog = { mode: "create" } | { mode: "rename"; link: ConciergeLink } | null;

/* Liens & QR : un lien par canal (Instagram, WhatsApp, carte de visite…),
   chacun avec son QR et ce qu'il produit. Créer, renommer, activer,
   supprimer : chaque écriture part d'un clic. `?nouveau=1` (bouton
   « Nouveau lien » du menu) ouvre la création. */
function LinksContent() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const links = useConciergeLinks();
  const { qrCodes, reservations, rows, isLoading, failed, reload } = links;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toDelete, setToDelete] = useState<ConciergeLink | null>(null);

  /* ?nouveau=1 : on ouvre la création — ajustement d'état pendant le
     rendu — puis on nettoie l'URL pour que Retour ne la rouvre pas. */
  const wantsNew = params.get("nouveau") === "1";
  const [seenNew, setSeenNew] = useState(false);
  if (wantsNew !== seenNew) {
    setSeenNew(wantsNew);
    if (wantsNew) setDialog({ mode: "create" });
  }
  useEffect(() => {
    if (wantsNew) router.replace("/concierge/liens");
  }, [wantsNew, router]);

  if (isLoading) return <PageSkeleton kpis={4} rows={4} />;

  const newButton = (
    <Button variant="primary" icon={Plus} onClick={() => setDialog({ mode: "create" })}>
      {t("Nouveau lien", "New link")}
    </Button>
  );
  const header = (
    <PageHeader
      title={t("Liens & QR", "Links & QR")}
      description={t(
        "Un lien par canal où vous le partagez. Chaque réservation est rattachée à son lien : vous voyez lequel rapporte.",
        "One link per channel you share it on. Every reservation is tied to its link: you can see which one earns."
      )}
      actions={
        <>
          {qrCodes.length > 0 && (
            <LinkButton href="/concierge/liens/imprimer" icon={Printer}>
              {t("Imprimer les QR", "Print QR codes")}
            </LinkButton>
          )}
          {newButton}
        </>
      }
    />
  );

  /* Un lien qui a des réservations n'est pas supprimé mais désactivé (voir
     le store) : la confirmation le dit. */
  const doomed = toDelete ? reservations.filter((r) => r.qr_code_id === toDelete.id).length : 0;

  const overlays = (
    <>
      {dialog && (
        <LinkNameDialog
          key={dialog.mode === "rename" ? dialog.link.id : "nouveau"}
          mode={dialog.mode}
          initial={dialog.mode === "rename" ? dialog.link.label : ""}
          existing={qrCodes
            .filter((q) => dialog.mode !== "rename" || q.id !== dialog.link.id)
            .map((q) => q.label)}
          onClose={() => setDialog(null)}
          onSubmit={(label) =>
            dialog.mode === "rename" ? links.renameLink(dialog.link, label) : links.createLink(label)
          }
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await links.deleteLink(toDelete);
          setToDelete(null);
        }}
        loading={links.busy}
        danger
        confirmLabel={doomed > 0 ? t("Désactiver", "Deactivate") : t("Supprimer", "Delete")}
        title={toDelete ? t(`Supprimer « ${toDelete.label} » ?`, `Delete “${toDelete.label}”?`) : ""}
        description={
          t(
            "Le lien et son QR ne fonctionneront plus, même déjà partagés ou imprimés.",
            "The link and its QR code will stop working, even where already shared or printed."
          ) +
          " " +
          (doomed > 0
            ? t(
                `Il a ${doomed} ${plural(doomed, "réservation", "réservations")} : il sera désactivé, pas supprimé, pour garder leur historique et leurs commissions.`,
                `It has ${doomed} ${plural(doomed, "reservation", undefined, "en")}: it will be deactivated, not deleted, to keep their history and commissions.`
              )
            : t("Cette suppression est irréversible.", "This can't be undone."))
        }
      />
    </>
  );

  if (loadFailed(failed, qrCodes, reservations))
    return (
      <>
        {header}
        <ConciergeLoadError onRetry={reload} />
        {overlays}
      </>
    );

  const active = qrCodes.filter((q) => q.active).length;
  const scans = qrCodes.reduce((s, q) => s + q.scans, 0);
  const booked = rows.reduce((s, q) => s + q.liveReservations, 0);
  const commission = rows.reduce((s, q) => s + q.commission, 0);

  return (
    <>
      {header}

      {qrCodes.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Link2}
            title={t("Aucun lien pour le moment", "No links yet")}
            description={t(
              "Créez un premier lien, puis un par canal (Instagram, WhatsApp, carte de visite…) pour savoir d'où viennent vos réservations.",
              "Create a first link, then one per channel (Instagram, WhatsApp, business card…) to see where your reservations come from."
            )}
            action={newButton}
          />
        </Card>
      ) : (
        <>
          <KpiGrid
            items={[
              {
                label: t("Liens", "Links"),
                value: formatNumber(qrCodes.length, locale),
                hint: t(`${active} ${plural(active, "actif")}`, `${active} active`),
                icon: Link2,
                tone: "sky",
              },
              {
                label: t("Ouvertures", "Opens"),
                value: formatNumber(scans, locale),
                hint: t("liens ouverts et QR scannés", "links opened and QR codes scanned"),
                icon: ScanLine,
                tone: "violet",
              },
              {
                label: t("Réservations", "Reservations"),
                value: formatNumber(booked, locale),
                hint:
                  scans > 0
                    ? t(
                        `${formatPercent(booked / scans, 1, locale)} de conversion`,
                        `${formatPercent(booked / scans, 1, locale)} conversion`
                      )
                    : t("aucune ouverture pour l'instant", "no opens yet"),
                icon: QrCode,
                tone: "amber",
              },
              {
                label: t("Commissions", "Commissions"),
                value: formatMad(commission, true, locale),
                hint: t("acquises, tous liens", "earned, all links"),
                icon: Coins,
                tone: "emerald",
              },
            ]}
          />

          <div className="grid gap-4 2xl:grid-cols-2">
            {rows.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                url={links.linkOf(link)}
                displayName={links.displayName}
                onRename={() => setDialog({ mode: "rename", link })}
                onToggle={() => links.toggleLink(link)}
                onDelete={() => setToDelete(link)}
              />
            ))}
          </div>

          <InfoNote icon={Info}>
            {t(
              "Renommer un lien ne change ni son adresse ni son QR. Le désactiver le met en pause : il n'ouvre plus le menu, son historique reste. Un lien qui a déjà des réservations ne se supprime pas : il se désactive, pour garder leur historique.",
              "Renaming a link changes neither its address nor its QR code. Deactivating pauses it: it no longer opens the menu, and its history stays. A link that already has reservations can't be deleted: it is deactivated, to keep their history."
            )}
          </InfoNote>
        </>
      )}

      {overlays}
    </>
  );
}
