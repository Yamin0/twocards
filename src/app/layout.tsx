import type { Metadata, Viewport } from "next";
import { Manrope, Inter, Nunito } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

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


// Gotham — licence client. Seul le Book (+ italique) est fourni.
const gotham = localFont({
  variable: "--font-gotham",
  display: "swap",
  src: [
    { path: "./fonts/gotham-book-webfont.woff2", weight: "400", style: "normal" },
    {
      path: "./fonts/gotham-bookitalic-webfont.woff2",
      weight: "400",
      style: "italic",
    },
  ],
});

// Suisse Int'l — licence client. Book et Bold seulement : les poids Black
// fournis ne sont utilisés nulle part et seraient préchargés pour rien.
const suisse = localFont({
  variable: "--font-suisse",
  display: "swap",
  src: [
    { path: "./fonts/SuisseIntl-Book.woff2", weight: "400", style: "normal" },
    { path: "./fonts/SuisseIntl-Bold.woff2", weight: "700", style: "normal" },
  ],
});

// Satoshi — page d'accueil. Fonte variable (300 à 900, droit et italique) :
// une seule paire de fichiers couvre toutes les graisses de la landing.
const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [
    {
      path: "./fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
});

/* Teinte la barre de Safari iOS (et le chrome des navigateurs mobiles) dans
   le noir de la navbar au lieu du blanc par défaut : la barre se fond dans le
   site. Même valeur que l'écran de chargement du héros (#0a0a0a). */
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

/* Titre et description dans la langue du visiteur. */
export async function generateMetadata(): Promise<Metadata> {
  const en = (await getLocale()) === "en";
  const title = en
    ? "twocards. | One QR code, from the room to the commission"
    : "twocards. | Un seul QR code, de la chambre à la commission";
  const description = en
    ? "A QR code in the room, a link by email or WhatsApp: your guest discovers your selection, books in seconds, and you track everything: arrival, verified bill, commission."
    : "Un QR en chambre, un lien par e-mail ou WhatsApp : votre client découvre votre sélection, réserve en quelques secondes, et vous suivez tout, arrivée, facture vérifiée, commission.";
  const ogTitle = en
    ? "twocards. | The channel manager for concierges & PRs"
    : "twocards. | Le channel manager des concierges & RP";
  const ogDescription = en
    ? "Every recommendation becomes a trackable booking: attribution, deposits, check-in, verified bills and automated commissions."
    : "Chaque recommandation devient une réservation traçable : attribution, acomptes, check-in, factures vérifiées et commissions automatisées.";
  return {
    metadataBase: new URL("https://twocardspro.com"),
    title,
    description,
    openGraph: {
      type: "website",
      locale: en ? "en_GB" : "fr_FR",
      alternateLocale: en ? "fr_FR" : "en_GB",
      siteName: "twocards.",
      title: ogTitle,
      description: ogDescription,
    },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${inter.variable} ${nunito.variable} ${gotham.variable} ${suisse.variable} ${satoshi.variable} scroll-smooth`}
    >
      <body>
        {/* L'application mobile affiche ces mêmes pages dans une WebView et
            porte déjà le logo, le compte et la navigation par onglets. Elle
            s'annonce par son agent utilisateur ; la classe est posée avant
            le rendu du contenu pour éviter tout clignotement. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(navigator.userAgent.indexOf('TwocardsApp')>-1)document.documentElement.classList.add('tc-app')}catch(e){}",
          }}
        />
        <LocaleProvider locale={locale}>
          <ImpersonationBanner />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
