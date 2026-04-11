"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-400/15 border border-red-400/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={26} strokeWidth={1.5} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-white/40 font-[family-name:var(--font-inter)] mb-8">
          Nous n&apos;avons pas pu charger cette page. Veuillez réessayer.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_30px_rgba(96,165,250,0.3)] font-[family-name:var(--font-manrope)]"
          >
            <RefreshCw size={16} strokeWidth={1.5} />
            Réessayer
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 font-medium transition-colors font-[family-name:var(--font-manrope)]"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Retour au dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
