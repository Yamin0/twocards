import type { Metadata } from "next";
import { GuestExperience } from "./guest-experience";

/* Page publique ouverte par le scan d'un QR code hôtel : aucun compte,
   aucune indexation — le lien n'a de sens qu'imprimé dans l'hôtel. */
export const metadata: Metadata = {
  title: "Votre conciergerie | twocards.",
  description:
    "Restaurants, activités, clubs et services : réservez vos plus belles sorties.",
  robots: { index: false, follow: false },
};

export default async function GuestScanPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ h?: string; c?: string }>;
}) {
  const { code } = await params;
  const { h, c } = await searchParams;
  return (
    <GuestExperience
      code={code}
      hotelName={h?.trim() || null}
      city={c?.trim() || null}
    />
  );
}
