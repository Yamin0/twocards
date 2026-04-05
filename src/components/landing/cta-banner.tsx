import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="mx-6 mb-32 lg:mx-12">
      <div className="mx-auto max-w-7xl rounded-sm bg-primary px-8 py-16 text-center lg:px-16 lg:py-20">
        <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-white sm:text-4xl">
          Pret a optimiser vos operations ?
        </h2>
        <p className="mx-auto mt-4 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-primary-container">
          Rejoignez les etablissements qui transforment leur gestion de nuit
          avec twocards.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/signup"
            className="rounded-sm bg-white px-6 py-3 font-[family-name:var(--font-manrope)] text-sm font-semibold text-primary-dark transition-opacity hover:opacity-90"
          >
            Demander un acces anticipe
          </Link>
          <Link
            href="#contact"
            className="rounded-sm border border-white/30 px-6 py-3 font-[family-name:var(--font-manrope)] text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Planifier une demo
          </Link>
        </div>
      </div>
    </section>
  );
}
