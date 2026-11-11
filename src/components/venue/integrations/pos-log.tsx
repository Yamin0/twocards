"use client";

import { Receipt, RefreshCw } from "lucide-react";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { Badge, Card, EmptyState, IconButton, Tag, type BadgeTone } from "@/components/app/ui";
import type { PosEvent } from "@/hooks/use-pos-integration";

/* Statut technique renvoyé par le webhook (valeur anglaise en base) : seul
   le libellé affiché est traduit. */
const EVENT_TONE: Record<PosEvent["status"], BadgeTone> = {
  matched: "ok",
  unmatched: "warn",
  duplicate: "neutral",
};

/* Journal des dix derniers tickets reçus. */
export function PosEventLog({
  events,
  onRefresh,
  refreshing,
}: {
  events: PosEvent[];
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const labels: Record<PosEvent["status"], string> = {
    matched: t("Rapproché", "Matched"),
    unmatched: t("Non rapproché", "Unmatched"),
    duplicate: t("Doublon", "Duplicate"),
  };
  return (
    <Card
      title={t("Journal des événements", "Event log")}
      actions={
        <IconButton
          icon={RefreshCw}
          label={t("Rafraîchir le journal", "Refresh the log")}
          onClick={onRefresh}
          disabled={refreshing}
          className={refreshing ? "[&>svg]:animate-spin" : undefined}
        />
      }
    >
      {events.length === 0 ? (
        <EmptyState
          compact
          icon={Receipt}
          title={t("Aucun événement reçu", "No events received yet")}
          description={t(
            "Dès que votre caisse appellera le webhook, chaque ticket apparaîtra ici, rapproché ou non.",
            "As soon as your till calls the webhook, every ticket will appear here, matched or not."
          )}
        />
      ) : (
        <ul className="divide-y divide-line">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="num truncate text-sm text-ink">
                  {t("Table", "Table")} {e.table_label ?? "?"} · {(e.amount ?? 0).toLocaleString(intl)} MAD
                  {e.ticket_id ? ` · ${e.ticket_id}` : ""}
                </p>
                <p className="truncate text-xs text-ink-3">
                  {new Date(e.created_at).toLocaleString(intl)}
                  {e.reason ? ` · ${e.reason}` : ""}
                </p>
              </div>
              <Badge tone={EVENT_TONE[e.status] ?? "neutral"} className="shrink-0">
                {labels[e.status] ?? e.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* Libellés des tables du plan de salle, tels que la caisse doit les envoyer. */
export function PosTableMapping({ tables }: { tables: string[] }) {
  const t = useT();
  return (
    <Card title={t("Correspondance des tables", "Table mapping")}>
      <p className="mb-3 text-[13px] leading-relaxed text-ink-2">
        {t(
          <>
            Le champ <code className="rounded bg-fill-2 px-1 py-0.5 font-mono text-xs text-ink">table</code>{" "}
            envoyé par la caisse doit porter le même libellé que vos tables twocards :
          </>,
          <>
            The <code className="rounded bg-fill-2 px-1 py-0.5 font-mono text-xs text-ink">table</code>{" "}
            field sent by the till must use the same label as your twocards tables:
          </>
        )}
      </p>
      {tables.length === 0 ? (
        <p className="text-[13px] text-warn">
          {t(
            "Aucune table dans votre plan de salle : créez-les d'abord.",
            "No tables in your floor plan yet. Create them first."
          )}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tables.map((label) => (
            <Tag key={label} className="font-mono">
              {label}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  );
}
