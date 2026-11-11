import type { Metadata } from "next";
import { QrHero } from "@/components/landing/qr-hero";
import { QrFlow } from "@/components/landing/qr-system";
import { QrAudiences } from "@/components/landing/qr-audiences";
import { Activity } from "@/components/landing/activity";
import { Differentiators } from "@/components/landing/differentiators";
import { FaqHome } from "@/components/landing/faq-home";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/layout/footer";
import { getT } from "@/lib/i18n/server";

const SITE = "https://twocardspro.com";

/* Le titre et la description par défaut du layout racine sont ceux de
   l'accueil ; seule l'adresse canonique est précisée ici. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* La page d'accueil porte le système QR : héros avec le film de marque en
   grand, puis le parcours du QR et les métiers qu'il sert, les
   notifications, les outils du réseau, la FAQ et le bandeau final. Les
   quatre pages métiers reprennent les mêmes pièces (section-header.tsx). */
export default async function Home() {
  const t = await getT();

  /* Données structurées : qui publie le site (Organization) et le site
     lui-même (WebSite). Rien d'autre que ce qui est affiché sur le site. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "twocards.",
        alternateName: "TwoCards",
        url: SITE,
        logo: `${SITE}/logo-cards.png`,
        email: "contact@twocardspro.com",
        description: t(
          "Réseau de réservation à Marrakech : un QR code en chambre, des adresses vérifiées, des commissions calculées sur l'addition vérifiée.",
          "Booking network in Marrakech: an in-room QR code, verified venues, commissions calculated on the verified bill.",
        ),
        areaServed: { "@type": "City", name: "Marrakech" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name: "twocards.",
        inLanguage: ["fr", "en"],
        publisher: { "@id": `${SITE}/#organization` },
      },
    ],
  };

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <main>
        <QrHero />
        <QrFlow />
        <QrAudiences />
        <Activity />
        <Differentiators />
        <FaqHome />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
