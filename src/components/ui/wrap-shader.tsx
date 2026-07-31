"use client";

import { Warp } from "@paper-design/shaders-react";

/**
 * Voile shader animé à poser au-dessus d'une photo (absolute inset-0).
 * Palette champagne/encre accordée à la direction éditoriale ivoire ;
 * le mix-blend laisse la photo respirer tout en la rendant vivante.
 */
export function WarpOverlay({
  className = "",
  opacity = 0.5,
  speed = 0.4,
}: {
  className?: string;
  opacity?: number;
  speed?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 mix-blend-overlay ${className}`}
      style={{ opacity }}
    >
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={speed}
        colors={[
          "hsl(40, 45%, 12%)",
          "hsl(42, 60%, 80%)",
          "hsl(35, 35%, 38%)",
          "hsl(45, 70%, 90%)",
        ]}
      />
    </div>
  );
}

export default function WarpShaderHero() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={0.45}
          softness={1}
          distortion={0.25}
          swirl={0.8}
          swirlIterations={10}
          shape="checks"
          shapeScale={0.1}
          scale={1}
          rotation={0}
          speed={1}
          colors={[
            "hsl(200, 100%, 20%)",
            "hsl(160, 100%, 75%)",
            "hsl(180, 90%, 30%)",
            "hsl(170, 100%, 80%)",
          ]}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
        <div className="max-w-4xl w-full text-center space-y-8">
          <h1 className="text-white text-5xl md:text-7xl font-sans font-light text-balance">
            Elegant Shader Backgrounds
          </h1>

          <p className="text-white/90 text-xl md:text-2xl font-sans font-light leading-relaxed max-w-3xl mx-auto">
            Beautiful, performant shader effects that enhance your content
            without overwhelming it. Perfect for hero sections, landing pages,
            and modern web experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button className="px-8 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white font-medium hover:bg-white/30 transition-all duration-300 hover:scale-105">
              Get Started
            </button>
            <button className="px-8 py-4 bg-white rounded-full text-gray-800 font-medium hover:scale-105 transition-transform duration-300">
              View Examples
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
