"use client";

import { useMemo, useState } from "react";
import { Crown, MessageCircle, Phone, Repeat, Star, Users, UserPlus, Coins, Download } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace } from "@/lib/hotel/store";
import { guestsFromReservations, isLive, reservationCategoryLabel, type GuestProfile } from "@/lib/hotel/analytics";
import { formatDate, formatMad, formatNumber, plural, relativeDay, todayIso, whatsappLink } from "@/lib/hotel/format";
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
} from "@/components/hotel/ui";
import { RatingStars } from "@/components/hotel/charts";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { intlLocale, type Locale, type Translate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

type Filter = "tous" | "fideles" | "avenir" | "notes";
type Sort = "recent" | "visites" | "depense" | "nom";

/* Une décimale, au format de la langue (4,5 / 4.5). */
const fmt1 = (n: number, locale: Locale) => n.toLocaleString(intlLocale(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function exportCsv(guests: GuestProfile[], t: Translate) {
  const header = [
    t("Client", "Guest"),
    t("Téléphone", "Phone"),
    t("Sorties", "Outings"),
    t("Première", "First"),
    t("Dernière", "Last"),
    t("Prochaine", "Next"),
    t("Dépensé (MAD)", "Spent (MAD)"),
    t("Commissions (MAD)", "Commissions (MAD)"),
    t("Note", "Rating"),
    t("Adresse préférée", "Favourite place"),
    t("Emplacements", "Locations"),
  ];
  const lines = guests.map((g) =>
    [g.name, g.phone, g.visits, g.firstVisit, g.lastVisit, g.nextVisit ?? "", Math.round(g.totalSpent), Math.round(g.totalCommission), g.rating?.toFixed(1) ?? "", g.favoriteVenue ?? "", g.rooms.join(" / ")]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t("clients", "guests")}-${todayIso()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HotelClientsPage() {
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, isLoading } = useHotelSpace();
  const [filter, setFilter] = useState<Filter>("tous");
  const [sort, setSort] = useState<Sort>("recent");
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();

  const guests = useMemo(() => guestsFromReservations(reservations), [reservations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests
      .filter((g) => {
        if (filter === "fideles" && g.liveVisits < 2) return false;
        if (filter === "avenir" && !g.nextVisit) return false;
        if (filter === "notes" && g.rating === null) return false;
        if (q && !g.name.toLowerCase().includes(q) && !g.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) && !(g.favoriteVenue ?? "").toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case "visites":
            return b.liveVisits - a.liveVisits;
          case "depense":
            return b.totalSpent - a.totalSpent;
          case "nom":
            return a.name.localeCompare(b.name, locale);
          default:
            return b.lastVisit.localeCompare(a.lastVisit);
        }
      });
  }, [guests, filter, sort, search, locale]);

  if (authLoading || isLoading) return <PageSkeleton kpis={4} table />;

  const loyal = guests.filter((g) => g.liveVisits >= 2).length;
  const upcoming = guests.filter((g) => g.nextVisit).length;
  const rated = guests.filter((g) => g.rating !== null);
  const avg = rated.length > 0 ? rated.reduce((s, g) => s + (g.rating ?? 0), 0) / rated.length : null;
  const open = openKey ? (guests.find((g) => g.key === openKey) ?? null) : null;

  return (
    <>
      <PageHeader
        eyebrow={t("Clients", "Guests")}
        title={t("Vos clients et leurs sorties", "Your guests and their outings")}
        description={t(
          "Un profil par client, reconstitué à partir de ses réservations : sorties passées et à venir, adresses préférées, montant dépensé, avis. Le carnet d'adresses d'une conciergerie, sans rien saisir.",
          "One profile per guest, built from their reservations: past and upcoming outings, favourite places, amount spent, reviews. A concierge desk's little black book, with nothing to type in."
        )}
        actions={
          <Button icon={Download} onClick={() => exportCsv(filtered, t)} disabled={filtered.length === 0}>
            {t("Exporter", "Export")} ({filtered.length})
          </Button>
        }
      />

      <KpiGrid
        items={[
          { label: t("Clients", "Guests"), value: formatNumber(guests.length, locale), hint: t("ayant réservé au moins une fois", "who have booked at least once"), icon: Users, tone: "sky" },
          { label: t("Fidèles", "Regulars"), value: formatNumber(loyal, locale), hint: t("2 sorties ou plus", "2 or more outings"), icon: Repeat, tone: "violet" },
          { label: t("Sortie à venir", "Upcoming outing"), value: formatNumber(upcoming, locale), hint: t("clients avec une réservation future", "guests with a future reservation"), icon: UserPlus, tone: "emerald" },
          { label: t("Satisfaction", "Satisfaction"), value: avg !== null ? `${fmt1(avg, locale)}/5` : "—", hint: t(`${rated.length} ${plural(rated.length, "client noté", "clients notés")}`, `${rated.length} ${plural(rated.length, "guest rated", "guests rated", "en")}`), icon: Star, tone: "amber" },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "tous", label: t("Tous", "All"), count: guests.length },
            { value: "fideles", label: t("Fidèles", "Regulars"), count: loyal },
            { value: "avenir", label: t("Sortie à venir", "Upcoming outing"), count: upcoming },
            { value: "notes", label: t("Ont laissé un avis", "Left a review"), count: rated.length },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder={t("Nom, téléphone, adresse…", "Name, phone, place…")} className="w-full sm:w-60" />
          <Select<Sort>
            label={t("Trier", "Sort")}
            value={sort}
            onChange={setSort}
            className="w-44"
            options={[
              { value: "recent", label: t("Dernière sortie", "Latest outing") },
              { value: "visites", label: t("Plus de sorties", "Most outings") },
              { value: "depense", label: t("Plus dépensé", "Highest spend") },
              { value: "nom", label: t("Nom (A → Z)", "Name (A → Z)") },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel solid>
          <EmptyState
            icon={Users}
            title={guests.length === 0 ? t("Aucun client pour le moment", "No guests yet") : t("Aucun client ne correspond", "No guests match")}
            description={
              guests.length === 0
                ? t(
                    "Les profils se créent tout seuls à la première réservation passée depuis un de vos QR codes.",
                    "Profiles are created automatically with the first reservation made from one of your QR codes."
                  )
                : t("Essayez un autre filtre ou une autre recherche.", "Try another filter or search.")
            }
            action={guests.length === 0 ? <LinkButton href="/hotel/chambres" variant="primary">{t("Mes QR codes", "My QR codes")}</LinkButton> : undefined}
          />
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setOpenKey(g.key)}
              className="hotel-panel group p-4 text-left transition-colors hover:bg-white/[0.09]"
            >
              <div className="flex items-start gap-3">
                <Avatar name={g.name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-bold text-white">
                    {g.name}
                    {g.liveVisits >= 3 && <Crown size={13} strokeWidth={2} className="shrink-0 text-amber-300" />}
                  </p>
                  <p className="num truncate text-xs text-white/45">{g.phone}</p>
                </div>
                {g.rating !== null && <RatingStars value={g.rating} size={10} />}
              </div>
              <dl className="num mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { l: t("Sorties", "Outings"), v: formatNumber(g.liveVisits, locale) },
                  { l: t("Dépensé", "Spent"), v: g.totalSpent > 0 ? formatMad(g.totalSpent, true, locale) : "—" },
                  { l: t("Commission", "Commission"), v: g.totalCommission > 0 ? formatMad(g.totalCommission, true, locale) : "—" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg bg-white/[0.05] py-1.5">
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-white/40">{s.l}</dt>
                    <dd className="truncate px-1 text-[13px] font-black text-white">{s.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-white/50">
                {g.nextVisit ? (
                  <Tag className="bg-emerald-500/15 text-emerald-300">{t("Prochaine :", "Next:")} {relativeDay(g.nextVisit, undefined, locale)}</Tag>
                ) : (
                  <Tag>{t("Dernière :", "Last:")} {formatDate(g.lastVisit, "medium", locale)}</Tag>
                )}
                {g.favoriteVenue && <span className="truncate">♥ {g.favoriteVenue}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <GuestDrawer guest={open} onClose={() => setOpenKey(null)} />
    </>
  );
}

function GuestDrawer({ guest: g, onClose }: { guest: GuestProfile | null; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  if (!g) return null;
  const today = todayIso();
  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={t(
        `${g.liveVisits} ${plural(g.liveVisits, "sortie")} · client depuis le ${formatDate(g.firstVisit)}`,
        `${g.liveVisits} ${plural(g.liveVisits, "outing", undefined, "en")} · guest since ${formatDate(g.firstVisit, "medium", "en")}`
      )}
      title={g.name}
      footer={
        <>
          <LinkButton href={whatsappLink(g.phone, t(`Bonjour ${g.name.split(" ")[0]}, `, `Hello ${g.name.split(" ")[0]}, `))} external icon={MessageCircle} variant="primary" size="sm">
            WhatsApp
          </LinkButton>
          <LinkButton href={`tel:${g.phone.replace(/\s/g, "")}`} external icon={Phone} size="sm">
            {t("Appeler", "Call")}
          </LinkButton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {[
          { l: t("Dépensé", "Spent"), v: g.totalSpent > 0 ? formatMad(g.totalSpent, false, locale) : "—", icon: Coins },
          { l: t("Commissions", "Commissions"), v: g.totalCommission > 0 ? formatMad(g.totalCommission, false, locale) : "—", icon: Coins },
          { l: t("Taille moyenne", "Average party"), v: t(`${fmt1(g.averageParty, locale)} pers.`, `${fmt1(g.averageParty, locale)} guests`), icon: Users },
          { l: t("Note moyenne", "Average rating"), v: g.rating !== null ? `${fmt1(g.rating, locale)}/5` : "—", icon: Star },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{s.l}</p>
            <p className="num mt-1 text-base font-black text-white">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {g.categories.map((c) => (
          <Tag key={c}>{reservationCategoryLabel(c, locale)}</Tag>
        ))}
        {g.rooms.map((r) => (
          <Tag key={r} className="bg-sky-500/15 text-sky-200">{r}</Tag>
        ))}
      </div>

      <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{t("Historique des sorties", "Outing history")}</p>
      <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-white/[0.03]">
        {g.reservations.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{r.venue_name}</p>
                <p className="num text-xs text-white/50">
                  {r.reservation_date >= today ? relativeDay(r.reservation_date, undefined, locale) : formatDate(r.reservation_date, "long", locale)}
                  {r.reservation_time ? ` · ${r.reservation_time}` : ""} · {r.party_size} {t("pers.", r.party_size === 1 ? "guest" : "guests")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={r.status} />
                {r.commission > 0 && isLive(r) && <span className="num text-[11px] font-bold text-amber-300">+{formatMad(r.commission, false, locale)}</span>}
              </div>
            </div>
            {r.rating !== null && (
              <div className="mt-1.5 flex items-center gap-2">
                <RatingStars value={r.rating} size={11} />
                {r.rating_comment && <span className="truncate text-xs text-white/55">“{r.rating_comment}”</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
