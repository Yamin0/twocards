"use client";

import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotify } from "@/components/app/ui";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { useVenueQrReservations } from "@/hooks/use-venue-qr-reservations";
import { isOut, type Reservation, type ReservationStatus } from "@/lib/venue/reservations";

/* Réservations de l'établissement et les gestes du service : confirmer,
   refuser, marquer arrivé, saisir l'addition, placer à une table.

   Chaque geste est optimiste : l'écran change tout de suite, et revient en
   arrière avec un message si la base refuse. Seules les colonnes ouvertes à
   l'établissement sont écrites (status, arrived_at, amount_spent,
   table_id). La commission n'est jamais envoyée : le trigger
   qr_apply_commission la recalcule à partir du montant. */

export type NewReservation = {
  name: string;
  phone: string;
  date: string;
  time: string;
  party: number;
  tableId: string;
  notes: string;
};

export function useVenueReservations() {
  const t = useT();
  const intl = useIntlLocale();
  const notify = useNotify();
  const { reservations, isLoading, error, reload } = useVenueQrReservations();
  /* Écritures confirmées ou en cours, fusionnées sur la lecture : la liste
     reste juste même si le temps réel tarde à répercuter l'UPDATE. */
  const [overrides, setOverrides] = useState<Record<string, Partial<Reservation>>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const rows = useMemo(
    () => (reservations ?? []).map((r) => ({ ...r, ...overrides[r.id] })),
    [reservations, overrides]
  );

  const patch = useCallback(
    (id: string, values: Partial<Reservation>) =>
      setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...values } })),
    []
  );
  const mark = useCallback(
    (id: string, on: boolean) => setBusy((prev) => ({ ...prev, [id]: on })),
    []
  );

  const setStatus = useCallback(
    async (r: Reservation, status: ReservationStatus) => {
      patch(r.id, { status });
      const { error: err } = await createClient().from("qr_reservations").update({ status }).eq("id", r.id);
      if (err) {
        patch(r.id, { status: r.status });
        notify(t("Le statut n'a pas pu être changé.", "The status couldn't be changed."), "error");
        return false;
      }
      notify(
        status === "confirmée"
          ? t(`${r.guest_name} : réservation confirmée`, `${r.guest_name}: reservation confirmed`)
          : status === "annulée"
            ? t(`${r.guest_name} : réservation refusée`, `${r.guest_name}: reservation declined`)
            : status === "no-show"
              ? t(`${r.guest_name} : no-show enregistré`, `${r.guest_name}: no-show recorded`)
              : t(`${r.guest_name} : remise en attente`, `${r.guest_name}: back to pending`)
      );
      return true;
    },
    [patch, notify, t]
  );

  /* L'heure d'arrivée est écrite en base : visible de tous les postes. */
  const checkIn = useCallback(
    async (r: Reservation) => {
      const arrived_at = new Date().toISOString();
      patch(r.id, { arrived_at });
      const { error: err } = await createClient().from("qr_reservations").update({ arrived_at }).eq("id", r.id);
      if (err) {
        patch(r.id, { arrived_at: r.arrived_at });
        notify(t("L'arrivée n'a pas pu être enregistrée.", "The arrival couldn't be recorded."), "error");
        return false;
      }
      notify(t(`${r.guest_name} : arrivée enregistrée`, `${r.guest_name}: arrival recorded`));
      return true;
    },
    [patch, notify, t]
  );

  /* Saisir l'addition confirme la réservation, comme avant. Refusé sur une
     réservation annulée ou no-show : il faut d'abord la rétablir. */
  const saveBill = useCallback(
    async (r: Reservation, amount: number) => {
      if (isOut(r)) return false;
      mark(r.id, true);
      const { data, error: err } = await createClient()
        .from("qr_reservations")
        .update({ amount_spent: amount, status: "confirmée" })
        .eq("id", r.id)
        .select("amount_spent, commission, status")
        .single();
      mark(r.id, false);
      if (err || !data) {
        notify(
          r.amount_source === "pos"
            ? t("Ce montant vient de la caisse : il ne se modifie pas ici.", "This amount comes from the till and can't be edited here.")
            : t("L'addition n'a pas pu être enregistrée.", "The bill couldn't be saved."),
          "error"
        );
        return false;
      }
      patch(r.id, data as Partial<Reservation>);
      notify(
        t(
          `Addition enregistrée · commission ${Number(data.commission).toLocaleString(intl)} MAD`,
          `Bill saved · commission ${Number(data.commission).toLocaleString(intl)} MAD`
        )
      );
      return true;
    },
    [patch, mark, notify, t, intl]
  );

  const assignTable = useCallback(
    async (r: Reservation, tableId: number | null, label?: string) => {
      patch(r.id, { table_id: tableId });
      const { error: err } = await createClient()
        .from("qr_reservations")
        .update({ table_id: tableId })
        .eq("id", r.id);
      if (err) {
        patch(r.id, { table_id: r.table_id });
        notify(t("La table n'a pas pu être assignée.", "The table couldn't be assigned."), "error");
        return false;
      }
      /* Double réservation : on ne l'interdit pas (deux services peuvent
         s'enchaîner), on le dit. */
      const clash =
        tableId !== null &&
        rows.some(
          (x) =>
            x.id !== r.id &&
            x.table_id === tableId &&
            x.reservation_date === r.reservation_date &&
            (x.reservation_time ?? "") === (r.reservation_time ?? "") &&
            !isOut(x)
        );
      if (tableId === null) notify(t("Table retirée", "Table removed"));
      else if (clash)
        notify(
          t(
            `La table ${label ?? ""} a déjà une réservation à cette heure.`,
            `Table ${label ?? ""} already has a reservation at this time.`
          ),
          "error"
        );
      else notify(t(`Table ${label ?? ""} assignée`, `Table ${label ?? ""} assigned`));
      return true;
    },
    [patch, notify, t, rows]
  );

  /* Réservation prise par l'établissement (téléphone, passage). */
  const create = useCallback(
    async (form: NewReservation) => {
      const { error: err } = await createClient().rpc("venue_create_reservation", {
        p_guest_name: form.name,
        p_guest_phone: form.phone,
        p_date: form.date,
        p_time: form.time || null,
        p_party_size: form.party,
        p_notes: form.notes || null,
        p_table_id: form.tableId ? Number(form.tableId) : null,
      });
      if (err) {
        notify(t("La réservation n'a pas pu être créée.", "The reservation couldn't be created."), "error");
        return false;
      }
      notify(t("Réservation créée", "Reservation created"));
      reload();
      return true;
    },
    [notify, t, reload]
  );

  return { rows, isLoading, error, reload, busy, setStatus, checkIn, saveBill, assignTable, create };
}
