"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lock, Pencil } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  localISODate,
  shiftISODate,
  useTableReservations,
  useVenueTables,
  type TableReservation,
  type VenueTablePatch,
} from "@/hooks/use-venue-tables";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  IconButton,
  InfoNote,
  KpiGrid,
  PageHeader,
  PageSkeleton,
  inputClass,
  useNotify,
} from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { FloorCanvas } from "@/components/venue/floor-plan/floor-canvas";
import { FloorLegend, type FloorTable } from "@/components/venue/floor-plan/table-node";
import { NoTableSelected, TableDetails } from "@/components/venue/floor-plan/table-details";
import { TableEditor } from "@/components/venue/floor-plan/table-editor";

/* Plan de salle : l'occupation des tables pour une date, l'arrivée des
   clients, les walk-ins, et un mode édition pour dessiner la salle. */

export default function FloorPlanPage() {
  const { isLoading: authLoading } = useAuthUser();
  const t = useT();
  const intl = useIntlLocale();
  const notify = useNotify();

  /* Le plan montre l'occupation du jour choisi, pas un état figé. */
  const [selectedDate, setSelectedDate] = useState(() => localISODate());
  const today = localISODate();

  const plan = useVenueTables();
  const bookings = useTableReservations(selectedDate);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [freeing, setFreeing] = useState(false);
  /* Walk-in : nombre de couverts à installer sur une table libre. */
  const [walkInParty, setWalkInParty] = useState(2);
  const [seating, setSeating] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  const header = (actions?: React.ReactNode) => (
    <PageHeader
      title={t("Plan de salle", "Floor plan")}
      description={
        selectedDate === today
          ? t(
              "Occupation d'aujourd'hui. Choisissez une date pour voir un autre service.",
              "Today's occupancy. Pick a date to see another service."
            )
          : t(
              `Occupation du ${longDate(selectedDate, intl)}.`,
              `Occupancy for ${longDate(selectedDate, intl)}.`
            )
      }
      actions={actions}
    />
  );

  if (authLoading || plan.isLoading) return <PageSkeleton />;

  if (plan.tables === null) {
    return (
      <div className="space-y-6">
        {header()}
        <Card padded={false}>
          <ErrorState
            title={t("Plan de salle indisponible", "Couldn't load the floor plan")}
            onRetry={plan.reload}
          />
        </Card>
      </div>
    );
  }

  /* Une table qui porte une réservation ce jour-là s'affiche occupée (sauf
     si elle est bloquée) ; la première réservation donne l'heure. */
  const tables: FloorTable[] = plan.tables.map((tb) => {
    const list = bookings.byTable[tb.id];
    return list?.length
      ? { ...tb, status: tb.status === "blocked" ? "blocked" : "occupied", reservation: list[0] }
      : tb;
  });
  const selected = tables.find((tb) => tb.id === selectedId);
  const selectedReservations = selected ? bookings.byTable[selected.id] ?? [] : [];
  const tableToDelete = pendingDelete !== null ? tables.find((tb) => tb.id === pendingDelete) : null;

  const occupied = tables.filter((tb) => tb.status === "occupied");
  const availableCount = tables.filter((tb) => tb.status === "available").length;
  const totalCapacity = tables.reduce((sum, tb) => sum + tb.capacity, 0);
  const bookedCovers = occupied.reduce((sum, tb) => {
    const list = bookings.byTable[tb.id];
    return sum + (list?.length ? list.reduce((s, r) => s + r.partySize, 0) : tb.capacity);
  }, 0);

  const selectTable = (id: number) => {
    setSelectedId(id);
    setWalkInError(null);
  };

  const patchTable = async (id: number, patch: VenueTablePatch) => {
    const ok = await plan.patchTable(id, patch);
    if (!ok) notify(t("Échec de l'enregistrement", "Couldn't save"), "error");
  };

  const addTable = async (x: number, y: number) => {
    const label = String(tables.reduce((m, tb) => Math.max(m, Number(tb.label) || 0), 0) + 1);
    const row = await plan.addTable(label, x, y);
    if (!row) {
      notify(t("Impossible d'ajouter la table", "Couldn't add the table"), "error");
      return;
    }
    setSelectedId(row.id);
    notify(t(`Table ${label} ajoutée`, `Table ${label} added`));
  };

  const confirmDelete = async () => {
    if (!tableToDelete) return;
    setDeleting(true);
    const ok = await plan.removeTable(tableToDelete.id);
    setDeleting(false);
    setPendingDelete(null);
    if (!ok) {
      notify(t("Échec de la suppression", "Couldn't delete"), "error");
      return;
    }
    if (selectedId === tableToDelete.id) setSelectedId(null);
    notify(t(`Table ${tableToDelete.label} supprimée`, `Table ${tableToDelete.label} deleted`));
  };

  /* Arrivée : l'heure est en base, partagée entre postes. Si l'écriture
     échoue, l'affichage revient en arrière et l'erreur est dite. */
  const checkIn = async (res: TableReservation) => {
    setCheckingInId(res.resId);
    const ok = await bookings.checkIn(res.resId);
    setCheckingInId(null);
    if (ok) notify(t(`${res.client}, arrivée enregistrée`, `${res.client}, arrival recorded`));
    else
      notify(
        t(
          "Arrivée non enregistrée. Vérifiez la connexion, puis réessayez.",
          "Arrival not recorded. Check your connection, then try again."
        ),
        "error"
      );
  };

  const seatWalkIn = async () => {
    if (!selected || seating) return;
    setSeating(true);
    setWalkInError(null);
    const result = await bookings.seatWalkIn(selected.id, walkInParty);
    setSeating(false);
    if (result === "failed") {
      const message = t(
        "Le client n'a pas pu être installé : rien n'a été enregistré. Vérifiez la connexion, puis réessayez.",
        "The guest couldn't be seated: nothing was saved. Check your connection, then try again."
      );
      setWalkInError(message);
      notify(t("Impossible d'installer le client", "Couldn't seat the guest"), "error");
      return;
    }
    if (result === "arrival-failed") {
      notify(
        t(
          `Table ${selected.label} : client installé, mais l'arrivée n'a pas été enregistrée. Marquez-le arrivé.`,
          `Table ${selected.label}: guest seated, but the arrival wasn't recorded. Mark them as arrived.`
        ),
        "error"
      );
      return;
    }
    notify(
      t(
        `${walkInParty} couvert${walkInParty > 1 ? "s" : ""} installé${walkInParty > 1 ? "s" : ""}, table ${selected.label}`,
        `${walkInParty} cover${walkInParty === 1 ? "" : "s"} seated, table ${selected.label}`
      )
    );
  };

  const freeTable = async () => {
    if (!selected) return;
    setFreeing(true);
    const ok = await bookings.freeTable(selected.id);
    setFreeing(false);
    if (!ok) {
      notify(t("Impossible de libérer la table", "Couldn't free up the table"), "error");
      return;
    }
    setSelectedId(null);
    notify(t(`Table ${selected.label} libérée`, `Table ${selected.label} freed up`));
  };

  return (
    <div className="space-y-6">
      {header(
        <>
          <div className="flex items-center gap-1">
            <IconButton
              icon={ChevronLeft}
              label={t("Jour précédent", "Previous day")}
              onClick={() => setSelectedDate((d) => shiftISODate(d, -1))}
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              aria-label={t("Date du plan de salle", "Floor plan date")}
              className={cn(inputClass, "num h-11 w-auto py-0")}
            />
            <IconButton
              icon={ChevronRight}
              label={t("Jour suivant", "Next day")}
              onClick={() => setSelectedDate((d) => shiftISODate(d, 1))}
            />
          </div>
          {selectedDate !== today && (
            <Button onClick={() => setSelectedDate(today)}>{t("Aujourd'hui", "Today")}</Button>
          )}
          <Button
            variant={editMode ? "primary" : "secondary"}
            icon={editMode ? Pencil : Lock}
            aria-pressed={editMode}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? t("Terminer l'édition", "Done editing") : t("Modifier", "Edit")}
          </Button>
        </>
      )}

      {bookings.error && (
        <InfoNote tone="danger">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {t(
                "Les réservations de ce jour n'ont pas pu être chargées : l'occupation affichée peut être incomplète.",
                "This day's reservations couldn't be loaded: the occupancy shown may be incomplete."
              )}
            </span>
            <Button size="sm" onClick={bookings.reload}>
              {t("Réessayer", "Try again")}
            </Button>
          </div>
        </InfoNote>
      )}

      {tables.length > 0 && (
        <KpiGrid
          items={[
            {
              label: t("Tables occupées", "Tables occupied"),
              value: `${occupied.length}/${tables.length}`,
            },
            { label: t("Disponibles", "Available"), value: availableCount },
            { label: t("Couverts réservés", "Covers booked"), value: bookedCovers },
            { label: t("Capacité totale", "Total capacity"), value: totalCapacity },
          ]}
        />
      )}

      <FloorLegend editMode={editMode} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="min-w-0 lg:col-span-7">
          <FloorCanvas
            tables={tables}
            selectedId={selectedId}
            onSelect={selectTable}
            editMode={editMode}
            onEnterEdit={() => setEditMode(true)}
            onMove={plan.moveLocal}
            onMoveEnd={(id, x, y) => patchTable(id, { x, y })}
            onDragChange={plan.pauseSync}
            onAdd={addTable}
            onRequestDelete={setPendingDelete}
          />
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <TableDetails
              table={selected}
              reservations={selectedReservations}
              editMode={editMode}
              dateLabel={new Date(selectedDate + "T00:00:00").toLocaleDateString(intl)}
              isToday={selectedDate === today}
              checkingInId={checkingInId}
              onCheckIn={checkIn}
              walkIn={{
                party: walkInParty,
                onPartyChange: setWalkInParty,
                seating,
                error: walkInError,
                onSeat: seatWalkIn,
              }}
              freeing={freeing}
              onFree={freeTable}
              editor={
                <TableEditor
                  table={selected}
                  onPatch={(patch) => patchTable(selected.id, patch)}
                  onDelete={() => setPendingDelete(selected.id)}
                />
              }
            />
          ) : (
            <NoTableSelected editMode={editMode} />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={tableToDelete != null}
        danger
        loading={deleting}
        title={
          tableToDelete
            ? t(`Supprimer la table ${tableToDelete.label} ?`, `Delete table ${tableToDelete.label}?`)
            : ""
        }
        description={
          tableToDelete && (bookings.byTable[tableToDelete.id] ?? []).length > 0
            ? t(
                "Ses réservations du jour perdront leur assignation.",
                "That day's reservations on it will lose their table."
              )
            : undefined
        }
        confirmLabel={t("Supprimer", "Delete")}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

const longDate = (iso: string, intl: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(intl, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
