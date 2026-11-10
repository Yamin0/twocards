import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Demander un accès | twocards.", "Request access | twocards."),
    description: t(
      "Hôtel, établissement, concierge ou créateur : rejoignez le réseau twocards.",
      "Hotel, venue, concierge or creator: join the twocards network.",
    ),
  };
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
