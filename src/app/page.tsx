import { ScrollVideoHero } from "@/components/landing/scroll-video-hero";
import { Activity } from "@/components/landing/activity";
import { Differentiators } from "@/components/landing/differentiators";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)]">
      <main>
        {/* La section « En temps réel » défile en transparence sur la vidéo */}
        <ScrollVideoHero>
          <Activity variant="overlay" />
        </ScrollVideoHero>
        <Differentiators />
      </main>
      <Footer />
    </div>
  );
}
