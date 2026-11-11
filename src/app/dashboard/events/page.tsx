"use client";

import { useState } from "react";
import { Calendar, LayoutGrid, List, Plus, SearchX, Ticket } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useVenueEvents, type VenueEvent } from "@/hooks/use-venue-events";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  InfoNote,
  KpiGrid,
  PageHeader,
  PageSkeleton,
  SearchInput,
  Segmented,
  Select,
  useNotify,
} from "@/components/app/ui";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { EventCard, type EventActions } from "@/components/venue/events/event-card";
import { EventsList } from "@/components/venue/events/events-list";
import { EventsCalendar } from "@/components/venue/events/events-calendar";
import { EventViewDrawer } from "@/components/venue/events/event-view-drawer";
import { EventFormDrawer } from "@/components/venue/events/event-form-drawer";
import {
  applyForm,
  emptyForm,
  eventToForm,
  formToDraft,
  withDayCounts,
  type EventForm,
} from "@/components/venue/events/event-lib";

type ViewMode = "grid" | "list" | "calendar";
/* Valeurs de base (françaises) ; « Ouvert » couvre aussi « Bientôt complet ». */
type StatusFilter = "" | "Ouvert" | "Fermé" | "Brouillon";
type FormTarget = { mode: "create" | "edit"; id: number | null; form: EventForm };

