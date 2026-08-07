"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Avatar } from "@/components/shared/avatar";

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
  label = "Photo de profil",
}: {
  onMessage?: (message: string) => void;
  label?: string;
}) {
  const { avatarUrl, initials, userId } = useAuthUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Format non pris en charge. Utilisez JPG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image trop lourde : 10 Mo maximum.");
      return;
    }
    if (!userId) {
      setError("Session expirée. Reconnectez-vous puis réessayez.");
      return;
    }

    setBusy(true);

    let thumbnail: Blob;
    try {
      thumbnail = await toSquareThumbnail(file);
    } catch {
      setError("Image illisible. Essayez un autre fichier.");
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
      setError("L'envoi a échoué. Réessayez.");
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
      setError("La photo n'a pas pu être enregistrée. Réessayez.");
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
    onMessage?.("Photo de profil mise à jour");
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
      setError("La photo n'a pas pu être retirée. Réessayez.");
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
    onMessage?.("Photo de profil retirée");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar
            url={avatarUrl}
            initials={initials}
            size={80}
            className="border border-white/20 bg-blue-500/20"
            textClassName="text-2xl font-bold text-blue-400"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label="Changer la photo de profil"
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} strokeWidth={1.5} />
            )}
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-0.5 text-xs text-white/40">
            JPG, PNG, WebP ou GIF — 10 Mo maximum. L&apos;image est recadrée en
            carré automatiquement.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-xs font-medium text-blue-400 transition-opacity hover:underline disabled:opacity-50"
            >
              {avatarUrl ? "Changer la photo" : "Ajouter une photo"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="flex items-center gap-1 text-xs font-medium text-red-400/80 transition-colors hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 size={12} strokeWidth={1.5} />
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400" role="alert">
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
