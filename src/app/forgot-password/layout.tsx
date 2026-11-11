import type { Metadata } from "next";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: ["Mot de passe oublié", "Forgot password"],
    description: [
      "Recevez un lien pour définir un nouveau mot de passe twocards.",
      "Get a link to set a new twocards password.",
    ],
    path: "/forgot-password",
    index: false,
  });
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
