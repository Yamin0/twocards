"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Printer, QrCode } from "lucide-react";
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
import { PRINT_SIZES, PrintCard, type PrintSize, type PrintTheme } from "@/components/hotel/qr/print-card";
import { HotelLoadError, loadFailed } from "@/components/hotel/states";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace } from "@/lib/hotel/store";
import { guestUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/* Planche d'impression : une carte par QR, prête pour la chambre. À
   l'impression, la coque (tc-shell-chrome) et les réglages (print-hide)
   disparaissent : seules les cartes sortent, sur fond blanc. */

type Scope = "selection" | "actifs" | "tous";

export default function PrintPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={0} rows={4} />}>
      <PrintContent />
    </Suspense>
  );
}

function PrintContent() {
  const params = useSearchParams();
  const t = useT();
  const { isLoading: authLoading, venueName, city } = useAuthUser();
  const { qrCodes, profile, isLoading, failed, reload } = useHotelSpace();
  const [size, setSize] = useState<PrintSize>("moyen");
  const [theme, setTheme] = useState<PrintTheme>("clair");
  /* null = texte par défaut, dans la langue courante. */
  const [headlineEdit, setHeadline] = useState<string | null>(null);
  const [sublineEdit, setSubline] = useState<string | null>(null);
  const headline = headlineEdit ?? t("Scannez pour réserver vos sorties", "Scan to book your outings");
  const subline =
    sublineEdit ??
    t(
      "Restaurants, activités, clubs et services : réservez en quelques secondes, la réception s'occupe du reste.",
      "Restaurants, activities, clubs and services: book in seconds, the front desk takes care of the rest."
    );
  /* ?ids=a,b,c : les emplacements choisis dans la liste. */
  const ids = useMemo(() => new Set((params.get("ids") ?? "").split(",").filter(Boolean)), [params]);
  const [scope, setScope] = useState<Scope>(ids.size > 0 ? "selection" : "actifs");

  if (authLoading || isLoading) return <PageSkeleton kpis={0} rows={4} />;

  const hotelName = profile.hotel_name || venueName || t("Votre hôtel", "Your hotel");
  const hotelCity = profile.city || city;
  const picked = qrCodes.filter((q) => ids.has(q.id));
  const list = scope === "selection" && ids.size > 0 ? picked : scope === "tous" ? qrCodes : qrCodes.filter((q) => q.active);

  return (
    <div className="print-sheet">
      <div className="print-hide space-y-6">
        <PageHeader
          back={{ href: "/hotel/chambres", label: t("Chambres & QR codes", "Rooms & QR codes") }}
          title={t("Imprimer les cartes", "Print the cards")}
          description={t(
            "Une carte par emplacement, à poser sur la table de nuit, au lobby ou au spa. Réglez le format et le message : seules les cartes sont imprimées.",
            "One card per location, for the bedside table, the lobby or the spa. Set the format and the message: only the cards are printed."
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
          <HotelLoadError onRetry={reload} />
        ) : qrCodes.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon={QrCode}
              title={t("Aucun QR code à imprimer", "No QR codes to print")}
              description={t(
                "Créez d'abord un QR code par chambre ou par espace.",
                "Create one QR code per room or area first."
              )}
              action={
                <LinkButton href="/hotel/chambres?nouveau=1" variant="primary" icon={Plus}>
                  {t("Nouveau QR code", "New QR code")}
                </LinkButton>
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label={t("Emplacements", "Locations")}>
                <Segmented<Scope>
                  size="sm"
                  label={t("Emplacements", "Locations")}
                  value={scope}
                  onChange={setScope}
                  options={[
                    ...(ids.size > 0
                      ? [{ value: "selection" as const, label: t("Sélection", "Selection"), count: picked.length }]
                      : []),
                    { value: "actifs", label: t("Actifs", "Active"), count: qrCodes.filter((q) => q.active).length },
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
                    { value: "accent", label: t("Bandeau à la couleur de l'hôtel", "Banner in the hotel's colour") },
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
                hint={t("Absent du petit format.", "Not shown on the small format.")}
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
              icon={QrCode}
              title={t("Aucun QR code actif", "No active QR codes")}
              description={t(
                "Les QR désactivés ne sont pas imprimés par défaut.",
                "Deactivated QR codes aren't printed by default."
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
              url={guestUrl(q.code, hotelName, hotelCity)}
              hotelName={hotelName}
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
