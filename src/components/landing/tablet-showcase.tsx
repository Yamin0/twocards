"use client";

import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function TabletShowcase() {
  return (
    <section className="bg-primary-dark relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-dark via-primary-dark/95 to-primary-dark" />

      <div className="relative z-10">
        <ContainerScroll
          titleComponent={
            <div className="mx-auto max-w-7xl px-6 lg:px-12 text-center">
              <p className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-primary-container mb-4">
                Découvrez l&apos;interface
              </p>
              <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Un tableau de bord
                <br />
                <span className="text-on-primary-container">
                  pensé pour l&apos;action.
                </span>
              </h2>
            </div>
          }
        >
          <Image
            src="/dashboard-preview-v2.png"
            alt="twocards. — Tableau de bord"
            height={720}
            width={1400}
            className="mx-auto rounded-2xl object-cover h-full object-left-top"
            draggable={false}
          />
        </ContainerScroll>
      </div>
    </section>
  );
}
