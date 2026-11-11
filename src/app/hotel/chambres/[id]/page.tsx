"use client";

import { use, useState } from "react";
import { ArrowLeft, CalendarDays, Coins, Pencil, Power, Printer, QrCode, ScanLine, Trash2, TrendingUp } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  KpiGrid,
  LinkButton,
  Modal,
  PageHeader,
  PageSkeleton,
  StatusPill,
  inputClass,
  statusLabel,
} from "@/components/app/ui";
import { QrFiltersCard } from "@/components/hotel/qr/qr-filters-card";
import { QrLinkCard } from "@/components/hotel/qr/qr-link-card";
import { QrMenuCard } from "@/components/hotel/qr/qr-menu-card";
import { QrReservationsTable } from "@/components/hotel/qr/qr-reservations-table";
import { HotelLoadError, loadFailed } from "@/components/hotel/states";
import { formatMad, formatNumber, formatPercent, plural, timeAgo } from "@/lib/hotel/format";
import { useQrDetail } from "@/lib/hotel/use-qr-detail";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

export default function HotelQrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const d = useQrDetail(id);
  const { qr } = d;

  /* null = fenêtre fermée ; sinon le nom en cours de saisie. */
  const [renameTo, setRenameTo] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (d.isLoading) return <PageSkeleton kpis={4} rows={6} />;

  if (!qr) {
    if (loadFailed(d.failed, d.qrCodes)) return <HotelLoadError onRetry={d.reload} />;
    return (
      <Card padded={false}>
        <EmptyState
          icon={QrCode}
          title={t("QR code introuvable", "QR code not found")}
          description={t(
            "Ce QR code n'existe pas ou ne vous appartient pas.",
            "This QR code doesn't exist or doesn't belong to you."
          )}
          action={
            <LinkButton href="/hotel/chambres" icon={ArrowLeft}>
              {t("Retour aux chambres", "Back to rooms")}
            </LinkButton>
          }
        />
      </Card>
    );
  }

  const lost = d.mine.length - d.live.length;
  const submitRename = async () => {
    if (renameTo === null) return;
    setRenaming(true);
    const ok = await d.rename(renameTo);
    setRenaming(false);
    if (ok) setRenameTo(null);
  };

  return (
    <>
      <PageHeader
        back={{ href: "/hotel/chambres", label: t("Chambres & QR codes", "Rooms & QR codes") }}
        title={qr.label}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="num">
              {t("Code", "Code")} {qr.code}
            </span>
            <StatusPill status={qr.active ? "actif" : "inactif"} />
            <span>
              {t(`Créé ${timeAgo(qr.created_at)}.`, `Created ${timeAgo(qr.created_at, undefined, "en")}.`)}
            </span>
          </span>
        }
        actions={
          <>
            <Button icon={Pencil} onClick={() => setRenameTo(qr.label)}>
              {t("Renommer", "Rename")}
            </Button>
            <Button icon={Power} onClick={d.toggleActive}>
              {qr.active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")}
            </Button>
            <LinkButton href={`/hotel/chambres/imprimer?ids=${qr.id}`} icon={Printer}>
              {t("Imprimer", "Print")}
            </LinkButton>
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>
              {t("Supprimer", "Delete")}
            </Button>
          </>
        }
      />

      <KpiGrid
        items={[
          {
            label: t("Commissions", "Commissions"),
            value: formatMad(d.commission, true, locale),
            icon: Coins,
            tone: "emerald",
            hint:
              d.spent > 0
                ? t(`sur ${formatMad(d.spent, true)} dépensés`, `on ${formatMad(d.spent, true, "en")} spent`)
                : t("aucun montant saisi", "no amount entered yet"),
          },
          {
            label: t("Réservations", "Reservations"),
            value: formatNumber(d.live.length, locale),
            icon: CalendarDays,
            tone: "sky",
            hint:
              lost > 0
                ? t(
                    `${lost} ${plural(lost, "annulée", "annulées")} ou ${statusLabel("no-show", "fr").toLowerCase()}`,
                    `${lost} cancelled or ${statusLabel("no-show", "en").toLowerCase()}`
                  )
                : t("aucune annulation", "no cancellations"),
          },
          {
            label: t("Scans", "Scans"),
            value: formatNumber(qr.scans, locale),
            icon: ScanLine,
            tone: "violet",
            hint:
              qr.scans > 0
                ? t(
                    `${formatPercent(d.conversion, 1, locale)} deviennent une réservation`,
                    `${formatPercent(d.conversion, 1, locale)} become a reservation`
                  )
                : t("en attente du premier scan", "awaiting the first scan"),
          },
          {
            label: t("Satisfaction", "Satisfaction"),
            value:
              d.rating.average !== null
                ? `${d.rating.average.toLocaleString(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5`
                : "—",
            icon: TrendingUp,
            tone: "amber",
            hint:
              d.rating.count > 0
                ? t(
                    `${d.rating.count} ${plural(d.rating.count, "avis")}`,
                    `${d.rating.count} ${plural(d.rating.count, "review", undefined, "en")}`
                  )
                : t("aucun avis", "no reviews"),
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <QrLinkCard qr={qr} link={d.link} hotelName={d.hotelName} className="xl:col-span-2" />
        <QrFiltersCard qr={qr} d={d} className="xl:col-span-3" />
      </div>

      <QrMenuCard d={d} />

      <QrReservationsTable rows={d.mine} qrLabel={qr.label} />

      <Modal
        open={renameTo !== null}
        onClose={() => setRenameTo(null)}
        size="sm"
        title={t("Renommer l'emplacement", "Rename the location")}
        description={t(
          "Le QR imprimé reste valable : seul le nom affiché change.",
          "The printed QR still works: only the displayed name changes."
        )}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameTo(null)}>
              {t("Annuler", "Cancel")}
            </Button>
            <Button variant="primary" onClick={submitRename} loading={renaming} disabled={!renameTo?.trim()}>
              {t("Enregistrer", "Save")}
            </Button>
          </>
        }
      >
        <Field label={t("Nom de l'emplacement", "Location name")} htmlFor="qr-rename">
          <input
            id="qr-rename"
            data-autofocus
            value={renameTo ?? ""}
            onChange={(e) => setRenameTo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            maxLength={60}
            className={inputClass}
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!(await d.removeQr())) setDeleteOpen(false);
        }}
        loading={d.busy}
        danger
        confirmLabel={t("Supprimer", "Delete")}
        title={t(`Supprimer « ${qr.label} » ?`, `Delete “${qr.label}”?`)}
        description={t(
          "Le QR imprimé ne fonctionnera plus. S'il a déjà des réservations, il est désactivé au lieu d'être supprimé : leur historique et leurs commissions sont conservés.",
          "The printed QR will stop working. If it already has reservations, it is deactivated instead of deleted: their history and commissions are kept."
        )}
      />
    </>
  );
}
