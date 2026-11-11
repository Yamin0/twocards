"use client";

import Link from "next/link";
import QRCode from "react-qr-code";
import { BedDouble, CheckSquare, Copy, Download, MapPin, Power, Square, Trash2 } from "lucide-react";
import { Badge, Card, IconButton, LinkButton, StatusPill } from "@/components/app/ui";
import type { QrPerformance } from "@/lib/hotel/analytics";
import { formatMad, formatNumber, isRoomLabel } from "@/lib/hotel/format";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

/* Carte d'un emplacement : le QR (sur blanc, tel qu'il sera imprimé), ce
   qu'il rapporte, et les gestes courants. Le conteneur id="qr-<id>" est lu
   par downloadSvg. */
export function QrCard({
  q,
  link,
  best,
  selected,
  onSelect,
  onToggle,
  onDelete,
  onCopy,
  onDownload,
}: {
  q: QrPerformance;
  link: string;
  /** Ce QR est celui qui a rapporté le plus de commissions. */
  best: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const Icon = isRoomLabel(q.label) ? BedDouble : MapPin;
  const stats = [
    { label: t("Scans", "Scans"), value: formatNumber(q.scans, locale) },
    { label: t("Réservations", "Bookings"), value: formatNumber(q.liveReservations, locale) },
    {
      label: t("Commission", "Commission"),
      value: q.commission > 0 ? formatMad(q.commission, true, locale) : "—",
    },
  ];
  return (
    <Card
      as="article"
      padded={false}
      className={cn("flex flex-col", selected && "border-link ring-2 ring-link/25")}
      bodyClassName="flex flex-1 flex-col p-4"
    >
      <div className="mb-3 flex items-start gap-1">
        <IconButton
          icon={selected ? CheckSquare : Square}
          label={
            selected
              ? t(`Désélectionner ${q.label}`, `Deselect ${q.label}`)
              : t(`Sélectionner ${q.label}`, `Select ${q.label}`)
          }
          aria-pressed={selected}
          onClick={onSelect}
          className={cn("-ml-2 -mt-2", selected && "text-link")}
        />
        <div className="min-w-0 flex-1">
          <Link href={`/hotel/chambres/${q.id}`} className="flex items-center gap-1.5 hover:underline">
            <Icon size={15} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <span className="truncate text-sm font-bold text-ink">{q.label}</span>
          </Link>
          <p className="num mt-0.5 text-xs text-ink-3">
            {t("Code", "Code")} {q.code}
          </p>
        </div>
        <StatusPill status={q.active ? "actif" : "inactif"} />
      </div>

      <Link
        href={`/hotel/chambres/${q.id}`}
        id={`qr-${q.id}`}
        className={cn(
          "flex items-center justify-center rounded-xl border border-line bg-white p-4",
          !q.active && "opacity-50"
        )}
        aria-label={t(`Ouvrir ${q.label}`, `Open ${q.label}`)}
      >
        <QRCode value={link} size={132} />
      </Link>

      {best && (
        <Badge tone="ok" className="mt-3 self-start">
          {t("Rapporte le plus", "Top earner")}
        </Badge>
      )}

      <dl className="num mt-3 grid grid-cols-3 gap-2 text-center">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-fill px-1 py-1.5">
            <dt className="truncate text-xs text-ink-3">{s.label}</dt>
            <dd className="truncate text-sm font-bold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto pt-3">
        <LinkButton href={`/hotel/chambres/${q.id}`} size="sm" className="w-full">
          {t("Menu et suivi", "Menu and tracking")}
        </LinkButton>
        <div className="mt-1 flex items-center justify-between">
          <IconButton icon={Copy} label={t("Copier le lien", "Copy link")} onClick={onCopy} />
          <IconButton icon={Download} label={t("Télécharger le SVG", "Download SVG")} onClick={onDownload} />
          <IconButton
            icon={Power}
            label={q.active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")}
            onClick={onToggle}
          />
          <IconButton icon={Trash2} label={t("Supprimer", "Delete")} onClick={onDelete} tone="danger" />
        </div>
      </div>
    </Card>
  );
}
