import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte | twocards.",
  description: "Créez votre compte twocards pour gérer vos réservations.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
