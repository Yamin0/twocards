import { redirect } from "next/navigation";

/* L'onglet QR codes est devenu Chambres. */
export default function LegacyQrCodesPage() {
  redirect("/hotel/chambres");
}
