"use client";

import Link from "next/link";
import QRCode from "react-qr-code";
import { CheckSquare, Copy, Download, Power, Square } from "lucide-react";
import { Badge, Card, IconButton, LinkButton, StatusPill, Table, Td, Th, Tr } from "@/components/app/ui";
import { formatMad, formatNumber, formatPercent, timeAgo } from "@/lib/hotel/format";
import type { QrList } from "@/lib/hotel/use-qr-list";
import { useLocale, useT } from "@/lib/i18n/client";

/* Vue liste des emplacements : ce que chaque QR produit, colonne par
   colonne. Sous 768 px, chaque ligne se replie en carte. */
export function QrTable({ list }: { list: QrList }) {
  const t = useT();
  const locale = useLocale();
  const { filtered, selected, best } = list;
  return (
    <Card padded={false} as="div">
      <Table stack>
        <thead>
          <tr>
            <Th>{t("Emplacement", "Location")}</Th>
            <Th>{t("Statut", "Status")}</Th>
            <Th align="right">{t("Scans", "Scans")}</Th>
            <Th align="right">{t("Réservations", "Reservations")}</Th>
            <Th align="right">{t("Conversion", "Conversion")}</Th>
            <Th align="right">{t("Montant dépensé", "Amount spent")}</Th>
            <Th align="right">{t("Commission", "Commission")}</Th>
            <Th>{t("Dernière demande", "Latest request")}</Th>
            <Th align="right">
              <span className="sr-only">{t("Actions", "Actions")}</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((q) => {
            const on = selected.has(q.id);
            return (
              <Tr key={q.id}>
                <Td head>
                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={on ? CheckSquare : Square}
                      label={
                        on
                          ? t(`Désélectionner ${q.label}`, `Deselect ${q.label}`)
                          : t(`Sélectionner ${q.label}`, `Select ${q.label}`)
                      }
                      aria-pressed={on}
                      onClick={() => list.toggleSelect(q.id)}
                      className={on ? "-ml-2 text-link" : "-ml-2"}
                    />
                    <div className="min-w-0">
                      <Link href={`/hotel/chambres/${q.id}`} className="font-bold text-ink hover:underline">
                        {q.label}
                      </Link>
                      {best?.id === q.id && (
                        <Badge tone="ok" className="ml-2">
                          {t("Rapporte le plus", "Top earner")}
                        </Badge>
                      )}
                      <p className="num text-xs text-ink-3">{q.code}</p>
                    </div>
                  </div>
                </Td>
                <Td label={t("Statut", "Status")}>
                  <StatusPill status={q.active ? "actif" : "inactif"} />
                </Td>
                <Td label={t("Scans", "Scans")} align="right" className="num">
                  {formatNumber(q.scans, locale)}
                </Td>
                <Td label={t("Réservations", "Reservations")} align="right" className="num">
                  {formatNumber(q.liveReservations, locale)}
                </Td>
                <Td label={t("Conversion", "Conversion")} align="right" className="num" muted>
                  {q.scans > 0 ? formatPercent(q.conversion, 1, locale) : "—"}
                </Td>
                <Td label={t("Montant dépensé", "Amount spent")} align="right" className="num whitespace-nowrap" muted>
                  {q.spent > 0 ? formatMad(q.spent, false, locale) : "—"}
                </Td>
                <Td label={t("Commission", "Commission")} align="right" className="num whitespace-nowrap font-bold">
                  {q.commission > 0 ? formatMad(q.commission, false, locale) : "—"}
                </Td>
                <Td label={t("Dernière demande", "Latest request")} muted className="whitespace-nowrap">
                  {q.lastReservation ? timeAgo(q.lastReservation, undefined, locale) : "—"}
                </Td>
                <Td actions align="right">
                  <div className="inline-flex items-center gap-0.5">
                    <IconButton icon={Copy} label={t("Copier le lien", "Copy link")} onClick={() => list.copyLink(q)} />
                    <IconButton
                      icon={Download}
                      label={t("Télécharger le SVG", "Download SVG")}
                      onClick={() => list.download(q)}
                    />
                    <IconButton
                      icon={Power}
                      label={q.active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")}
                      onClick={() => list.toggleActive(q)}
                    />
                    <LinkButton href={`/hotel/chambres/${q.id}`} size="sm">
                      {t("Ouvrir", "Open")}
                    </LinkButton>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      {/* Les QR de la vue liste doivent exister dans le DOM pour l'export SVG. */}
      <div className="hidden">
        {filtered.map((q) => (
          <div key={q.id} id={`qr-${q.id}`}>
            <QRCode value={list.linkOf(q)} size={128} />
          </div>
        ))}
      </div>
    </Card>
  );
}
