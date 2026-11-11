"use client";

import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  EMPTY_SERVICE,
  useVenueServices,
  type VenueService,
  type VenueServiceDraft,
} from "@/hooks/use-venue-services";
import { useT } from "@/lib/i18n/client";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  InfoNote,
  PageHeader,
  PageSkeleton,
  useNotify,
} from "@/components/app/ui";
import { ServiceCard } from "@/components/venue/prestations/service-card";
import { ServiceEditor } from "@/components/venue/prestations/service-editor";

/* Prestations d'une activité ou d'un service : une balade en quad d'une
   heure, un transfert aéroport, un massage de 50 minutes. Chaque
   prestation visible apparaît aussitôt sous la fiche de l'établissement dans
   le menu des hôtels partenaires, et le client la choisit avec sa date. */

export default function PrestationsPage() {
  const { isLoading: authLoading, userId, isActivityVenue } = useAuthUser();
  const t = useT();
  const notify = useNotify();
  const { services, isLoading, error, reload, save, setActive, move, remove } =
    useVenueServices(!authLoading);
  const [editor, setEditor] = useState<{ id: string | null; draft: VenueServiceDraft } | null>(null);
  const [deleting, setDeleting] = useState<VenueService | null>(null);
  const [busy, setBusy] = useState(false);

  const openNew = () => setEditor({ id: null, draft: EMPTY_SERVICE });

  const header = (
    <PageHeader
      title={t("Prestations", "Services")}
      description={t(
        "Ce que vos clients peuvent réserver : durée, prix, une photo. Chaque prestation visible apparaît aussitôt sous votre fiche dans le menu des hôtels partenaires, et le client la choisit avec sa date.",
        "What your guests can book: duration, price, a photo. Every visible service appears straight away under your listing on partner hotels' menus, and guests pick it along with their date."
      )}
      actions={
        services && (
          <Button variant="primary" icon={Plus} onClick={openNew}>
            {t("Nouvelle prestation", "New service")}
          </Button>
        )
      }
    />
  );

  if (authLoading || isLoading) return <PageSkeleton kpis={0} rows={4} />;

  if (error || services === null) {
    return (
      <div className="space-y-6">
        {header}
        <Card padded={false}>
          <ErrorState
            title={t("Prestations impossibles à charger", "Couldn't load your services")}
            onRetry={reload}
          />
        </Card>
      </div>
    );
  }

  const onSave = async () => {
    if (!editor || !userId) return;
    if (!editor.draft.name.trim()) {
      notify(t("Donnez un nom à la prestation.", "Give the service a name."), "error");
      return;
    }
    setBusy(true);
    const ok = await save(editor.id, editor.draft, userId);
    setBusy(false);
    if (!ok) {
      notify(t("Enregistrement impossible. Réessayez.", "Could not save. Please try again."), "error");
      return;
    }
    setEditor(null);
    notify(
      editor.id
        ? t("Prestation mise à jour.", "Service updated.")
        : t("Prestation ajoutée, visible sur le menu.", "Service added and visible on the menu.")
    );
  };

  const onToggle = async (s: VenueService) => {
    const next = !s.active;
    if (await setActive(s, next)) {
      notify(next ? t("Visible sur le menu.", "Visible on the menu.") : t("Retirée du menu.", "Removed from the menu."));
    } else {
      notify(t("Changement impossible. Réessayez.", "Could not update. Please try again."), "error");
    }
  };

  const onMove = async (s: VenueService, dir: -1 | 1) => {
    if (!(await move(s, dir))) notify(t("Réordonnancement impossible.", "Could not reorder."), "error");
  };

  const onDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const ok = await remove(deleting.id);
    setBusy(false);
    setDeleting(null);
    if (ok) notify(t("Prestation supprimée.", "Service deleted."));
    else notify(t("Suppression impossible.", "Could not delete."), "error");
  };

  const visible = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      {header}

      {!isActivityVenue && (
        <InfoNote tone="amber">
          {t(
            "Votre compte est enregistré comme restaurant ou club : les prestations servent surtout aux activités et services, mais rien ne vous empêche d'y mettre vos formules.",
            "Your account is registered as a restaurant or club. Services are mainly for activities, but you can still list your set menus and packages here."
          )}
        </InfoNote>
      )}

      {services.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={Tags}
            title={t("Aucune prestation pour le moment", "No services yet")}
            description={t(
              "Par exemple « Balade en quad, 1 h, 450 MAD ». Dès qu'elle est enregistrée, les clients des hôtels partenaires peuvent la réserver.",
              "For example “Quad bike ride, 1 hr, 450 MAD”. Once saved, guests at partner hotels can book it."
            )}
            action={
              <Button variant="primary" icon={Plus} onClick={openNew}>
                {t("Ajouter ma première prestation", "Add my first service")}
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <p className="text-[13px] text-ink-3">
            {t(
              <>
                {services.length} prestation{services.length > 1 ? "s" : ""} ·{" "}
                <span className="font-bold text-ink">
                  {visible} visible{visible > 1 ? "s" : ""}
                </span>{" "}
                sur le menu · l&apos;ordre ci-dessous est celui du menu.
              </>,
              <>
                {services.length} service{services.length === 1 ? "" : "s"} ·{" "}
                <span className="font-bold text-ink">{visible} visible</span> on the menu · the
                order below is the menu order.
              </>
            )}
          </p>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {services.map((s, i) => (
              <ServiceCard
                key={s.id}
                service={s}
                isFirst={i === 0}
                isLast={i === services.length - 1}
                onEdit={() => setEditor({ id: s.id, draft: { ...s } })}
                onToggle={() => onToggle(s)}
                onMove={(dir) => onMove(s, dir)}
                onDelete={() => setDeleting(s)}
              />
            ))}
          </ul>
        </>
      )}

      {editor && userId && (
        <ServiceEditor
          draft={editor.draft}
          isNew={editor.id === null}
          userId={userId}
          busy={busy}
          onChange={(draft) => setEditor({ ...editor, draft })}
          onClose={() => setEditor(null)}
          onSave={onSave}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={onDelete}
        title={t("Supprimer cette prestation ?", "Delete this service?")}
        description={
          deleting
            ? t(
                `« ${deleting.name} » disparaît du menu immédiatement. Les réservations déjà reçues sont conservées.`,
                `“${deleting.name}” is removed from the menu immediately. Reservations already received are kept.`
              )
            : undefined
        }
        confirmLabel={t("Supprimer", "Delete")}
        danger
        loading={busy}
      />
    </div>
  );
}
