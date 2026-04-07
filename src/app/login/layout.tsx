import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | twocards.",
  description: "Connectez-vous à votre espace twocards.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
