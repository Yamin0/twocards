import { Hero } from "@/components/landing/hero";
import { Testimonial } from "@/components/landing/testimonial";
import { ValueProps } from "@/components/landing/value-props";
import { Journey } from "@/components/landing/journey";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)]">
      <main>
        <Hero />
        <Testimonial />
        <ValueProps />
        <Journey />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
