"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { AuthShell, authLinkClass } from "@/components/landing/auth-shell";
import { PublicMotion } from "@/components/landing/public-motion";
import { DEFAULT_IMAGE, getKinds } from "../_lib/signup-content";
import type { Kind } from "../_lib/signup-payload";
import { useScreenHeading, useSignupForm } from "../_hooks/use-signup-form";
import { DoneStep } from "./done-step";
import { FormStep } from "./form-step";
import { KindStep } from "./kind-step";

/* Demande d'accès en deux écrans : le métier (« Vous êtes… »), puis un seul
   formulaire qui réunit ce qui concerne le métier et les coordonnées du
   compte. Arrivé d'une page métier (?role=hotel…), on ouvre directement sur
   le formulaire. Sur grand écran, une photo du métier occupe la moitié
   gauche ; mêmes images que l'accordéon de l'accueil. */

/* Changement d'écran : fondu et léger glissement. En mouvement réduit, le
   fondu seul : PublicMotion n'anime plus le déplacement, mais l'écran
   sauterait encore de quelques pixels si on le lui demandait. */
const TRANSITION = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };
const SLIDE = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: TRANSITION,
};
const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: TRANSITION,
};

export function SignupFlow({ initialKind }: { initialKind: Kind | null }) {
  const t = useT();
  const f = useSignupForm(initialKind);
  const screen = f.done ? "done" : f.step === 1 || !f.kind ? "step-1" : `step-2-${f.kind}`;
  const headingRef = useScreenHeading(screen);
  const screenMotion = useReducedMotion() ? FADE : SLIDE;
  const [previewed, setPreviewed] = useState<Kind | null>(null);

  const kinds = getKinds(t);
  const shown = kinds.find((k) => k.value === (f.step === 1 ? previewed ?? f.kind : f.kind));

  return (
    <PublicMotion>
      <AuthShell
        image={shown?.image ?? DEFAULT_IMAGE}
        caption={
          shown
            ? shown.caption
            : t(
                "Hôtels, établissements, concierges et créateurs : un même réseau, chaque réservation suivie.",
                "Hotels, venues, concierges and creators: one network, every reservation tracked.",
              )
        }
        maxWidth="max-w-[520px]"
        headerLink={
          <>
            <span className="hidden sm:inline">{t("Déjà un compte ? ", "Already have an account? ")}</span>
            <Link href="/login" className={authLinkClass}>
              {t("Se connecter", "Log in")}
            </Link>
          </>
        }
      >
        {!f.done && (
          <div className="mb-8">
            <div className="flex gap-1.5" aria-hidden>
              {[1, 2].map((n) => (
                <span
                  key={n}
                  className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
                    n <= f.step ? "bg-[var(--landing-ink)]" : "bg-black/10"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 flex min-h-11 items-center justify-between text-[14px] text-[var(--landing-mute)]">
              {f.step === 2 ? (
                <button
                  type="button"
                  onClick={f.back}
                  className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[var(--landing-ink)]/80 transition-colors hover:text-[var(--landing-ink)]"
                >
                  <ArrowLeft size={15} strokeWidth={1.75} aria-hidden />
                  {t("Changer de métier", "Change profile")}
                </button>
              ) : (
                <span>{t("Demander un accès", "Request access")}</span>
              )}
              <span>{t(`Étape ${f.step} sur 2`, `Step ${f.step} of 2`)}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {screen === "done" ? (
            <motion.div key={screen} {...screenMotion} role="status">
              <DoneStep headingRef={headingRef} email={f.form.email} />
            </motion.div>
          ) : screen === "step-1" ? (
            <motion.div key={screen} {...screenMotion}>
              <KindStep headingRef={headingRef} onChoose={f.chooseKind} onPreview={setPreviewed} />
            </motion.div>
          ) : (
            <motion.div key={screen} {...screenMotion}>
              <FormStep f={f} headingRef={headingRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </AuthShell>
    </PublicMotion>
  );
}
