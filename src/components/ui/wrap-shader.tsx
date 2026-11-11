"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/* Le shader WebGL (@paper-design/shaders-react) ne fait pas partie du
   premier chargement : son code n'est demandé qu'au moment où une bande
   qui le porte approche de l'écran. */
const Warp = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.Warp),
  { ssr: false },
);

/**
 * Voile shader animé à poser au-dessus d'une photo (absolute inset-0).
 * Palette champagne/encre accordée à la direction éditoriale ivoire ;
 * le mix-blend laisse la photo respirer tout en la rendant vivante.
 *
 * Il ne tourne que lorsqu'il est à l'écran, et jamais si le visiteur a
 * demandé moins d'animations : la photo reste alors seule.
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
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 mix-blend-overlay ${className}`}
      style={{ opacity }}
    >
      {visible && (
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
      )}
    </div>
  );
}
