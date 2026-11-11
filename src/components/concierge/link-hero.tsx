"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  Plus,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  InfoNote,
  LinkButton,
  Select,
  useCopy,
  useNotify,
} from "@/components/app/ui";
import type { ConciergeLink } from "@/lib/concierge/space";
import { downloadPng, downloadSvg, shareByWhatsapp } from "@/lib/qr";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

/** Adresse du menu en mode aperçu : ni scan compté, ni réservation écrite. */
export const previewUrl = (link: string) => `${link}${link.includes("?") ? "&" : "?"}apercu=1`;

/* Aperçu du menu client dans un cadre de téléphone. */
export function MenuPreviewFrame({ link }: { link: string }) {
  const t = useT();
  return (
    <div className="w-[300px] max-w-full overflow-hidden rounded-[2rem] border-[6px] border-ink bg-white shadow-pop">
      <iframe
        title={t("Aperçu du menu client", "Guest menu preview")}
        src={previewUrl(link)}
        className="h-[560px] w-full bg-white"
      />
    </div>
  );
}

/* Le lien personnel et son QR, en tête de l'accueil : copier, partager par
   WhatsApp, télécharger le QR, voir le menu tel que le client le verra. Avec
   plusieurs liens, un sélecteur choisit celui qu'on partage. Le conteneur
   id="qr-<id>" est lu par downloadSvg et downloadPng. */
export function LinkHero({
  links,
  linkOf,
  displayName,
}: {
  links: ConciergeLink[];
  linkOf: (link: ConciergeLink) => string;
  displayName: string | null;
}) {
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();
  const { copied, copy } = useCopy();
  const [preview, setPreview] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  const link = links.find((l) => l.id === chosen) ?? links.find((l) => l.active) ?? links[0];
  if (!link) return null;
  const url = linkOf(link);
  const exported = (ok: boolean, what: string) =>
    ok
      ? notify(t(`${what} téléchargé`, `${what} downloaded`))
      : notify(t("Échec du téléchargement", "Download failed"), "error");

  return (
    <Card
      title={t("Mon lien et mon QR", "My link and QR code")}
      description={t(
        "Chaque réservation passée par ce lien vous est attribuée, jusqu'à la commission.",
        "Every reservation made through this link is attributed to you, through to the commission."
      )}
      actions={
        <>
          {links.length > 1 && (
            <Select
              label={t("Lien affiché", "Link shown")}
              value={link.id}
              onChange={setChosen}
              className="w-48"
              options={links.map((l) => ({ value: l.id, label: l.label }))}
            />
          )}
          <LinkButton href="/concierge/liens" size="sm" variant="ghost">
            {links.length > 1 ? t("Gérer mes liens", "Manage my links") : t("Ajouter un lien", "Add a link")}
          </LinkButton>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div
          id={`qr-${link.id}`}
          className={cn("shrink-0 rounded-2xl border border-line bg-white p-4", !link.active && "opacity-50")}
        >
          <QRCode value={url} size={168} />
        </div>
        <div className="min-w-0 flex-1 space-y-3 self-stretch">
          <div>
            <p className="text-[13px] font-bold text-ink-2">{link.label}</p>
            <p className="num mt-1 break-all rounded-xl border border-line bg-fill px-3.5 py-3 text-sm text-ink">
              {url}
            </p>
          </div>
          {!link.active && (
            <InfoNote tone="amber">
              {t(
                "Ce lien est désactivé : il n'ouvre plus le menu. Réactivez-le dans « Liens & QR ».",
                "This link is deactivated: it no longer opens the menu. Reactivate it in “Links & QR”."
              )}
            </InfoNote>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon={copied ? Check : Copy}
              onClick={() =>
                copy(url).then(
                  (ok) => !ok && notify(t("Impossible de copier le lien", "Couldn't copy the link"), "error")
                )
              }
            >
              {copied ? t("Lien copié", "Link copied") : t("Copier le lien", "Copy link")}
            </Button>
            <LinkButton href={shareByWhatsapp(url, displayName, locale)} external icon={MessageCircle}>
              {t("Partager par WhatsApp", "Share on WhatsApp")}
            </LinkButton>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            <Button size="sm" icon={Download} onClick={() => exported(downloadSvg(`qr-${link.id}`, link.label), "SVG")}>
              {t("QR en SVG", "QR as SVG")}
            </Button>
            <Button
              size="sm"
              icon={ImageIcon}
              onClick={() => downloadPng(`qr-${link.id}`, link.label).then((ok) => exported(ok, "PNG"))}
            >
              {t("QR en PNG", "QR as PNG")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={preview ? EyeOff : Eye}
              aria-expanded={preview}
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? t("Masquer l'aperçu", "Hide preview") : t("Aperçu du menu client", "Guest menu preview")}
            </Button>
            <LinkButton size="sm" variant="ghost" href={previewUrl(url)} external icon={ExternalLink}>
              {t("Ouvrir l'aperçu", "Open preview")}
            </LinkButton>
          </div>
        </div>
      </div>
      {preview && (
        <div className="mt-5 flex justify-center border-t border-line pt-5">
          <MenuPreviewFrame link={url} />
        </div>
      )}
    </Card>
  );
}

/* Tant qu'aucun lien n'existe : une phrase et une seule action. La création
   est une écriture en base ; elle n'a lieu qu'au clic, jamais au chargement. */
export function CreateFirstLink({ onCreate }: { onCreate: (label: string) => Promise<boolean> }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const create = async () => {
    if (busy) return;
    setBusy(true);
    /* Le nom du lien s'affiche en tête du menu client : un mot neutre, que
       le concierge peut changer ensuite. */
    await onCreate(t("Sélection", "Selection"));
    setBusy(false);
  };
  return (
    <Card padded={false}>
      <EmptyState
        icon={Link2}
        title={t("Vous n'avez pas encore de lien", "You don't have a link yet")}
        description={t(
          "Votre lien ouvre un menu de restaurants, activités, clubs et services à réserver. Partagez-le, ou imprimez son QR : chaque réservation vous est attribuée, jusqu'à la commission.",
          "Your link opens a menu of restaurants, activities, clubs and services to book. Share it, or print its QR code: every reservation is attributed to you, through to the commission."
        )}
        action={
          <Button variant="primary" size="lg" icon={Plus} onClick={create} loading={busy}>
            {t("Créer mon lien", "Create my link")}
          </Button>
        }
      />
    </Card>
  );
}
