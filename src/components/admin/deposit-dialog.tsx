"use client";

import { useId, useState } from "react";
import { Button, Field, InfoNote, Modal, Segmented, Select, inputClass } from "@/components/app/ui";
import { DEPOSIT_CURRENCIES, formatDeposit, type DepositCurrency, type DepositMode } from "@/lib/booking/deposit";
import { useIntlLocale, useT } from "@/lib/i18n/client";

/* Acompte en ligne d'une adresse du catalogue : aucun, par personne (menu
   fixe, activité au tarif par tête) ou fixe pour la réservation. L'acompte
   est la commission twocards, payée par le client sur Stripe en réservant. */

export type DepositSetting = { mode: DepositMode; amount: number | null; currency: DepositCurrency };

export function DepositDialog({
  name,
  initial,
  onClose,
  onSave,
}: {
  name: string;
  initial: DepositSetting;
  onClose: () => void;
  /* Renvoie un message d'erreur, ou null si tout s'est bien passé. */
  onSave: (next: DepositSetting) => Promise<string | null>;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const amountId = useId();
  const [mode, setMode] = useState<DepositMode>(initial.mode);
  const [amount, setAmount] = useState(initial.amount ? String(initial.amount) : "");
  const [currency, setCurrency] = useState<DepositCurrency>(initial.currency);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount.replace(",", "."));
  const valid = mode === "none" || (Number.isFinite(value) && value >= 10 && value <= 100000);

  const submit = async () => {
    if (!valid) {
      setError(t("Indiquez un montant entre 10 et 100 000.", "Enter an amount between 10 and 100,000."));
      return;
    }
    setSaving(true);
    const message = await onSave({ mode, amount: mode === "none" ? null : Math.round(value * 100) / 100, currency });
    setSaving(false);
    if (message) setError(message);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t(`Acompte · ${name}`, `Deposit · ${name}`)}
      description={t(
        "Payé en ligne par le client pour confirmer sa réservation. C'est la commission twocards, encaissée par Twocards, LLC.",
        "Paid online by the guest to confirm the booking. It is the twocards commission, collected by Twocards, LLC."
      )}
      footer={
        <>
          <Button onClick={onClose}>{t("Annuler", "Cancel")}</Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            {t("Enregistrer", "Save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Segmented<DepositMode>
          label={t("Type d'acompte", "Deposit type")}
          value={mode}
          onChange={(v) => {
            setMode(v);
            setError(null);
          }}
          options={[
            { value: "none", label: t("Aucun", "None") },
            { value: "per_person", label: t("Par personne", "Per guest") },
            { value: "fixed", label: t("Fixe", "Fixed") },
          ]}
        />
        {mode !== "none" && (
          <div className="grid grid-cols-[1fr_7rem] items-end gap-3">
            <Field
              label={mode === "per_person" ? t("Montant par personne", "Amount per guest") : t("Montant par réservation", "Amount per booking")}
              htmlFor={amountId}
              error={error ?? undefined}
            >
              <input
                id={amountId}
                className={inputClass}
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="150"
              />
            </Field>
            <Select<DepositCurrency>
              label={t("Devise", "Currency")}
              value={currency}
              onChange={setCurrency}
              options={DEPOSIT_CURRENCIES.map((c) => ({ value: c, label: c.toUpperCase() }))}
            />
          </div>
        )}
        {mode !== "none" && valid && value > 0 && (
          <InfoNote>
            {mode === "per_person"
              ? t(
                  `Pour 4 personnes, le client paiera ${formatDeposit(value * 4, currency, intl)} en réservant.`,
                  `For 4 guests, the guest will pay ${formatDeposit(value * 4, currency, intl)} when booking.`
                )
              : t(
                  `Le client paiera ${formatDeposit(value, currency, intl)} en réservant, quel que soit le nombre de personnes.`,
                  `The guest will pay ${formatDeposit(value, currency, intl)} when booking, whatever the party size.`
                )}
            {currency !== "mad" &&
              t(
                " Hors dirhams, la commission des tableaux reste calculée sur l'addition.",
                " Outside dirhams, dashboard commission is still computed from the bill."
              )}
          </InfoNote>
        )}
        {mode === "none" && error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
