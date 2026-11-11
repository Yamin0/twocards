"use client";

import { ArrowRight, Inbox } from "lucide-react";
import { Card, LinkButton } from "@/components/app/ui";
import { ReservationRow } from "@/components/hotel/reservation-row";
import { plural } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { useT } from "@/lib/i18n/client";

const SHOWN = 4;

/* Les demandes que l'établissement n'a pas encore confirmées : la seule
   chose de l'accueil qui peut demander un geste (appeler le client ou
   l'établissement). Chaque ligne ouvre la fiche. */
export function PendingRequests({ pending, today }: { pending: HotelReservation[]; today: string }) {
  const t = useT();
  if (pending.length === 0) return null;
  const n = pending.length;
  const more = n - SHOWN;
  return (
    <Card
      className="border-warn/40"
      padded={false}
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warn-soft">
            <Inbox size={16} strokeWidth={1.75} className="text-warn" aria-hidden />
          </span>
          {t(
            `${n} ${plural(n, "demande")} en attente de confirmation`,
            `${n} ${plural(n, "request", undefined, "en")} awaiting confirmation`
          )}
        </span>
      }
      description={t(
        "L'établissement confirme directement avec le client. Ouvrez une demande pour appeler ou écrire au client.",
        "The venue confirms directly with the guest. Open a request to call or message the guest."
      )}
      actions={
        <LinkButton href="/hotel/reservations?statut=attente" size="sm" variant="primary" icon={ArrowRight}>
          {t("Tout voir", "View all")}
        </LinkButton>
      }
    >
      <ul className="divide-y divide-line border-t border-line">
        {pending.slice(0, SHOWN).map((r) => (
          <li key={r.id}>
            <ReservationRow r={r} href={`/hotel/reservations?id=${r.id}`} day={{ today }} />
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p className="border-t border-line px-5 py-3 text-[13px] text-ink-3 sm:px-6">
          {t(
            `Et ${more} ${plural(more, "autre demande", "autres demandes")}.`,
            `And ${more} more ${plural(more, "request", undefined, "en")}.`
          )}
        </p>
      )}
    </Card>
  );
}
