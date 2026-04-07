"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <div className="bg-surface-card rounded-md editorial-shadow p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} strokeWidth={1.5} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)] mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mb-6">
          Nous n&apos;avons pas pu charger cette page. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          <RefreshCw size={16} strokeWidth={1.5} />
          Réessayer
        </button>
      </div>
    </div>
  );
}
