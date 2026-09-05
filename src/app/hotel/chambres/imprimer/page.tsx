"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { ArrowLeft, Printer, Smartphone } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace } from "@/lib/hotel/store";
import { guestUrl } from "@/lib/qr";
import { Button, LinkButton, Segmented, Select, inputClass } from "@/components/hotel/ui";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { cn } from "@/lib/utils";

/* Planche d'impression : une carte par QR, prête pour la chambre. Le fond
   zellige et la barre latérale sont masqués à l'impression (print-hide),
   seules les cartes blanches restent — sur du A4, deux à six par page. */

type Size = "petit" | "moyen" | "grand";
type Theme = "clair" | "accent";

const SIZES: Record<Size, { cols: string; qr: number; card: string }> = {
  petit: { cols: "grid-cols-2 md:grid-cols-3 print:grid-cols-3", qr: 128, card: "p-5" },
  moyen: { cols: "grid-cols-1 sm:grid-cols-2 print:grid-cols-2", qr: 176, card: "p-7" },
  grand: { cols: "grid-cols-1 print:grid-cols-1", qr: 260, card: "p-10" },
};

export default function PrintPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={0} />}>
      <PrintContent />
    </Suspense>
  );
}

function PrintContent() {
  const params = useSearchParams();
  const { isLoading: authLoading, venueName, city } = useAuthUser();
  const { qrCodes, profile, isLoading } = useHotelSpace();
  const [size, setSize] = useState<Size>("moyen");
  const [theme, setTheme] = useState<Theme>("clair");
  const [headline, setHeadline] = useState("Scannez pour réserver vos sorties");
  const [subline, setSubline] = useState(
    "Restaurants, activités, clubs et services — réservez en quelques secondes, la réception s'occupe du reste."
  );
  const ids = useMemo(() => new Set((params.get("ids") ?? "").split(",").filter(Boolean)), [params]);
  const [scope, setScope] = useState<"selection" | "actifs" | "tous">(ids.size > 0 ? "selection" : "actifs");

  if (authLoading || isLoading) return <PageSkeleton kpis={0} />;

  const hotelName = profile.hotel_name || venueName || "Votre hôtel";
  const hotelCity = profile.city || city;
  const accent = profile.accent_color;
  const list =
    scope === "selection" && ids.size > 0
      ? qrCodes.filter((q) => ids.has(q.id))
      : scope === "tous"
        ? qrCodes
        : qrCodes.filter((q) => q.active);
  const conf = SIZES[size];

  return (
    <div className="print-sheet">
      <div className="print-hide space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <LinkButton href="/hotel/chambres" variant="ghost" size="sm" icon={ArrowLeft} className="-ml-3 mb-2">
              Retour aux chambres
            </LinkButton>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">Imprimer les QR codes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Une carte par emplacement, prête à poser sur la table de nuit, au lobby ou au spa. Réglez le format, le
              message, puis lancez l&apos;impression : seules les cartes sont imprimées.
            </p>
          </div>
          <Button variant="primary" size="lg" icon={Printer} onClick={() => window.print()}>
            Imprimer {list.length} carte{list.length > 1 ? "s" : ""}
          </Button>
        </div>

        <div className="hotel-panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white/70">Emplacements</p>
            <Segmented
              size="sm"
              value={scope}
              onChange={setScope}
              options={[
                ...(ids.size > 0 ? [{ value: "selection" as const, label: "Sélection", count: ids.size }] : []),
                { value: "actifs" as const, label: "Actifs", count: qrCodes.filter((q) => q.active).length },
                { value: "tous" as const, label: "Tous", count: qrCodes.length },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white/70">Format</p>
            <Segmented<Size>
              size="sm"
              value={size}
              onChange={setSize}
              options={[
                { value: "petit", label: "Petit" },
                { value: "moyen", label: "Moyen" },
                { value: "grand", label: "Grand" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white/70">Style</p>
            <Select<Theme>
              label="Style"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "clair", label: "Blanc, sobre" },
                { value: "accent", label: "Bandeau à la couleur de l'hôtel" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white/70">Titre</p>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={60} className={cn(inputClass, "h-10 py-0")} />
          </div>
          <div className="space-y-1.5 md:col-span-2 xl:col-span-4">
            <p className="text-xs font-bold text-white/70">Texte d&apos;accompagnement</p>
            <input value={subline} onChange={(e) => setSubline(e.target.value)} maxLength={160} className={cn(inputClass, "h-10 py-0")} />
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="print-hide mt-6 text-sm text-white/50">Aucun QR code à imprimer.</p>
      ) : (
        <div className={cn("mt-6 grid gap-5 print:mt-0 print:gap-4", conf.cols)}>
          {list.map((q) => (
            <article
              key={q.id}
              className={cn(
                "print-card flex flex-col items-center overflow-hidden rounded-2xl bg-white text-center text-black shadow-xl print:rounded-xl print:shadow-none print:border print:border-neutral-300",
                conf.card
              )}
            >
              {theme === "accent" && (
                <div className="-mx-10 -mt-10 mb-6 w-[calc(100%+5rem)] px-6 py-3 text-white" style={{ background: accent }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em]">{hotelName}</p>
                </div>
              )}
              {theme === "clair" && (
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500">{hotelName}</p>
              )}
              <h2 className={cn("font-display font-black tracking-tight", size === "grand" ? "mt-3 text-4xl" : size === "moyen" ? "mt-2 text-2xl" : "mt-1.5 text-lg")}>
                {q.label}
              </h2>
              <div className={cn("rounded-xl border-4 border-neutral-100 p-3", size === "petit" ? "mt-4" : "mt-6")}>
                <QRCode value={guestUrl(q.code, hotelName, hotelCity)} size={conf.qr} />
              </div>
              <p className={cn("font-bold leading-snug", size === "grand" ? "mt-6 text-xl" : size === "moyen" ? "mt-5 text-base" : "mt-4 text-sm")}>
                {headline}
              </p>
              {size !== "petit" && (
                <p className={cn("mx-auto mt-2 max-w-xs leading-relaxed text-neutral-500", size === "grand" ? "text-sm" : "text-xs")}>
                  {subline}
                </p>
              )}
              <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                <Smartphone size={12} strokeWidth={1.75} />
                Ouvrez l&apos;appareil photo, visez le code
              </p>
              <div className="mt-5 flex items-center justify-center gap-1.5 text-neutral-400">
                <span className="text-[10px]">Propulsé par</span>
                <Image src="/logo-header.png" alt="twocards." width={16} height={16} className="h-4 w-auto opacity-70" />
                <span className="text-[11px] font-black text-neutral-600">twocards.</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
