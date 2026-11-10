import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demander un accès | twocards.",
  description: "Hôtel, établissement, concierge ou créateur : rejoignez le réseau twocards.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
