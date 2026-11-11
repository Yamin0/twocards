import type { Metadata } from "next";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: ["Nouveau mot de passe", "New password"],
    description: [
      "Définissez un nouveau mot de passe pour votre espace twocards.",
      "Set a new password for your twocards workspace.",
    ],
    path: "/reset-password",
    index: false,
  });
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
