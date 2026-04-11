import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { GlobeSection } from "@/components/landing/globe-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SocialProof } from "@/components/landing/social-proof";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen relative bg-[#0a0a0f] text-white overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/8 blur-[150px]" />
        <div className="absolute top-[40%] right-[5%] w-[40%] h-[40%] rounded-full bg-indigo-500/6 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main className="pt-[88px]">
          <Hero />
          <GlobeSection />
          <Features />
          <HowItWorks />
          <SocialProof />
          <CtaBanner />
        </main>
        <Footer />
      </div>
    </div>
  );
}
