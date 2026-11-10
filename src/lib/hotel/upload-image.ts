import { createClient } from "@/lib/supabase/client";
import { makeT, type Locale } from "@/lib/i18n";

/* Envoi d'une image dans le bucket « avatars », sous le dossier de
   l'utilisateur connecté (seule zone où les règles de stockage l'autorisent).
   L'image est redimensionnée et encodée en WebP dans le navigateur : une
   photo de téléphone pèse plusieurs mégaoctets pour une vignette de
   quelques centaines de pixels. Renvoie l'URL publique. */
export async function uploadImage(
  file: File,
  userId: string,
  prefix: string,
  maxWidth = 1200,
  locale: Locale = "fr"
): Promise<string> {
  const t = makeT(locale);
  if (!file.type.startsWith("image/"))
    throw new Error(t("Choisissez une image (JPG, PNG, WebP)", "Choose an image (JPG, PNG, WebP)"));
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error(t("Canvas indisponible", "Canvas unavailable"));
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error(t("Conversion impossible", "Image conversion failed")))), "image/webp", 0.85)
  );
  const supabase = createClient();
  const path = `${userId}/${prefix}-${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/webp" });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
