"use client";

import { GlobeInteractive } from "@/components/ui/cobe-globe-interactive";
import { MapPin } from "lucide-react";

const cities = [
  { name: "Paris", flag: "🇫🇷", venues: 12 },
  { name: "Marrakech", flag: "🇲🇦", venues: 8 },
  { name: "Londres", flag: "🇬🇧", venues: 6 },
  { name: "Madrid", flag: "🇪🇸", venues: 4 },
];

export function GlobeSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-surface overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-semibold font-[family-name:var(--font-inter)] uppercase tracking-widest mb-4">
            Réseau international
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-dark font-[family-name:var(--font-manrope)] leading-tight">
            Présent là où la nuit
            <br />
            <span className="text-primary">prend vie.</span>
          </h2>
          <p className="mt-4 text-on-surface-variant text-sm sm:text-base max-w-xl mx-auto font-[family-name:var(--font-inter)] leading-relaxed">
            twocards connecte les meilleurs établissements et concierges
            à travers l&apos;Europe et l&apos;Afrique du Nord.
          </p>
        </div>

        {/* Globe + City cards layout */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left: City list (desktop) */}
          <div className="hidden lg:flex flex-col gap-3 w-56">
            {cities.slice(0, 2).map((city) => (
              <CityCard key={city.name} {...city} />
            ))}
          </div>

          {/* Center: Globe */}
          <div className="flex-1 w-full max-w-lg mx-auto">
            <GlobeInteractive speed={0.002} />
          </div>

          {/* Right: City list (desktop) */}
          <div className="hidden lg:flex flex-col gap-3 w-56">
            {cities.slice(2, 4).map((city) => (
              <CityCard key={city.name} {...city} />
            ))}
          </div>

          {/* Mobile: All cities in a row */}
          <div className="flex lg:hidden flex-wrap justify-center gap-3 w-full">
            {cities.map((city) => (
              <CityCard key={city.name} {...city} compact />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CityCard({
  name,
  flag,
  venues,
  compact = false,
}: {
  name: string;
  flag: string;
  venues: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-outline-variant/10 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
        compact ? "px-4 py-3" : "p-4"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{flag}</span>
        <div>
          <h3
            className={`font-bold text-on-background font-[family-name:var(--font-manrope)] ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            {name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-on-surface-variant font-[family-name:var(--font-inter)]">
            <MapPin size={11} strokeWidth={1.5} />
            {venues} établissements
          </p>
        </div>
      </div>
    </div>
  );
}
