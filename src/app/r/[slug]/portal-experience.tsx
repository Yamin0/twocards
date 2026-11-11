"use client";

import type { CSSProperties } from "react";
import { LanguageToggle } from "@/components/booking/language-toggle";
import { PoweredBy } from "@/components/booking/powered-by";
import { RemoteImage } from "@/components/booking/remote-image";
import { RetryPanel } from "@/components/booking/retry-panel";
import { useHydrated } from "@/components/booking/use-hydrated";
import { inkOn, isDarkHex, onColor } from "@/lib/booking/color";
import type { PortalResult } from "@/lib/booking/load";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { PortalBookingFlow } from "./_components/portal-booking";

/* Style « widget de réservation » à la SevenRooms : carte blanche centrée,
   typographie noire, beaucoup d'air, une couleur d'accent par établissement,
   parcours en trois temps — personnes / date / créneau, puis coordonnées,
   puis confirmation. Mobile : pleine largeur ; desktop : carte ~480 px.
   L'accent signe aussi les détails du navigateur (sélection, caret, focus).

   Le portail (`portal_get`) arrive déjà chargé du serveur : le nom, l'accroche
   et la photo sont dans le HTML. Le parcours, lui, dépend de l'heure du
   client : il n'est monté qu'une fois dans le navigateur. */

const DEFAULT_ACCENT = "#13305c";
const DEFAULT_BACKGROUND = "#f5f5f4";

export function PortalExperience({ slug, embed, result }: { slug: string; embed: boolean; result: PortalResult }) {
  const t = useT();
  const hydrated = useHydrated();
  const portal = result.status === "ready" ? result.portal : null;
  const accent = portal?.accent_color ?? DEFAULT_ACCENT;
  const background = portal?.background_color ?? DEFAULT_BACKGROUND;
  const darkBg = isDarkHex(background);

  const style = {
    background,
    fontFamily: "var(--font-portal-ui), sans-serif",
    "--portal-accent": accent,
    /* Encre posée sur l'accent : blanche ou sombre selon sa luminosité. */
    "--portal-on-accent": onColor(accent),
    /* L'accent comme encre sur la carte blanche, seulement s'il s'y lit. */
    "--portal-accent-ink": inkOn(accent, "#ffffff", "#171717"),
  } as CSSProperties;

  return (
    <div data-portal="" className={cn("min-h-screen text-neutral-900", !embed && "sm:py-10")} style={style}>
      {/* L'accent de l'établissement signe jusqu'aux détails du navigateur. */}
      <style>{`
        [data-portal] ::selection { background: var(--portal-accent); color: var(--portal-on-accent); }
        [data-portal] :focus-visible:not([tabindex="-1"]) { outline: 2px solid var(--portal-accent-ink); outline-offset: 2px; }
        [data-portal] input, [data-portal] textarea { caret-color: var(--portal-accent-ink); }
        [data-portal] .portal-rail { scrollbar-width: thin; scrollbar-color: #d4d4d4 transparent; }
        [data-portal] .portal-rail::-webkit-scrollbar { height: 4px; }
        [data-portal] .portal-rail::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 2px; }
        [data-portal] .portal-rail::-webkit-scrollbar-track { background: transparent; }
        @keyframes portal-pop { from { opacity: 0; transform: scale(0.82); } }
      `}</style>
      <main
        className={cn(
          "relative mx-auto flex w-full flex-col bg-white",
          embed
            ? "min-h-screen"
            : cn(
                "min-h-screen sm:min-h-0 sm:max-w-[480px] sm:overflow-hidden sm:rounded-2xl",
                darkBg ? "sm:shadow-[0_32px_90px_-24px_rgba(0,0,0,0.85)]" : "sm:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.3)]"
              )
        )}
      >
        {/* En iframe, le cookie de langue est refusé : la langue passe par l'URL. */}
        <LanguageToggle tone="light" viaUrl={embed} className="absolute right-1 top-1 z-10" />

        {/* Photo de couverture importée par l'établissement — fondue dans
            l'en-tête pour que la maison ouvre la page, pas le widget. C'est
            la plus grande image de l'écran : préchargée. */}
        {portal?.cover_url && (
          <div className="relative h-48 w-full sm:h-52">
            <RemoteImage
              src={portal.cover_url}
              fill
              preload
              sizes={embed ? "100vw" : "(max-width: 640px) 100vw, 480px"}
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
          </div>
        )}

        {/* En-tête établissement */}
        <header className={cn("border-b border-neutral-200 px-6 pb-5 text-center", portal?.cover_url ? "pt-5" : "pt-12")}>
          {/* Sans photo, un simple trait d'accent tient lieu de signature. */}
          {portal && !portal.cover_url && <div className="mx-auto mb-4 h-[3px] w-8 rounded-full bg-[var(--portal-accent)]" />}
          <h1 className="font-[family-name:var(--font-portal-display)] text-balance break-words text-[26px] font-normal tracking-wide">
            {portal
              ? portal.display_name
              : result.status === "notfound"
                ? t("Portail introuvable", "Booking page not found")
                : t("Réservation", "Booking")}
          </h1>
          {portal?.tagline && <p className="mt-1 text-sm text-neutral-600">{portal.tagline}</p>}
        </header>

        <div className="flex-1 px-6 py-6">
          {result.status === "notfound" && (
            <p className="py-10 text-center text-base text-neutral-700">
              {t(
                "Ce portail de réservation n'existe pas ou a été désactivé.",
                "This booking page doesn't exist or has been deactivated."
              )}
            </p>
          )}

          {result.status === "error" && (
            <RetryPanel title={t("Le portail ne s'est pas chargé", "The booking page didn't load")} className="px-0 py-6">
              {t(
                "La connexion a été interrompue. Réessayez dans un instant.",
                "The connection was interrupted. Try again in a moment."
              )}
            </RetryPanel>
          )}

          {portal &&
            (hydrated ? (
              <PortalBookingFlow slug={slug} portal={portal} />
            ) : (
              /* Avant l'hydratation : la silhouette du parcours, à sa hauteur. */
              <div aria-busy="true" className="space-y-7">
                <span className="sr-only">{t("Chargement des créneaux…", "Loading available times…")}</span>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-11 w-11 rounded-full bg-neutral-100" />
                  ))}
                </div>
                <div className="flex gap-2 overflow-hidden">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-[4.25rem] w-14 shrink-0 rounded-xl bg-neutral-100" />
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="h-11 rounded-lg bg-neutral-100" />
                  ))}
                </div>
                <div className="h-[3.25rem] rounded-xl bg-neutral-100" />
              </div>
            ))}
        </div>

        {/* Pied — présent aussi en embed : c'est la marque du réseau. */}
        <footer className="border-t border-neutral-200 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <PoweredBy />
        </footer>
      </main>
    </div>
  );
}
