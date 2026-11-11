import type { Metadata } from "next";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: ["Demander un accès", "Request access"],
    description: [
      "Hôtel, établissement, concierge ou créateur : rejoignez le réseau twocards.",
      "Hotel, venue, concierge or creator: join the twocards network.",
    ],
    path: "/signup",
    index: false,
  });
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
