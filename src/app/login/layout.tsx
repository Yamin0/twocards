import type { Metadata } from "next";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: ["Connexion", "Log in"],
    description: ["Connectez-vous à votre espace twocards.", "Log in to your twocards workspace."],
    path: "/login",
    index: false,
  });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
