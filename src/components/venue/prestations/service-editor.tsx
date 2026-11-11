"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { uploadImage } from "@/lib/hotel/upload-image";
import { useLocale, useT } from "@/lib/i18n/client";
import { Button, Field, IconButton, Modal, Switch, inputClass, useNotify } from "@/components/app/ui";
import type { VenueServiceDraft } from "@/hooks/use-venue-services";

/* Fenêtre de création ou de modification d'une prestation. */
export function ServiceEditor({
  draft,
  isNew,
  userId,
  busy,
  onChange,
  onClose,
  onSave,
}: {
  draft: VenueServiceDraft;
  isNew: boolean;
  userId: string;
  busy: boolean;
  onChange: (d: VenueServiceDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, userId, "service", 1200, locale);
      onChange({ ...draft, image_url: url });
    } catch (e) {
      notify(
        e instanceof Error ? e.message : t("Envoi de la photo impossible.", "Could not upload the photo."),
        "error"
      );
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
        <Field
          label={t("Nom", "Name")}
          htmlFor="svc-name"
          hint={t("Ce que le client voit en premier.", "What guests see first.")}
        >
          <input
            id="svc-name"
            className={inputClass}
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder={t("Balade en quad", "Quad bike ride")}
            maxLength={80}
            data-autofocus
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
        <Field
          label={t("Description", "Description")}
          htmlFor="svc-desc"
          hint={t("Facultatif, 300 caractères.", "Optional, 300 characters.")}
        >
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
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-fill-2">
              {draft.image_url ? (
                <Image src={draft.image_url} alt="" fill unoptimized sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-3">
                  <ImagePlus size={20} strokeWidth={1.5} aria-hidden />
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
            <Button size="sm" icon={ImagePlus} loading={uploading} onClick={() => fileRef.current?.click()}>
              {draft.image_url ? t("Changer", "Change") : t("Ajouter une photo", "Add a photo")}
            </Button>
            {draft.image_url && (
              <IconButton
                icon={X}
                label={t("Retirer la photo", "Remove photo")}
                onClick={() => onChange({ ...draft, image_url: null })}
              />
            )}
          </div>
        </Field>
        <div className="flex items-center gap-3">
          <Switch
            checked={draft.active}
            onChange={(active) => onChange({ ...draft, active })}
            label={t("Visible sur le menu des hôtels", "Visible on hotel menus")}
          />
          <span className="text-sm text-ink-2" aria-hidden>
            {t("Visible sur le menu des hôtels", "Visible on hotel menus")}
          </span>
        </div>
      </form>
    </Modal>
  );
}
