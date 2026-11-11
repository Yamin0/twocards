import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, type GuestCategory, type GuestOffer, type GuestService } from "@/lib/guest-catalog";
import { nextDays } from "@/lib/booking/dates";
import { bookingErrorKind, bookingErrorMessage } from "@/lib/booking/errors";
import { defaultGuestDate, isGuestSlotPast, isGuestTimePast } from "@/lib/booking/slots";
import { useT } from "@/lib/i18n/client";

export type SheetStep = "details" | "contact" | "done";

/* Valeur de `time` quand le client saisit lui-même son heure. */
export const OTHER_TIME = "autre";

/* État et envoi de la demande de réservation du menu QR. Trois temps :
   « details » (prestation, personnes, date, heure), « contact » (nom,
   téléphone, précision), « done ». L'envoi n'existe qu'à l'étape contact. */
export function useReservationForm({
  code,
  category,
  offer,
  preview,
}: {
  code: string;
  category: GuestCategory;
  offer: GuestOffer;
  preview: boolean;
}) {
  const t = useT();
  const [days] = useState(() => nextDays(14));
  const [step, setStep] = useState<SheetStep>("details");
  const [partySize, setPartySize] = useState(2);
  /* La première prestation est proposée d'office : c'est l'établissement
     qui a choisi l'ordre, et le client peut en changer d'un geste. */
  const [service, setService] = useState<GuestService | null>(offer.services[0] ?? null);
  /* Demain si plus aucun créneau n'est réservable ce soir, comme le portail. */
  const [date, setDateState] = useState(() => defaultGuestDate(category.key));
  const [time, setTime] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [timeError, setTimeError] = useState("");

  const chosenTime = time === OTHER_TIME ? customTime : time;

  /* Dès que le client corrige un champ, le message d'erreur s'efface. */
  const editing =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setErrorMsg("");
    };

  const setDate = (iso: string) => {
    setDateState(iso);
    setTimeError("");
    /* Un créneau proposé peut être déjà passé sur la nouvelle date (retour
       sur aujourd'hui) ; l'heure saisie à la main, elle, est recontrôlée au
       moment de continuer. */
    if (time && time !== OTHER_TIME && isGuestSlotPast(iso, time)) setTime(null);
  };

  const pickTime = (value: string | null) => {
    setTime(value);
    setTimeError("");
  };

  const changeCustomTime = (value: string) => {
    setCustomTime(value);
    setTimeError("");
  };

  /* Passage à l'étape contact. Renvoie false si l'heure saisie est passée :
     la feuille reste alors sur l'étape 1, message affiché sous le champ. */
  const toContact = () => {
    if (time === OTHER_TIME && customTime && isGuestTimePast(date, customTime)) {
      setTimeError(
        t(
          "Cette heure est déjà passée. Choisissez une heure plus tardive ou un autre jour.",
          "This time has already passed. Choose a later time or another day."
        )
      );
      return false;
    }
    setErrorMsg("");
    setStep("contact");
    return true;
  };

  const submit = async () => {
    if (sending) return;
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName) {
      setErrorMsg(bookingErrorMessage("name", t, "reception"));
      return;
    }
    if (cleanPhone.replace(/\D/g, "").length < 6) {
      setErrorMsg(bookingErrorMessage("phone", t, "reception"));
      return;
    }
    /* Aperçu ouvert par l'hôtel depuis son espace : rien n'est écrit. */
    if (preview) {
      setStep("done");
      return;
    }
    setSending(true);
    setErrorMsg("");
    let failure: { message?: string | null; code?: string | null } | null = null;
    try {
      const { error } = await createClient().rpc("qr_create_reservation", {
        p_code: code,
        /* Libellé français enregistré en base, quelle que soit la langue affichée. */
        p_category: CATEGORY_LABELS[category.key],
        p_venue: offer.name,
        p_guest_name: cleanName,
        p_guest_phone: cleanPhone,
        p_date: date,
        p_time: chosenTime || null,
        p_party_size: partySize,
        p_notes: notes || null,
        /* Slug du catalogue : relie la réservation au compte de
           l'établissement, qui saisira le montant dépensé. */
        p_venue_slug: offer.id,
        /* La prestation choisie, telle que l'établissement la nomme. */
        p_service: service?.name ?? null,
      });
      failure = error;
    } catch (e) {
      failure = { message: e instanceof Error ? e.message : "Failed to fetch" };
    }
    setSending(false);
    if (failure) {
      setErrorMsg(bookingErrorMessage(bookingErrorKind(failure), t, "reception"));
      return;
    }
    setStep("done");
  };

  return {
    days,
    step,
    setStep,
    partySize,
    setPartySize,
    service,
    setService,
    date,
    setDate,
    time,
    pickTime,
    customTime,
    changeCustomTime,
    chosenTime,
    timeError,
    name,
    setName: editing(setName),
    phone,
    setPhone: editing(setPhone),
    notes,
    setNotes: editing(setNotes),
    sending,
    errorMsg,
    toContact,
    submit,
  };
}

export type ReservationForm = ReturnType<typeof useReservationForm>;
