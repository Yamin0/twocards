"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { uploadImage } from "@/lib/hotel/upload-image";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  Switch,
  Toast,
  inputClass,
} from "@/components/hotel/ui";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useLocale, useT } from "@/lib/i18n/client";

/* Prestations d'une activité ou d'un service : une balade en quad d'une
   heure, un transfert aéroport, un massage de 50 minutes. Chaque
   prestation visible apparaît aussitôt sous la fiche de l'établissement dans
   le menu des hôtels partenaires, et le client la choisit avec sa date. */

type Service = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  image_url: string | null;
  active: boolean;
  sort_order: number;
};

type Draft = Omit<Service, "id" | "sort_order">;

const EMPTY: Draft = {
  name: "",
  description: "",
  duration: "",
  price: "",
  image_url: null,
  active: true,
};

const SELECT = "id, name, description, duration, price, image_url, active, sort_order";

export default function PrestationsPage() {
  const { isLoading, userId, isActivityVenue } = useAuthUser();
  const t = useT();
  const [services, setServices] = useState<Service[] | null>(null);
  const [editor, setEditor] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string, tone: "success" | "error" = "success") => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const load = async () => {
    const { data } = await createClient()
      .from("venue_services")
      .select(SELECT)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setServices((data as Service[] | null) ?? []);
  };

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    createClient()
      .from("venue_services")
      .select(SELECT)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setServices((data as Service[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  if (isLoading || services === null) return <DashboardSkeleton />;

  const save = async () => {
    if (!editor || !userId) return;
    const d = editor.draft;
    if (!d.name.trim()) {
      notify(t("Donnez un nom à la prestation.", "Give the service a name."), "error");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const payload = {
      name: d.name.trim(),
      description: d.description.trim(),
      duration: d.duration.trim(),
      price: d.price.trim(),
      image_url: d.image_url,
      active: d.active,
    };
    const { error } = editor.id
      ? await supabase.from("venue_services").update(payload).eq("id", editor.id)
      : await supabase.from("venue_services").insert({
          ...payload,
          owner_id: userId,
          sort_order: (services.at(-1)?.sort_order ?? 0) + 10,
        });
    setBusy(false);
    if (error) {
      notify(t("Enregistrement impossible. Réessayez.", "Could not save. Please try again."), "error");
      return;
    }
    setEditor(null);
    notify(
      editor.id
        ? t("Prestation mise à jour.", "Service updated.")
        : t("Prestation ajoutée, visible sur le menu.", "Service added and visible on the menu.")
    );
    load();
  };

  const toggle = async (s: Service) => {
    const next = !s.active;
    setServices((prev) => prev!.map((x) => (x.id === s.id ? { ...x, active: next } : x)));
    const { error } = await createClient()
      .from("venue_services")
      .update({ active: next })
      .eq("id", s.id);
    if (error) {
      setServices((prev) => prev!.map((x) => (x.id === s.id ? { ...x, active: s.active } : x)));
      notify(t("Changement impossible. Réessayez.", "Could not update. Please try again."), "error");
    } else {
      notify(next ? t("Visible sur le menu.", "Visible on the menu.") : t("Retirée du menu.", "Removed from the menu."));
    }
  };

  /* Monter ou descendre : on échange les rangs des deux voisines. */
  const move = async (s: Service, dir: -1 | 1) => {
    const i = services.findIndex((x) => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= services.length) return;
    const a = services[i];
    const b = services[j];
    /* Deux rangs égaux (import, anciennes lignes) ne se distingueraient pas :
       on réattribue des rangs espacés. */
    const ra = a.sort_order === b.sort_order ? b.sort_order + (dir > 0 ? 10 : -10) : b.sort_order;
    const rb = a.sort_order === b.sort_order ? a.sort_order : a.sort_order;
    const next = [...services];
    next[i] = { ...b, sort_order: rb };
    next[j] = { ...a, sort_order: ra };
    setServices(next);
    const supabase = createClient();
    const [r1, r2] = await Promise.all([
      supabase.from("venue_services").update({ sort_order: ra }).eq("id", a.id),
      supabase.from("venue_services").update({ sort_order: rb }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) {
      notify(t("Réordonnancement impossible.", "Could not reorder."), "error");
      load();
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const { error } = await createClient()
      .from("venue_services")
      .delete()
      .eq("id", deleting.id);
    setBusy(false);
    setDeleting(null);
    if (error) {
      notify(t("Suppression impossible.", "Could not delete."), "error");
      return;
    }
    notify(t("Prestation supprimée.", "Service deleted."));
    load();
  };

  const visible = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      <div className=" bg-panel border border-line rounded-3xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-light text-ink">{t("Prestations", "Services")}</h1>
            <p className="font-ui text-sm text-ink-2 mt-2 max-w-xl">
              {t(
                "Ce que vos clients peuvent réserver : durée, prix, une photo. Chaque prestation visible apparaît aussitôt sous votre fiche dans le menu des hôtels partenaires, et le client la choisit avec sa date.",
                "What your guests can book: duration, price, a photo. Every visible service appears straight away under your listing on partner hotels' menus, and guests pick it along with their date."
              )}
            </p>
            {!isActivityVenue && (
              <p className="font-ui mt-2 text-xs text-warn">
                {t(
                  <>
                    Votre compte est enregistré comme restaurant ou club : les
                    prestations servent surtout aux activités et services, mais
                    rien ne vous empêche d&apos;y mettre vos formules.
                  </>,
                  <>
                    Your account is registered as a restaurant or club. Services
                    are mainly for activities, but you can still list your set
                    menus and packages here.
                  </>
                )}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setEditor({ id: null, draft: EMPTY })}
            className="shrink-0"
          >
            {t("Nouvelle prestation", "New service")}
          </Button>
        </div>
        {services.length > 0 && (
          <p className="font-ui mt-4 border-t border-line pt-4 text-xs text-ink-3">
            {t(
              <>
                {services.length} prestation{services.length > 1 ? "s" : ""} ·{" "}
                <span className="text-ink">{visible} visible{visible > 1 ? "s" : ""}</span> sur le
                menu · l&apos;ordre ci-dessous est celui du menu.
              </>,
              <>
                {services.length} service{services.length === 1 ? "" : "s"} ·{" "}
                <span className="text-ink">{visible} visible</span> on the
                menu · the order below is the menu order.
              </>
            )}
          </p>
        )}
      </div>

      {services.length === 0 ? (
        <div className=" bg-panel border border-line rounded-3xl">
          <EmptyState
            icon={Tags}
            title={t("Aucune prestation pour le moment", "No services yet")}
            description={t(
              "Par exemple « Balade en quad, 1 h, 450 MAD ». Dès qu'elle est enregistrée, les clients des hôtels partenaires peuvent la réserver.",
              "For example “Quad bike ride, 1 hr, 450 MAD”. Once saved, guests at partner hotels can book it."
            )}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setEditor({ id: null, draft: EMPTY })}>
                {t("Ajouter ma première prestation", "Add my first service")}
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {services.map((s, i) => (
            <li
              key={s.id}
              className={` border rounded-2xl p-4 flex gap-4 transition-colors ${
                s.active
                  ? "bg-panel border-line"
                  : "bg-panel border-line"
              }`}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-fill">
                {s.image_url ? (
                  <Image
                    src={s.image_url}
                    alt=""
                    fill
                    unoptimized
                    sizes="80px"
                    className={`object-cover ${s.active ? "" : "opacity-50"}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-3">
                    <Tags size={22} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`font-ui text-[15px] font-semibold truncate ${s.active ? "text-ink" : "text-ink-3"}`}>
                      {s.name}
                    </p>
                    <p className="font-ui text-xs text-ink-3 mt-0.5">
                      {[s.duration, s.price].filter(Boolean).join(" · ") || t("Durée et prix à préciser", "Duration and price to be added")}
                    </p>
                  </div>
                  {!s.active && (
                    <span className="font-ui shrink-0 rounded-full border border-line-2 px-2 py-0.5 text-xs font-bold text-ink-3">
                      {t("masquée", "hidden")}
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="font-ui mt-1.5 text-xs leading-relaxed text-ink-3 line-clamp-2">
                    {s.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditor({ id: s.id, draft: { ...s } })}
                    className="font-ui inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-2 px-3 text-xs font-medium text-ink hover:bg-fill-2 transition-colors"
                  >
                    <Pencil size={13} strokeWidth={1.75} />
                    {t("Modifier", "Edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    className="font-ui inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-2 px-3 text-xs font-medium text-ink hover:bg-fill-2 transition-colors"
                  >
                    {s.active ? <EyeOff size={13} strokeWidth={1.75} /> : <Eye size={13} strokeWidth={1.75} />}
                    {s.active ? t("Masquer", "Hide") : t("Afficher", "Show")}
                  </button>
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(s, -1)}
                      disabled={i === 0}
                      aria-label={t("Monter", "Move up")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 hover:bg-fill-2 hover:text-ink disabled:opacity-25 transition-colors"
                    >
                      <ArrowUp size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(s, 1)}
                      disabled={i === services.length - 1}
                      aria-label={t("Descendre", "Move down")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 hover:bg-fill-2 hover:text-ink disabled:opacity-25 transition-colors"
                    >
                      <ArrowDown size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(s)}
                      aria-label={t("Supprimer", "Delete")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-danger hover:bg-danger-soft hover:text-danger transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editor && userId && (
        <ServiceEditor
          draft={editor.draft}
          isNew={editor.id === null}
          userId={userId}
          busy={busy}
          onChange={(draft) => setEditor({ ...editor, draft })}
          onClose={() => setEditor(null)}
          onSave={save}
          onError={(m) => notify(m, "error")}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
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

      <Toast message={toast?.message ?? null} tone={toast?.tone} />
    </div>
  );
}

function ServiceEditor({
  draft,
  isNew,
  userId,
  busy,
  onChange,
  onClose,
  onSave,
  onError,
}: {
  draft: Draft;
  isNew: boolean;
  userId: string;
  busy: boolean;
  onChange: (d: Draft) => void;
  onClose: () => void;
  onSave: () => void;
  onError: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const t = useT();
  const locale = useLocale();

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, userId, "service", 1200, locale);
      onChange({ ...draft, image_url: url });
    } catch (e) {
      onError(e instanceof Error ? e.message : t("Envoi de la photo impossible.", "Could not upload the photo."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? t("Nouvelle prestation", "New service") : t("Modifier la prestation", "Edit service")}
      description={t("Ce que le client lit avant de choisir sa date.", "What guests read before choosing their date.")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button variant="primary" onClick={onSave} loading={busy}>
            {isNew ? t("Ajouter au menu", "Add to menu") : t("Enregistrer", "Save")}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <Field label={t("Nom", "Name")} htmlFor="svc-name" hint={t("Ce que le client voit en premier.", "What guests see first.")}>
          <input
            id="svc-name"
            className={inputClass}
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder={t("Balade en quad", "Quad bike ride")}
            maxLength={80}
            autoFocus
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Durée", "Duration")} htmlFor="svc-duration">
            <input
              id="svc-duration"
              className={inputClass}
              value={draft.duration}
              onChange={(e) => onChange({ ...draft, duration: e.target.value })}
              placeholder={t("1 h", "1 hr")}
              maxLength={40}
            />
          </Field>
          <Field label={t("Prix", "Price")} htmlFor="svc-price">
            <input
              id="svc-price"
              className={inputClass}
              value={draft.price}
              onChange={(e) => onChange({ ...draft, price: e.target.value })}
              placeholder="450 MAD"
              maxLength={40}
              inputMode="decimal"
            />
          </Field>
        </div>
        <Field label={t("Description", "Description")} htmlFor="svc-desc" hint={t("Facultatif, 300 caractères.", "Optional, 300 characters.")}>
          <textarea
            id="svc-desc"
            className={`${inputClass} min-h-24 resize-none`}
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            placeholder={t(
              "Départ de la Palmeraie, casque et lunettes fournis, guide francophone.",
              "Departs from the Palmeraie, helmet and goggles provided, English-speaking guide."
            )}
            maxLength={300}
          />
        </Field>
        <Field
          label={t("Photo", "Photo")}
          hint={t(
            "Facultative. Sans photo, celle de votre fiche est utilisée.",
            "Optional. Without one, your listing photo is used."
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-fill">
              {draft.image_url ? (
                <Image src={draft.image_url} alt="" fill unoptimized sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-3">
                  <ImagePlus size={20} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={ImagePlus}
              loading={uploading}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {draft.image_url ? t("Changer", "Change") : t("Ajouter une photo", "Add a photo")}
            </Button>
            {draft.image_url && (
              <button
                type="button"
                onClick={() => onChange({ ...draft, image_url: null })}
                aria-label={t("Retirer la photo", "Remove photo")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 hover:bg-fill-2 hover:text-ink transition-colors"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </Field>
        <Switch
          checked={draft.active}
          onChange={(active) => onChange({ ...draft, active })}
          label={t("Visible sur le menu des hôtels", "Visible on hotel menus")}
        />
      </form>
    </Modal>
  );
}
