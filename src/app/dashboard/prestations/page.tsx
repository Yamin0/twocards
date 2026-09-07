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
      notify("Donnez un nom à la prestation.", "error");
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
      notify("Enregistrement impossible. Réessayez.", "error");
      return;
    }
    setEditor(null);
    notify(editor.id ? "Prestation mise à jour." : "Prestation ajoutée, visible sur le menu.");
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
      notify("Changement impossible. Réessayez.", "error");
    } else {
      notify(next ? "Visible sur le menu." : "Retirée du menu.");
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
      notify("Réordonnancement impossible.", "error");
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
      notify("Suppression impossible.", "error");
      return;
    }
    notify("Prestation supprimée.");
    load();
  };

  const visible = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-light text-white">Prestations</h1>
            <p className="font-ui text-sm text-white/60 mt-2 max-w-xl">
              Ce que vos clients peuvent réserver : durée, prix, une photo.
              Chaque prestation visible apparaît aussitôt sous votre fiche dans
              le menu des hôtels partenaires, et le client la choisit avec sa
              date.
            </p>
            {!isActivityVenue && (
              <p className="font-ui mt-2 text-xs text-amber-300/80">
                Votre compte est enregistré comme restaurant ou club : les
                prestations servent surtout aux activités et services, mais
                rien ne vous empêche d&apos;y mettre vos formules.
              </p>
            )}
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setEditor({ id: null, draft: EMPTY })}
            className="shrink-0"
          >
            Nouvelle prestation
          </Button>
        </div>
        {services.length > 0 && (
          <p className="font-ui mt-4 border-t border-white/[0.08] pt-4 text-xs text-white/50">
            {services.length} prestation{services.length > 1 ? "s" : ""} ·{" "}
            <span className="text-white/80">{visible} visible{visible > 1 ? "s" : ""}</span> sur le
            menu · l&apos;ordre ci-dessous est celui du menu.
          </p>
        )}
      </div>

      {services.length === 0 ? (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl">
          <EmptyState
            icon={Tags}
            title="Aucune prestation pour le moment"
            description="Par exemple « Balade en quad, 1 h, 450 MAD ». Dès qu'elle est enregistrée, les clients des hôtels partenaires peuvent la réserver."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setEditor({ id: null, draft: EMPTY })}>
                Ajouter ma première prestation
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {services.map((s, i) => (
            <li
              key={s.id}
              className={`backdrop-blur-2xl border rounded-2xl p-4 flex gap-4 transition-colors ${
                s.active
                  ? "bg-black/45 border-white/[0.12]"
                  : "bg-black/30 border-white/[0.06]"
              }`}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
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
                  <div className="flex h-full w-full items-center justify-center text-white/25">
                    <Tags size={22} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`font-ui text-[15px] font-semibold truncate ${s.active ? "text-white" : "text-white/50"}`}>
                      {s.name}
                    </p>
                    <p className="font-ui text-xs text-white/50 mt-0.5">
                      {[s.duration, s.price].filter(Boolean).join(" · ") || "Durée et prix à préciser"}
                    </p>
                  </div>
                  {!s.active && (
                    <span className="font-ui shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                      masquée
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="font-ui mt-1.5 text-xs leading-relaxed text-white/45 line-clamp-2">
                    {s.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditor({ id: s.id, draft: { ...s } })}
                    className="font-ui inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    <Pencil size={13} strokeWidth={1.75} />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    className="font-ui inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors"
                  >
                    {s.active ? <EyeOff size={13} strokeWidth={1.75} /> : <Eye size={13} strokeWidth={1.75} />}
                    {s.active ? "Masquer" : "Afficher"}
                  </button>
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(s, -1)}
                      disabled={i === 0}
                      aria-label="Monter"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-25 transition-colors"
                    >
                      <ArrowUp size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(s, 1)}
                      disabled={i === services.length - 1}
                      aria-label="Descendre"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-25 transition-colors"
                    >
                      <ArrowDown size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(s)}
                      aria-label="Supprimer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
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
        title="Supprimer cette prestation ?"
        description={
          deleting
            ? `« ${deleting.name} » disparaît du menu immédiatement. Les réservations déjà reçues sont conservées.`
            : undefined
        }
        confirmLabel="Supprimer"
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

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, userId, "service", 1200);
      onChange({ ...draft, image_url: url });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Envoi de la photo impossible.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Nouvelle prestation" : "Modifier la prestation"}
      description="Ce que le client lit avant de choisir sa date."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button variant="primary" onClick={onSave} loading={busy}>
            {isNew ? "Ajouter au menu" : "Enregistrer"}
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
        <Field label="Nom" htmlFor="svc-name" hint="Ce que le client voit en premier.">
          <input
            id="svc-name"
            className={inputClass}
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder="Balade en quad"
            maxLength={80}
            autoFocus
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Durée" htmlFor="svc-duration">
            <input
              id="svc-duration"
              className={inputClass}
              value={draft.duration}
              onChange={(e) => onChange({ ...draft, duration: e.target.value })}
              placeholder="1 h"
              maxLength={40}
            />
          </Field>
          <Field label="Prix" htmlFor="svc-price">
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
        <Field label="Description" htmlFor="svc-desc" hint="Facultatif, 300 caractères.">
          <textarea
            id="svc-desc"
            className={`${inputClass} min-h-24 resize-none`}
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            placeholder="Départ de la Palmeraie, casque et lunettes fournis, guide francophone."
            maxLength={300}
          />
        </Field>
        <Field label="Photo" hint="Facultative. Sans photo, celle de votre fiche est utilisée.">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
              {draft.image_url ? (
                <Image src={draft.image_url} alt="" fill unoptimized sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/25">
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
              {draft.image_url ? "Changer" : "Ajouter une photo"}
            </Button>
            {draft.image_url && (
              <button
                type="button"
                onClick={() => onChange({ ...draft, image_url: null })}
                aria-label="Retirer la photo"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </Field>
        <Switch
          checked={draft.active}
          onChange={(active) => onChange({ ...draft, active })}
          label="Visible sur le menu des hôtels"
        />
      </form>
    </Modal>
  );
}
