"use client";

import { Suspense } from "react";
import {
  BedDouble,
  CheckSquare,
  Coins,
  LayoutGrid,
  List,
  Plus,
  Power,
  Printer,
  QrCode,
  ScanLine,
  Square,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
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
  SearchInput,
  Segmented,
  Select,
} from "@/components/app/ui";
import { CreateQrDialog } from "@/components/hotel/qr/create-dialog";
import { QrCard } from "@/components/hotel/qr/qr-card";
import { QrTable } from "@/components/hotel/qr/qr-table";
import { HotelLoadError, loadFailed } from "@/components/hotel/states";
import { formatMad, formatNumber, formatPercent, isRoomLabel, plural } from "@/lib/hotel/format";
import { useQrList, type QrFilter, type QrSort, type QrView } from "@/lib/hotel/use-qr-list";
import { useLocale, useT } from "@/lib/i18n/client";

export default function HotelChambresPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={4} rows={8} />}>
      <ChambresContent />
    </Suspense>
  );
}

function ChambresContent() {
  const t = useT();
  const locale = useLocale();
  const list = useQrList();
  const { qrCodes, reservations, rows, filtered, selected, best } = list;

  if (list.isLoading) return <PageSkeleton kpis={4} rows={8} />;

  const header = (
    <PageHeader
      title={t("Chambres & QR codes", "Rooms & QR codes")}
      description={t(
        "Un QR code par chambre, suite ou espace commun. Chaque réservation est rattachée à son emplacement : vous voyez lequel rapporte.",
        "One QR code per room, suite or common area. Every reservation is linked to its location: you can see which one earns."
      )}
      actions={
        <>
          {qrCodes.length > 0 && (
            <LinkButton href={list.printHref} icon={Printer}>
              {t("Imprimer", "Print")}
              {selected.size > 0 ? ` (${selected.size})` : ""}
            </LinkButton>
          )}
          <Button variant="primary" icon={Plus} onClick={() => list.setCreateOpen(true)}>
            {t("Nouveau QR code", "New QR code")}
          </Button>
        </>
      }
    />
  );

  if (loadFailed(list.failed, qrCodes, reservations))
    return (
      <>
        {header}
        <HotelLoadError onRetry={list.reload} />
      </>
    );

  const activeCount = qrCodes.filter((q) => q.active).length;
  const totalScans = qrCodes.reduce((s, q) => s + q.scans, 0);
  const totalResas = rows.reduce((s, r) => s + r.liveReservations, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);
  const rooms = qrCodes.filter((q) => isRoomLabel(q.label)).length;
  const spaces = qrCodes.length - rooms;

  return (
    <>
      {header}

      {qrCodes.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={QrCode}
            title={t("Aucun QR code pour le moment", "No QR codes yet")}
            description={t(
              "Créez un QR code par chambre ou par zone de l'hôtel, puis imprimez les cartes : chaque scan ouvre votre menu de sorties.",
              "Create one QR code per room or area of the hotel, then print the cards: each scan opens your outings menu."
            )}
            action={
              <Button variant="primary" icon={Plus} onClick={() => list.setCreateOpen(true)}>
                {t("Créer mon premier QR code", "Create my first QR code")}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <KpiGrid
            items={[
              {
                label: t("QR codes", "QR codes"),
                value: formatNumber(qrCodes.length, locale),
                hint: t(
                  `${activeCount} ${plural(activeCount, "actif")} · ${rooms} ${plural(rooms, "chambre")}, ${spaces} ${plural(spaces, "espace")}`,
                  `${activeCount} active · ${rooms} ${plural(rooms, "room", undefined, "en")}, ${spaces} ${plural(spaces, "area", undefined, "en")}`
                ),
                icon: BedDouble,
                tone: "sky",
              },
              {
                label: t("Scans", "Scans"),
                value: formatNumber(totalScans, locale),
                hint: t("cumulés, tous emplacements", "total, all locations"),
                icon: ScanLine,
                tone: "violet",
              },
              {
                label: t("Réservations", "Reservations"),
                value: formatNumber(totalResas, locale),
                hint:
                  totalScans > 0
                    ? t(
                        `${formatPercent(totalResas / totalScans, 1, locale)} de conversion`,
                        `${formatPercent(totalResas / totalScans, 1, locale)} conversion`
                      )
                    : t("en attente de scans", "awaiting scans"),
                icon: QrCode,
                tone: "amber",
              },
              {
                label: t("Commissions", "Commissions"),
                value: formatMad(totalCommission, true, locale),
                hint: t("acquises, tous emplacements", "earned, all locations"),
                icon: Coins,
                tone: "emerald",
              },
            ]}
          />

          {best && (
            <InfoNote icon={Trophy}>
              {t(
                `« ${best.label} » rapporte le plus : ${formatMad(best.commission)} de commissions pour ${best.liveReservations} ${plural(best.liveReservations, "réservation")}.`,
                `“${best.label}” earns the most: ${formatMad(best.commission, false, "en")} in commissions from ${best.liveReservations} ${plural(best.liveReservations, "reservation", undefined, "en")}.`
              )}
            </InfoNote>
          )}

          {/* Filtres, recherche, tri, vue */}
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Segmented<QrFilter>
              label={t("Filtrer les emplacements", "Filter locations")}
              value={list.filter}
              onChange={list.setFilter}
              options={[
                { value: "tous", label: t("Tous", "All"), count: rows.length },
                { value: "chambres", label: t("Chambres", "Rooms"), count: rooms },
                { value: "espaces", label: t("Espaces communs", "Common areas"), count: spaces },
                { value: "actifs", label: t("Actifs", "Active"), count: activeCount },
                { value: "inactifs", label: t("Inactifs", "Inactive"), count: rows.length - activeCount },
              ]}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={list.search}
                onChange={list.setSearch}
                placeholder={t("Chambre, code…", "Room, code…")}
                className="w-full sm:w-52"
              />
              <Select<QrSort>
                label={t("Trier", "Sort")}
                value={list.sort}
                onChange={list.setSort}
                className="w-full sm:w-56"
                options={[
                  { value: "recent", label: t("Plus récents", "Newest") },
                  { value: "label", label: t("Nom (A → Z)", "Name (A → Z)") },
                  { value: "commission", label: t("Plus de commissions", "Highest commissions") },
                  { value: "montant", label: t("Plus gros montant dépensé", "Highest amount spent") },
                  { value: "resas", label: t("Plus de réservations", "Most reservations") },
                  { value: "scans", label: t("Plus scannés", "Most scanned") },
                  { value: "conversion", label: t("Meilleure conversion", "Best conversion") },
                ]}
              />
              <Segmented<QrView>
                label={t("Affichage", "View")}
                value={list.view}
                onChange={list.setView}
                className="self-start"
                options={[
                  {
                    value: "grille",
                    label: (
                      <>
                        <LayoutGrid size={15} strokeWidth={1.75} aria-hidden />
                        {t("Cartes", "Cards")}
                      </>
                    ),
                  },
                  {
                    value: "liste",
                    label: (
                      <>
                        <List size={15} strokeWidth={1.75} aria-hidden />
                        {t("Tableau", "Table")}
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {/* Sélection multiple */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={list.allSelected ? CheckSquare : Square}
              onClick={list.selectAll}
              aria-pressed={list.allSelected}
            >
              {selected.size > 0
                ? t(`${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`, `${selected.size} selected`)
                : t("Tout sélectionner", "Select all")}
            </Button>
            {selected.size > 0 && (
              <>
                <Button size="sm" icon={Power} onClick={() => list.bulkActive(true)} loading={list.busy}>
                  {t("Activer", "Activate")}
                </Button>
                <Button size="sm" icon={Power} onClick={() => list.bulkActive(false)} loading={list.busy}>
                  {t("Désactiver", "Deactivate")}
                </Button>
                <LinkButton size="sm" icon={Printer} href={list.printHref}>
                  {t("Imprimer", "Print")}
                </LinkButton>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => list.setToDelete([...selected])}>
                  {t("Supprimer", "Delete")}
                </Button>
                <Button size="sm" variant="ghost" icon={X} onClick={list.clearSelection}>
                  {t("Annuler", "Cancel")}
                </Button>
              </>
            )}
          </div>

          {filtered.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                compact
                icon={QrCode}
                title={t("Aucun emplacement ne correspond", "No matching locations")}
                description={t("Essayez un autre filtre ou une autre recherche.", "Try another filter or search.")}
                action={
                  <Button
                    onClick={() => {
                      list.setSearch("");
                      list.setFilter("tous");
                    }}
                  >
                    {t("Réinitialiser", "Reset")}
                  </Button>
                }
              />
            </Card>
          ) : list.view === "grille" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((q) => (
                <QrCard
                  key={q.id}
                  q={q}
                  link={list.linkOf(q)}
                  best={best?.id === q.id}
                  selected={selected.has(q.id)}
                  onSelect={() => list.toggleSelect(q.id)}
                  onToggle={() => list.toggleActive(q)}
                  onDelete={() => list.setToDelete([q.id])}
                  onCopy={() => list.copyLink(q)}
                  onDownload={() => list.download(q)}
                />
              ))}
            </div>
          ) : (
            <QrTable list={list} />
          )}
        </>
      )}

      <CreateQrDialog
        open={list.createOpen}
        onClose={() => list.setCreateOpen(false)}
        existing={qrCodes.map((q) => q.label)}
        onCreate={list.createLabels}
      />

      <ConfirmDialog
        open={list.toDelete !== null}
        onCancel={() => list.setToDelete(null)}
        onConfirm={list.confirmDelete}
        loading={list.busy}
        danger
        confirmLabel={t("Supprimer définitivement", "Delete permanently")}
        title={
          list.toDelete && list.toDelete.length > 1
            ? t(`Supprimer ${list.toDelete.length} QR codes ?`, `Delete ${list.toDelete.length} QR codes?`)
            : t("Supprimer ce QR code ?", "Delete this QR code?")
        }
        description={t(
          "Le QR imprimé ne fonctionnera plus. S'il a déjà des réservations, il est désactivé au lieu d'être supprimé : leur historique et leurs commissions sont conservés.",
          "The printed QR will stop working. If it already has reservations, it is deactivated instead of deleted: their history and commissions are kept."
        )}
      />
    </>
  );
}
