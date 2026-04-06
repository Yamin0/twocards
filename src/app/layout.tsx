import type { Metadata } from "next";
import { Manrope, Inter, Nunito } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "twocards. | CRM B2B pour les établissements de nuit",
  description: "Gérez les listes d'invités, les réservations de tables et votre réseau de RP et concierges depuis un tableau de bord unique.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${inter.variable} ${nunito.variable} scroll-smooth`}
    >
      <body>{children}</body>
    </html>
  );
}
