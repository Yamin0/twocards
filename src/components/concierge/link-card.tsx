"use client";

import QRCode from "react-qr-code";
import {
  Check,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Button,
  Card,
  IconButton,
  LinkButton,
  StatusPill,
  Switch,
  useCopy,
  useNotify,
} from "@/components/app/ui";
import { previewUrl } from "@/components/concierge/link-hero";
import type { QrPerformance } from "@/lib/hotel/analytics";
import { formatMad, formatNumber, formatTimestamp } from "@/lib/hotel/format";
import { downloadPng, downloadSvg, shareByWhatsapp } from "@/lib/qr";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

/* Un lien et son QR : ce qu'il a produit (ouvertures, réservations,
   commission) et ses gestes — copier, partager, télécharger, renommer,
   activer, supprimer. Le conteneur id="qr-<id>" est lu par downloadSvg et
   downloadPng. */
export function LinkCard({
  link,
  url,
  displayName,
  onRename,
  onToggle,
  onDelete,
}: {
  link: QrPerformance;
  url: string;
  displayName: string | null;
  onRename: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();
  const { copied, copy } = useCopy();
  const exported = (ok: boolean, what: string) =>
    ok
      ? notify(t(`${what} téléchargé`, `${what} downloaded`))
      : notify(t("Échec du téléchargement", "Download failed"), "error");
  const stats = [
    { label: t("Ouvertures", "Opens"), value: formatNumber(link.scans, locale) },
    { label: t("Réservations", "Bookings"), value: formatNumber(link.liveReservations, locale) },
    {
      label: t("Commission", "Commission"),
      value: link.commission > 0 ? formatMad(link.commission, true, locale) : "—",
    },
  ];

  return (
    <Card as="article" padded={false} bodyClassName="p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div
          id={`qr-${link.id}`}
          className={cn(
            "flex shrink-0 items-center justify-center self-center rounded-2xl border border-line bg-white p-4 sm:self-start",
            !link.active && "opacity-50"
          )}
        >
          <QRCode value={url} size={132} />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="min-w-0 truncate text-base font-bold text-ink">{link.label}</h2>
            <IconButton
              icon={Pencil}
              size={15}
              label={t(`Renommer ${link.label}`, `Rename ${link.label}`)}
              onClick={onRename}
              className="-ml-2 h-9 w-9"
            />
            <StatusPill status={link.active ? "actif" : "inactif"} className="ml-auto" />
            <Switch
              checked={link.active}
              onChange={onToggle}
              label={
                link.active
                  ? t(`Désactiver ${link.label}`, `Deactivate ${link.label}`)
                  : t(`Activer ${link.label}`, `Activate ${link.label}`)
              }
            />
          </div>

          <p className="num break-all rounded-xl border border-line bg-fill px-3 py-2.5 text-[13px] text-ink-2">
            {url}
          </p>

          <dl className="num grid grid-cols-3 gap-2 text-center">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-fill px-1 py-1.5">
                <dt className="truncate text-xs text-ink-3">{s.label}</dt>
                <dd className="truncate text-sm font-bold text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={copied ? Check : Copy}
              onClick={() =>
                copy(url).then(
                  (ok) => !ok && notify(t("Impossible de copier le lien", "Couldn't copy the link"), "error")
                )
              }
            >
              {copied ? t("Copié", "Copied") : t("Copier le lien", "Copy link")}
            </Button>
            <LinkButton size="sm" href={shareByWhatsapp(url, displayName, locale)} external icon={MessageCircle}>
              WhatsApp
            </LinkButton>
            <Button size="sm" icon={Download} onClick={() => exported(downloadSvg(`qr-${link.id}`, link.label), "SVG")}>
              SVG
            </Button>
            <Button
              size="sm"
              icon={ImageIcon}
              onClick={() => downloadPng(`qr-${link.id}`, link.label).then((ok) => exported(ok, "PNG"))}
            >
              PNG
            </Button>
            <LinkButton size="sm" variant="ghost" href={previewUrl(url)} external icon={Eye}>
              {t("Aperçu", "Preview")}
            </LinkButton>
            <IconButton
              icon={Trash2}
              tone="danger"
              label={t(`Supprimer ${link.label}`, `Delete ${link.label}`)}
              onClick={onDelete}
              className="ml-auto"
            />
          </div>

          <p className="text-xs text-ink-3">
            {t("Créé le", "Created")} {formatTimestamp(link.created_at, locale)}
            {link.lastReservation
              ? t(
                  ` · dernière demande le ${formatTimestamp(link.lastReservation, "fr")}`,
                  ` · latest request ${formatTimestamp(link.lastReservation, "en")}`
                )
              : ""}
          </p>
        </div>
      </div>
    </Card>
  );
}
