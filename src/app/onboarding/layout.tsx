import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Configuration | twocards.", "Setup | twocards."),
    description: t("Configurez votre établissement sur twocards.", "Set up your venue on twocards."),
  };
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
