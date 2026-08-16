import { redirect } from "next/navigation";

/* L'onglet QR codes est devenu Chambres. */
export default async function LegacyQrCodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/hotel/chambres/${id}`);
}
