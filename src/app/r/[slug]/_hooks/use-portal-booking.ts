"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fromIsoDay, nextDays } from "@/lib/booking/dates";
import { bookingErrorKind, bookingErrorMessage } from "@/lib/booking/errors";
import type { Portal } from "@/lib/booking/load";
import { buildSlots, defaultPortalDate, slotDateTime } from "@/lib/booking/slots";
import { useT } from "@/lib/i18n/client";

export type PortalStep = "slots" | "details" | "done";

/* État et envoi d'une demande sur le portail direct : personnes / date /
   créneau, puis coordonnées, puis confirmation. À n'utiliser que dans le
   navigateur (après hydratation) : tout part de l'heure du client. */
export function usePortalBooking(slug: string, portal: Portal) {
  const t = useT();
  const slots = useMemo(
    () => buildSlots(portal.start_time, portal.end_time, portal.interval_minutes),
    [portal.start_time, portal.end_time, portal.interval_minutes]
  );
  const [days] = useState(() => nextDays(14));
  const [step, setStep] = useState<PortalStep>("slots");
  const [party, setParty] = useState(Math.min(2, portal.party_max));
  /* Si tous les créneaux du jour sont déjà passés, on ouvre sur demain. */
  const [date, setDateState] = useState(() => defaultPortalDate(slots));
  const [time, setTime] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Message affiché au retour sur le choix de l'heure, quand le créneau
     s'est rempli pendant la saisie des coordonnées. */
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  /* Créneaux complets pour la date affichée : les couverts déjà demandés y
     atteignent la capacité du plan de salle. Ils ne sont pas proposés. */
  const [fullSlots, setFullSlots] = useState<Set<string>>(() => new Set());
  /* Incrémenté pour relire la disponibilité sans changer de date. */
  const [availabilityVersion, setAvailabilityVersion] = useState(0);

  /* La disponibilité se recharge à chaque changement de date, et après un
     refus « Créneau complet ». En cas d'échec réseau, on montre tout plutôt
     que de bloquer la vente : la base revérifie le créneau à l'envoi. */
  useEffect(() => {
    let cancelled = false;
    createClient()
      .rpc("portal_full_slots", { p_slug: slug, p_date: date })
      .then(
        ({ data }) => {
          if (cancelled) return;
          const full = new Set(((data as { slot: string }[] | null) ?? []).map((r) => r.slot));
          setFullSlots(full);
          setTime((current) => (current && full.has(current) ? null : current));
        },
        () => undefined
      );
    return () => {
      cancelled = true;
    };
  }, [slug, date, availabilityVersion]);

  /* Dès que le client corrige un champ, le message d'erreur s'efface. */
  const editing =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setError(null);
    };

  const openSlots = useMemo(() => slots.filter((s) => !fullSlots.has(s.label)), [slots, fullSlots]);
  const selectedDate = fromIsoDay(date);

  const setDate = (iso: string) => {
    setDateState(iso);
    setSlotNotice(null);
    /* Un créneau choisi peut être déjà passé sur la nouvelle date (retour
       sur aujourd'hui). */
    if (time) {
      const slot = slots.find((s) => s.label === time);
      if (slot && slotDateTime(iso, slot) < new Date()) setTime(null);
    }
  };

  const toDetails = () => {
    if (!time) return;
    setError(null);
    setStep("details");
  };

  const submit = async () => {
    if (!time || sending) return;
    const guestName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!firstName.trim() || !lastName.trim()) {
      setError(
        t("Indiquez votre prénom et votre nom.", "Please enter your first and last name.")
      );
      return;
    }
    if (phone.replace(/\D/g, "").length < 6) {
      setError(bookingErrorMessage("phone", t, "venue"));
      return;
    }
    /* Le client a pu laisser la page ouverte : le créneau est peut-être passé. */
    const slot = slots.find((s) => s.label === time);
    if (slot && slotDateTime(date, slot) < new Date()) {
      setError(
        t(
          "Ce créneau vient de passer. Revenez à l'étape précédente et choisissez une autre heure.",
          "This time has just passed. Go back one step and choose another time."
        )
      );
      return;
    }
    setSending(true);
    setError(null);
    let failure: { message?: string | null; code?: string | null } | null = null;
    try {
      const { error: err } = await createClient().rpc("portal_create_reservation", {
        p_slug: slug,
        p_guest_name: guestName,
        p_guest_phone: phone.trim(),
        p_date: date,
        p_time: time,
        p_party_size: party,
        p_notes: notes || null,
      });
      failure = err;
    } catch (e) {
      failure = { message: e instanceof Error ? e.message : "Failed to fetch" };
    }
    setSending(false);
    if (failure) {
      const kind = bookingErrorKind(failure);
      if (kind === "full") {
        /* Le créneau s'est rempli pendant la saisie : retour au choix de
           l'heure, coordonnées conservées. Le créneau refusé disparaît tout
           de suite, puis la liste est relue depuis la base. */
        const refused = time;
        setFullSlots((current) => new Set(current).add(refused));
        setTime(null);
        setSlotNotice(bookingErrorMessage(kind, t, "venue"));
        setStep("slots");
        setAvailabilityVersion((v) => v + 1);
        return;
      }
      setError(bookingErrorMessage(kind, t, "venue"));
      return;
    }
    setSlotNotice(null);
    setStep("done");
  };

  /* Choisir une heure ou un jour efface le message « créneau complet ». */
  const chooseTime = (label: string) => {
    setTime(label);
    setSlotNotice(null);
  };

  /* « Faire une autre réservation » : on garde personnes et date. */
  const restart = () => {
    setStep("slots");
    setTime(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setNotes("");
    setError(null);
    setSlotNotice(null);
  };

  return {
    slots,
    openSlots,
    days,
    step,
    setStep,
    party,
    setParty,
    date,
    setDate,
    selectedDate,
    time,
    setTime: chooseTime,
    slotNotice,
    firstName,
    setFirstName: editing(setFirstName),
    lastName,
    setLastName: editing(setLastName),
    phone,
    setPhone: editing(setPhone),
    notes,
    setNotes: editing(setNotes),
    sending,
    error,
    toDetails,
    submit,
    restart,
  };
}

export type PortalBooking = ReturnType<typeof usePortalBooking>;
