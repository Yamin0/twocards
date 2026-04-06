import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/landing/hero";
import { TabletShowcase } from "@/components/landing/tablet-showcase";
import { Features } from "@/components/landing/features";
import { GlobeSection } from "@/components/landing/globe-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SocialProof } from "@/components/landing/social-proof";
import { CinematicSection } from "@/components/landing/cinematic-section";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-[88px]">
        <Hero />
        <GlobeSection />
        <Features />
        <HowItWorks />
        <SocialProof />
        <CinematicSection />
        <TabletShowcase />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
