import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HotelNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="num select-none font-display text-8xl font-black text-white/[0.06]">404</p>
        <div className="hotel-panel-solid -mt-10 p-10">
          <h1 className="font-display text-xl font-bold text-white">Page introuvable</h1>
          <p className="mt-2 text-sm text-white/50">Cette section n&apos;existe pas dans l&apos;espace hôtel.</p>
          <Link
            href="/hotel"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-sky-300 transition-colors hover:text-sky-200"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            Retour à la vue d&apos;ensemble
          </Link>
        </div>
      </div>
    </div>
  );
}
