"use server";

import { createClient } from "@/lib/supabase/server";

export type OptoutState = {
  status: "idle" | "done" | "error";
  message: string;
  email: string;
};

/** Violation de contrainte d'unicité : l'adresse était déjà désinscrite. */
const ALREADY_OPTED_OUT = "23505";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function unsubscribe(
  _prev: OptoutState,
  formData: FormData
): Promise<OptoutState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);

  if (!EMAIL.test(email) || email.length > 320) {
    return {
      status: "error",
      message: "Cette adresse e-mail ne semble pas valide.",
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_optouts")
    .insert({ email, reason, source: "web" });

  // Une seconde demande pour la même adresse est un succès, pas une erreur :
  // la personne veut être désinscrite, elle l'est déjà.
  if (error && error.code !== ALREADY_OPTED_OUT) {
    return {
      status: "error",
      message:
        "L'enregistrement a échoué. Écrivez à yamin@twocardspro.com, nous vous retirons manuellement.",
      email,
    };
  }

  return { status: "done", message: "", email };
}
