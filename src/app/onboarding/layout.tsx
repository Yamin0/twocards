import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuration | twocards.",
  description: "Configurez votre établissement sur twocards.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
