"use client";

import { useMemo, useState } from "react";
import { Crown, MessageCircle, Phone, Repeat, Star, Users, UserPlus, Coins, Download } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace } from "@/lib/hotel/store";
import { guestsFromReservations, isLive, type GuestProfile } from "@/lib/hotel/analytics";
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

type Filter = "tous" | "fideles" | "avenir" | "notes";
type Sort = "recent" | "visites" | "depense" | "nom";

function exportCsv(guests: GuestProfile[]) {
  const header = ["Client", "Téléphone", "Sorties", "Première", "Dernière", "Prochaine", "Dépensé (MAD)", "Commissions (MAD)", "Note", "Adresse préférée", "Emplacements"];
  const lines = guests.map((g) =>
    [g.name, g.phone, g.visits, g.firstVisit, g.lastVisit, g.nextVisit ?? "", Math.round(g.totalSpent), Math.round(g.totalCommission), g.rating?.toFixed(1) ?? "", g.favoriteVenue ?? "", g.rooms.join(" / ")]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clients-${todayIso()}.csv`;
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
            return a.name.localeCompare(b.name, "fr");
          default:
            return b.lastVisit.localeCompare(a.lastVisit);
        }
      });
  }, [guests, filter, sort, search]);

  if (authLoading || isLoading) return <PageSkeleton kpis={4} table />;

  const loyal = guests.filter((g) => g.liveVisits >= 2).length;
  const upcoming = guests.filter((g) => g.nextVisit).length;
  const rated = guests.filter((g) => g.rating !== null);
  const avg = rated.length > 0 ? rated.reduce((s, g) => s + (g.rating ?? 0), 0) / rated.length : null;
  const open = openKey ? (guests.find((g) => g.key === openKey) ?? null) : null;

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Vos clients et leurs sorties"
        description="Un profil par client, reconstitué à partir de ses réservations : sorties passées et à venir, adresses préférées, montant dépensé, avis. Le carnet d'adresses d'une conciergerie, sans rien saisir."
        actions={
          <Button icon={Download} onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
            Exporter ({filtered.length})
          </Button>
        }
      />

      <KpiGrid
        items={[
          { label: "Clients", value: formatNumber(guests.length), hint: "ayant réservé au moins une fois", icon: Users, tone: "sky" },
          { label: "Fidèles", value: formatNumber(loyal), hint: "2 sorties ou plus", icon: Repeat, tone: "violet" },
          { label: "Sortie à venir", value: formatNumber(upcoming), hint: "clients avec une réservation future", icon: UserPlus, tone: "emerald" },
          { label: "Satisfaction", value: avg !== null ? `${avg.toFixed(1).replace(".", ",")}/5` : "—", hint: `${rated.length} ${plural(rated.length, "client noté", "clients notés")}`, icon: Star, tone: "amber" },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "tous", label: "Tous", count: guests.length },
            { value: "fideles", label: "Fidèles", count: loyal },
            { value: "avenir", label: "Sortie à venir", count: upcoming },
            { value: "notes", label: "Ont laissé un avis", count: rated.length },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Nom, téléphone, adresse…" className="w-full sm:w-60" />
          <Select<Sort>
            label="Trier"
            value={sort}
            onChange={setSort}
            className="w-44"
            options={[
              { value: "recent", label: "Dernière sortie" },
              { value: "visites", label: "Plus de sorties" },
              { value: "depense", label: "Plus dépensé" },
              { value: "nom", label: "Nom (A → Z)" },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel solid>
          <EmptyState
            icon={Users}
            title={guests.length === 0 ? "Aucun client pour le moment" : "Aucun client ne correspond"}
            description={
              guests.length === 0
                ? "Les profils se créent tout seuls à la première réservation passée depuis un de vos QR codes."
                : "Essayez un autre filtre ou une autre recherche."
            }
            action={guests.length === 0 ? <LinkButton href="/hotel/chambres" variant="primary">Mes QR codes</LinkButton> : undefined}
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
                  { l: "Sorties", v: formatNumber(g.liveVisits) },
                  { l: "Dépensé", v: g.totalSpent > 0 ? formatMad(g.totalSpent, true) : "—" },
                  { l: "Commission", v: g.totalCommission > 0 ? formatMad(g.totalCommission, true) : "—" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg bg-white/[0.05] py-1.5">
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-white/40">{s.l}</dt>
                    <dd className="truncate px-1 text-[13px] font-black text-white">{s.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-white/50">
                {g.nextVisit ? (
                  <Tag className="bg-emerald-500/15 text-emerald-300">Prochaine : {relativeDay(g.nextVisit)}</Tag>
                ) : (
                  <Tag>Dernière : {formatDate(g.lastVisit)}</Tag>
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
  if (!g) return null;
  const today = todayIso();
  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow={`${g.liveVisits} ${plural(g.liveVisits, "sortie")} · client depuis le ${formatDate(g.firstVisit)}`}
      title={g.name}
      footer={
        <>
          <LinkButton href={whatsappLink(g.phone, `Bonjour ${g.name.split(" ")[0]}, `)} external icon={MessageCircle} variant="primary" size="sm">
            WhatsApp
          </LinkButton>
          <LinkButton href={`tel:${g.phone.replace(/\s/g, "")}`} external icon={Phone} size="sm">
            Appeler
          </LinkButton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {[
          { l: "Dépensé", v: g.totalSpent > 0 ? formatMad(g.totalSpent) : "—", icon: Coins },
          { l: "Commissions", v: g.totalCommission > 0 ? formatMad(g.totalCommission) : "—", icon: Coins },
          { l: "Taille moyenne", v: `${g.averageParty.toFixed(1).replace(".", ",")} pers.`, icon: Users },
          { l: "Note moyenne", v: g.rating !== null ? `${g.rating.toFixed(1).replace(".", ",")}/5` : "—", icon: Star },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{s.l}</p>
            <p className="num mt-1 text-base font-black text-white">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {g.categories.map((c) => (
          <Tag key={c}>{c}</Tag>
        ))}
        {g.rooms.map((r) => (
          <Tag key={r} className="bg-sky-500/15 text-sky-200">{r}</Tag>
        ))}
      </div>

      <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Historique des sorties</p>
      <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-white/[0.03]">
        {g.reservations.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{r.venue_name}</p>
                <p className="num text-xs text-white/50">
                  {r.reservation_date >= today ? relativeDay(r.reservation_date) : formatDate(r.reservation_date, "long")}
                  {r.reservation_time ? ` · ${r.reservation_time}` : ""} · {r.party_size} pers.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={r.status} />
                {r.commission > 0 && isLive(r) && <span className="num text-[11px] font-bold text-amber-300">+{formatMad(r.commission)}</span>}
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
