"use client";

import { useState } from "react";
import { Plug, Webhook } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { usePosIntegration } from "@/hooks/use-pos-integration";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  Card,
  ErrorState,
  InfoNote,
  PageHeader,
  PageSkeleton,
  cardClass,
  useNotify,
} from "@/components/app/ui";
import { PosSetup, getPosProviders } from "@/components/venue/integrations/pos-setup";
import { PosEventLog, PosTableMapping } from "@/components/venue/integrations/pos-log";

/* Caisse (POS) : chaque ticket fermé remplit le montant de la sortie
   correspondante. Cette page ne fait que générer la clé, montrer le webhook
   et lire le journal ; le rapprochement et la commission restent en base. */

export default function IntegrationsPage() {
  const { isLoading: authLoading } = useAuthUser();
  const t = useT();
  const intl = useIntlLocale();
  const notify = useNotify();
  const { integration, events, tables, isLoading, error, reload, refresh, rotateKey, sendTest } =
    usePosIntegration();

  /* Caisse choisie : celle de l'intégration enregistrée tant que
     l'utilisateur n'en a pas sélectionné une autre. */
  const [chosenProvider, setChosenProvider] = useState<string | null>(null);
  const provider = chosenProvider ?? integration?.provider ?? "generic";
  const [freshKey, setFreshKey] = useState<string | null>(null);
  /* Clé saisie pour le ticket de test : pré-remplie à la génération, sinon
     collée par l'utilisateur — la clé n'étant jamais réaffichée. */
  const [testKey, setTestKey] = useState("");
  const [busy, setBusy] = useState<"key" | "test" | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const header = (
    <PageHeader
      title={t("Caisse (POS)", "Point of sale (POS)")}
      description={t(
        "Connectez votre caisse : chaque ticket fermé remplit automatiquement le montant de la sortie twocards correspondante, la commission se calcule sans aucune saisie.",
        "Connect your till: every closed ticket automatically fills in the amount of the matching twocards outing, and the commission is calculated with no manual entry."
      )}
    />
  );

  if (authLoading || isLoading) return <PageSkeleton kpis={0} rows={4} />;

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Card padded={false}>
          <ErrorState
            title={t("Impossible de charger l'intégration", "Could not load the integration")}
            onRetry={reload}
          />
        </Card>
      </div>
    );
  }

  const onRotateKey = async () => {
    setBusy("key");
    const key = await rotateKey(provider);
    setBusy(null);
    if (!key) {
      notify(t("Impossible de générer la clé", "Could not generate the key"), "error");
      return;
    }
    setFreshKey(key);
    setTestKey(key);
  };

  const onSendTest = async () => {
    const key = testKey.trim();
    if (!key || tables.length === 0) return;
    setBusy("test");
    const result = await sendTest(key);
    setBusy(null);
    if (!result.ok) {
      notify(t("Le test n'a pas abouti", "The test failed"), "error");
    } else if (result.status === "matched") {
      notify(
        t(
          `Test rapproché · ${result.commission} MAD de commission dérivés`,
          `Test matched · ${result.commission} MAD commission derived`
        )
      );
    } else {
      notify(
        t(
          `Test reçu (${result.status}), voir le journal`,
          `Test received (${result.status}), see the log`
        )
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const ok = await refresh();
    setRefreshing(false);
    if (!ok) notify(t("Actualisation impossible", "Could not refresh"), "error");
  };

  const active = integration?.status === "active";
  const providerLabel =
    getPosProviders(t).find((p) => p.value === integration?.provider)?.label ?? integration?.provider;

  return (
    <div className="space-y-6">
      {header}

      {/* Statut */}
      <div className={cn(cardClass, "flex items-center gap-3 p-4")}>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            active ? "bg-ok-soft text-ok" : "bg-fill-2 text-ink-3"
          )}
        >
          <Plug size={18} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">
            {active
              ? `${t("Intégration active", "Integration active")} · ${providerLabel}`
              : t("Aucune caisse connectée", "No till connected")}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {integration?.last_event_at
              ? t(
                  `Dernier événement reçu le ${new Date(integration.last_event_at).toLocaleString(intl)}`,
                  `Last event received on ${new Date(integration.last_event_at).toLocaleString(intl)}`
                )
              : t(
                  "Suivez les trois étapes ci-dessous, cinq minutes suffisent",
                  "Follow the three steps below. It only takes five minutes"
                )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <PosSetup
          provider={provider}
          onProvider={setChosenProvider}
          active={active}
          freshKey={freshKey}
          onRotateKey={onRotateKey}
          testKey={testKey}
          onTestKey={setTestKey}
          onSendTest={onSendTest}
          hasTables={tables.length > 0}
          busy={busy}
        />
        <div className="space-y-4">
          <PosEventLog events={events} onRefresh={onRefresh} refreshing={refreshing} />
          <PosTableMapping tables={tables} />
        </div>
      </div>

      <InfoNote icon={Webhook}>
        {t(
          "Votre caisse n'apparaît pas ou vous préférez être accompagné ? L'équipe twocards configure l'intégration avec vous : écrivez-nous depuis l'onglet Messages.",
          "Your till isn't listed, or you'd rather have some help? The twocards team will set up the integration with you. Write to us from the Messages tab."
        )}
      </InfoNote>
    </div>
  );
}
