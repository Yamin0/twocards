"use client";

import { Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Button, Segmented, Switch } from "@/components/app/ui";
import type { VenueTable, VenueTablePatch } from "@/hooks/use-venue-tables";
import { Stepper } from "./table-details";

/* Réglages d'une table en mode édition : chaque geste est enregistré tout
   de suite. `shape` et `status` gardent leurs valeurs de base ; seuls les
   libellés suivent la langue. */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <span className="text-[13px] font-bold text-ink-2">{label}</span>
      {children}
    </div>
  );
}

export function TableEditor({
  table,
  onPatch,
  onDelete,
}: {
  table: VenueTable;
  onPatch: (patch: VenueTablePatch) => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <div className="space-y-3">
      <div className="space-y-4 rounded-xl border border-line bg-fill p-4">
        <Row label={t("Capacité", "Capacity")}>
          <Stepper
            value={table.capacity}
            onChange={(capacity) => onPatch({ capacity })}
            min={1}
            max={50}
            decreaseLabel={t("Réduire la capacité", "Decrease capacity")}
            increaseLabel={t("Augmenter la capacité", "Increase capacity")}
          />
        </Row>
        <Row label={t("Table VIP", "VIP table")}>
          <Switch
            checked={table.vip}
            onChange={(vip) => onPatch({ vip })}
            label={t("Table VIP", "VIP table")}
          />
        </Row>
        <Row label={t("Forme", "Shape")}>
          <Segmented<VenueTable["shape"]>
            size="sm"
            label={t("Forme", "Shape")}
            value={table.shape}
            onChange={(shape) => onPatch({ shape })}
            options={[
              { value: "round", label: t("Ronde", "Round") },
              { value: "rect", label: t("Rectangle", "Rectangle") },
            ]}
          />
        </Row>
        <Row label={t("Statut", "Status")}>
          <Segmented<VenueTable["status"]>
            size="sm"
            label={t("Statut", "Status")}
            value={table.status}
            onChange={(status) => onPatch({ status })}
            options={[
              { value: "available", label: t("Libre", "Free") },
              { value: "occupied", label: t("Occupée", "Occupied") },
              { value: "blocked", label: t("Bloquée", "Blocked") },
            ]}
          />
        </Row>
      </div>
      <Button variant="danger" icon={Trash2} onClick={onDelete} className="w-full">
        {t("Supprimer cette table", "Delete this table")}
      </Button>
    </div>
  );
}
