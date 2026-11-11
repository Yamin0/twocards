import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function HotelNotFound() {
  const t = await getT();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="num select-none font-display text-8xl font-black text-ink-4">404</p>
        <div className="hotel-panel-solid -mt-10 p-10">
          <h1 className="font-display text-xl font-bold text-ink">{t("Page introuvable", "Page not found")}</h1>
          <p className="mt-2 text-sm text-ink-3">
            {t(
              <>Cette section n&apos;existe pas dans l&apos;espace hôtel.</>,
              <>This section doesn&apos;t exist in the hotel workspace.</>
            )}
          </p>
          <Link
            href="/hotel"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-info transition-colors hover:text-info"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            {t(<>Retour à la vue d&apos;ensemble</>, <>Back to overview</>)}
          </Link>
        </div>
      </div>
    </div>
  );
}