export default function EventsPage() {
  const t = useT();
  const intl = useIntlLocale();
  const notify = useNotify();
  const { isLoading: authLoading } = useAuthUser();
  const { events, dayReservations, isLoading, error, countsError, reload, create, update, remove } =
    useVenueEvents();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [toDelete, setToDelete] = useState<VenueEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const header = (
    <PageHeader
      title={t("Événements", "Events")}
      description={t("Vos soirées et votre programmation.", "Your nights and your line-up.")}
      actions={
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setFormTarget({ mode: "create", id: null, form: emptyForm() })}
        >
          {t("Créer un événement", "Create an event")}
        </Button>
      }
    />
  );

  if (error)
    return (
      <div className="space-y-6">
        <PageHeader title={t("Événements", "Events")} />
        <Card padded={false}>
          <ErrorState onRetry={reload} />
        </Card>
      </div>
    );
  if (authLoading || isLoading) return <PageSkeleton kpis={3} />;

  const displayEvents = events.map((e) => withDayCounts(e, dayReservations, intl));

  const filteredEvents = displayEvents.filter((e) => {
    if (filterStatus === "Ouvert" && e.status !== "Ouvert" && e.status !== "Bientôt complet")
      return false;
    if (filterStatus === "Fermé" && e.status !== "Fermé") return false;
    if (filterStatus === "Brouillon" && e.status !== "Brouillon") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.venue.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeEvents = displayEvents.filter(
    (e) => e.status === "Ouvert" || e.status === "Bientôt complet"
  ).length;
  const totalReservations = displayEvents.reduce((sum, e) => sum + e.reservations, 0);
  /* Capacité nulle exclue du taux de remplissage : pas de division par zéro. */
  const fillables = displayEvents.filter((e) => !e.closed && e.totalSpots > 0);
  const avgFill =
    fillables.length > 0
      ? Math.round(
          fillables.reduce((sum, e) => sum + ((e.totalSpots - e.spots) / e.totalSpots) * 100, 0) /
            fillables.length
        )
      : 0;

  /* ── Actions ── */
  const openView = (id: number) => setViewId(id);
  const openEdit = (id: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setViewId(null);
    setFormTarget({ mode: "edit", id, form: eventToForm(ev) });
  };

  const duplicateEvent = async (id: number) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    /* L'identifiant recopié est ignoré à l'insertion (colonnes explicites). */
    const created = await create({
      ...ev,
      title: `${ev.title}${t(" (copie)", " (copy)")}`,
      status: "Brouillon",
      reservations: 0,
      spots: ev.totalSpots,
      revenue: "0 MAD",
      rpCount: 0,
      closed: false,
    });
    if (created) notify(t(`« ${ev.title} » dupliqué`, `“${ev.title}” duplicated`));
    else notify(t("La copie n'a pas pu être créée", "Couldn't duplicate the event"), "error");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await remove(toDelete.id);
    setDeleting(false);
    if (ok) {
      if (viewId === toDelete.id) setViewId(null);
      notify(t(`« ${toDelete.title} » supprimé`, `“${toDelete.title}” deleted`));
    } else {
      notify(t("La suppression a échoué", "Couldn't delete the event"), "error");
    }
    setToDelete(null);
  };

  const saveForm = async (form: EventForm): Promise<boolean> => {
    if (!formTarget) return false;
    if (formTarget.mode === "create") {
      const created = await create(formToDraft(form));
      if (!created) {
        notify(t("L'événement n'a pas pu être créé", "Couldn't create the event"), "error");
        return false;
      }
      notify(t(`« ${form.title} » créé`, `“${form.title}” created`));
    } else {
      const existing = events.find((e) => e.id === formTarget.id);
      if (!existing) return false;
      if (!(await update(applyForm(existing, form)))) {
        notify(t("Les modifications n'ont pas été enregistrées", "Couldn't save your changes"), "error");
        return false;
      }
      notify(t(`« ${form.title} » mis à jour`, `“${form.title}” updated`));
    }
    setFormTarget(null);
    return true;
  };

  const actions: EventActions = {
    onView: openView,
    onEdit: openEdit,
    onDuplicate: duplicateEvent,
    onDelete: (id) => setToDelete(events.find((e) => e.id === id) ?? null),
  };
  const viewEvent = viewId !== null ? displayEvents.find((e) => e.id === viewId) : undefined;

  return (
    <div className="space-y-6">
      {header}

      {displayEvents.length > 0 && (
        <KpiGrid
          columns={3}
          items={[
            { label: t("Événements ouverts", "Open events"), value: activeEvents },
            {
              label: t("Réservations ces jours-là", "Bookings on those days"),
              value: totalReservations,
              hint: t(
                "toutes les réservations des jours d'événement",
                "all reservations on event days"
              ),
            },
            {
              label: t("Remplissage moyen", "Average fill rate"),
              value: t(`${avgFill} %`, `${avgFill}%`),
              hint: t("places prises ces jours-là", "spots taken on those days"),
            },
          ]}
        />
      )}

      {countsError && (
        <InfoNote tone="amber">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {t(
                "Les réservations n'ont pas pu être lues : les chiffres du jour ne sont pas à jour.",
                "Reservations couldn't be loaded: the day's figures are not up to date."
              )}
            </span>
            <Button size="sm" onClick={reload}>
              {t("Réessayer", "Try again")}
            </Button>
          </div>
        </InfoNote>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("Nom ou lieu", "Name or location")}
          label={t("Rechercher un événement", "Search events")}
          className="min-w-[200px] max-w-sm flex-1"
        />
        <Select<StatusFilter>
          label={t("Filtrer par statut", "Filter by status")}
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "", label: t("Tous les statuts", "All statuses") },
            { value: "Ouvert", label: t("Ouvert", "Open") },
            { value: "Fermé", label: t("Fermé", "Closed") },
            { value: "Brouillon", label: t("Brouillon", "Draft") },
          ]}
        />
        <Segmented<ViewMode>
          label={t("Affichage", "View")}
          className="ml-auto"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: "grid", label: <ViewLabel icon={LayoutGrid} text={t("Grille", "Grid")} /> },
            { value: "list", label: <ViewLabel icon={List} text={t("Liste", "List")} /> },
            { value: "calendar", label: <ViewLabel icon={Calendar} text={t("Calendrier", "Calendar")} /> },
          ]}
        />
      </div>

      {viewMode === "calendar" ? (
        <EventsCalendar events={displayEvents} onView={openView} />
      ) : displayEvents.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Ticket}
            title={t("Aucun événement", "No events yet")}
            description={t(
              "Créez votre première soirée : elle apparaîtra ici et dans le calendrier.",
              "Create your first night: it will appear here and in the calendar."
            )}
            action={
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setFormTarget({ mode: "create", id: null, form: emptyForm() })}
              >
                {t("Créer un événement", "Create an event")}
              </Button>
            }
          />
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            compact
            icon={SearchX}
            title={t("Aucun événement ne correspond", "No events match")}
            action={
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("");
                }}
              >
                {t("Effacer les filtres", "Clear filters")}
              </Button>
            }
          />
        </Card>
      ) : viewMode === "list" ? (
        <EventsList events={filteredEvents} actions={actions} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} actions={actions} />
          ))}
        </div>
      )}

      {filteredEvents.length > 0 && viewMode !== "calendar" && (
        <p className="num px-1 text-xs text-ink-3">
          {t(
            `${filteredEvents.length} sur ${displayEvents.length} événement${displayEvents.length > 1 ? "s" : ""}`,
            `${filteredEvents.length} of ${displayEvents.length} event${displayEvents.length === 1 ? "" : "s"}`
          )}
        </p>
      )}

      {viewEvent && (
        <EventViewDrawer event={viewEvent} onClose={() => setViewId(null)} onEdit={openEdit} />
      )}
      {formTarget && (
        <EventFormDrawer
          key={formTarget.id ?? "new"}
          mode={formTarget.mode}
          initial={formTarget.form}
          onClose={() => setFormTarget(null)}
          onSubmit={saveForm}
        />
      )}
      <ConfirmDialog
        open={toDelete !== null}
        danger
        loading={deleting}
        title={t(`Supprimer « ${toDelete?.title ?? ""} » ?`, `Delete “${toDelete?.title ?? ""}”?`)}
        description={t("Cette action est définitive.", "This can't be undone.")}
        confirmLabel={t("Supprimer", "Delete")}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ViewLabel({ icon: Icon, text }: { icon: typeof LayoutGrid; text: string }) {
  return (
    <>
      <Icon size={14} strokeWidth={1.75} aria-hidden />
      <span className="sr-only sm:not-sr-only">{text}</span>
    </>
  );
}
