import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS, type GuestCategory, type GuestOffer, type GuestService } from "@/lib/guest-catalog";
import { nextDays } from "@/lib/booking/dates";
import { bookingErrorKind, bookingErrorMessage } from "@/lib/booking/errors";
import { defaultGuestDate, isGuestSlotPast, isGuestTimePast } from "@/lib/booking/slots";
import { cartLines, depositTotal, vehiclesFor, type DepositCurrency, type VehicleCart } from "@/lib/booking/deposit";
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
  desk = "reception",
}: {
  code: string;
  category: GuestCategory;
  offer: GuestOffer;
  preview: boolean;
  /* Vers qui orienter le client en cas d'échec : la réception d'un hôtel, ou
     la personne qui a partagé le lien d'un concierge. */
  desk?: "reception" | "host";
}) {
  const t = useT();
  const [days] = useState(() => nextDays(14));
  const [step, setStep] = useState<SheetStep>("details");
  const [partySize, setPartySize] = useState(2);
  /* La première prestation est proposée d'office : c'est l'établissement
     qui a choisi l'ordre, et le client peut en changer d'un geste. */
  const [service, setService] = useState<GuestService | null>(offer.services[0] ?? null);
  /* Offre à véhicules (prestations à prix partenaire) : le client compose un
     panier — un modèle, une durée, une quantité par ligne — au lieu de
     choisir une seule prestation. Trois personnes peuvent ainsi prendre trois
     modèles différents. */
  const cartMode = offer.services.some((s) => s.deposit && s.clientPrice);
  /* Entrées à la personne (day pass adulte, enfant…) : même panier et même
     acompte, mais aucune prestation n'a de nombre de places. Le menu parle
     alors de personnes, pas de véhicules. */
  const ticketMode = cartMode && offer.services.every((s) => !(s.deposit && s.clientPrice) || !s.seats);
  const [cart, setCart] = useState<VehicleCart>({});
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

  /* Retour arrière depuis la page Stripe : le navigateur restaure la page
     telle quelle (cache bfcache), bouton encore « en cours ». */
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setSending(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  /* Montant affiché avant de payer (la base le recalcule). Une prestation à
     prix partenaire porte son propre acompte, par véhicule ; sinon c'est le
     réglage de l'adresse. */
  const lines = cartMode ? cartLines(offer.services, cart) : [];
  const vehicleCount = lines.reduce((sum, l) => sum + l.qty, 0);
  /* Places réunies par le panier (1 par véhicule quand le nombre manque). */
  const seatsChosen = lines.reduce((sum, l) => sum + l.qty * (l.service.seats ?? 1), 0);

  const deposit: {
    amount: number;
    currency: DepositCurrency;
    /* Prestation à prix partenaire seulement. */
    vehicles?: number;
    unit?: number;
    onSite?: number;
  } | null = cartMode
    ? vehicleCount > 0
      ? {
          amount: lines.reduce((sum, l) => sum + l.qty * (l.service.deposit ?? 0), 0),
          currency: lines[0].service.currency ?? "mad",
          vehicles: vehicleCount,
          onSite: lines.reduce((sum, l) => sum + l.qty * ((l.service.clientPrice ?? 0) - (l.service.deposit ?? 0)), 0),
        }
      : null
    : service?.deposit && service.clientPrice
      ? (() => {
          const vehicles = vehiclesFor(service.seats, partySize);
          return {
            amount: service.deposit * vehicles,
            currency: service.currency ?? "mad",
            vehicles,
            unit: service.deposit,
            onSite: (service.clientPrice - service.deposit) * vehicles,
          };
        })()
      : offer.deposit
        ? { amount: depositTotal(offer.deposit, partySize), currency: offer.deposit.currency }
        : null;

  /* Quantité d'une ligne du panier : 20 véhicules au plus en tout. */
  const setQty = (id: string, qty: number) => {
    setCart((current) => {
      const others = Object.entries(current).reduce((sum, [key, n]) => (key === id ? sum : sum + n), 0);
      const next = Math.max(0, Math.min(Math.floor(qty), 20 - others));
      const copy = { ...current };
      if (next > 0) copy[id] = next;
      else delete copy[id];
      return copy;
    });
    setErrorMsg("");
  };

  /* Résumé affiché (noms traduits) : « 1 × Buggy X3 · 2 h, 2 × Quad 300 cc · 1 h ». */
  const selectionLabel = cartMode
    ? lines.map((l) => `${l.qty} × ${l.service.name}`).join(", ")
    : service?.name ?? "";

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
    if (cartMode && vehicleCount === 0) {
      setErrorMsg(
        ticketMode
          ? t("Choisissez au moins une entrée.", "Choose at least one ticket.")
          : t("Choisissez au moins un véhicule.", "Choose at least one vehicle.")
      );
      return false;
    }
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
      setErrorMsg(bookingErrorMessage("name", t, desk));
      return;
    }
    if (cleanPhone.replace(/\D/g, "").length < 6) {
      setErrorMsg(bookingErrorMessage("phone", t, desk));
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
    if (deposit) {
      /* Acompte : on part sur la page de paiement Stripe. La réservation
         sera enregistrée au retour, une fois le paiement confirmé. */
      try {
        const res = await fetch("/api/acompte/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            category: CATEGORY_LABELS[category.key],
            venue: offer.baseName,
            slug: offer.id,
            name: cleanName,
            phone: cleanPhone,
            date,
            time: chosenTime || null,
            party: partySize,
            notes: notes || null,
            /* Panier : la base recalcule tout, le résumé enregistré vient d'elle. */
            service: cartMode ? null : service?.baseName ?? null,
            lines: cartMode ? lines.map((l) => ({ id: l.service.id, qty: l.qty })) : undefined,
          }),
        });
        const payload = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
        if (res.ok && payload.url) {
          window.location.assign(payload.url);
          return;
        }
        failure = { message: payload.message ?? "Paiement indisponible" };
      } catch (e) {
        failure = { message: e instanceof Error ? e.message : "Failed to fetch" };
      }
      setSending(false);
      setErrorMsg(bookingErrorMessage(bookingErrorKind(failure), t, desk));
      return;
    }
    try {
      const { error } = await createClient().rpc("qr_create_reservation", {
        p_code: code,
        /* Libellé français enregistré en base, quelle que soit la langue affichée. */
        p_category: CATEGORY_LABELS[category.key],
        p_venue: offer.baseName,
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
        p_service: service?.baseName ?? null,
      });
      failure = error;
    } catch (e) {
      failure = { message: e instanceof Error ? e.message : "Failed to fetch" };
    }
    setSending(false);
    if (failure) {
      setErrorMsg(bookingErrorMessage(bookingErrorKind(failure), t, desk));
      return;
    }
    setStep("done");
  };

  return {
    days,
    step,
    setStep,
    cartMode,
    ticketMode,
    cart,
    setQty,
    lines,
    vehicleCount,
    seatsChosen,
    selectionLabel,
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
    deposit,
    errorMsg,
    toContact,
    submit,
  };
}

export type ReservationForm = ReturnType<typeof useReservationForm>;
