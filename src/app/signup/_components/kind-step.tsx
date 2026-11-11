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
              /* Survol et focus clavier : la ligne passe en encre, texte
                 blanc. Le retrait négatif garde photos et textes alignés
                 sur le titre, le fond déborde de la marge. */
              className="group -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-xl px-3 py-5 text-left outline-none transition-colors duration-200 hover:bg-[var(--landing-ink)] hover:text-white focus-visible:bg-[var(--landing-ink)] focus-visible:text-white motion-reduce:transition-none sm:gap-6"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#1a1612] sm:h-[76px] sm:w-[76px]">
                <Image src={k.image} alt="" fill sizes="76px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-semibold tracking-[-0.015em] sm:text-[22px]">{k.label}</span>
                <span className="mt-1 block text-[14px] leading-snug text-[var(--landing-mute)] transition-colors duration-200 group-hover:text-white/75 group-focus-visible:text-white/75 sm:text-[15px]">
                  {k.line}
                </span>
              </span>
              <ArrowRight
                size={20}
                strokeWidth={1.5}
                aria-hidden
                className="shrink-0 text-black/40 transition-all group-hover:translate-x-1 group-hover:text-white group-focus-visible:text-white"
              />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
