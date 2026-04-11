import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="px-6 pb-32 lg:px-12">
      <div className="mx-auto max-w-7xl liquid-glass-enhanced rounded-3xl px-8 py-16 text-center lg:px-16 lg:py-20">
        <h2 className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          Prêt à optimiser vos opérations ?
        </h2>
        <p className="mx-auto mt-4 max-w-md font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/50">
          Rejoignez les établissements qui transforment leur gestion de nuit
          avec twocards.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/signup"
            className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full px-8 py-3.5 text-sm shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:shadow-[0_0_30px_rgba(96,165,250,0.4)] transition-all duration-300 hover:scale-[1.02] font-[family-name:var(--font-manrope)] flex items-center gap-2"
          >
            Demander un accès anticipé
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3.5 font-[family-name:var(--font-manrope)] text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
          >
            Planifier une démo
          </Link>
        </div>
      </div>
    </section>
  );
}
