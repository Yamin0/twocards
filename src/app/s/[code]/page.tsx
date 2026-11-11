import type { Metadata } from "next";
import { loadGuestMenu } from "@/lib/booking/load";
import { getLocale, getT } from "@/lib/i18n/server";
import { GuestExperience } from "./guest-experience";

/* Page publique ouverte par le scan d'un QR code hôtel : aucun compte,
   aucune indexation — le lien n'a de sens qu'imprimé dans l'hôtel.

   Le menu (`qr_get_menu`) est chargé ici, côté serveur : le client reçoit une
   page déjà remplie au lieu d'attendre le JS, puis l'appel, puis les images.
   Le nom et la ville de l'hôtel viennent de son profil ; les paramètres `?h=`
   et `?c=` des anciens QR servent de secours. Le suivi du scan
   (`qr_track_scan`) reste dans le navigateur, une fois par session. */

type Search = { h?: string; c?: string; apercu?: string };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const [{ code }, { h }, t, locale] = await Promise.all([params, searchParams, getT(), getLocale()]);
  const result = await loadGuestMenu(code, locale);
  const hotelName = (result.status === "ready" ? result.hotel.hotelName : null) ?? h?.trim() ?? null;
  return {
    title: hotelName
      ? t(`${hotelName} · Votre conciergerie`, `${hotelName} · Your concierge`)
      : t("Votre conciergerie", "Your concierge"),
    description: t(
      "Restaurants, activités, clubs et services : réservez vos plus belles sorties.",
      "Restaurants, activities, clubs and services: book your finest outings."
    ),
    robots: { index: false, follow: false },
  };
}

export default async function GuestScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Search>;
}) {
  const [{ code }, { h, c, apercu }, locale] = await Promise.all([params, searchParams, getLocale()]);
  const result = await loadGuestMenu(code, locale);
  return (
    <GuestExperience
      code={code}
      result={result}
      fallbackHotelName={h?.trim() || null}
      fallbackCity={c?.trim() || null}
      preview={apercu === "1"}
    />
  );
}
