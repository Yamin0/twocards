import { ScrollVideoHero } from "@/components/landing/scroll-video-hero";
import { Activity } from "@/components/landing/activity";
import { Differentiators } from "@/components/landing/differentiators";
import { Platform } from "@/components/landing/platform";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)]">
      <main>
        {/* Tout le contenu défile en transparence sur la vidéo épinglée */}
        <ScrollVideoHero>
          <Activity variant="overlay" />
          <Differentiators variant="overlay" />
        </ScrollVideoHero>
        {/* Après la scène vidéo : ce que la plateforme fait, pour qui,
            avec une porte d'entrée par métier. */}
        <Platform />
      </main>
      <Footer />
    </div>
  );
}
