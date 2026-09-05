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

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? "Bonne nuit" : h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
};

export default function HotelHomePage() {
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
    label,
    value: live.filter((r) => r.category === label).length,
    color: CATEGORY_COLORS[label],
  }));
  const topRooms = qrPerformance(qrCodes, reservations)
    .filter((q) => q.liveReservations > 0)
    .sort((a, b) => b.liveReservations - a.liveReservations)
    .slice(0, 5)
    .map((q) => ({ id: q.id, label: q.label, value: q.liveReservations, sub: `${q.scans} scans` }));
  const topVenues = topN(countBy(live, (r) => r.venue_name), 5);
  const recent = [...reservations]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);
  const commissionByVenue = topN(sumBy(live, (r) => r.venue_name, (r) => r.commission), 3);

  const kpis = [
    {
      label: "Réservations · 30 j",
      value: formatNumber(resa30.current),
      delta: resa30.ratio,
      deltaLabel: "première période",
      hint: "vs 30 j précédents",
      icon: CalendarDays,
      tone: "sky" as const,
    },
    {
      label: "Commissions du mois",
      value: formatMad(commissionMonth, true),
      delta: commissionPrev > 0 ? (commissionMonth - commissionPrev) / commissionPrev : null,
      deltaLabel: "premier mois",
      hint: "vs mois précédent",
      icon: Coins,
      tone: "amber" as const,
    },
    {
      label: "Scans cumulés",
      value: formatNumber(scans),
      hint: `${activeQr} QR ${plural(activeQr, "actif")} sur ${qrCodes.length}`,
      icon: ScanLine,
      tone: "emerald" as const,
    },
    {
      label: "Taux de conversion",
      value: formatPercent(conversion, 1),
      hint: "scans devenus réservations",
      icon: TrendingUp,
      tone: "violet" as const,
    },
  ];

  const firstName = fullName?.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={
          <>
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </>
        }
        description={
          pending.length > 0
            ? `${pending.length} ${plural(pending.length, "demande")} en attente de confirmation par l'établissement, ${todays.length} ${plural(todays.length, "sortie")} aujourd'hui.`
            : todays.length > 0
              ? `${todays.length} ${plural(todays.length, "sortie")} de vos clients aujourd'hui. Tout est à jour.`
              : "Vos clients scannent, réservent leurs sorties, et chaque sortie vous rapporte une commission."
        }
        actions={
          <>
            <LinkButton href="/hotel/chambres/imprimer" icon={Printer} variant="secondary">
              Imprimer les QR
            </LinkButton>
            <LinkButton href="/hotel/chambres?nouveau=1" icon={QrCode} variant="primary">
              Nouveau QR code
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
                Bienvenue sur twocards
              </p>
              <h2 className="font-display text-2xl font-bold text-white">
                Trois étapes pour vos premières commissions
              </h2>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { n: "1", t: "Créez vos QR codes", d: "Un par chambre, suite ou espace commun (lobby, spa, piscine)." },
                  { n: "2", t: "Choisissez le menu", d: "Les restaurants, activités, clubs et services proposés au client." },
                  { n: "3", t: "Imprimez, posez, encaissez", d: "Chaque réservation vous rapporte 10 % du montant dépensé." },
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
              Créer mon premier QR
            </LinkButton>
          </div>
        </Panel>
      )}

      <KpiGrid items={kpis} />

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Aujourd'hui */}
        <Panel
          title="Sorties du jour"
          description={
            todays.length > 0
              ? `${todays.length} ${plural(todays.length, "client")} de l'hôtel ${plural(todays.length, "sort", "sortent")} aujourd'hui`
              : "Aucune sortie prévue aujourd'hui"
          }
          actions={
            <Link href="/hotel/reservations?periode=aujourdhui" className="text-xs font-bold text-sky-300 hover:text-sky-200">
              Tout voir
            </Link>
          }
          className="xl:col-span-2"
          padded={false}
        >
          {todays.length === 0 && upcoming.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Calme plat pour aujourd'hui"
              description="Les sorties du jour et à venir de vos clients s'affichent ici, avec l'heure, l'établissement et la chambre."
              compact
            />
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {[...todays, ...upcoming].slice(0, 7).map((r) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                  <div className="num flex w-14 shrink-0 flex-col items-center rounded-xl border border-white/10 bg-white/[0.04] py-1.5">
                    <span className="text-[10px] font-bold uppercase text-white/45">
                      {r.reservation_date === today ? "Auj." : formatDate(r.reservation_date, "short")}
                    </span>
                    <span className="text-sm font-black text-white">{r.reservation_time ?? "—"}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {r.venue_name}
                      <span className="ml-2 text-xs font-medium text-white/45">{r.category}</span>
                    </p>
                    <p className="truncate text-xs text-white/55">
                      {r.guest_name} · {r.party_size} pers.
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
          <Panel title="Satisfaction">
            {rating.average !== null ? (
              <div className="flex items-center gap-4">
                <p className="num font-display text-5xl font-black leading-none text-white">
                  {rating.average.toFixed(1).replace(".", ",")}
                </p>
                <div>
                  <RatingStars value={rating.average} size={16} />
                  <p className="mt-1 text-xs text-white/50">
                    {rating.count} {plural(rating.count, "avis")} client
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs leading-relaxed text-white/50">
                <Star size={18} strokeWidth={1.5} className="shrink-0 text-white/30" />
                Aucun avis pour le moment. Chaque client peut noter sa sortie après coup ; la moyenne apparaîtra ici.
              </div>
            )}
          </Panel>
          <Panel title="Conversion">
            <div className="flex items-center gap-4">
              <Ring ratio={Math.min(conversion * 4, 1)} size={72} color="#a78bfa">
                <span className="num text-xs font-black text-white">{formatPercent(conversion, 0)}</span>
              </Ring>
              <p className="text-xs leading-relaxed text-white/55">
                <span className="num font-bold text-white">{formatNumber(live.length)}</span> réservations pour{" "}
                <span className="num font-bold text-white">{formatNumber(scans)}</span> scans. Un menu court et des
                adresses proches font grimper ce taux.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Réservations par semaine" description="8 dernières semaines, hors annulations" className="xl:col-span-2">
          <Bars data={weekly} color="bg-sky-400" height={150} />
          <div className="mt-5 border-t border-white/[0.08] pt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
              Répartition par catégorie
            </p>
            <SplitBar segments={byCategory} />
          </div>
        </Panel>

        <Panel
          title="Emplacements les plus actifs"
          description="Réservations générées par QR"
          actions={
            <Link href="/hotel/chambres?tri=resas" className="text-xs font-bold text-sky-300 hover:text-sky-200">
              Tous
            </Link>
          }
        >
          <RankedBars
            items={topRooms}
            href={(id) => `/hotel/chambres/${id}`}
            empty="Dès qu'un scan devient une réservation, l'emplacement apparaît ici."
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Dernières demandes"
          description="Au fil de l'eau, en temps réel"
          actions={
            <Link href="/hotel/reservations" className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 hover:text-sky-200">
              Toutes <ArrowRight size={12} strokeWidth={2} />
            </Link>
          }
          className="xl:col-span-2"
          padded={false}
        >
          {recent.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="Aucune demande pour le moment"
              description="Dès qu'un client scanne un QR et réserve, la demande apparaît ici instantanément."
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
                        {relativeDay(r.reservation_date)}
                        {r.reservation_time ? ` à ${r.reservation_time}` : ""} · {r.party_size} pers.
                        {r.qr_label ? ` · ${r.qr_label}` : ""} · reçue {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {r.commission > 0 && (
                        <span className="num hidden text-xs font-bold text-amber-300 sm:inline">
                          +{formatMad(r.commission)}
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
          <Panel title="Adresses préférées" description="Vos clients y réservent le plus">
            <RankedBars items={topVenues} color="bg-emerald-400/80" empty="Aucune réservation pour le moment." />
            {commissionByVenue.length > 0 && (
              <p className="mt-4 border-t border-white/[0.08] pt-3 text-[11px] leading-relaxed text-white/45">
                Plus rentable : <span className="font-bold text-white/80">{commissionByVenue[0].label}</span> ({formatMad(commissionByVenue[0].value)} de commissions).
              </p>
            )}
          </Panel>

          <Panel title="Raccourcis">
            <ul className="space-y-1">
              {[
                { href: "/hotel/chambres", icon: BedDouble, label: "Gérer les chambres et espaces" },
                { href: "/hotel/adresses", icon: MapPin, label: "Ajouter une adresse maison au menu" },
                { href: "/hotel/settings?onglet=menu", icon: Sparkles, label: "Personnaliser le menu client" },
                { href: "/hotel/clients", icon: Users, label: "Voir mes clients fidèles" },
                {
                  href: qrCodes[0] ? `/s/${qrCodes[0].code}` : "/hotel/chambres",
                  icon: Eye,
                  label: "Ouvrir le menu tel que le voit un client",
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
                Renseignez le nom et la ville de l&apos;hôtel dans les{" "}
                <Link href="/hotel/settings" className="font-bold text-amber-300">
                  paramètres
                </Link>{" "}
                : ils s&apos;affichent sur le menu client.
              </p>
            )}
          </Panel>
        </div>
      </div>

      {reservations.length > 0 && (
        <p className="text-center text-[11px] text-white/30">
          {formatNumber(reservations.length)} {plural(reservations.length, "réservation")} depuis le{" "}
          {formatDate(
            reservations.reduce((min, r) => (r.reservation_date < min ? r.reservation_date : min), reservations[0].reservation_date),
            "long"
          )}{" "}
          · {formatNumber(live.filter((r) => isWithinDays(r.reservation_date, 7)).length)} cette semaine
        </p>
      )}
    </>
  );
}
