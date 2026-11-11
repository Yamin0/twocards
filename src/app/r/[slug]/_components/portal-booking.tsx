"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { dayMonth } from "@/lib/booking/dates";
import type { Portal } from "@/lib/booking/load";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { usePortalBooking } from "../_hooks/use-portal-booking";
import { PortalContact } from "./portal-contact";
import { PortalSlots } from "./portal-slots";

/* Le parcours de réservation du portail, monté dans le navigateur seulement
   (voir `portal-experience`) : personnes / date / créneau, coordonnées,
   confirmation. */
export function PortalBookingFlow({ slug, portal }: { slug: string; portal: Portal }) {
  const t = useT();
  const intl = useIntlLocale();
  const booking = usePortalBooking(slug, portal);
  const { step } = booking;
  const regionRef = useRef<HTMLDivElement>(null);

  /* À chaque changement d'étape, le haut du parcours revient à l'écran et
     prend le focus : le lecteur d'écran annonce la nouvelle étape. */
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    const node = regionRef.current;
    if (!node) return;
    if (step !== "details") node.focus({ preventScroll: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (node.getBoundingClientRect().top < 0) node.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [step]);

  return (
    <div ref={regionRef} tabIndex={-1} className="scroll-mt-4 outline-none">
      {step === "slots" && <PortalSlots booking={booking} portal={portal} />}
      {step === "details" && <PortalContact booking={booking} portal={portal} />}
      {step === "done" && (
        <div className="py-8 text-center" role="status">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--portal-accent)_12%,white)] text-[var(--portal-accent-ink)] motion-safe:[animation:portal-pop_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
          >
            <Check size={30} strokeWidth={2} aria-hidden />
          </div>
          <h2 className="font-[family-name:var(--font-portal-display)] text-2xl font-normal">{t("Demande envoyée", "Request sent")}</h2>
          <p className="mx-auto mt-2 max-w-xs text-base leading-relaxed text-neutral-700">
            {t(
              <>
                {portal.display_name} vous recontactera au <span className="font-medium text-neutral-900">{booking.phone.trim()}</span> pour
                confirmer votre table de {booking.party} le {dayMonth(booking.selectedDate, intl)} à {booking.time}.
              </>,
              <>
                {portal.display_name} will contact you on <span className="font-medium text-neutral-900">{booking.phone.trim()}</span> to
                confirm your table for {booking.party} on {dayMonth(booking.selectedDate, intl)} at {booking.time}.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={booking.restart}
            className="mt-6 inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-[var(--portal-accent-ink)] underline underline-offset-4"
          >
            {t("Faire une autre réservation", "Make another reservation")}
          </button>
        </div>
      )}
    </div>
  );
}
