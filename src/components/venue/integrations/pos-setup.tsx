"use client";

import { Check, Copy, FlaskConical, KeyRound, Send, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";
import {
  Button,
  Card,
  Field,
  IconButton,
  InfoNote,
  Segmented,
  inputClass,
  useCopy,
  useNotify,
} from "@/components/app/ui";
import { POS_WEBHOOK_URL } from "@/hooks/use-pos-integration";

/* Caisses courantes : la v1 passe par le webhook universel — toutes savent
   l'appeler, directement ou via Zapier / Make. Les identifiants sont ceux
   envoyés à pos_rotate_key : ils ne se traduisent pas. */
export const getPosProviders = (t: Translate) => [
  { value: "lightspeed", label: "Lightspeed" },
  { value: "square", label: "Square" },
  { value: "tiller", label: "Tiller by SumUp" },
  { value: "laddition", label: "L'Addition" },
  { value: "zelty", label: "Zelty" },
  { value: "micros", label: "Oracle Micros" },
  { value: "generic", label: t("Autre / Zapier", "Other / Zapier") },
];

function CopyValue({ value, label }: { value: string; label: string }) {
  const t = useT();
  const notify = useNotify();
  const { copied, copy } = useCopy(2000);
  return (
    <div className="flex items-center gap-2">
      <p className="min-w-0 flex-1 truncate rounded-xl border border-line bg-fill px-3 py-2.5 font-mono text-xs text-ink-2">
        {value}
      </p>
      <IconButton
        icon={copied ? Check : Copy}
        label={copied ? t("Copié", "Copied") : label}
        className={copied ? "text-ok" : undefined}
        onClick={async () => {
          if (!(await copy(value))) notify(t("Impossible de copier", "Could not copy"), "error");
        }}
      />
    </div>
  );
}

/* Les trois étapes de connexion, puis le ticket de test. */
export function PosSetup({
  provider,
  onProvider,
  active,
  freshKey,
  onRotateKey,
  testKey,
  onTestKey,
  onSendTest,
  busy,
}: {
  provider: string;
  onProvider: (id: string) => void;
  /** Une intégration est déjà active : générer une clé révoque l'ancienne. */
  active: boolean;
  /** Clé en clair, affichée une seule fois juste après sa génération. */
  freshKey: string | null;
  onRotateKey: () => void;
  testKey: string;
  onTestKey: (v: string) => void;
  onSendTest: () => void;
  busy: "key" | "test" | null;
}) {
  const t = useT();
  const code = "rounded bg-fill-2 px-1 py-0.5 font-mono text-xs text-ink";

  return (
    <Card>
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-base font-bold text-ink">{t("1. Votre caisse", "1. Your till")}</h2>
          <Segmented
            size="sm"
            className="flex-wrap"
            label={t("Votre caisse", "Your till")}
            options={getPosProviders(t)}
            value={provider}
            onChange={onProvider}
          />
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-ink">{t("2. Votre clé d'API", "2. Your API key")}</h2>
          {freshKey ? (
            <div className="space-y-2">
              <CopyValue value={freshKey} label={t("Copier la clé", "Copy key")} />
              <p className="text-[13px] font-bold text-warn">
                {t(
                  "Copiez-la maintenant : elle ne sera plus jamais affichée.",
                  "Copy it now: it will never be shown again."
                )}
              </p>
            </div>
          ) : (
            <Button variant="primary" icon={KeyRound} loading={busy === "key"} onClick={onRotateKey}>
              {active
                ? t("Régénérer la clé (révoque l'ancienne)", "Regenerate key (revokes the old one)")
                : t("Générer ma clé", "Generate my key")}
            </Button>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-ink">
            {t("3. Le webhook dans votre caisse", "3. The webhook in your till")}
          </h2>
          <CopyValue value={POS_WEBHOOK_URL} label={t("Copier l'URL du webhook", "Copy webhook URL")} />
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            {t(
              <>
                À chaque ticket fermé, envoyez <code className={code}>{"{ table, amount, ticket_id }"}</code>{" "}
                avec l&apos;en-tête <code className={code}>x-twocards-key</code>. Depuis la caisse
                directement, ou via Zapier / Make si elle ne gère pas les webhooks sortants.
              </>,
              <>
                For every closed ticket, send <code className={code}>{"{ table, amount, ticket_id }"}</code>{" "}
                with the <code className={code}>x-twocards-key</code> header. Straight from the till, or
                via Zapier / Make if it does not support outgoing webhooks.
              </>
            )}
          </p>
        </section>

        <section className="space-y-3 border-t border-line pt-5">
          <h2 className="text-base font-bold text-ink">{t("Ticket de test", "Test ticket")}</h2>
          <InfoNote icon={FlaskConical} tone="sky">
            {t(
              "Le test vérifie votre clé et la liaison avec twocards. Il n'envoie ni table ni montant : il n'écrit sur aucune réservation et ne crée aucune commission. Il apparaît dans le journal avec le badge « Test ».",
              "The test checks your key and the link with twocards. It sends no table and no amount: it writes to no reservation and creates no commission. It shows in the log with a “Test” badge."
            )}
          </InfoNote>
          <Field
            label={t("Clé API", "API key")}
            htmlFor="pos-test-key"
            hint={t(
              "La clé n'est jamais réaffichée après sa génération : collez celle que vous avez conservée.",
              "The key is never shown again after it is generated. Paste the one you kept."
            )}
          >
            <input
              id="pos-test-key"
              type="text"
              value={testKey}
              onChange={(e) => onTestKey(e.target.value)}
              placeholder={t("Collez votre clé pour tester", "Paste your key to test")}
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
              <ShieldCheck size={15} strokeWidth={1.75} aria-hidden />
              {t("Clé hachée en base, jamais stockée en clair", "Key is hashed, never stored in plain text")}
            </p>
            <Button
              size="sm"
              icon={Send}
              loading={busy === "test"}
              disabled={!testKey.trim()}
              title={testKey.trim() ? undefined : t("Collez d'abord votre clé API", "Paste your API key first")}
              onClick={onSendTest}
            >
              {t("Envoyer un ticket de test", "Send a test ticket")}
            </Button>
          </div>
        </section>
      </div>
    </Card>
  );
}
