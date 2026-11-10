"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button, LinkButton, Panel } from "@/components/hotel/ui";
import { useT } from "@/lib/i18n/client";

export default function HotelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error("Hotel error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Panel solid className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/15">
            <AlertTriangle size={26} strokeWidth={1.5} className="text-red-300" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">{t("Une erreur est survenue", "Something went wrong")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">
            {t(
              <>
                Nous n&apos;avons pas pu charger cette page. Réessayez ; si le problème persiste, contactez votre
                référent twocards.
              </>,
              <>We couldn&apos;t load this page. Try again; if the problem persists, contact your twocards account manager.</>
            )}
          </p>
          {error.digest && <p className="num mt-2 text-[10px] text-white/25">{t("Réf.", "Ref.")} {error.digest}</p>}
          <div className="mt-6 flex flex-col items-center gap-2">
            <Button variant="primary" icon={RefreshCw} onClick={reset}>
              {t("Réessayer", "Try again")}
            </Button>
            <LinkButton href="/hotel" variant="ghost" size="sm" icon={ArrowLeft}>
              {t(<>Retour à la vue d&apos;ensemble</>, <>Back to overview</>)}
            </LinkButton>
          </div>
        </div>
      </Panel>
    </div>
  );
}
