"use client";

import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Clock,
  Coins,
  Eye,
  MapPin,
  Printer,
  QrCode,
  ScanLine,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace } from "@/lib/hotel/store";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  averageRating,
  conversionRate,
  countBy,
  isLive,
  qrPerformance,
  reservationCategoryLabel,
  sumBy,
  topN,
  weeklySeries,
  windowDelta,
} from "@/lib/hotel/analytics";
import {
  formatDate,
  formatMad,
  formatNumber,
  formatPercent,
  isWithinDays,
  plural,
  relativeDay,
  sameMonth,
  timeAgo,
  todayIso,
} from "@/lib/hotel/format";
import {
  Avatar,
  EmptyState,
  KpiGrid,
  LinkButton,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/hotel/ui";
import { Bars, RankedBars, RatingStars, Ring, SplitBar } from "@/components/hotel/charts";
import { PageSkeleton } from "@/components/hotel/skeleton";
import type { Translate } from "@/lib/i18n";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

const greeting = (t: Translate) => {
  const h = new Date().getHours();
  return h < 5
    ? t("Bonne nuit", "Good night")
    : h < 12
      ? t("Bonjour", "Good morning")
      : h < 18
        ? t("Bon après-midi", "Good afternoon")
        : t("Bonsoir", "Good evening");
};

export default function HotelHomePage() {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const { fullName, isLoading: authLoading } = useAuthUser();
  const { qrCodes, reservations, profile, isLoading } = useHotelSpace();

  if (authLoading || isLoading) return <PageSkeleton kpis={4} />;

  const today = todayIso();
  const live = reservations.filter(isLive);
  const pending = reservations.filter((r) => r.status === "en attente");
  const todays = live
    .filter((r) => r.reservation_date === today)
    .sort((a, b) => (a.reservation_time ?? "99").localeCompare(b.reservation_time ?? "99"));
  const upcoming = live
    .filter((r) => r.reservation_date > today)
    .sort((a, b) => a.reservation_date.localeCompare(b.reservation_date))
    .slice(0, 5);

  const scans = qrCodes.reduce((s, q) => s + q.scans, 0);
  const activeQr = qrCodes.filter((q) => q.active).length;
  const resa30 = windowDelta(live, 30);
  const commissionMonth = live
    .filter((r) => sameMonth(r.reservation_date))
    .reduce((s, r) => s + r.commission, 0);
  const commissionPrev = live
    .filter((r) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return sameMonth(r.reservation_date, d);
    })
    .reduce((s, r) => s + r.commission, 0);
  const conversion = conversionRate(scans, live.length);
  const rating = averageRating(reservations);
  const weekly = weeklySeries(live.map((r) => r.reservation_date), 8);
  const byCategory = CATEGORIES.map((label) => ({
    label: reservationCategoryLabel(label, locale),
    value: live.filter((r) => r.category === label).length,
    color: CATEGORY_COLORS[label],
  }));
  const topRooms = qrPerformance(qrCodes, reservations)
    .filter((q) => q.liveReservations > 0)
    .sort((a, b) => b.liveReservations - a.liveReservations)
    .slice(0, 5)
    .map((q) => ({ id: q.id, label: q.label, value: q.liveReservations, sub: `${formatNumber(q.scans, locale)} scans` }));
  const topVenues = topN(countBy(live, (r) => r.venue_name), 5);
  const recent = [...reservations]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);
  const commissionByVenue = topN(sumBy(live, (r) => r.venue_name, (r) => r.commission), 3);

  const kpis = [
    {
      label: t("Réservations · 30 j", "Reservations · 30 d"),
      value: formatNumber(resa30.current, locale),
      delta: resa30.ratio,
      deltaLabel: t("première période", "first period"),
      hint: t("vs 30 j précédents", "vs previous 30 d"),
      icon: CalendarDays,
      tone: "sky" as const,
    },
    {
      label: t("Commissions du mois", "Commissions this month"),
      value: formatMad(commissionMonth, true, locale),
      delta: commissionPrev > 0 ? (commissionMonth - commissionPrev) / commissionPrev : null,
      deltaLabel: t("premier mois", "first month"),
      hint: t("vs mois précédent", "vs last month"),
      icon: Coins,
      tone: "amber" as const,
    },
    {
      label: t("Scans cumulés", "Total scans"),
      value: formatNumber(scans, locale),
      hint: t(
        `${activeQr} QR ${plural(activeQr, "actif")} sur ${qrCodes.length}`,
        `${activeQr} of ${qrCodes.length} QR active`
      ),
      icon: ScanLine,
      tone: "emerald" as const,
    },
    {
      label: t("Taux de conversion", "Conversion rate"),
      value: formatPercent(conversion, 1, locale),
      hint: t("scans devenus réservations", "scans turned into reservations"),
      icon: TrendingUp,
      tone: "violet" as const,
    },
  ];

  const firstName = fullName?.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(intl, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={
          <>
            {greeting(t)}
            {firstName ? `, ${firstName}` : ""}
          </>
        }
        description={
          pending.length > 0
            ? t(
                `${pending.length} ${plural(pending.length, "demande")} en attente de confirmation par l'établissement, ${todays.length} ${plural(todays.length, "sortie")} aujourd'hui.`,
                `${pending.length} ${plural(pending.length, "request", undefined, "en")} awaiting confirmation from the venue, ${todays.length} ${plural(todays.length, "outing", undefined, "en")} today.`
              )
            : todays.length > 0
              ? t(
                  `${todays.length} ${plural(todays.length, "sortie")} de vos clients aujourd'hui. Tout est à jour.`,
                  `${todays.length} guest ${plural(todays.length, "outing", undefined, "en")} today. Everything is up to date.`
                )
              : t(
                  "Vos clients scannent, réservent leurs sorties, et chaque sortie vous rapporte une commission.",
                  "Your guests scan, book their outings, and every outing earns you a commission."
                )
        }
        actions={
          <>
            <LinkButton href="/hotel/chambres/imprimer" icon={Printer} variant="secondary">
              {t("Imprimer les QR", "Print QR codes")}
            </LinkButton>
            <LinkButton href="/hotel/chambres?nouveau=1" icon={QrCode} variant="primary">
              {t("Nouveau QR code", "New QR code")}
            </LinkButton>
          </>
        }
      />

      {/* Premier pas, uniquement tant qu'aucun QR n'existe */}
      {qrCodes.length === 0 && (
        <Panel solid>
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">
                {t("Bienvenue sur twocards", "Welcome to twocards")}
              </p>
              <h2 className="font-display text-2xl font-bold text-white">
                {t("Trois étapes pour vos premières commissions", "Three steps to your first commissions")}
              </h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    n: "1",
                    t: t("Créez vos QR codes", "Create your QR codes"),
                    d: t("Un par chambre, suite ou espace commun (lobby, spa, piscine).", "One per room, suite or common area (lobby, spa, pool)."),
                  },
                  {
                    n: "2",
                    t: t("Choisissez le menu", "Choose the menu"),
                    d: t("Les restaurants, activités, clubs et services proposés au client.", "The restaurants, activities, clubs and services offered to guests."),
                  },
                  {
                    n: "3",
                    t: t("Imprimez, posez, encaissez", "Print, place, get paid"),
                    d: t("Chaque réservation vous rapporte 10 % du montant dépensé.", "Every reservation earns you 10% of the amount spent."),
                  },
                ].map((s) => (
                  <li key={s.n} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="num text-xs font-black text-sky-300">{s.n}</span>
                    <p className="mt-1 text-sm font-bold text-white">{s.t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/50">{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
            <LinkButton href="/hotel/chambres?nouveau=1" icon={QrCode} variant="primary" size="lg">
              {t("Créer mon premier QR", "Create my first QR")}
            </LinkButton>
          </div>
        </Panel>
      )}

      <KpiGrid items={kpis} />

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Aujourd'hui */}
        <Panel
          title={t("Sorties du jour", "Today's outings")}
          description={
            todays.length > 0
              ? t(
                  `${todays.length} ${plural(todays.length, "client")} de l'hôtel ${plural(todays.length, "sort", "sortent")} aujourd'hui`,
                  `${todays.length} hotel ${plural(todays.length, "guest", undefined, "en")} going out today`
                )
              : t("Aucune sortie prévue aujourd'hui", "No outings planned today")
          }
          actions={
            <Link href="/hotel/reservations?periode=aujourdhui" className="text-xs font-bold text-sky-300 hover:text-sky-200">
              {t("Tout voir", "View all")}
            </Link>
          }
          className="xl:col-span-2"
          padded={false}
        >
          {todays.length === 0 && upcoming.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={t("Calme plat pour aujourd'hui", "All quiet today")}
              description={t(
                "Les sorties du jour et à venir de vos clients s'affichent ici, avec l'heure, l'établissement et la chambre.",
                "Your guests' outings for today and the days ahead appear here, with the time, venue and room."
              )}
              compact
            />
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {[...todays, ...upcoming].slice(0, 7).map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                  <div className="num flex w-14 shrink-0 flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] py-1.5">
                    <span className="text-[10px] font-bold uppercase text-white/45">
                      {r.reservation_date === today ? t("Auj.", "Today") : formatDate(r.reservation_date, "short", locale)}
                    </span>
                    <span className="text-sm font-black text-white">{r.reservation_time ?? "—"}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {r.venue_name}
                      <span className="ml-2 text-xs font-medium text-white/45">{reservationCategoryLabel(r.category, locale)}</span>
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {r.guest_name} · {r.party_size} {t("pers.", r.party_size === 1 ? "guest" : "guests")}
                      {r.qr_label ? ` · ${r.qr_label}` : ""}
                    </p>
                  </div>
                  <StatusPill status={r.status} className="hidden sm:inline-flex" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Satisfaction + conversion */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Panel title={t("Satisfaction", "Satisfaction")}>
            {rating.average !== null ? (
              <div className="flex items-center gap-4">
                <p className="num font-display text-5xl font-black leading-none text-white">
                  {locale === "en" ? rating.average.toFixed(1) : rating.average.toFixed(1).replace(".", ",")}
                </p>
                <div>
                  <RatingStars value={rating.average} size={16} />
                  <p className="mt-1 text-xs text-white/50">
                    {t(
                      `${rating.count} ${plural(rating.count, "avis")} client`,
                      `${rating.count} guest ${plural(rating.count, "review", undefined, "en")}`
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs leading-relaxed text-white/50">
                <Star size={18} strokeWidth={1.5} className="shrink-0 text-white/30" />
                {t(
                  "Aucun avis pour le moment. Chaque client peut noter sa sortie après coup ; la moyenne apparaîtra ici.",
                  "No reviews yet. Guests can rate their outing afterwards; the average will appear here."
                )}
              </div>
            )}
          </Panel>
          <Panel title={t("Conversion", "Conversion")}>
            <div className="flex items-center gap-4">
              <Ring ratio={Math.min(conversion * 4, 1)} size={72} color="#a78bfa">
                <span className="num text-xs font-black text-white">{formatPercent(conversion, 0, locale)}</span>
              </Ring>
              <p className="text-xs leading-relaxed text-white/55">
                {t(
                  <>
                    <span className="num font-bold text-white">{formatNumber(live.length, locale)}</span> réservations pour{" "}
                    <span className="num font-bold text-white">{formatNumber(scans, locale)}</span> scans. Un menu court et des
                    adresses proches font grimper ce taux.
                  </>,
                  <>
                    <span className="num font-bold text-white">{formatNumber(live.length, locale)}</span> reservations from{" "}
                    <span className="num font-bold text-white">{formatNumber(scans, locale)}</span> scans. A short menu and
                    nearby places push this rate up.
                  </>
                )}
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title={t("Réservations par semaine", "Reservations per week")}
          description={t("8 dernières semaines, hors annulations", "Last 8 weeks, excluding cancellations")}
          className="xl:col-span-2"
        >
          <Bars data={weekly} color="bg-sky-400" height={150} />
          <div className="mt-5 border-t border-white/[0.08] pt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              {t("Répartition par catégorie", "Breakdown by category")}
            </p>
            <SplitBar segments={byCategory} />
          </div>
        </Panel>

        <Panel
          title={t("Emplacements les plus actifs", "Most active locations")}
          description={t("Réservations générées par QR", "Reservations generated per QR")}
          actions={
            <Link href="/hotel/chambres?tri=resas" className="text-xs font-bold text-sky-300 hover:text-sky-200">
              {t("Tous", "All")}
            </Link>
          }
        >
          <RankedBars
            items={topRooms}
            href={(id) => `/hotel/chambres/${id}`}
            empty={t("Dès qu'un scan devient une réservation, l'emplacement apparaît ici.", "As soon as a scan becomes a reservation, the location shows up here.")}
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title={t("Dernières demandes", "Latest requests")}
          description={t("Au fil de l'eau, en temps réel", "As they come in, in real time")}
          actions={
            <Link href="/hotel/reservations" className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 hover:text-sky-200">
              {t("Toutes", "All")} <ArrowRight size={12} strokeWidth={2} />
            </Link>
          }
          className="xl:col-span-2"
          padded={false}
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title={t("Aucune demande pour le moment", "No requests yet")}
              description={t(
                "Dès qu'un client scanne un QR et réserve, la demande apparaît ici instantanément.",
                "As soon as a guest scans a QR and books, the request appears here instantly."
              )}
              compact
            />
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/hotel/reservations?id=${r.id}`}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.04] sm:px-6"
                  >
                    <Avatar name={r.guest_name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {r.guest_name}
                        <span className="font-medium text-white/45"> · {r.venue_name}</span>
                      </p>
                      <p className="truncate text-xs text-white/50">
                        {relativeDay(r.reservation_date, undefined, locale)}
                        {r.reservation_time ? t(` à ${r.reservation_time}`, ` at ${r.reservation_time}`) : ""} · {r.party_size}{" "}
                        {t("pers.", r.party_size === 1 ? "guest" : "guests")}
                        {r.qr_label ? ` · ${r.qr_label}` : ""} · {t("reçue", "received")} {timeAgo(r.created_at, undefined, locale)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {r.commission > 0 && (
                        <span className="num hidden text-xs font-bold text-amber-300 sm:inline">
                          +{formatMad(r.commission, false, locale)}
                        </span>
                      )}
                      <StatusPill status={r.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel
            title={t("Adresses préférées", "Favourite places")}
            description={t("Vos clients y réservent le plus", "Where your guests book the most")}
          >
            <RankedBars
              items={topVenues}
              color="bg-emerald-400/80"
              empty={t("Aucune réservation pour le moment.", "No reservations yet.")}
            />
            {commissionByVenue.length > 0 && (
              <p className="mt-4 border-t border-white/[0.08] pt-3 text-[11px] leading-relaxed text-white/45">
                {t(
                  <>
                    Plus rentable : <span className="font-bold text-white/80">{commissionByVenue[0].label}</span> (
                    {formatMad(commissionByVenue[0].value, false, locale)} de commissions).
                  </>,
                  <>
                    Most profitable: <span className="font-bold text-white/80">{commissionByVenue[0].label}</span> (
                    {formatMad(commissionByVenue[0].value, false, locale)} in commissions).
                  </>
                )}
              </p>
            )}
          </Panel>

          <Panel title={t("Raccourcis", "Shortcuts")}>
            <ul className="space-y-1">
              {[
                { href: "/hotel/chambres", icon: BedDouble, label: t("Gérer les chambres et espaces", "Manage rooms and spaces") },
                { href: "/hotel/adresses", icon: MapPin, label: t("Ajouter une adresse maison au menu", "Add your own place to the menu") },
                { href: "/hotel/settings?onglet=menu", icon: Sparkles, label: t("Personnaliser le menu client", "Customise the guest menu") },
                { href: "/hotel/clients", icon: Users, label: t("Voir mes clients fidèles", "See my loyal guests") },
                {
                  href: qrCodes[0] ? `/s/${qrCodes[0].code}` : "/hotel/chambres",
                  icon: Eye,
                  label: t("Ouvrir le menu tel que le voit un client", "Open the menu as a guest sees it"),
                  external: !!qrCodes[0],
                },
              ].map((s) => (
                <li key={s.href}>
                  {s.external ? (
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <s.icon size={16} strokeWidth={1.75} className="text-white/45" />
                      {s.label}
                    </a>
                  ) : (
                    <Link
                      href={s.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <s.icon size={16} strokeWidth={1.75} className="text-white/45" />
                      {s.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {!profile.hotel_name && (
              <p className="mt-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.07] px-3 py-2 text-[11px] leading-relaxed text-white/60">
                {t(
                  <>
                    Renseignez le nom et la ville de l&apos;hôtel dans les{" "}
                    <Link href="/hotel/settings" className="font-bold text-amber-300">
                      paramètres
                    </Link>{" "}
                    : ils s&apos;affichent sur le menu client.
                  </>,
                  <>
                    Add the hotel&apos;s name and city in{" "}
                    <Link href="/hotel/settings" className="font-bold text-amber-300">
                      settings
                    </Link>
                    : they appear on the guest menu.
                  </>
                )}
              </p>
            )}
          </Panel>
        </div>
      </div>

      {reservations.length > 0 && (
        <p className="text-center text-[11px] text-white/30">
          {formatNumber(reservations.length, locale)}{" "}
          {t(plural(reservations.length, "réservation"), plural(reservations.length, "reservation", undefined, "en"))}{" "}
          {t("depuis le", "since")}{" "}
          {formatDate(
            reservations.reduce((min, r) => (r.reservation_date < min ? r.reservation_date : min), reservations[0].reservation_date),
            "long",
            locale
          )}{" "}
          · {formatNumber(live.filter((r) => isWithinDays(r.reservation_date, 7)).length, locale)} {t("cette semaine", "this week")}
        </p>
      )}
    </>
  );
}
