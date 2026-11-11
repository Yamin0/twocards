"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { useT } from "@/lib/i18n/client";
import {
  buildSignUp,
  type AudienceSize,
  type ChoiceState,
  type ConciergeType,
  type FormState,
  type Kind,
  type VenueType,
} from "../_lib/signup-payload";
import {
  FIELD_ID,
  OPTIONAL_FIELDS,
  firstInvalid,
  validateSignup,
  type Errors,
  type FieldName,
} from "../_lib/signup-validation";

/* État de la demande d'accès : l'écran affiché (1 = métier, 2 = formulaire),
   la saisie, les erreurs par champ et l'envoi à Supabase.

   Tout est contrôlé à l'envoi, avec un message sous chaque champ en cause et
   le focus posé sur le premier ; l'erreur d'un champ s'efface dès qu'on le
   corrige. */

export type Step = 1 | 2;

/* Identifiant du bloc des champs facultatifs (cible de aria-controls). */
export const MORE_ID = "signup-more";

const EMPTY: FormState = {
  venueName: "",
  city: "",
  rooms: "",
  organization: "",
  instagram: "",
  fullname: "",
  email: "",
  phone: "",
  password: "",
};

/* À chaque changement d'écran : retour en haut (mobile) et focus sur le
   titre, pour que le lecteur d'écran annonce le nouvel écran. Renvoie la
   référence à poser sur le h1 de l'écran.

   C'est une référence « fonction », appelée quand le nouveau titre arrive
   dans la page : l'ancien écran reste monté le temps de son fondu de sortie,
   un focus posé dès le changement d'état irait sur le titre qui s'en va.
   `screen` identifie l'écran affiché ; rien ne bouge au premier rendu. */
export function useScreenHeading(screen: string) {
  const announced = useRef(screen);
  return useCallback(
    (heading: HTMLHeadingElement | null) => {
      if (!heading || announced.current === screen) return;
      announced.current = screen;
      window.scrollTo({ top: 0 });
      heading.focus({ preventScroll: true });
    },
    [screen],
  );
}

export function useSignupForm(initialKind: Kind | null) {
  const t = useT();

  const [kind, setKind] = useState<Kind | null>(initialKind);
  const [step, setStep] = useState<Step>(initialKind ? 2 : 1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [choices, setChoices] = useState<ChoiceState>({
    venueType: "restaurant",
    conciergeType: null,
    audienceSize: null,
  });

  const setField = (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };
  const setVenueType = (venueType: VenueType) => setChoices((prev) => ({ ...prev, venueType }));
  const setConciergeType = (conciergeType: ConciergeType) => setChoices((prev) => ({ ...prev, conciergeType }));
  const setAudienceSize = (audienceSize: AudienceSize) => setChoices((prev) => ({ ...prev, audienceSize }));

  /* Focus demandé après un rendu : le champ visé peut se trouver dans le
     bloc facultatif, qui n'existe dans la page qu'une fois déplié. Un objet
     neuf à chaque demande : redemander le même champ relance l'effet. */
  const [focusTarget, setFocusTarget] = useState<{ id: string } | null>(null);
  useEffect(() => {
    if (!focusTarget) return;
    const el = document.getElementById(focusTarget.id);
    const target = el instanceof HTMLInputElement ? el : el?.querySelector("input");
    target?.focus();
  }, [focusTarget]);

  /* Un champ facultatif déjà rempli ne doit jamais partir sans être visible :
     le bloc s'ouvre d'office s'il contient une saisie pour ce métier. */
  const hasOptionalInput = (k: Kind) =>
    OPTIONAL_FIELDS[k].some((name) => form[name].trim() !== "") ||
    (k === "concierge" && choices.conciergeType !== null) ||
    (k === "influenceur" && choices.audienceSize !== null);

  const chooseKind = (k: Kind) => {
    setKind(k);
    setError("");
    setErrors({});
    setMoreOpen(hasOptionalInput(k));
    setStep(2);
  };

  const back = () => {
    setError("");
    setErrors({});
    setStep(1);
  };

  const openMore = () => {
    setMoreOpen(true);
    setFocusTarget({ id: MORE_ID });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind || loading) return;
    setError("");

    const found = validateSignup(kind, form, t);
    const first = firstInvalid(kind, found);
    if (first) {
      setErrors(found);
      if (OPTIONAL_FIELDS[kind].includes(first)) setMoreOpen(true);
      setFocusTarget({ id: FIELD_ID[first] });
      return;
    }
    setErrors({});
    setLoading(true);

    const { error: signUpError } = await createClient()
      .auth.signUp(buildSignUp(kind, form, choices, window.location.origin))
      .catch((err: unknown) => ({ error: err as { message?: string } }));

    setLoading(false);
    if (signUpError) {
      setError(authErrorMessage(signUpError, t));
      return;
    }
    setDone(true);
  };

  return {
    kind,
    step,
    done,
    error,
    errors,
    loading,
    form,
    choices,
    moreOpen,
    setField,
    setVenueType,
    setConciergeType,
    setAudienceSize,
    chooseKind,
    back,
    openMore,
    submit,
  };
}

export type SignupForm = ReturnType<typeof useSignupForm>;
