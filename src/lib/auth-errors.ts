import type { Translate } from "@/lib/i18n";

/* ─── Erreurs d'authentification Supabase, en clair et dans les deux langues ──
   Une seule table pour la connexion, la demande d'accès, le mot de passe
   oublié et sa réinitialisation. Supabase renvoie un `code` stable depuis
   la v2 d'auth-js ; les anciens messages anglais sont reconnus en repli.
   Une erreur inconnue donne un message générique : le texte brut du
   serveur, en anglais, n'est jamais montré à l'utilisateur. */

type AuthErrorLike = { message?: string; code?: string; status?: number } | null | undefined;

export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_exists"
  | "rate_limit"
  | "weak_password"
  | "same_password"
  | "invalid_email"
  | "session_missing"
  | "link_expired"
  | "signup_disabled"
  | "user_banned"
  | "network"
  | "unknown";

const BY_CODE: Record<string, AuthErrorKind> = {
  invalid_credentials: "invalid_credentials",
  email_not_confirmed: "email_not_confirmed",
  user_already_exists: "user_exists",
  email_exists: "user_exists",
  over_request_rate_limit: "rate_limit",
  over_email_send_rate_limit: "rate_limit",
  over_sms_send_rate_limit: "rate_limit",
  weak_password: "weak_password",
  same_password: "same_password",
  email_address_invalid: "invalid_email",
  validation_failed: "invalid_email",
  session_not_found: "session_missing",
  session_expired: "session_missing",
  otp_expired: "link_expired",
  flow_state_expired: "link_expired",
  flow_state_not_found: "link_expired",
  bad_code_verifier: "link_expired",
  signup_disabled: "signup_disabled",
  email_provider_disabled: "signup_disabled",
  user_banned: "user_banned",
};

const BY_MESSAGE: [RegExp, AuthErrorKind][] = [
  [/invalid login credentials/i, "invalid_credentials"],
  [/email not confirmed/i, "email_not_confirmed"],
  [/already registered|already exists/i, "user_exists"],
  [/rate limit|security purposes|too many requests/i, "rate_limit"],
  [/different from the old password/i, "same_password"],
  [/password should be|weak password/i, "weak_password"],
  [/invalid.*email|email.*invalid|valid email/i, "invalid_email"],
  [/auth session missing|session.*(not found|expired)/i, "session_missing"],
  [/expired|invalid.*(token|link|code)/i, "link_expired"],
  [/signups? not allowed|signup.*disabled/i, "signup_disabled"],
  [/banned/i, "user_banned"],
  [/failed to fetch|network|load failed/i, "network"],
];

export function authErrorKind(error: AuthErrorLike): AuthErrorKind {
  if (!error) return "unknown";
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 429) return "rate_limit";
  const message = error.message ?? "";
  for (const [pattern, kind] of BY_MESSAGE) {
    if (pattern.test(message)) return kind;
  }
  return "unknown";
}

export function authErrorText(kind: AuthErrorKind, t: Translate): string {
  switch (kind) {
    case "invalid_credentials":
      return t("Identifiant ou mot de passe incorrect.", "Incorrect username or password.");
    case "email_not_confirmed":
      return t(
        "Adresse e-mail pas encore confirmée : cliquez sur le lien reçu par e-mail.",
        "Email address not confirmed yet: click the link we emailed you.",
      );
    case "user_exists":
      return t(
        "Un compte existe déjà avec cet e-mail. Connectez-vous, ou réinitialisez votre mot de passe.",
        "An account already exists with this email. Log in, or reset your password.",
      );
    case "rate_limit":
      return t(
        "Trop de tentatives. Patientez une minute avant de réessayer.",
        "Too many attempts. Please wait a minute before trying again.",
      );
    case "weak_password":
      return t(
        "Ce mot de passe est trop faible. Choisissez-en un plus long ou moins courant.",
        "This password is too weak. Choose a longer or less common one.",
      );
    case "same_password":
      return t(
        "Le nouveau mot de passe doit être différent de l'ancien.",
        "Your new password must be different from the old one.",
      );
    case "invalid_email":
      return t("Adresse e-mail invalide.", "Invalid email address.");
    case "session_missing":
      return t(
        "Le lien a expiré. Demandez un nouveau lien de réinitialisation.",
        "This link has expired. Request a new reset link.",
      );
    case "link_expired":
      return t(
        "Ce lien n'est plus valable : il a expiré ou a déjà servi. Connectez-vous, ou demandez-en un nouveau.",
        "This link is no longer valid: it has expired or has already been used. Log in, or request a new one.",
      );
    case "signup_disabled":
      return t(
        "Les inscriptions sont momentanément fermées. Écrivez-nous à contact@twocardspro.com.",
        "Sign-ups are temporarily closed. Write to us at contact@twocardspro.com.",
      );
    case "user_banned":
      return t(
        "Ce compte est suspendu. Écrivez-nous à contact@twocardspro.com.",
        "This account is suspended. Write to us at contact@twocardspro.com.",
      );
    case "network":
      return t(
        "Connexion impossible. Vérifiez votre réseau, puis réessayez.",
        "Couldn't connect. Check your network, then try again.",
      );
    default:
      return t(
        "Une erreur est survenue. Réessayez dans un instant ; si elle persiste, écrivez-nous à contact@twocardspro.com.",
        "Something went wrong. Try again in a moment; if it persists, write to us at contact@twocardspro.com.",
      );
  }
}

/** Message à afficher pour une erreur renvoyée par supabase.auth.*. */
export function authErrorMessage(error: AuthErrorLike, t: Translate): string {
  return authErrorText(authErrorKind(error), t);
}

/** Message pour le paramètre `?error=` posé par /auth/callback (« auth » :
    lien de confirmation ou de réinitialisation refusé). */
export function authQueryErrorMessage(param: string | null | undefined, t: Translate): string | null {
  if (!param) return null;
  return authErrorText(param === "auth" ? "link_expired" : "unknown", t);
}
