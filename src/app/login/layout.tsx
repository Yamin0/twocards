import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Connexion | twocards.", "Log in | twocards."),
    description: t("Connectez-vous à votre espace twocards.", "Log in to your twocards workspace."),
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
