"use client";

import { useState } from "react";
import { Link2, Printer } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Field,
  LinkButton,
  PageHeader,
  PageSkeleton,
  Segmented,
  Select,
  inputClass,
} from "@/components/app/ui";
import { ConciergeLoadError } from "@/components/concierge/states";
import { PRINT_SIZES, PrintCard, type PrintSize, type PrintTheme } from "@/components/hotel/qr/print-card";
import { loadFailed } from "@/components/hotel/states";
import { useConciergeSpace } from "@/lib/concierge/space";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

type Scope = "actifs" | "tous";

/* Planche d'impression des QR du concierge : la carte de l'espace hôtel
   (PrintCard), une par lien. À l'impression, la coque (tc-shell-chrome) et
   les réglages (print-hide) disparaissent : seules les cartes sortent, sur
   fond blanc. */
export default function ConciergePrintPage() {
  const t = useT();
  const { qrCodes, profile, displayName, linkOf, isLoading, failed, reload } = useConciergeSpace();
  const [size, setSize] = useState<PrintSize>("moyen");
  const [theme, setTheme] = useState<PrintTheme>("clair");
  const [scope, setScope] = useState<Scope>("actifs");
  /* null = texte par défaut, dans la langue courante. */
  const [headlineEdit, setHeadline] = useState<string | null>(null);
  const [sublineEdit, setSubline] = useState<string | null>(null);
  const headline = headlineEdit ?? t("Scannez pour réserver vos sorties", "Scan to book your outings");
  const subline =
    sublineEdit ??
    t(
      "Restaurants, activités, clubs et services : réservez en quelques secondes.",
      "Restaurants, activities, clubs and services: book in seconds."
    );

  if (isLoading) return <PageSkeleton kpis={0} rows={4} />;

  const active = qrCodes.filter((q) => q.active);
  const list = scope === "tous" ? qrCodes : active;

  return (
    <div className="print-sheet">
      <div className="print-hide space-y-6">
        <PageHeader
          back={{ href: "/concierge/liens", label: t("Liens & QR", "Links & QR") }}
          title={t("Imprimer les QR", "Print QR codes")}
          description={t(
            "Une carte par lien, à poser sur un comptoir ou à glisser avec une carte de visite. Réglez le format et le message : seules les cartes sont imprimées.",
            "One card per link, to place on a counter or hand out with a business card. Set the format and the message: only the cards are printed."
          )}
          actions={
            <Button variant="primary" size="lg" icon={Printer} onClick={() => window.print()} disabled={list.length === 0}>
              {t(
                `Imprimer ${list.length} carte${list.length > 1 ? "s" : ""}`,
                `Print ${list.length} card${list.length === 1 ? "" : "s"}`
              )}
            </Button>
          }
        />

        {loadFailed(failed, qrCodes) ? (
          <ConciergeLoadError onRetry={reload} />
        ) : qrCodes.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={Link2}
              title={t("Aucun QR à imprimer", "No QR codes to print")}
              description={t("Créez d'abord votre lien : son QR est généré avec lui.", "Create your link first: its QR code comes with it.")}
              action={
                <LinkButton href="/concierge/liens?nouveau=1" variant="primary" icon={Link2}>
                  {t("Nouveau lien", "New link")}
                </LinkButton>
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label={t("Liens", "Links")}>
                <Segmented<Scope>
                  size="sm"
                  label={t("Liens", "Links")}
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: "actifs", label: t("Actifs", "Active"), count: active.length },
                    { value: "tous", label: t("Tous", "All"), count: qrCodes.length },
                  ]}
                />
              </Field>
              <Field label={t("Format", "Format")}>
                <Segmented<PrintSize>
                  size="sm"
                  label={t("Format", "Format")}
                  value={size}
                  onChange={setSize}
                  options={[
                    { value: "petit", label: t("Petit", "Small") },
                    { value: "moyen", label: t("Moyen", "Medium") },
                    { value: "grand", label: t("Grand", "Large") },
                  ]}
                />
              </Field>
              <Field label={t("Style", "Style")}>
                <Select<PrintTheme>
                  label={t("Style", "Style")}
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: "clair", label: t("Blanc, sobre", "White, minimal") },
                    { value: "accent", label: t("Bandeau à la couleur de votre menu", "Banner in your menu's colour") },
                  ]}
                />
              </Field>
              <Field label={t("Titre", "Title")} htmlFor="print-title">
                <input
                  id="print-title"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={60}
                  className={cn(inputClass, "h-11 py-0")}
                />
              </Field>
              <Field
                label={t("Texte d'accompagnement", "Supporting text")}
                htmlFor="print-text"
                hint={t(
                  "Absent du petit format. Le nom de chaque lien est imprimé en titre de sa carte.",
                  "Not shown on the small format. Each link's name is printed as its card's heading."
                )}
                className="md:col-span-2 xl:col-span-4"
              >
                <input
                  id="print-text"
                  value={subline}
                  onChange={(e) => setSubline(e.target.value)}
                  maxLength={160}
                  className={cn(inputClass, "h-11 py-0")}
                />
              </Field>
            </div>
          </Card>
        )}

        {qrCodes.length > 0 && list.length === 0 && (
          <Card padded={false}>
            <EmptyState
              compact
              icon={Link2}
              title={t("Aucun lien actif", "No active links")}
              description={t(
                "Les liens désactivés ne sont pas imprimés par défaut.",
                "Deactivated links aren't printed by default."
              )}
              action={<Button onClick={() => setScope("tous")}>{t("Tout imprimer", "Print all")}</Button>}
            />
          </Card>
        )}
      </div>

      {list.length > 0 && (
        <div className={cn("mt-6 grid gap-5 print:mt-0 print:gap-4", PRINT_SIZES[size].cols)}>
          {list.map((q) => (
            <PrintCard
              key={q.id}
              label={q.label}
              url={linkOf(q)}
              hotelName={displayName ?? ""}
              accent={profile.accent_color}
              size={size}
              theme={theme}
              headline={headline}
              subline={subline}
            />
          ))}
        </div>
      )}
    </div>
  );
}
