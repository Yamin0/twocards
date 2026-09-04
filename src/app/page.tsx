import { QrHero } from "@/components/landing/qr-hero";
import { QrFlow, QrAudiences } from "@/components/landing/qr-system";
import { Activity } from "@/components/landing/activity";
import { Differentiators } from "@/components/landing/differentiators";
import { FaqHome } from "@/components/landing/faq-home";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/layout/footer";

/* La page d'accueil porte le système QR : héros en deux volets avec la
   vidéo de présentation, puis le parcours du QR et les métiers qu'il sert.
   Les sections notifications et différenciateurs descendent ensuite, sur
   fond ivoire — la vidéo des portes pilotée par le scroll est passée sur la
   page Influenceurs. */
export default function Home() {
  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)]">
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
