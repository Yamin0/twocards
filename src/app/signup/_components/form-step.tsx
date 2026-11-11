"use client";

import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import {
  AuthAlert,
  AuthSubmit,
  authHeadingClass,
  authIntroClass,
  authLinkClass,
  useHydrated,
} from "@/components/landing/auth-shell";
import { getFormCopy } from "../_lib/signup-content";
import { MORE_ID, type SignupForm } from "../_hooks/use-signup-form";
import { AccountFields, KindFields, OptionalFields } from "./form-fields";

/* Écran 2 : un seul formulaire. Les champs obligatoires du métier, puis
   ceux du compte ; les facultatifs attendent derrière « Ajouter… » et
   s'ouvrent d'eux-mêmes s'ils contiennent une erreur. */

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id} className="space-y-6">
      <h2 id={id} className="text-[18px] font-semibold tracking-[-0.015em]">
        {title}
      </h2>
      {children}
    </div>
  );
}

export function FormStep({
  f,
  headingRef,
}: {
  f: SignupForm;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const t = useT();
  const hydrated = useHydrated();
  if (!f.kind) return null;
  const copy = getFormCopy(t)[f.kind];

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className={authHeadingClass}>
        {copy.title}
      </h1>
      <p className={authIntroClass}>{copy.intro}</p>

      <form onSubmit={f.submit} noValidate={hydrated} className="mt-9 space-y-9">
        {copy.group ? (
          <>
            <Group id="signup-group-kind" title={copy.group}>
              <KindFields f={f} />
            </Group>
            <Group id="signup-group-account" title={t("Votre compte", "Your account")}>
              <AccountFields f={f} />
            </Group>
          </>
        ) : (
          <div className="space-y-6">
            <AccountFields f={f} />
          </div>
        )}

        {f.moreOpen ? (
          <div id={MORE_ID}>
            <Group id="signup-group-more" title={t("Pour aller plus vite ensuite", "To save time later")}>
              <OptionalFields f={f} />
            </Group>
          </div>
        ) : (
          <button
            type="button"
            onClick={f.openMore}
            aria-expanded={false}
            className="flex min-h-11 w-full items-center gap-3 py-1 rounded-lg text-left text-[15px] text-[var(--landing-ink)]/80 transition-colors hover:text-[var(--landing-ink)]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/20">
              <Plus size={15} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-medium underline decoration-black/25 underline-offset-4">{copy.more}</span>{" "}
              <span className="text-[13px] text-[var(--landing-mute)]">({t("facultatif", "optional")})</span>
            </span>
          </button>
        )}

        <div className="space-y-6">
          {f.error && <AuthAlert>{f.error}</AuthAlert>}

          <AuthSubmit loading={f.loading}>{t("Créer mon compte", "Create my account")}</AuthSubmit>

          {/* Nouvel onglet : la saisie en cours n'est pas perdue. */}
          <p className="text-[13px] leading-relaxed text-[var(--landing-mute)]">
            {t(
              <>
                En créant votre compte, vous acceptez nos{" "}
                <Link href="/legal/cgu" target="_blank" className={authLinkClass}>
                  conditions générales d&apos;utilisation
                </Link>{" "}
                et notre{" "}
                <Link href="/legal/confidentialite" target="_blank" className={authLinkClass}>
                  politique de confidentialité
                </Link>
                .
              </>,
              <>
                By creating your account, you agree to our{" "}
                <Link href="/legal/cgu" target="_blank" className={authLinkClass}>
                  terms of use
                </Link>{" "}
                and our{" "}
                <Link href="/legal/confidentialite" target="_blank" className={authLinkClass}>
                  privacy policy
                </Link>
                .
              </>,
            )}
          </p>
        </div>
      </form>
    </>
  );
}
