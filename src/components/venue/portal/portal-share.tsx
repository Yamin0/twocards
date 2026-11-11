"use client";

import QRCode from "react-qr-code";
import { Check, Copy, Download, ExternalLink, Globe } from "lucide-react";
import { downloadSvg } from "@/lib/qr";
import { useT } from "@/lib/i18n/client";
import { Button, Card, Field, IconButton, LinkButton, useCopy, useNotify } from "@/components/app/ui";

/* Valeur à copier : le texte, puis le bouton qui confirme la copie. */
function CopyRow({
  value,
  copyLabel,
  wrap = false,
  children,
}: {
  value: string;
  copyLabel: string;
  wrap?: boolean;
  children?: React.ReactNode;
}) {
  const t = useT();
  const notify = useNotify();
  const { copied, copy } = useCopy(2000);
  return (
    <div className={wrap ? "flex items-start gap-2" : "flex items-center gap-2"}>
      <p
        className={`min-w-0 flex-1 rounded-xl border border-line bg-fill px-3 py-2.5 font-mono text-xs text-ink-2 ${
          wrap ? "break-all leading-relaxed" : "truncate"
        }`}
      >
        {value}
      </p>
      <IconButton
        icon={copied ? Check : Copy}
        label={copied ? t("Copié", "Copied") : copyLabel}
        className={copied ? "text-ok" : undefined}
        onClick={async () => {
          if (!(await copy(value))) notify(t("Impossible de copier", "Could not copy"), "error");
        }}
      />
      {children}
    </div>
  );
}

/* Partage du portail : adresse publique, code d'intégration, QR code. */
export function PortalShare({
  exists,
  slug,
  displayName,
}: {
  /** Faux tant que le portail n'a jamais été enregistré. */
  exists: boolean;
  slug: string;
  displayName: string;
}) {
  const t = useT();
  const notify = useNotify();
  /* Composant client monté après le chargement des données : window existe. */
  const portalUrl =
    typeof window === "undefined" || !slug ? "" : `${window.location.origin}/r/${slug}`;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const iframeTitle = `${t("Réserver", "Book")} · ${displayName}`.replace(/"/g, "&quot;");
  const iframeId = `twocards-portail-${slug}`;
  /* Code sans script : hauteur fixe, pour les sites qui interdisent le
     JavaScript collé (certains constructeurs de sites). */
  const embedCodeFixed = `<iframe src="${portalUrl}?embed=1" width="100%" height="760" style="border:0;border-radius:16px" title="${iframeTitle}"></iframe>`;
  /* Code recommandé : la page /r annonce sa hauteur par postMessage
     ({ type: "twocards:hauteur", hauteur }, voir use-embed-height), le
     script n'écoute que l'origine twocards et que cette iframe. 760 px reste
     la hauteur de départ, avant le premier message. */
  const embedCode = `<iframe id="${iframeId}" src="${portalUrl}?embed=1" width="100%" height="760" style="border:0;border-radius:16px;display:block" title="${iframeTitle}"></iframe>
<script>
window.addEventListener("message", function (e) {
  var f = document.getElementById("${iframeId}");
  if (!f || e.origin !== "${origin}" || e.source !== f.contentWindow) return;
  var d = e.data;
  if (d && d.type === "twocards:hauteur" && typeof d.hauteur === "number" && d.hauteur > 0 && d.hauteur < 20000) {
    f.style.height = Math.ceil(d.hauteur) + "px";
  }
});
</script>`;

  return (
    <div className="space-y-4">
      <Card title={t("Partager", "Share")}>
        {!exists ? (
          <p className="text-sm leading-relaxed text-ink-2">
            {t(
              "Enregistrez votre portail : son adresse publique, le code d'intégration et le QR code apparaîtront ici.",
              "Save your portal: its public address, embed code and QR code will appear here."
            )}
          </p>
        ) : (
          <div className="space-y-5">
            <Field label={t("Page publique : réseaux sociaux, bio, Google", "Public page: social media, bio, Google")}>
              <CopyRow value={portalUrl} copyLabel={t("Copier l'adresse", "Copy address")}>
                <LinkButton href={portalUrl} external size="sm" icon={ExternalLink}>
                  {t("Ouvrir", "Open")}
                </LinkButton>
              </CopyRow>
            </Field>

            <Field
              label={t("Intégration sur votre site (iframe)", "Embed on your website (iframe)")}
              hint={t(
                "Recommandé : la hauteur du cadre suit le portail à chaque étape, sans barre de défilement.",
                "Recommended: the frame height follows the booking page at every step, with no scrollbar."
              )}
            >
              <CopyRow
                value={embedCode}
                copyLabel={t("Copier le code d'intégration", "Copy embed code")}
                wrap
              />
            </Field>

            <Field
              label={t("Sans script (hauteur fixe)", "Without script (fixed height)")}
              hint={t(
                "Si votre site refuse les scripts : hauteur fixe de 760 px, à ajuster dans la valeur height.",
                "If your website blocks scripts: fixed 760 px height, adjust the height value as needed."
              )}
            >
              <CopyRow
                value={embedCodeFixed}
                copyLabel={t("Copier le code sans script", "Copy code without script")}
                wrap
              />
            </Field>

            <div className="flex items-center gap-5">
              {/* Fond blanc voulu : un QR code se lit noir sur blanc. */}
              <div id="portal-qr" className="rounded-xl border border-line bg-white p-3">
                <QRCode value={portalUrl} size={96} />
              </div>
              <div>
                <p className="mb-2 text-sm leading-relaxed text-ink-2">
                  {t(
                    "QR code de votre portail : cartes, vitrine, flyers.",
                    "Your portal QR code, for cards, windows and flyers."
                  )}
                </p>
                <Button
                  size="sm"
                  icon={Download}
                  onClick={() => {
                    if (downloadSvg("portal-qr", `portail-${slug}`))
                      notify(t("QR code téléchargé", "QR code downloaded"));
                  }}
                >
                  {t("Télécharger (SVG)", "Download (SVG)")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card title={t("Comment ça marche", "How it works")}>
        <ul className="space-y-2.5 text-sm leading-relaxed text-ink-2">
          <li className="flex gap-2.5">
            <Globe size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            {t(
              "Les réservations du portail arrivent dans votre onglet Réservations, marquées « direct », sans commission : ce canal vous appartient.",
              "Portal reservations land in your Reservations tab, tagged “direct”, commission-free. This channel is yours."
            )}
          </li>
          <li className="flex gap-2.5">
            <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
            {t(
              "Assignez-les à une table : elles occupent votre plan de salle comme les réservations twocards.",
              "Assign them to a table: they fill your floor plan just like twocards reservations."
            )}
          </li>
        </ul>
      </Card>
    </div>
  );
}
