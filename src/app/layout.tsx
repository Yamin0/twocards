import type { Metadata } from "next";
import { Manrope, Inter, Nunito, Montserrat } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const montserrat = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "twocards. | Transformez chaque recommandation en réservation traçable",
  description:
    "TwoCards connecte les établissements aux concierges et RP vérifiés, synchronise les disponibilités et automatise l'attribution, les acomptes et les commissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${inter.variable} ${nunito.variable} ${montserrat.variable} scroll-smooth`}
    >
      <body>{children}</body>
    </html>
  );
}
