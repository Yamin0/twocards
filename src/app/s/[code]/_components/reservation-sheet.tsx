"use client";

import { useEffect, useId, useRef, type RefObject } from "react";
import { ArrowLeft, X } from "lucide-react";
import { RemoteImage } from "@/components/booking/remote-image";
import { useDialog } from "@/components/booking/use-dialog";
import type { GuestCategory, GuestOffer } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";
import { useReservationForm } from "../_hooks/use-reservation-form";
import { StepContact } from "./step-contact";
import { StepDetails } from "./step-details";
import { StepDone } from "./step-done";

/* Feuille de réservation — trois temps : régler (prestation, personnes, date,
   heure), laisser ses coordonnées, confirmation. Boîte de dialogue modale :
   titre relié, focus piégé puis rendu à la carte d'où l'on vient, Échap
   ferme. Sur téléphone elle monte du bas de l'écran. */
export function ReservationSheet({
  code,
  category,
  offer,
  hotelName,
  desk,
  preview,
  openerRef,
  onClose,
}: {
  code: string;
  category: GuestCategory;
  offer: GuestOffer;
  /* Nommé dans « … sont prévenus » ; `null` pour un concierge sans nom. */
  hotelName: string | null;
  /* Vers qui orienter le client en cas d'échec d'envoi. */
  desk: "reception" | "host";
  preview: boolean;
  /* La carte d'où la feuille a été ouverte : le focus y revient. */
  openerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const t = useT();
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const form = useReservationForm({ code, category, offer, preview, desk });
  const { step } = form;
  useDialog(sheetRef, onClose, openerRef);

  /* Chaque étape s'ouvre en haut de la feuille. Le champ « nom » prend le
     focus de lui-même à l'étape contact ; sinon il revient sur la feuille,
     pour que le lecteur d'écran annonce le nouveau contenu. */
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    sheetRef.current?.scrollTo({ top: 0 });
    if (step !== "contact") sheetRef.current?.focus({ preventScroll: true });
  }, [step]);

  const iconButton =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900";

  return (
    <div className="satoshi fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 flex max-h-[94dvh] w-full max-w-lg flex-col overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-white text-neutral-900 shadow-2xl outline-none animate-in slide-in-from-bottom-4 motion-reduce:animate-none sm:rounded-[1.75rem]"
      >
        {step === "done" ? (
          <StepDone form={form} offer={offer}
            hotelName={hotelName}
            kind={desk === "host" ? "concierge" : "hotel"}
            preview={preview} titleId={titleId} onClose={onClose} />
        ) : (
          <>
            <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-black/[0.08] bg-white/95 py-2.5 pl-4 pr-2 backdrop-blur">
              {step === "contact" ? (
                <button type="button" onClick={() => form.setStep("details")} aria-label={t("Retour", "Back")} className={`${iconButton} bg-neutral-100`}>
                  <ArrowLeft size={18} strokeWidth={2.25} aria-hidden />
                </button>
              ) : (
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <RemoteImage src={offer.image} fill sizes="44px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1 pl-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-600">{category.label}</p>
                <h2 id={titleId} className="font-display truncate text-[17px] font-bold leading-tight tracking-tight">
                  {offer.name}
                </h2>
              </div>
              <span
                className="num shrink-0 text-xs font-bold text-neutral-600"
                aria-label={t(`Étape ${step === "details" ? 1 : 2} sur 2`, `Step ${step === "details" ? 1 : 2} of 2`)}
              >
                {step === "details" ? "1/2" : "2/2"}
              </span>
              <button type="button" onClick={onClose} aria-label={t("Fermer", "Close")} className={iconButton}>
                <X size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>
            {step === "details" ? (
              <StepDetails form={form} offer={offer} category={category} />
            ) : (
              <StepContact form={form} hotelName={hotelName} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
