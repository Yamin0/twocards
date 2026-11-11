"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Download, ExternalLink, Eye, EyeOff, Image as ImageIcon, Mail, MessageCircle } from "lucide-react";
import { Button, Card, LinkButton, useCopy, useNotify } from "@/components/app/ui";
import type { HotelQrCode } from "@/lib/hotel/store";
import { downloadPng, downloadSvg, shareByEmail, shareByWhatsapp } from "@/lib/qr";
import { useLocale, useT } from "@/lib/i18n/client";

/* Le QR code, son lien unique et les exports. Le conteneur id="qr-<id>"
   est lu par downloadSvg et downloadPng. */
export function QrLinkCard({
  qr,
  link,
  hotelName,
  className,
}: {
  qr: HotelQrCode;
  link: string;
  hotelName: string | null;
  className?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();
  const { copied, copy } = useCopy();
  const [preview, setPreview] = useState(false);

  return (
    <Card
      title={t("QR code et lien unique", "QR code and unique link")}
      description={t(
        "Tout scan et toute réservation via ce lien sont rattachés à cet emplacement.",
        "Every scan and reservation through this link is attributed to this location."
      )}
      className={className}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div id={`qr-${qr.id}`} className="shrink-0 rounded-2xl border border-line bg-white p-4">
          <QRCode value={link} size={148} />
        </div>
        <div className="min-w-0 flex-1 space-y-3 self-stretch">
          <p className="num break-all rounded-xl border border-line bg-fill px-3 py-2.5 text-xs text-ink-2">{link}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              icon={copied ? Check : Copy}
              onClick={() =>
                copy(link).then((ok) => !ok && notify(t("Impossible de copier", "Couldn't copy"), "error"))
              }
            >
              {copied ? t("Copié", "Copied") : t("Copier", "Copy")}
            </Button>
            <LinkButton size="sm" href={link} external icon={ExternalLink}>
              {t("Ouvrir", "Open")}
            </LinkButton>
            <Button
              size="sm"
              icon={Download}
              onClick={() =>
                downloadSvg(`qr-${qr.id}`, qr.label)
                  ? notify(t("SVG téléchargé", "SVG downloaded"))
                  : notify(t("Échec de l'export", "Export failed"), "error")
              }
            >
              SVG
            </Button>
            <Button
              size="sm"
              icon={ImageIcon}
              onClick={() =>
                downloadPng(`qr-${qr.id}`, qr.label).then((ok) =>
                  ok
                    ? notify(t("PNG téléchargé", "PNG downloaded"))
                    : notify(t("Échec de l'export", "Export failed"), "error")
                )
              }
            >
              PNG
            </Button>
          </div>
          <div className="border-t border-line pt-3">
            <p className="mb-2 text-[13px] font-bold text-ink-2">{t("Partager sans QR", "Share without QR")}</p>
            <div className="flex flex-wrap gap-2">
              <LinkButton size="sm" href={shareByWhatsapp(link, hotelName, locale)} external icon={MessageCircle}>
                WhatsApp
              </LinkButton>
              <LinkButton size="sm" href={shareByEmail(link, hotelName, locale)} external icon={Mail}>
                {t("E-mail", "Email")}
              </LinkButton>
              <Button
                size="sm"
                variant="ghost"
                icon={preview ? EyeOff : Eye}
                aria-expanded={preview}
                onClick={() => setPreview((p) => !p)}
              >
                {preview ? t("Masquer l'aperçu", "Hide preview") : t("Aperçu client", "Guest preview")}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <div className="mt-5 flex justify-center border-t border-line pt-5">
          {/* Le menu client garde ses propres couleurs (celles de l'hôtel). */}
          <div className="w-[300px] max-w-full overflow-hidden rounded-[2rem] border-[6px] border-ink bg-white shadow-pop">
            <iframe
              title={t("Aperçu du menu client", "Guest menu preview")}
              src={`${link}${link.includes("?") ? "&" : "?"}apercu=1`}
              className="h-[560px] w-full bg-white"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
