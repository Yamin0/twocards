"use client";

import Image from "next/image";
import type { Ref } from "react";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { authHeadingClass, authIntroClass } from "@/components/landing/auth-shell";
import { getKinds } from "../_lib/signup-content";
import type { Kind } from "../_lib/signup-payload";

/* Écran 1 : « Vous êtes… ». Quatre métiers, un clic ouvre le formulaire.
   Le survol ou le focus d'un métier change la photo du panneau. */
export function KindStep({
  headingRef,
  onChoose,
  onPreview,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  onChoose: (kind: Kind) => void;
  onPreview: (kind: Kind | null) => void;
}) {
  const t = useT();
  const kinds = getKinds(t);
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className={authHeadingClass}>
        {t(
          <>
            Vous <em className="font-light italic">êtes</em>…
          </>,
          <>
            You <em className="font-light italic">are</em>…
          </>,
        )}
      </h1>
      <p className={authIntroClass}>
        {t(
          "Choisissez votre métier : il ne reste ensuite qu'un formulaire.",
          "Pick what you do: after that, there is just one form.",
        )}
      </p>

      <ul className="mt-9 border-t border-black/[0.08]" onMouseLeave={() => onPreview(null)}>
        {kinds.map((k) => (
          <li key={k.value} className="border-b border-black/[0.08]">
            <button
              type="button"
              onClick={() => onChoose(k.value)}
              onMouseEnter={() => onPreview(k.value)}
              onFocus={() => onPreview(k.value)}
              className="group flex w-full items-center gap-4 py-5 text-left outline-none focus-visible:bg-black/[0.04] sm:gap-6"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#1a1612] sm:h-[76px] sm:w-[76px]">
                <Image src={k.image} alt="" fill sizes="76px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-semibold tracking-[-0.015em] sm:text-[22px]">{k.label}</span>
                <span className="mt-1 block text-[14px] leading-snug text-[var(--landing-mute)] sm:text-[15px]">
                  {k.line}
                </span>
              </span>
              <ArrowRight
                size={20}
                strokeWidth={1.5}
                aria-hidden
                className="shrink-0 text-black/40 transition-all group-hover:translate-x-1 group-hover:text-[var(--landing-ink)]"
              />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
