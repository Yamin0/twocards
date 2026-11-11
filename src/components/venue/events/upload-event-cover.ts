import { createClient } from "@/lib/supabase/client";

/* Couverture d'événement : l'image est redimensionnée en webp côté
   navigateur puis envoyée dans le bucket avatars, sous le dossier de
   l'utilisateur, comme la couverture du portail. Seule l'adresse publique
   est enregistrée. Le préfixe event- et l'horodatage évitent d'écraser la
   couverture du portail. Lève une erreur si l'envoi échoue. */
export async function uploadEventCover(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no-user");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/webp", 0.85)
  );

  const path = `${user.id}/event-${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/webp" });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
