"use client";

import { Crown, MessageCircle, Phone } from "lucide-react";
import { Badge, Drawer, LinkButton, NameAvatar, StatusPill, Tag, cardClass } from "@/components/app/ui";
import { RatingStars } from "@/components/hotel/charts";
import { isLive, reservationCategoryLabel, type GuestProfile } from "@/lib/hotel/analytics";
import { formatDate, formatMad, formatNumber, plural, relativeDay, todayIso, whatsappLink } from "@/lib/hotel/format";
import { cn } from "@/lib/utils";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

/* Une décimale, au format de la langue (4,5 / 4.5). */
function useOneDecimal() {
  const intl = useIntlLocale();
  return (n: number) => n.toLocaleString(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/* Carte d'un client : qui, combien de sorties, ce qu'il a dépensé, la
   prochaine ou la dernière sortie. Toute la carte ouvre le profil. */
export function GuestCard({ g, onOpen }: { g: GuestProfile; onOpen: () => void }) {
  const t = useT();
  const locale = useLocale();
  const stats = [
    { label: t("Sorties", "Outings"), value: formatNumber(g.liveVisits, locale) },
    { label: t("Dépensé", "Spent"), value: g.totalSpent > 0 ? formatMad(g.totalSpent, true, locale) : "—" },
    {
      label: t("Commission", "Commission"),
      value: g.totalCommission > 0 ? formatMad(g.totalCommission, true, locale) : "—",
    },
  ];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(cardClass, "p-4 text-left transition-colors hover:border-line-2")}
    >
      <span className="flex items-start gap-3">
        <NameAvatar name={g.name} size={42} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <span className="truncate">{g.name}</span>
            {g.liveVisits >= 3 && (
              <Crown size={14} strokeWidth={2} className="shrink-0 text-warn" aria-label={t("Client fidèle", "Regular guest")} />
            )}
          </span>
          <span className="num block truncate text-xs text-ink-3">{g.phone}</span>
        </span>
        {g.rating !== null && <RatingStars value={g.rating} size={12} />}
      </span>
      <span className="num mt-4 grid grid-cols-3 gap-2 text-center">
        {stats.map((s) => (
          <span key={s.label} className="rounded-lg bg-fill px-1 py-1.5">
            <span className="block truncate text-xs text-ink-3">{s.label}</span>
            <span className="block truncate text-[13px] font-bold text-ink">{s.value}</span>
          </span>
        ))}
      </span>
      <span className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
        {g.nextVisit ? (
          <Badge tone="ok">
            {t("Prochaine :", "Next:")} {relativeDay(g.nextVisit, undefined, locale)}
          </Badge>
        ) : (
          <Badge>
            {t("Dernière :", "Last:")} {formatDate(g.lastVisit, "medium", locale)}
          </Badge>
        )}
        {g.favoriteVenue && (
          <span className="truncate">
            {t("Préfère", "Favourite:")} {g.favoriteVenue}
          </span>
        )}
      </span>
    </button>
  );
}

/* Profil d'un client : ses totaux et l'historique de ses sorties. */
export function GuestDrawer({ guest: g, onClose }: { guest: GuestProfile | null; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const fmt1 = useOneDecimal();
  if (!g) return null;
  const today = todayIso();
  const firstName = g.name.split(" ")[0];
  const totals = [
    { label: t("Dépensé", "Spent"), value: g.totalSpent > 0 ? formatMad(g.totalSpent, false, locale) : "—" },
    {
      label: t("Commissions", "Commissions"),
      value: g.totalCommission > 0 ? formatMad(g.totalCommission, false, locale) : "—",
    },
    {
      label: t("Taille moyenne", "Average party"),
      value: t(`${fmt1(g.averageParty)} pers.`, `${fmt1(g.averageParty)} guests`),
    },
    { label: t("Note moyenne", "Average rating"), value: g.rating !== null ? `${fmt1(g.rating)}/5` : "—" },
  ];
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
          <LinkButton
            href={whatsappLink(g.phone, t(`Bonjour ${firstName}, `, `Hello ${firstName}, `))}
            external
            icon={MessageCircle}
            variant="primary"
          >
            WhatsApp
          </LinkButton>
          <LinkButton href={`tel:${g.phone.replace(/\s/g, "")}`} external icon={Phone}>
            {t("Appeler", "Call")}
          </LinkButton>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-2">
        {totals.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-fill px-3.5 py-3">
            <dt className="text-xs text-ink-3">{s.label}</dt>
            <dd className="num mt-1 text-base font-bold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {g.categories.map((c) => (
          <Tag key={c}>{reservationCategoryLabel(c, locale)}</Tag>
        ))}
        {g.rooms.map((r) => (
          <Badge key={r} tone="info">
            {r}
          </Badge>
        ))}
      </div>

      <h3 className="mb-2 mt-6 text-[13px] font-bold text-ink-2">{t("Historique des sorties", "Outing history")}</h3>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {g.reservations.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{r.venue_name}</p>
                <p className="num text-xs text-ink-3">
                  {r.reservation_date >= today
                    ? relativeDay(r.reservation_date, undefined, locale)
                    : formatDate(r.reservation_date, "long", locale)}
                  {r.reservation_time ? ` · ${r.reservation_time}` : ""} · {r.party_size}{" "}
                  {t("pers.", r.party_size === 1 ? "guest" : "guests")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={r.status} />
                {r.commission > 0 && isLive(r) && (
                  <span className="num text-xs font-bold text-ok">+{formatMad(r.commission, false, locale)}</span>
                )}
              </div>
            </div>
            {r.rating !== null && (
              <div className="mt-1.5 flex items-center gap-2">
                <RatingStars value={r.rating} size={12} />
                {r.rating_comment && <span className="truncate text-xs text-ink-2">“{r.rating_comment}”</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
