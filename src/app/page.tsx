import { Hero } from "@/components/landing/hero";
import { Testimonial } from "@/components/landing/testimonial";
import { AudiencesStrip } from "@/components/landing/audiences-strip";
import { VenuesCarousel } from "@/components/landing/venues-carousel";
import { Differentiators } from "@/components/landing/differentiators";
import { Activity } from "@/components/landing/activity";
import { Journey } from "@/components/landing/journey";
import { Standards } from "@/components/landing/standards";
import { NetworkBento } from "@/components/landing/network-bento";
import { FaqHome } from "@/components/landing/faq-home";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)]">
      <main>
        <Hero />
        <Testimonial />
        <AudiencesStrip />
        <VenuesCarousel />
        <Differentiators />
        <Activity />
        <Journey />
        <Standards />
        <NetworkBento />
        <FaqHome />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
