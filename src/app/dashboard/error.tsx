"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className=" bg-panel border border-line rounded-3xl p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-danger-soft border border-danger/25 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={26} strokeWidth={1.5} className="text-danger" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">
          {t("Une erreur est survenue", "Something went wrong")}
        </h2>
        <p className="text-sm text-ink-3 font-ui mb-8">
          {t(
            "Nous n'avons pas pu charger cette page. Veuillez réessayer.",
            "We couldn't load this page. Please try again.",
          )}
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-link hover:bg-link-strong text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_30px_rgba(96,165,250,0.3)] font-ui"
          >
            <RefreshCw size={16} strokeWidth={1.5} />
            {t("Réessayer", "Try again")}
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink-2 font-medium transition-colors font-ui"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            {t("Retour au dashboard", "Back to dashboard")}
          </a>
        </div>
      </div>
    </div>
  );
}
