"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { unsubscribe, type OptoutState } from "./actions";

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-sm text-[var(--landing-ink)] outline-none transition-all placeholder:text-black/30 focus:border-black/40 focus:ring-1 focus:ring-black/10";

const labelClass =
  "block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-mute)]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--landing-ink)] px-4 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      Confirmer ma désinscription
    </button>
  );
}

export function OptoutForm({ initialEmail }: { initialEmail: string }) {
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
        <h2 className="font-title text-xl font-normal">C&apos;est fait.</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-ink)]/70">
          <span className="font-medium text-[var(--landing-ink)]">
            {state.email}
          </span>{" "}
          ne recevra plus de message de prospection de notre part. Vous
          n&apos;avez rien d&apos;autre à faire.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--landing-mute)]">
          Cette désinscription ne concerne pas les messages liés à une
          réservation en cours si vous êtes déjà client.
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
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.email || initialEmail}
            placeholder="vous@votre-restaurant.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reason" className={labelClass}>
            Raison <span className="normal-case tracking-normal">(facultatif)</span>
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            maxLength={500}
            placeholder="Ce qui nous aiderait à ne plus déranger les bonnes personnes."
            className={`${inputClass} resize-none`}
          />
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
