import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--landing-ivory)] px-6 text-center font-body text-[var(--landing-ink)]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
        {t("Erreur 404", "Error 404")}
      </p>
      <h1 className="font-title text-4xl font-normal leading-tight md:text-6xl">
        {t(
          <>Cette table n&apos;existe <em className="italic">pas</em>.</>,
          <>This table doesn&apos;t <em className="italic">exist</em>.</>
        )}
      </h1>
      <p className="mt-5 max-w-md text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
        {t(
          "La page que vous cherchez a été déplacée ou n'a jamais existé.",
          "The page you're looking for has moved or never existed."
        )}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-[var(--landing-ink)] px-8 py-3.5 text-sm font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-85"
      >
        {t("Retour à l'accueil", "Back to home")}
      </Link>
    </div>
  );
}
