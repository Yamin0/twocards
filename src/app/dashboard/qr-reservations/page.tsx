import { redirect } from "next/navigation";

/* Les deux pages de réservations ont fusionné : la page réelle vit
   désormais sur /dashboard/reservations. */
export default function LegacyQrReservationsPage() {
  redirect("/dashboard/reservations");
}
