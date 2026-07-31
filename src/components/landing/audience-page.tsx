"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { AudiencesStrip } from "@/components/landing/audiences-strip";
import { Footer } from "@/components/layout/footer";
import { GlassButton, GlassFilter } from "@/components/ui/liquid-glass";
import { WarpOverlay, WarpBackground } from "@/components/ui/wrap-shader";

export interface AudiencePageData {
  label: string;
  titleStart: string;
  titleAccent: string;
  titleEnd: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  steps: { title: string; description: string }[];
  image: string;
  imageAlt: string;
  statement: string;
  gainsTitle: string;
  gainsAccent: string;
  gains: { title: string; description: string }[];
  faq: { q: string; a: string }[];
  finalTitle: string;
  finalAccent: string;
  finalText: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export function AudiencePage({ data }: { data: AudiencePageData }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)] font-body">
      <GlassFilter />

      {/* Héros sur fond shader */}
      <div className="relative overflow-hidden">
        <WarpBackground speed={0.3} />
        <LandingNavbar />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-16 text-center md:pb-28 md:pt-24">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-8 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]"
          >
            {data.label}
          </motion.p>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-8 font-title text-[34px] font-normal leading-[1.15] tracking-[-0.02em] md:text-[56px]"
          >
            {data.titleStart} <em className="italic">{data.titleAccent}</em>
            {data.titleEnd}
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-10 max-w-2xl text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70"
          >
            {data.subtitle}
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col items-center gap-5 sm:flex-row"
          >
            <Link
              href={data.primaryCta.href}
              className="rounded-full bg-[var(--landing-ink)] px-8 py-3.5 text-[14px] font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-80"
            >
              {data.primaryCta.label}
            </Link>
            <Link
              href={data.secondaryCta.href}
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/60 underline decoration-black/20 underline-offset-4 transition-colors hover:text-[var(--landing-ink)]"
            >
              {data.secondaryCta.label}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Trois étapes */}
      <section className="border-t border-black/[0.06] px-6 py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center font-title text-3xl font-normal leading-tight md:text-4xl"
          >
            Trois étapes. <em className="italic">Un seul réseau.</em>
          </motion.h2>

          <div className="grid gap-0 md:grid-cols-3">
            {data.steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border-t border-black/[0.08] px-1 py-10 md:px-6"
              >
                <span className="font-title text-[26px] font-normal leading-none text-[var(--landing-mute)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-[16px] font-medium leading-snug">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bande photo + statement */}
      <section
        className="relative flex min-h-[50vh] items-center justify-center overflow-hidden px-6 py-24"
        style={{
          background: `url("${data.image}") center center / cover`,
        }}
      >
        <WarpOverlay opacity={0.45} speed={0.3} />
        <div className="absolute inset-0 bg-black/45" />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl text-center font-title text-2xl font-normal leading-snug text-white md:text-4xl"
        >
          {data.statement}
        </motion.p>
      </section>

      {/* Ce que vous y gagnez */}
      <section className="px-6 py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center font-title text-3xl font-normal leading-tight md:text-4xl"
          >
            {data.gainsTitle} <em className="italic">{data.gainsAccent}</em>
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {data.gains.map((gain, i) => (
              <motion.div
                key={gain.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className="border-t border-black/[0.08] px-1 py-8 md:px-5"
              >
                <h3 className="text-[15px] font-medium leading-snug">
                  {gain.title}
                </h3>
                <p className="mt-3 text-[13px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {gain.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-black/[0.06] px-6 py-24 md:px-16 md:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Questions fréquentes
          </p>
          <h2 className="mb-14 text-center font-title text-3xl font-normal leading-tight md:text-4xl">
            Ce qu&apos;on nous demande <em className="italic">souvent</em>.
          </h2>

          <div className="flex flex-col">
            {data.faq.map((item) => (
              <details
                key={item.q}
                className="group border-t border-black/[0.08] last:border-b"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus
                    size={16}
                    strokeWidth={1.5}
                    className="shrink-0 text-[var(--landing-mute)] transition-transform duration-300 group-open:rotate-45"
                  />
                </summary>
                <p className="pb-6 pr-10 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/65">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Les autres métiers du réseau */}
      <AudiencesStrip exclude={pathname} />

      {/* CTA final */}
      <section className="border-t border-black/[0.06] px-6 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <h2 className="mb-5 font-title text-3xl font-normal leading-[1.15] md:text-5xl">
            {data.finalTitle} <em className="italic">{data.finalAccent}</em>
          </h2>
          <p className="mb-10 max-w-xl text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/70">
            {data.finalText}
          </p>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <GlassButton href={data.primaryCta.href}>
              <p className="text-base font-normal tracking-wide text-[var(--landing-ink)]">
                {data.primaryCta.label}
              </p>
            </GlassButton>
            <Link
              href={data.secondaryCta.href}
              className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-ink)]/60 transition-colors hover:text-[var(--landing-ink)]"
            >
              {data.secondaryCta.label}
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
