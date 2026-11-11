"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Avatar } from "@/components/shared/avatar";
import { useT } from "@/lib/i18n/client";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 512;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/* Recadrage carré et réduction avant l'envoi : une photo prise au téléphone
   pèse plusieurs mégaoctets alors qu'elle s'affiche dans un cercle de 36 px.
   On stocke donc une vignette de 512 px, légère à charger partout. */
async function toSquareThumbnail(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(side, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas indisponible");
  }

  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size
  );
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Conversion impossible")),
      "image/webp",
      0.85
    );
  });
}

/* Envoi de la photo de profil, partagé par les espaces établissement,
   concierge et hôtel. L'image part dans le bucket « avatars » sous un dossier
   au nom de l'utilisateur (les règles de sécurité Supabase n'autorisent que
   ce chemin), puis son URL est enregistrée dans les métadonnées du compte —
   ce qui met à jour l'avatar dans toute l'application sans rechargement. */
export function AvatarUploader({
  onMessage,
  label,
}: {
  onMessage?: (message: string) => void;
  label?: string;
}) {
  const t = useT();
  const { avatarUrl, initials, userId } = useAuthUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError(t("Format non pris en charge. Utilisez JPG, PNG, WebP ou GIF.", "Unsupported format. Use JPG, PNG, WebP or GIF."));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("Image trop lourde : 10 Mo maximum.", "Image too large: 10 MB maximum."));
      return;
    }
    if (!userId) {
      setError(t("Session expirée. Reconnectez-vous puis réessayez.", "Session expired. Log in again and retry."));
      return;
    }

    setBusy(true);

    let thumbnail: Blob;
    try {
      thumbnail = await toSquareThumbnail(file);
    } catch {
      setError(t("Image illisible. Essayez un autre fichier.", "We couldn’t read this image. Try another file."));
      setBusy(false);
      return;
    }

    const supabase = createClient();
    /* Nom unique à chaque envoi : réutiliser le même chemin ferait resservir
       l'ancienne image depuis le cache du CDN. */
    const fileName = `${crypto.randomUUID()}.webp`;
    const path = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, thumbnail, { contentType: "image/webp" });

    if (uploadError) {
      setError(t("L'envoi a échoué. Réessayez.", "Upload failed. Please try again."));
      setBusy(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: metaError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (metaError) {
      await supabase.storage.from("avatars").remove([path]);
      setError(t("La photo n'a pas pu être enregistrée. Réessayez.", "The photo couldn’t be saved. Please try again."));
      setBusy(false);
      return;
    }

    /* Ménage des envois précédents : sans cela chaque nouvelle photo
       laisserait l'ancienne dans le bucket. */
    const { data: existing } = await supabase.storage
      .from("avatars")
      .list(userId);
    const stale = (existing ?? [])
      .filter((item) => item.name !== fileName)
      .map((item) => `${userId}/${item.name}`);
    if (stale.length > 0) {
      await supabase.storage.from("avatars").remove(stale);
    }

    setBusy(false);
    onMessage?.(t("Photo de profil mise à jour", "Profile photo updated"));
  };

  const handleRemove = async () => {
    if (!userId) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();

    const { error: metaError } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    });
    if (metaError) {
      setError(t("La photo n'a pas pu être retirée. Réessayez.", "The photo couldn’t be removed. Please try again."));
      setBusy(false);
      return;
    }

    const { data: existing } = await supabase.storage
      .from("avatars")
      .list(userId);
    const paths = (existing ?? []).map((item) => `${userId}/${item.name}`);
    if (paths.length > 0) {
      await supabase.storage.from("avatars").remove(paths);
    }

    setBusy(false);
    onMessage?.(t("Photo de profil retirée", "Profile photo removed"));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar
            url={avatarUrl}
            initials={initials}
            size={80}
            className="border border-line-2 bg-info-soft"
            textClassName="text-2xl font-bold text-info"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label={t("Changer la photo de profil", "Change profile photo")}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-link text-white shadow-lg transition-colors hover:bg-link-strong disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} strokeWidth={1.5} />
            )}
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">{label ?? t("Photo de profil", "Profile photo")}</p>
          <p className="mt-0.5 text-xs text-ink-3">
            {t(
              <>
                JPG, PNG, WebP ou GIF · 10 Mo maximum. L&apos;image est recadrée en
                carré automatiquement.
              </>,
              <>JPG, PNG, WebP or GIF · 10 MB maximum. The image is cropped to a square automatically.</>,
            )}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-xs font-medium text-info transition-opacity hover:underline disabled:opacity-50"
            >
              {avatarUrl ? t("Changer la photo", "Change photo") : t("Ajouter une photo", "Add a photo")}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="flex items-center gap-1 text-xs font-medium text-danger transition-colors hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={12} strokeWidth={1.5} />
                {t("Retirer", "Remove")}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          /* Réinitialisé pour que renvoyer le même fichier déclenche
             à nouveau l'événement. */
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
