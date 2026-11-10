"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Coins,
  Download,
  Info,
  MessageCircle,
  Phone,
  QrCode,
  Star,
  Users,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace, type HotelReservation, type ReservationStatus } from "@/lib/hotel/store";
import { CATEGORIES, isLive, reservationCategoryLabel } from "@/lib/hotel/analytics";
import {
  addDays,
  formatDate,
  formatMad,
  formatNumber,
  formatTimestamp,
  isWithinDays,
  isoDay,
  plural,
  relativeDay,
  todayIso,
  whatsappLink,
} from "@/lib/hotel/format";
import {
  Avatar,
  Button,
  Drawer,
  EmptyState,
  KpiGrid,
  LinkButton,
  PageHeader,
  Panel,
  SearchInput,
  Segmented,
  Select,
  StatusPill,
  Tag,
  InfoNote,
} from "@/components/hotel/ui";
import { RatingStars } from "@/components/hotel/charts";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { cn } from "@/lib/utils";
import { intlLocale, type Locale, type Translate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

type StatusFilter = "toutes" | ReservationStatus;
type Period = "aujourdhui" | "avenir" | "7j" | "30j" | "tout";
type Category = "toutes" | (typeof CATEGORIES)[number];

/* Libellé affiché d'un statut (la valeur en base reste en français). */
const statusLabel = (s: ReservationStatus, t: Translate) =>
  s === "en attente" ? t("En attente", "Pending") : s === "confirmée" ? t("Confirmée", "Confirmed") : s === "annulée" ? t("Annulée", "Cancelled") : "No-show";

function exportCsv(rows: HotelReservation[], t: Translate, locale: Locale) {
  const header = [
    t("Date", "Date"),
    t("Heure", "Time"),
    t("Client", "Guest"),
    t("Téléphone", "Phone"),
    t("Sortie", "Outing"),
    t("Catégorie", "Category"),
    t("Chambre", "Room"),
    t("Personnes", "Guests"),
    t("Statut", "Status"),
    t("Montant (MAD)", "Amount (MAD)"),
    t("Commission (MAD)", "Commission (MAD)"),
    t("Note", "Rating"),
    t("Reçue le", "Received on"),
  ];
  const lines = rows.map((r) =>
    [
      r.reservation_date,
      r.reservation_time ?? "",
      r.guest_name,
      r.guest_phone,
      r.venue_name,
      reservationCategoryLabel(r.category, locale),
      r.qr_label ?? "",
      r.party_size,
      statusLabel(r.status, t),
      r.amount_spent ?? "",
      r.commission,
      r.rating ?? "",
      r.created_at.slice(0, 16).replace("T", " "),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t("reservations", "reservations")}-${todayIso()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HotelReservationsPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={4} table />}>
      <ReservationsContent />
    </Suspense>
  );
}

function ReservationsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, isLoading } = useHotelSpace();

  const [status, setStatus] = useState<StatusFilter>("toutes");
  const [period, setPeriod] = useState<Period>((params.get("periode") as Period) || "tout");
  const [category, setCategory] = useState<Category>("toutes");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();

  /* Lien profond ?id=… (depuis l'accueil ou une chambre) : on ouvre la fiche
     — ajustement d'état pendant le rendu — puis on nettoie l'URL pour que
     Retour ne la rouvre pas. */
  const deepId = params.get("id");
  const [seenId, setSeenId] = useState<string | null>(null);
  if (deepId !== seenId) {
    setSeenId(deepId);
    if (deepId) setOpenId(deepId);
  }
  useEffect(() => {
    if (deepId) router.replace("/hotel/reservations");
  }, [deepId, router]);

  const today = todayIso();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations
      .filter((r) => {
        if (status !== "toutes" && r.status !== status) return false;
        if (category !== "toutes" && r.category !== category) return false;
        switch (period) {
          case "aujourdhui":
            if (r.reservation_date !== today) return false;
            break;
          case "avenir":
            if (r.reservation_date < today) return false;
            break;
          case "7j":
            if (!isWithinDays(r.reservation_date, 7) && !(r.reservation_date > today && r.reservation_date <= isoDay(addDays(new Date(), 7)))) return false;
            break;
          case "30j":
            if (!isWithinDays(r.reservation_date, 30) && !(r.reservation_date > today && r.reservation_date <= isoDay(addDays(new Date(), 30)))) return false;
            break;
        }
        if (
          q &&
          !r.guest_name.toLowerCase().includes(q) &&
          !r.venue_name.toLowerCase().includes(q) &&
          !(r.qr_label ?? "").toLowerCase().includes(q) &&
          !r.guest_phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        /* À venir d'abord (le plus proche en tête), puis le passé (le plus récent en tête). */
        const af = a.reservation_date >= today;
        const bf = b.reservation_date >= today;
        if (af !== bf) return af ? -1 : 1;
        if (a.reservation_date !== b.reservation_date)
          return af ? a.reservation_date.localeCompare(b.reservation_date) : b.reservation_date.localeCompare(a.reservation_date);
        return (a.reservation_time ?? "99").localeCompare(b.reservation_time ?? "99");
      });
  }, [reservations, status, category, period, search, today]);

  /* Groupes par jour, dans l'ordre déjà trié. */
  const groups = useMemo(() => {
    const out: { date: string; rows: HotelReservation[] }[] = [];
    for (const r of filtered) {
      const last = out[out.length - 1];
      if (last && last.date === r.reservation_date) last.rows.push(r);
      else out.push({ date: r.reservation_date, rows: [r] });
    }
    return out;
  }, [filtered]);

  if (authLoading || isLoading) return <PageSkeleton kpis={4} table />;

  const open = openId ? (reservations.find((r) => r.id === openId) ?? null) : null;
  const pending = reservations.filter((r) => r.status === "en attente").length;
  const confirmed = reservations.filter((r) => r.status === "confirmée").length;
  const todays = reservations.filter((r) => r.reservation_date === today && isLive(r)).length;
  const upcoming = reservations.filter((r) => r.reservation_date > today && isLive(r)).length;
  const counts = (s: StatusFilter) => (s === "toutes" ? reservations.length : reservations.filter((r) => r.status === s).length);

  return (
    <>
      <PageHeader
        eyebrow={t("Réservations", "Reservations")}
        title={t("Les sorties de vos clients", "Your guests' outings")}
        description={t(
          "Chaque demande passée depuis un QR code, en temps réel. L'établissement confirme directement avec le client ; vous suivez ici l'état, le montant dépensé et votre commission.",
          "Every request made from a QR code, in real time. The venue confirms directly with the guest; here you track the status, the amount spent and your commission."
        )}
        actions={
          <Button icon={Download} onClick={() => exportCsv(filtered, t, locale)} disabled={filtered.length === 0}>
            {t("Exporter", "Export")} ({filtered.length})
          </Button>
        }
      />

      <KpiGrid
        items={[
          { label: t("Aujourd'hui", "Today"), value: formatNumber(todays, locale), hint: t(`${upcoming} à venir`, `${upcoming} upcoming`), icon: Clock, tone: "sky" },
          { label: t("En attente", "Pending"), value: formatNumber(pending, locale), hint: t("de confirmation", "confirmation"), icon: CalendarDays, tone: "amber" },
          { label: t("Confirmées", "Confirmed"), value: formatNumber(confirmed, locale), hint: t(`${reservations.length} au total`, `${reservations.length} in total`), icon: Users, tone: "emerald" },
          {
            label: t("Commissions", "Commissions"),
            value: formatMad(reservations.filter(isLive).reduce((s, r) => s + r.commission, 0), true, locale),
            hint: t("cumulées", "all-time"),
            icon: Coins,
            tone: "violet",
          },
        ]}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented<StatusFilter>
            value={status}
            onChange={setStatus}
            options={[
              { value: "toutes", label: t("Toutes", "All"), count: counts("toutes") },
              { value: "en attente", label: t("En attente", "Pending"), count: counts("en attente") },
              { value: "confirmée", label: t("Confirmées", "Confirmed"), count: counts("confirmée") },
              { value: "annulée", label: t("Annulées", "Cancelled"), count: counts("annulée") },
              { value: "no-show", label: "No-show", count: counts("no-show") },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder={t("Client, téléphone, sortie, chambre…", "Guest, phone, outing, room…")} className="w-full sm:w-64" />
            <Select<Category>
              label={t("Catégorie", "Category")}
              value={category}
              onChange={setCategory}
              className="w-40"
              options={[{ value: "toutes", label: t("Toutes catégories", "All categories") }, ...CATEGORIES.map((c) => ({ value: c, label: reservationCategoryLabel(c, locale) }))]}
            />
          </div>
        </div>
        <Segmented<Period>
          size="sm"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "aujourdhui", label: t("Aujourd'hui", "Today") },
            { value: "avenir", label: t("À venir", "Upcoming") },
            { value: "7j", label: t("± 7 jours", "± 7 days") },
            { value: "30j", label: t("± 30 jours", "± 30 days") },
            { value: "tout", label: t("Tout l'historique", "Full history") },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <Panel solid>
          <EmptyState
            icon={QrCode}
            title={reservations.length === 0 ? t("Aucune réservation pour le moment", "No reservations yet") : t("Aucune réservation ne correspond", "No reservations match")}
            description={
              reservations.length === 0
                ? t(
                    "Dès qu'un client scanne l'un de vos QR codes et réserve une sortie, elle apparaît ici instantanément avec la chambre d'origine.",
                    "As soon as a guest scans one of your QR codes and books an outing, it appears here instantly with the room it came from."
                  )
                : t("Essayez un autre filtre, une autre période ou une autre recherche.", "Try another filter, period or search.")
            }
            action={
              reservations.length === 0 ? (
                <LinkButton href="/hotel/chambres" variant="primary" icon={QrCode}>
                  {t("Mes QR codes", "My QR codes")}
                </LinkButton>
              ) : (
                <Button variant="ghost" onClick={() => { setStatus("toutes"); setPeriod("tout"); setCategory("toutes"); setSearch(""); }}>
                  {t("Réinitialiser les filtres", "Reset filters")}
                </Button>
              )
            }
          />
        </Panel>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="mb-2 flex items-baseline gap-3 px-1">
                <h2 className={cn("font-display text-sm font-bold", g.date === today ? "text-sky-300" : "text-white")}>
                  {relativeDay(g.date, undefined, locale)}
                </h2>
                <span className="text-xs text-white/40">
                  {g.date !== today && formatDate(g.date, "long", locale)} · {g.rows.length}{" "}
                  {t(plural(g.rows.length, "réservation"), plural(g.rows.length, "reservation", undefined, "en"))}
                </span>
              </div>
              <Panel padded={false}>
                <ul className="divide-y divide-white/[0.06]">
                  {g.rows.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(r.id)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] sm:px-5"
                      >
                        <span className="num flex w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] py-1.5 text-sm font-black text-white">
                          {r.reservation_time ?? "—"}
                        </span>
                        <Avatar name={r.guest_name} size={36} className="hidden sm:inline-flex" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-white">
                            {r.guest_name}
                            <span className="font-medium text-white/45"> · {r.venue_name}</span>
                          </span>
                          <span className="block truncate text-xs text-white/50">
                            {reservationCategoryLabel(r.category, locale)} · {r.party_size} {t("pers.", r.party_size === 1 ? "guest" : "guests")}
                            {r.qr_label ? ` · ${r.qr_label}` : ""}
                            {r.notes ? " · note" : ""}
                          </span>
                        </span>
                        {r.rating !== null && <RatingStars value={r.rating} size={11} className="hidden md:inline-flex" />}
                        {r.commission > 0 && (
                          <span className="num hidden shrink-0 text-xs font-bold text-amber-300 sm:inline">+{formatMad(r.commission, false, locale)}</span>
                        )}
                        {r.arrived_at && (
                          <span className="num hidden shrink-0 items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 sm:inline-flex">
                            {t("Arrivé", "Arrived")} {new Date(r.arrived_at).toLocaleTimeString(intlLocale(locale), { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        <StatusPill status={r.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          ))}
        </div>
      )}

      <InfoNote icon={Info}>
        {t(
          <>
            La confirmation se fait directement entre le client et l&apos;établissement. Le statut et le montant dépensé sont
            renseignés par l&apos;établissement (ou sa caisse) ; votre commission (10 % du montant dépensé par défaut) se calcule
            automatiquement dès que le montant est connu.
          </>,
          <>
            Confirmation happens directly between the guest and the venue. The status and amount spent are entered by the
            venue (or its till); your commission (10% of the amount spent by default) is calculated automatically as soon
            as the amount is known.
          </>
        )}
      </InfoNote>

      <ReservationDrawer reservation={open} onClose={() => setOpenId(null)} />
    </>
  );
}

/* ─── Fiche d'une réservation ───────────────────────────────────────────────── */

export function ReservationDrawer({
  reservation: r,
  onClose,
}: {
  reservation: HotelReservation | null;
  onClose: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  if (!r) return null;
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("Date", "Date"), value: `${relativeDay(r.reservation_date, undefined, locale)}${r.reservation_time ? t(` à ${r.reservation_time}`, ` at ${r.reservation_time}`) : ""}` },
    { label: t("Personnes", "Guests"), value: `${r.party_size}` },
    { label: t("Catégorie", "Category"), value: reservationCategoryLabel(r.category, locale) },
    { label: t("Emplacement", "Location"), value: r.qr_label ?? t("QR supprimé", "Deleted QR") },
    { label: t("Reçue le", "Received"), value: formatTimestamp(r.created_at, locale) },
    ...(r.arrived_at ? [{ label: t("Arrivée", "Arrival"), value: formatTimestamp(r.arrived_at, locale) }] : []),
  ];
  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={r.venue_name}
      title={r.guest_name}
      footer={
        <>
          <LinkButton href={whatsappLink(r.guest_phone)} external icon={MessageCircle} variant="primary" size="sm">
            WhatsApp
          </LinkButton>
          <LinkButton href={`tel:${r.guest_phone.replace(/\s/g, "")}`} external icon={Phone} size="sm">
            {t("Appeler", "Call")}
          </LinkButton>
          {r.qr_code_id && (
            <Link href={`/hotel/chambres/${r.qr_code_id}`} className="ml-auto self-center text-xs font-bold text-sky-300 hover:text-sky-200">
              {t("Voir l'emplacement", "View location")}
            </Link>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <StatusPill status={r.status} />
        <span className="num text-xs text-white/45">{r.guest_phone}</span>
      </div>

      <dl className="mt-5 divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-white/[0.03]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-xs text-white/45">{row.label}</dt>
            <dd className="num text-right text-sm font-medium text-white">{row.value}</dd>
          </div>
        ))}
      </dl>

      {r.notes && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{t("Précisions du client", "Guest's notes")}</p>
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/80">“{r.notes}”</p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] px-4 py-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300">{t("Commission", "Commission")}</p>
        {r.amount_spent !== null ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="num text-2xl font-black text-white">{formatMad(r.commission, false, locale)}</p>
              <p className="num text-xs text-white/50">
                {t(
                  `${Math.round(r.commission_rate * 100)} % de ${formatMad(r.amount_spent)} dépensés`,
                  `${Math.round(r.commission_rate * 100)}% of ${formatMad(r.amount_spent, false, "en")} spent`
                )}
                {r.amount_source === "pos" ? t(" · montant remonté par la caisse", " · amount reported by the till") : ""}
              </p>
            </div>
            <Tag>{isLive(r) ? t("acquise", "earned") : t("annulée", "cancelled")}</Tag>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-white/55">
            {isLive(r)
              ? t(
                  "Le montant dépensé n'est pas encore renseigné : la commission se calculera automatiquement après la sortie.",
                  "The amount spent hasn't been entered yet: the commission will be calculated automatically after the outing."
                )
              : t("Aucune commission : réservation annulée ou client absent.", "No commission: reservation cancelled or guest didn't show.")}
          </p>
        )}
      </div>

      {r.rating !== null && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{t("Avis du client", "Guest review")}</p>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-2">
              <RatingStars value={r.rating} size={14} />
              <span className="num text-sm font-bold text-white">{r.rating}/5</span>
              {r.rated_at && <span className="text-xs text-white/40">· {formatDate(r.rated_at.slice(0, 10), "medium", locale)}</span>}
            </div>
            {r.rating_comment && <p className="mt-2 text-sm leading-relaxed text-white/75">“{r.rating_comment}”</p>}
          </div>
        </div>
      )}
      {r.rating === null && isLive(r) && r.reservation_date < todayIso() && (
        <p className="mt-4 flex items-center gap-2 text-xs text-white/40">
          <Star size={12} strokeWidth={1.5} /> {t("Pas encore d'avis pour cette sortie.", "No review for this outing yet.")}
        </p>
      )}
    </Drawer>
  );
}
