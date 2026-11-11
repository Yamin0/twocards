"use client";

import Link from "next/link";
import type { Ref } from "react";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { authHeadingClass, authIntroClass } from "@/components/landing/auth-shell";

/* Écran de fin : le compte est créé, il reste à confirmer l'adresse. */
export function DoneStep({
  headingRef,
  email,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  email: string;
}) {
  const t = useT();
  const address = <span className="font-medium text-[var(--landing-ink)]">{email}</span>;
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className={authHeadingClass}>
        {t("Vérifiez votre boîte mail.", "Check your inbox.")}
      </h1>
      <p className={authIntroClass}>
        {t(
          <>Un lien de confirmation vient d&apos;être envoyé à {address}. Cliquez dessus pour activer votre compte.</>,
          <>We&apos;ve just sent a confirmation link to {address}. Click it to activate your account.</>,
        )}
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
      >
        {t("Aller à la connexion", "Go to log in")}
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
      </Link>
    </>
  );
}
