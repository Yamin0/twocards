import { notFound } from "next/navigation";
import { KitPreview } from "./kit-preview";

export const metadata = { title: "Kit | twocards.", robots: { index: false, follow: false } };

/* Planche du kit d'interface et de la coque, sans aucune donnée. Elle
   n'existe qu'en développement : en production, la page répond 404. */
export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitPreview />;
}
