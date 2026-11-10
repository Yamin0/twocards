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
