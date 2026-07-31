import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--landing-ivory)] px-6 text-center font-body text-[var(--landing-ink)]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
        Erreur 404
      </p>
      <h1 className="font-title text-4xl font-normal leading-tight md:text-6xl">
        Cette table n&apos;existe <em className="italic">pas</em>.
      </h1>
      <p className="mt-5 max-w-md text-[15px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
        La page que vous cherchez a été déplacée ou n&apos;a jamais existé.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-[var(--landing-ink)] px-8 py-3.5 text-sm font-medium text-[var(--landing-ivory)] transition-opacity hover:opacity-85"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
