"use client";

import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  DEFAULT_PORTAL,
  slugifyPortal,
  uploadPortalCover,
  useVenuePortal,
  type SavePortalResult,
  type VenuePortal,
} from "@/hooks/use-venue-portal";
import { useT } from "@/lib/i18n/client";
import { Card, ErrorState, PageHeader, PageSkeleton, useNotify } from "@/components/app/ui";
import { PortalForm } from "@/components/venue/portal/portal-form";
import { PortalShare } from "@/components/venue/portal/portal-share";

/* Le portail de réservation directe de l'établissement : une page publique
   /r/[slug] hébergée par twocards (réseaux sociaux, bio Instagram, Google
   Business) et intégrable au site de l'établissement en iframe. Les
   réservations arrivent dans l'onglet Réservations, canal « direct »,
   sans commission — le canal direct est gratuit. */

export default function PortalAdminPage() {
  const { isLoading: authLoading, venueName, userId } = useAuthUser();
  const { portal, isLoading, error, reload, save } = useVenuePortal();
  const t = useT();

  const header = (
    <PageHeader
      title={t("Portail de réservation", "Booking portal")}
      description={t(
        "Votre page de réservation directe, hébergée par twocards, à mettre en bio Instagram, sur Google et sur votre site (intégration iframe). Réservations sans commission : le canal direct est gratuit.",
        "Your direct booking page, hosted by twocards, for your Instagram bio, Google and your website (iframe embed). Commission-free reservations: the direct channel is free."
      )}
    />
  );

  if (authLoading || isLoading) return <PageSkeleton kpis={0} />;

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Card padded={false}>
          <ErrorState
            title={t("Portail impossible à charger", "Couldn't load your portal")}
            onRetry={reload}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {/* Monté une fois les données connues : le formulaire part de la
          ligne enregistrée, ou du nom de l'établissement au premier passage. */}
      <PortalEditor
        initial={
          portal ?? {
            ...DEFAULT_PORTAL,
            display_name: venueName ?? "",
            slug: venueName ? slugifyPortal(venueName) : "",
          }
        }
        initiallySaved={portal !== null}
        userId={userId}
        save={save}
      />
    </div>
  );
}

function PortalEditor({
  initial,
  initiallySaved,
  userId,
  save,
}: {
  initial: VenuePortal;
  initiallySaved: boolean;
  userId: string | null;
  save: (form: VenuePortal) => Promise<SavePortalResult>;
}) {
  const t = useT();
  const notify = useNotify();
  const [form, setForm] = useState<VenuePortal>(initial);
  const [exists, setExists] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof VenuePortal>(k: K, v: VenuePortal[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const uploadCover = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      notify(t("Choisissez une image", "Please choose an image"), "error");
      return;
    }
    setUploading(true);
    try {
      set("cover_url", await uploadPortalCover(file, userId));
      notify(t("Couverture importée, pensez à enregistrer", "Cover uploaded. Remember to save"));
    } catch {
      notify(t("L'envoi de l'image a échoué", "Image upload failed"), "error");
    }
    setUploading(false);
  };

  const onSave = async () => {
    if (!form.slug || form.slug.length < 3) {
      notify(
        t("Adresse invalide : 3 caractères minimum", "Invalid address: at least 3 characters"),
        "error"
      );
      return;
    }
    if (!form.display_name.trim()) {
      notify(t("Le nom affiché est requis", "Display name is required"), "error");
      return;
    }
    setSaving(true);
    const result = await save(form);
    setSaving(false);
    if (result !== "ok") {
      notify(
        result === "slug-taken"
          ? t(
              "Cette adresse est déjà prise par un autre établissement",
              "This address is already taken by another venue"
            )
          : t("Impossible d'enregistrer", "Could not save"),
        "error"
      );
      return;
    }
    setExists(true);
    notify(
      t(
        "Portail enregistré, la page publique est à jour",
        "Portal saved. The public page is up to date"
      )
    );
  };

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <PortalForm
        form={form}
        onChange={set}
        onSave={onSave}
        saving={saving}
        onUploadCover={uploadCover}
        uploading={uploading}
      />
      <PortalShare exists={exists} slug={form.slug} displayName={form.display_name} />
    </div>
  );
}
