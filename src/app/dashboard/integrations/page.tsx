"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { useT, useIntlLocale } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  Send,
  ShieldCheck,
  Webhook,
} from "lucide-react";

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pos-webhook`;

/* Caisses courantes : la v1 passe par le webhook universel — toutes savent
   l'appeler, directement ou via Zapier / Make. */
const getProviders = (t: Translate) => [
  { id: "lightspeed", label: "Lightspeed" },
  { id: "square", label: "Square" },
  { id: "tiller", label: "Tiller by SumUp" },
  { id: "laddition", label: "L'Addition" },
  { id: "zelty", label: "Zelty" },
  { id: "micros", label: "Oracle Micros" },
  { id: "generic", label: t("Autre / Zapier", "Other / Zapier") },
];

type Integration = {
  provider: string;
  status: string;
  last_event_at: string | null;
};

type PosEvent = {
  id: number;
  ticket_id: string | null;
  table_label: string | null;
  amount: number | null;
  status: "matched" | "unmatched" | "duplicate";
  reason: string | null;
  created_at: string;
};

const getEventBadge = (
  t: Translate
): Record<PosEvent["status"], { label: string; cls: string }> => ({
  matched: { label: t("rapproché", "matched"), cls: "bg-emerald-500/15 text-emerald-400" },
  unmatched: { label: t("non rapproché", "unmatched"), cls: "bg-amber-500/15 text-amber-400" },
  duplicate: { label: t("doublon", "duplicate"), cls: "bg-white/10 text-white/40" },
});

export default function IntegrationsPage() {
  const { isLoading } = useAuthUser();
  const { toast, showToast } = useToast();
  const t = useT();
  const intl = useIntlLocale();
  const PROVIDERS = getProviders(t);
  const EVENT_BADGE = getEventBadge(t);
  const [integration, setIntegration] = useState<Integration | null | undefined>(undefined);
  const [events, setEvents] = useState<PosEvent[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [provider, setProvider] = useState("generic");
  const [freshKey, setFreshKey] = useState<string | null>(null);
  /* Clé saisie pour le ticket de test : pré-remplie à la génération, sinon
     collée par l'utilisateur — la clé n'étant jamais réaffichée. */
  const [testKey, setTestKey] = useState("");
  const [busy, setBusy] = useState<"key" | "test" | null>(null);
  const [copied, setCopied] = useState<"url" | "key" | null>(null);

  const load = (isCancelled: () => boolean = () => false) => {
    const sb = createClient();
    sb.from("venue_integrations")
      .select("provider, status, last_event_at")
      .maybeSingle()
      .then(({ data, error }) => {
        if (isCancelled()) return;
        if (error) {
          setIntegration(null);
          showToast(t("Impossible de charger l'intégration", "Could not load the integration"));
          return;
        }
        setIntegration(data ?? null);
        if (data) setProvider(data.provider);
      });
    sb.from("pos_events")
      .select("id, ticket_id, table_label, amount, status, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!isCancelled()) setEvents(data ?? []);
      });
    sb.from("venue_tables")
      .select("label")
      .order("label")
      .then(({ data }) => {
        if (!isCancelled()) setTables((data ?? []).map((row) => row.label));
      });
  };

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || integration === undefined) return <DashboardSkeleton />;

  const copy = async (text: string, which: "url" | "key") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      showToast(t("Impossible de copier", "Could not copy"));
    }
  };

  const rotateKey = async () => {
    setBusy("key");
    const { data, error } = await createClient().rpc("pos_rotate_key", {
      p_provider: provider,
    });
    setBusy(null);
    if (error || !data) {
      showToast(t("Impossible de générer la clé", "Could not generate the key"));
      return;
    }
    setFreshKey(data as string);
    setTestKey(data as string);
    load();
  };

  const sendTest = async () => {
    const key = testKey.trim();
    if (!key || tables.length === 0) return;
    setBusy("test");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-twocards-key": key,
        },
        body: JSON.stringify({
          table: tables[0],
          amount: 1234,
          ticket_id: `TEST-${Date.now()}`,
        }),
      });
      const body = await res.json();
      showToast(
        body.status === "matched"
          ? t(
              `Test rapproché · ${body.commission} MAD de commission dérivés`,
              `Test matched · ${body.commission} MAD commission derived`
            )
          : t(
              `Test reçu (${body.status ?? res.status}), voir le journal`,
              `Test received (${body.status ?? res.status}), see the log`
            )
      );
    } catch {
      showToast(t("Le test n'a pas abouti", "The test failed"));
    }
    setBusy(null);
    load();
  };

  const inputLike =
    "font-mono truncate rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs text-white/70";

  return (
    <div className="bg-transparent min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="font-display text-3xl font-light text-white">
          {t("Caisse (POS)", "Point of sale (POS)")}
        </h1>
        <p className="font-ui text-sm text-white/60 mt-1.5 max-w-2xl">
          {t(
            "Connectez votre caisse : chaque ticket fermé remplit automatiquement le montant de la sortie twocards correspondante, la commission se calcule sans aucune saisie.",
            "Connect your till: every closed ticket automatically fills in the amount of the matching twocards outing, and the commission is calculated with no manual entry."
          )}
        </p>
      </div>

      {/* Statut */}
      <div className="px-4 sm:px-6 pb-6">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.12] backdrop-blur-xl bg-black/35 p-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              integration?.status === "active"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-white/10 text-white/40"
            }`}
          >
            <Plug size={18} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="font-ui text-sm font-semibold text-white">
              {integration?.status === "active"
                ? `${t("Intégration active", "Integration active")} · ${PROVIDERS.find((p) => p.id === integration.provider)?.label ?? integration.provider}`
                : t("Aucune caisse connectée", "No till connected")}
            </p>
            <p className="font-ui text-xs text-white/40 mt-0.5">
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
      </div>

      <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Étapes de connexion */}
        <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-normal text-white mb-3">
              {t("1. Votre caisse", "1. Your till")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`font-ui px-3 py-1.5 rounded-full text-xs transition-colors ${
                    provider === p.id
                      ? "bg-white/20 text-white border border-white/20"
                      : "bg-white/[0.05] text-white/50 border border-white/10 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-normal text-white mb-3">
              {t(<>2. Votre clé d&apos;API</>, <>2. Your API key</>)}
            </h2>
            {freshKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className={`${inputLike} flex-1`}>{freshKey}</p>
                  <button
                    onClick={() => copy(freshKey, "key")}
                    aria-label={t("Copier la clé", "Copy key")}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/15"
                  >
                    {copied === "key" ? (
                      <Check size={14} strokeWidth={2} className="text-emerald-400" />
                    ) : (
                      <Copy size={14} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <p className="font-ui text-[11px] text-amber-300/80">
                  {t(
                    "Copiez-la maintenant : elle ne sera plus jamais affichée.",
                    "Copy it now: it will never be shown again."
                  )}
                </p>
              </div>
            ) : (
              <button
                onClick={rotateKey}
                disabled={busy === "key"}
                className="font-ui flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {busy === "key" ? (
                  <Loader2 size={15} strokeWidth={2} className="animate-spin" />
                ) : (
                  <KeyRound size={15} strokeWidth={1.5} />
                )}
                {integration?.status === "active"
                  ? t("Régénérer la clé (révoque l'ancienne)", "Regenerate key (revokes the old one)")
                  : t("Générer ma clé", "Generate my key")}
              </button>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg font-normal text-white mb-3">
              {t("3. Le webhook dans votre caisse", "3. The webhook in your till")}
            </h2>
            <div className="flex items-center gap-2">
              <p className={`${inputLike} flex-1`}>{WEBHOOK_URL}</p>
              <button
                onClick={() => copy(WEBHOOK_URL, "url")}
                aria-label={t("Copier l'URL du webhook", "Copy webhook URL")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/15"
              >
                {copied === "url" ? (
                  <Check size={14} strokeWidth={2} className="text-emerald-400" />
                ) : (
                  <Copy size={14} strokeWidth={1.5} />
                )}
              </button>
            </div>
            <p className="font-ui text-xs text-white/40 mt-2 leading-relaxed">
              {t(
                <>
                  À chaque ticket fermé, envoyez{" "}
                  <code className="text-white/60">
                    {"{ table, amount, ticket_id }"}
                  </code>{" "}
                  avec l&apos;en-tête{" "}
                  <code className="text-white/60">x-twocards-key</code>. Depuis la
                  caisse directement, ou via Zapier / Make si elle ne gère pas les
                  webhooks sortants.
                </>,
                <>
                  For every closed ticket, send{" "}
                  <code className="text-white/60">
                    {"{ table, amount, ticket_id }"}
                  </code>{" "}
                  with the{" "}
                  <code className="text-white/60">x-twocards-key</code> header.
                  Straight from the till, or via Zapier / Make if it does not
                  support outgoing webhooks.
                </>
              )}
            </p>
          </div>

          <div className="border-t border-white/[0.08] pt-4 space-y-3">
            <div>
              <label
                htmlFor="pos-test-key"
                className="font-ui block text-xs text-white/60 mb-1.5"
              >
                {t("Clé API", "API key")}
              </label>
              <input
                id="pos-test-key"
                type="text"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder={t("Collez votre clé pour tester", "Paste your key to test")}
                autoComplete="off"
                spellCheck={false}
                className="font-mono w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs text-white/70 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              <p className="font-ui text-[11px] text-white/40 mt-1.5">
                {t(
                  <>
                    La clé n&apos;est jamais réaffichée après sa génération,
                    collez celle que vous avez conservée.
                  </>,
                  <>The key is never shown again after it is generated. Paste the one you kept.</>
                )}
              </p>
            </div>
            {tables.length === 0 && (
              <p className="font-ui text-[11px] text-amber-300/80">
                {t(
                  <>
                    Créez d&apos;abord une table dans le plan de salle pour tester
                    le rapprochement.
                  </>,
                  <>Create a table in the floor plan first to test matching.</>
                )}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="font-ui text-xs text-white/40 flex items-center gap-1.5">
                <ShieldCheck size={13} strokeWidth={1.5} />
                {t("Clé hachée en base, jamais stockée en clair", "Key is hashed, never stored in plain text")}
              </p>
              <button
                onClick={sendTest}
                disabled={!testKey.trim() || tables.length === 0 || busy === "test"}
                title={
                  tables.length === 0
                    ? t("Créez d'abord une table dans le plan de salle", "Create a table in the floor plan first")
                    : testKey.trim()
                      ? undefined
                      : t("Collez d'abord votre clé API", "Paste your API key first")
                }
                className="font-ui flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                {busy === "test" ? (
                  <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                ) : (
                  <Send size={13} strokeWidth={1.5} />
                )}
                {t("Envoyer un ticket de test", "Send a test ticket")}
              </button>
            </div>
          </div>
        </div>

        {/* Journal + correspondance des tables */}
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-normal text-white">
                {t("Journal des événements", "Event log")}
              </h2>
              <button
                onClick={() => load()}
                aria-label={t("Rafraîchir", "Refresh")}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 hover:text-white"
              >
                <RefreshCw size={14} strokeWidth={1.5} />
              </button>
            </div>
            {events.length === 0 ? (
              <p className="font-ui text-xs text-white/40 leading-relaxed">
                {t(
                  "Aucun événement reçu. Dès que votre caisse appellera le webhook, chaque ticket apparaîtra ici, rapproché ou non.",
                  "No events received yet. As soon as your till calls the webhook, every ticket will appear here, matched or not."
                )}
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {events.map((e) => (
                  <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-ui text-xs text-white truncate">
                        Table {e.table_label ?? "?"} ·{" "}
                        {(e.amount ?? 0).toLocaleString(intl)} MAD
                        {e.ticket_id ? ` · ${e.ticket_id}` : ""}
                      </p>
                      <p className="font-ui text-[11px] text-white/40 truncate">
                        {new Date(e.created_at).toLocaleString(intl)}
                        {e.reason ? ` · ${e.reason}` : ""}
                      </p>
                    </div>
                    <span
                      className={`font-ui shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${EVENT_BADGE[e.status].cls}`}
                    >
                      {EVENT_BADGE[e.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6">
            <h2 className="font-display text-lg font-normal text-white mb-2">
              {t("Correspondance des tables", "Table mapping")}
            </h2>
            <p className="font-ui text-xs text-white/40 leading-relaxed mb-3">
              {t(
                <>
                  Le champ <code className="text-white/60">table</code> envoyé par
                  la caisse doit porter le même libellé que vos tables twocards :
                </>,
                <>
                  The <code className="text-white/60">table</code> field sent by
                  the till must use the same label as your twocards tables:
                </>
              )}
            </p>
            {tables.length === 0 ? (
              <p className="font-ui text-xs text-amber-300/80">
                {t(
                  <>Aucune table dans votre plan de salle, créez-les d&apos;abord.</>,
                  <>No tables in your floor plan yet. Create them first.</>
                )}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tables.map((label) => (
                  <span
                    key={label}
                    className="font-mono rounded-lg bg-white/[0.06] border border-white/10 px-2 py-1 text-[11px] text-white/60"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note d'accompagnement */}
      <div className="px-4 sm:px-6 pb-8">
        <p className="font-ui flex items-start gap-2 text-xs text-white/40 max-w-2xl">
          <Webhook size={13} strokeWidth={1.5} className="shrink-0 mt-0.5" />
          {t(
            <>
              Votre caisse n&apos;apparaît pas ou vous préférez être accompagné ?
              L&apos;équipe twocards configure l&apos;intégration avec vous,
              écrivez-nous depuis l&apos;onglet Messages.
            </>,
            <>
              Your till isn&apos;t listed, or you&apos;d rather have some help?
              The twocards team will set up the integration with you. Write to
              us from the Messages tab.
            </>
          )}
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/15 text-white px-4 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="font-ui text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
