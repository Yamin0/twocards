"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
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

const WEBHOOK_URL =
  "https://bxipezffrrclyezkjckg.supabase.co/functions/v1/pos-webhook";

/* Caisses courantes : la v1 passe par le webhook universel — toutes savent
   l'appeler, directement ou via Zapier / Make. */
const PROVIDERS = [
  { id: "lightspeed", label: "Lightspeed" },
  { id: "square", label: "Square" },
  { id: "tiller", label: "Tiller by SumUp" },
  { id: "laddition", label: "L'Addition" },
  { id: "zelty", label: "Zelty" },
  { id: "micros", label: "Oracle Micros" },
  { id: "generic", label: "Autre / Zapier" },
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

const EVENT_BADGE: Record<PosEvent["status"], { label: string; cls: string }> = {
  matched: { label: "rapproché", cls: "bg-emerald-500/15 text-emerald-400" },
  unmatched: { label: "non rapproché", cls: "bg-amber-500/15 text-amber-400" },
  duplicate: { label: "doublon", cls: "bg-white/10 text-white/40" },
};

export default function IntegrationsPage() {
  const { isLoading } = useAuthUser();
  const { toast, showToast } = useToast();
  const [integration, setIntegration] = useState<Integration | null | undefined>(undefined);
  const [events, setEvents] = useState<PosEvent[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [provider, setProvider] = useState("generic");
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<"key" | "test" | null>(null);
  const [copied, setCopied] = useState<"url" | "key" | null>(null);

  const load = () => {
    const sb = createClient();
    sb.from("venue_integrations")
      .select("provider, status, last_event_at")
      .maybeSingle()
      .then(({ data }) => {
        setIntegration(data ?? null);
        if (data) setProvider(data.provider);
      });
    sb.from("pos_events")
      .select("id, ticket_id, table_label, amount, status, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setEvents(data ?? []));
    sb.from("venue_tables")
      .select("label")
      .order("label")
      .then(({ data }) => setTables((data ?? []).map((t) => t.label)));
  };

  useEffect(load, []);

  if (isLoading || integration === undefined) return <DashboardSkeleton />;

  const copy = async (text: string, which: "url" | "key") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      showToast("Impossible de copier");
    }
  };

  const rotateKey = async () => {
    setBusy("key");
    const { data, error } = await createClient().rpc("pos_rotate_key", {
      p_provider: provider,
    });
    setBusy(null);
    if (error || !data) {
      showToast("Impossible de générer la clé");
      return;
    }
    setFreshKey(data as string);
    load();
  };

  const sendTest = async () => {
    if (!freshKey) return;
    setBusy("test");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-twocards-key": freshKey,
        },
        body: JSON.stringify({
          table: tables[0] ?? "1",
          amount: 1234,
          ticket_id: `TEST-${Date.now()}`,
        }),
      });
      const body = await res.json();
      showToast(
        body.status === "matched"
          ? `Test rapproché — ${body.commission} MAD de commission dérivés`
          : `Test reçu (${body.status ?? res.status}) — voir le journal`
      );
    } catch {
      showToast("Le test n'a pas abouti");
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
          Caisse (POS)
        </h1>
        <p className="font-ui text-sm text-white/60 mt-1.5 max-w-2xl">
          Connectez votre caisse : chaque ticket fermé remplit automatiquement
          le montant de la sortie twocards correspondante — la commission se
          calcule sans aucune saisie.
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
                ? `Intégration active — ${PROVIDERS.find((p) => p.id === integration.provider)?.label ?? integration.provider}`
                : "Aucune caisse connectée"}
            </p>
            <p className="font-ui text-xs text-white/40 mt-0.5">
              {integration?.last_event_at
                ? `Dernier événement reçu le ${new Date(integration.last_event_at).toLocaleString("fr-FR")}`
                : "Suivez les trois étapes ci-dessous — cinq minutes suffisent"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Étapes de connexion */}
        <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-normal text-white mb-3">
              1. Votre caisse
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
              2. Votre clé d&apos;API
            </h2>
            {freshKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className={`${inputLike} flex-1`}>{freshKey}</p>
                  <button
                    onClick={() => copy(freshKey, "key")}
                    aria-label="Copier la clé"
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
                  Copiez-la maintenant : elle ne sera plus jamais affichée.
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
                  ? "Régénérer la clé (révoque l'ancienne)"
                  : "Générer ma clé"}
              </button>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg font-normal text-white mb-3">
              3. Le webhook dans votre caisse
            </h2>
            <div className="flex items-center gap-2">
              <p className={`${inputLike} flex-1`}>{WEBHOOK_URL}</p>
              <button
                onClick={() => copy(WEBHOOK_URL, "url")}
                aria-label="Copier l'URL du webhook"
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
              À chaque ticket fermé, envoyez{" "}
              <code className="text-white/60">
                {"{ table, amount, ticket_id }"}
              </code>{" "}
              avec l&apos;en-tête{" "}
              <code className="text-white/60">x-twocards-key</code>. Depuis la
              caisse directement, ou via Zapier / Make si elle ne gère pas les
              webhooks sortants.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
            <p className="font-ui text-xs text-white/40 flex items-center gap-1.5">
              <ShieldCheck size={13} strokeWidth={1.5} />
              Clé hachée en base, jamais stockée en clair
            </p>
            <button
              onClick={sendTest}
              disabled={!freshKey || busy === "test"}
              title={freshKey ? undefined : "Générez d'abord une clé"}
              className="font-ui flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              {busy === "test" ? (
                <Loader2 size={13} strokeWidth={2} className="animate-spin" />
              ) : (
                <Send size={13} strokeWidth={1.5} />
              )}
              Envoyer un ticket de test
            </button>
          </div>
        </div>

        {/* Journal + correspondance des tables */}
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-normal text-white">
                Journal des événements
              </h2>
              <button
                onClick={load}
                aria-label="Rafraîchir"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 hover:text-white"
              >
                <RefreshCw size={14} strokeWidth={1.5} />
              </button>
            </div>
            {events.length === 0 ? (
              <p className="font-ui text-xs text-white/40 leading-relaxed">
                Aucun événement reçu. Dès que votre caisse appellera le
                webhook, chaque ticket apparaîtra ici — rapproché ou non.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {events.map((e) => (
                  <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-ui text-xs text-white truncate">
                        Table {e.table_label ?? "?"} ·{" "}
                        {(e.amount ?? 0).toLocaleString()} MAD
                        {e.ticket_id ? ` · ${e.ticket_id}` : ""}
                      </p>
                      <p className="font-ui text-[11px] text-white/40 truncate">
                        {new Date(e.created_at).toLocaleString("fr-FR")}
                        {e.reason ? ` — ${e.reason}` : ""}
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
              Correspondance des tables
            </h2>
            <p className="font-ui text-xs text-white/40 leading-relaxed mb-3">
              Le champ <code className="text-white/60">table</code> envoyé par
              la caisse doit porter le même libellé que vos tables twocards :
            </p>
            {tables.length === 0 ? (
              <p className="font-ui text-xs text-amber-300/80">
                Aucune table dans votre plan de salle — créez-les d&apos;abord.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tables.map((t) => (
                  <span
                    key={t}
                    className="font-mono rounded-lg bg-white/[0.06] border border-white/10 px-2 py-1 text-[11px] text-white/60"
                  >
                    {t}
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
          Votre caisse n&apos;apparaît pas ou vous préférez être accompagné ?
          L&apos;équipe twocards configure l&apos;intégration avec vous —
          écrivez-nous depuis l&apos;onglet Messages.
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
