"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { unsubscribe, type OptoutState } from "./actions";
import { useT } from "@/lib/i18n/client";

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-sm text-[var(--landing-ink)] outline-none transition-all placeholder:text-black/30 focus:border-black/40 focus:ring-1 focus:ring-black/10";

const labelClass =
  "block text-[14px] font-medium text-[var(--landing-ink)]";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--landing-ink)] px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {t("Confirmer ma désinscription", "Confirm unsubscribe")}
    </button>
  );
}

export function OptoutForm({ initialEmail }: { initialEmail: string }) {
  const t = useT();
  const [state, formAction] = useActionState<OptoutState, FormData>(
    unsubscribe,
    { status: "idle", message: "", email: initialEmail }
  );

  if (state.status === "done") {
    return (
      <div className="rounded-2xl border border-black/[0.08] bg-white/60 p-8 sm:p-10">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--landing-ink)] text-white">
          <Check size={18} />
        </div>
        <h2 className="font-title text-xl font-normal">{t(<>C&apos;est fait.</>, <>All done.</>)}</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-ink)]/70">
          <span className="font-medium text-[var(--landing-ink)]">
            {state.email}
          </span>{" "}
          {t(
            <>
              ne recevra plus de message de prospection de notre part. Vous
              n&apos;avez rien d&apos;autre à faire.
            </>,
            <>
              will no longer receive outreach messages from us. There&apos;s
              nothing else you need to do.
            </>,
          )}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--landing-mute)]">
          {t(
            "Cette désinscription ne concerne pas les messages liés à une réservation en cours si vous êtes déjà client.",
            "This doesn’t apply to messages about an ongoing reservation if you’re already a customer.",
          )}
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-black/[0.08] bg-white/60 p-8 sm:p-10"
    >
      {state.status === "error" && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {state.message}
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className={labelClass}>
            {t("Adresse e-mail", "Email address")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.email || initialEmail}
            placeholder={t("vous@votre-restaurant.com", "you@your-restaurant.com")}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reason" className={labelClass}>
            {t("Raison", "Reason")}{" "}
            <span className="normal-case tracking-normal">{t("(facultatif)", "(optional)")}</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            maxLength={500}
            placeholder={t(
              "Ce qui nous aiderait à ne plus déranger les bonnes personnes.",
              "Anything that would help us stop bothering the right people.",
            )}
            className={`${inputClass} resize-none`}
          />
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
