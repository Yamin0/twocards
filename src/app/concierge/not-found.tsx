import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function ConciergeNotFound() {
  const t = await getT();
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <p className="text-8xl font-extrabold text-white/[0.06] font-ui mb-2 select-none">
          404
        </p>
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-10 -mt-10">
          <h1 className="text-xl font-bold text-white mb-2">
            {t("Page introuvable", "Page not found")}
          </h1>
          <p className="text-sm text-white/40 font-ui mb-6">
            {t("Cette section n'existe pas.", "This section doesn't exist.")}
          </p>
          <Link
            href="/concierge"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors font-ui"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            {t("Retour au tableau de bord", "Back to dashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
