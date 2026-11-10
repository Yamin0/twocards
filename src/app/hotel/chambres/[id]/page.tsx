"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Coins,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Palmtree,
  Pencil,
  Power,
  Printer,
  QrCode,
  RotateCcw,
  ScanLine,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { useHotelSpace } from "@/lib/hotel/store";
import { CATEGORY_KEYS, categoryLabel, cityCatalog, type GuestCategoryKey } from "@/lib/guest-catalog";
import { averageRating, conversionRate, isLive, reservationCategoryLabel } from "@/lib/hotel/analytics";
import { formatDate, formatMad, formatNumber, formatPercent, plural, timeAgo, todayIso, whatsappLink } from "@/lib/hotel/format";
import { downloadPng, downloadSvg, guestUrl, shareByEmail, shareByWhatsapp } from "@/lib/qr";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  KpiGrid,
  LinkButton,
  PageHeader,
  Panel,
  StatusPill,
  Switch,
  Table,
  Td,
  Th,
  Toast,
  Tr,
  inputClass,
  useCopy,
} from "@/components/hotel/ui";
import { RatingStars } from "@/components/hotel/charts";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

const CATEGORY_ICONS = {
  restaurants: UtensilsCrossed,
  activites: Palmtree,
  clubs: Music,
  services: Sparkles,
} as const;

/* Libellé d'une catégorie enregistrée (clé inconnue : affichée telle quelle). */
const catName = (k: string, locale: Locale) =>
  (CATEGORY_KEYS as string[]).includes(k) ? categoryLabel(k as GuestCategoryKey, locale) : k;

export default function HotelQrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const { isLoading: authLoading, venueName, city } = useAuthUser();
  const { qrCodes, reservations, profile, catalog, hotelOffers, isLoading, update, remove } = useHotelSpace();
  const { toast, showToast } = useToast();
  const { copied, copy } = useCopy();

  const qr = qrCodes.find((q) => q.id === id) ?? null;

  /* Édition du menu : l'état local part des offres masquées enregistrées et
     n'est renvoyé en base qu'à l'enregistrement. */
  const [hidden, setHidden] = useState<Set<string> | null>(null);
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  /* Filtres par catégorie de ce QR, avec échéance facultative. */
  const [cats, setCats] = useState<Set<string> | null>(null);
  const [until, setUntil] = useState<string | null>(null);
  const [savingRules, setSavingRules] = useState(false);

  /* Ajustement d'état pendant le rendu plutôt qu'un effet : l'édition part
     des offres masquées enregistrées dès que le QR est connu. */
  if (qr && hidden === null) setHidden(new Set(qr.hidden_offers));
  if (qr && cats === null) {
    setCats(new Set(qr.hidden_categories));
    setUntil(qr.hidden_until);
  }

  const hotelName = profile.hotel_name || venueName;
  const hotelCity = profile.city || city;
  const menuCatalog = useMemo(
    () => cityCatalog(hotelCity ?? null, catalog, hotelOffers, locale),
    [hotelCity, catalog, hotelOffers, locale]
  );

  if (authLoading || isLoading || (qr && (hidden === null || cats === null))) return <PageSkeleton kpis={4} table />;

  if (!qr) {
    return (
      <Panel solid>
        <EmptyState
          icon={QrCode}
          title={t("QR code introuvable", "QR code not found")}
          description={t("Ce QR code n'existe pas ou ne vous appartient pas.", "This QR code doesn't exist or doesn't belong to you.")}
          action={
            <LinkButton href="/hotel/chambres" icon={ArrowLeft}>
              {t("Retour aux chambres", "Back to rooms")}
            </LinkButton>
          }
        />
      </Panel>
    );
  }

  const link = guestUrl(qr.code, hotelName, hotelCity);
  const mine = reservations.filter((r) => r.qr_code_id === qr.id);
  const live = mine.filter(isLive);
  const commission = live.reduce((s, r) => s + r.commission, 0);
  const rating = averageRating(mine);
  const conversion = conversionRate(qr.scans, live.length);
  const hiddenSet = hidden ?? new Set<string>();
  /* Retraits valables pour tout l'hôtel (page Mes adresses) : affichés ici
     pour information, ils ne se règlent pas chambre par chambre. */
  const globalHidden = new Set(profile.hidden_offers);
  const menuDirty =
    JSON.stringify([...hiddenSet].sort()) !== JSON.stringify([...qr.hidden_offers].sort());
  const totalOffers = menuCatalog.reduce((s, c) => s + c.offers.length, 0);
  const shownOffers = menuCatalog.reduce((s, c) => s + c.offers.filter((o) => !hiddenSet.has(o.id)).length, 0);
  const q = menuSearch.trim().toLowerCase();

  const catSet = cats ?? new Set<string>();
  const today = todayIso();
  const rulesDirty =
    JSON.stringify([...catSet].sort()) !== JSON.stringify([...qr.hidden_categories].sort()) ||
    (until ?? null) !== (qr.hidden_until ?? null);
  const rulesExpired = !!qr.hidden_until && qr.hidden_until < today;
  const toggleCat = (key: string) =>
    setCats((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const saveRules = async () => {
    setSavingRules(true);
    const ok = await update(qr.id, { hidden_categories: [...catSet], hidden_until: until || null });
    setSavingRules(false);
    showToast(
      ok
        ? t("Filtres enregistrés, visibles dès le prochain scan", "Filters saved, live from the next scan")
        : t("Impossible d'enregistrer les filtres", "Couldn't save the filters")
    );
  };

  const toggleOffer = (offerId: string) =>
    setHidden((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(offerId)) next.delete(offerId);
      else next.add(offerId);
      return next;
    });

  const setCategory = (ids: string[], propose: boolean) =>
    setHidden((prev) => {
      const next = new Set(prev ?? []);
      for (const oid of ids) {
        if (propose) next.delete(oid);
        else next.add(oid);
      }
      return next;
    });

  const saveMenu = async () => {
    setSavingMenu(true);
    const ok = await update(qr.id, { hidden_offers: [...hiddenSet] });
    setSavingMenu(false);
    showToast(
      ok
        ? t("Menu enregistré, visible dès le prochain scan", "Menu saved, live from the next scan")
        : t("Impossible d'enregistrer le menu", "Couldn't save the menu")
    );
  };

  const rename = async () => {
    const trimmed = label.trim();
    if (!trimmed || trimmed === qr.label) {
      setRenaming(false);
      return;
    }
    const ok = await update(qr.id, { label: trimmed });
    setRenaming(false);
    showToast(ok ? t("Emplacement renommé", "Location renamed") : t("Échec du renommage", "Rename failed"));
  };

  const toggleActive = async () => {
    const ok = await update(qr.id, { active: !qr.active });
    showToast(
      ok
        ? qr.active
          ? t("QR désactivé, le lien affiche un message d'indisponibilité", "QR deactivated, the link now shows an unavailable message")
          : t("QR réactivé", "QR reactivated")
        : t("Échec de la mise à jour", "Update failed")
    );
  };

  const confirmDelete = async () => {
    setBusy(true);
    const ok = await remove([qr.id]);
    setBusy(false);
    if (ok) router.push("/hotel/chambres");
    else {
      setDeleteOpen(false);
      showToast(t("Échec de la suppression", "Delete failed"));
    }
  };

  return (
    <>
      <PageHeader
        back={{ href: "/hotel/chambres", label: t("Chambres & QR codes", "Rooms & QR codes") }}
        eyebrow={`${t("Code", "Code")} ${qr.code}`}
        title={
          renaming ? (
            <span className="flex items-center gap-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") rename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                autoFocus
                maxLength={60}
                className={cn(inputClass, "h-11 w-72 text-xl font-bold")}
              />
              <Button size="sm" variant="primary" icon={Check} onClick={rename}>
                OK
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)}>
                {t("Annuler", "Cancel")}
              </Button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-3">
              {qr.label}
              <StatusPill status={qr.active ? "actif" : "inactif"} />
              <IconButton
                icon={Pencil}
                label={t("Renommer", "Rename")}
                size={15}
                onClick={() => {
                  setLabel(qr.label);
                  setRenaming(true);
                }}
              />
            </span>
          )
        }
        description={t(
          `Créé ${timeAgo(qr.created_at)} · ${formatNumber(qr.scans)} ${plural(qr.scans, "scan")} · ${live.length} ${plural(live.length, "réservation")} · ${formatMad(commission)} de commissions.`,
          `Created ${timeAgo(qr.created_at, undefined, "en")} · ${formatNumber(qr.scans, "en")} ${plural(qr.scans, "scan", undefined, "en")} · ${live.length} ${plural(live.length, "reservation", undefined, "en")} · ${formatMad(commission, false, "en")} in commissions.`
        )}
        actions={
          <>
            <Button icon={Power} onClick={toggleActive}>
              {qr.active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")}
            </Button>
            <LinkButton href={`/hotel/chambres/imprimer?ids=${qr.id}`} icon={Printer}>
              {t("Imprimer", "Print")}
            </LinkButton>
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>
              {t("Supprimer", "Delete")}
            </Button>
          </>
        }
      />

      <KpiGrid
        items={[
          {
            label: t("Scans", "Scans"),
            value: formatNumber(qr.scans, locale),
            icon: ScanLine,
            tone: "emerald",
            hint: t("temps réel", "real time"),
          },
          {
            label: t("Réservations", "Reservations"),
            value: formatNumber(live.length, locale),
            icon: CalendarDays,
            tone: "sky",
            hint: t(
              `${mine.length - live.length} annulée${mine.length - live.length > 1 ? "s" : ""} ou no-show`,
              `${mine.length - live.length} cancelled or no-show`
            ),
          },
          {
            label: t("Conversion", "Conversion"),
            value: qr.scans > 0 ? formatPercent(conversion, 1, locale) : "—",
            icon: TrendingUp,
            tone: "violet",
            hint: t("réservations / scans", "reservations / scans"),
          },
          {
            label: t("Commissions", "Commissions"),
            value: formatMad(commission, true, locale),
            icon: Coins,
            tone: "amber",
            hint:
              rating.average !== null
                ? t(
                    `${rating.average.toFixed(1).replace(".", ",")}/5 · ${rating.count} ${plural(rating.count, "avis")}`,
                    `${rating.average.toFixed(1)}/5 · ${rating.count} ${plural(rating.count, "review", undefined, "en")}`
                  )
                : t("aucun avis", "no reviews"),
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {/* QR et lien */}
        <Panel
          title={t("QR code & lien unique", "QR code & unique link")}
          description={t(
            "Tout scan et toute réservation via ce lien sont rattachés à cet emplacement.",
            "Every scan and reservation through this link is attributed to this location."
          )}
          className="xl:col-span-2"
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div id={`qr-${qr.id}`} className="shrink-0 rounded-2xl bg-white p-4">
              <QRCode value={link} size={148} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="font-mono-satoshi truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white/70">
                {link}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={copied ? Check : Copy} onClick={() => copy(link).then((ok) => !ok && showToast(t("Impossible de copier", "Couldn't copy")))}>
                  {copied ? t("Copié", "Copied") : t("Copier", "Copy")}
                </Button>
                <LinkButton size="sm" href={link} external icon={ExternalLink}>
                  {t("Ouvrir", "Open")}
                </LinkButton>
                <Button size="sm" icon={Download} onClick={() => downloadSvg(`qr-${qr.id}`, qr.label) && showToast(t("SVG téléchargé", "SVG downloaded"))}>
                  SVG
                </Button>
                <Button size="sm" icon={ImageIcon} onClick={() => downloadPng(`qr-${qr.id}`, qr.label).then((ok) => showToast(ok ? t("PNG téléchargé", "PNG downloaded") : t("Échec de l'export", "Export failed")))}>
                  PNG
                </Button>
              </div>
              <div className="border-t border-white/[0.08] pt-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{t("Partager sans QR", "Share without QR")}</p>
                <div className="flex flex-wrap gap-2">
                  <LinkButton size="sm" variant="ghost" href={shareByWhatsapp(link, hotelName, locale)} external icon={MessageCircle}>
                    WhatsApp
                  </LinkButton>
                  <LinkButton size="sm" variant="ghost" href={shareByEmail(link, hotelName, locale)} external icon={Mail}>
                    {t("E-mail", "Email")}
                  </LinkButton>
                  <Button size="sm" variant="ghost" icon={preview ? EyeOff : Eye} onClick={() => setPreview((p) => !p)}>
                    {preview ? t("Masquer l'aperçu", "Hide preview") : t("Aperçu client", "Guest preview")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {preview && (
            <div className="mt-5 flex justify-center border-t border-white/[0.08] pt-5">
              <div className="w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-black bg-black shadow-2xl">
                <iframe
                  title={t("Aperçu du menu client", "Guest menu preview")}
                  src={`${link}${link.includes("?") ? "&" : "?"}apercu=1`}
                  className="h-[560px] w-full bg-white"
                />
              </div>
            </div>
          )}
        </Panel>

        {/* Filtres : une catégorie entière, le temps d'un séjour */}
        <Panel
          title={t("Filtres du menu", "Menu filters")}
          description={t(
            "Retirez une catégorie entière de ce QR, le temps d'un séjour ou pour de bon. Pour une famille, un geste : plus de clubs.",
            "Remove a whole category from this QR, for one stay or for good. For a family, one tap: no more clubs."
          )}
          actions={
            <>
              {rulesDirty && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={RotateCcw}
                  onClick={() => {
                    setCats(new Set(qr.hidden_categories));
                    setUntil(qr.hidden_until);
                  }}
                >
                  {t("Annuler", "Cancel")}
                </Button>
              )}
              <Button size="sm" variant={rulesDirty ? "primary" : "secondary"} icon={Check} onClick={saveRules} loading={savingRules} disabled={!rulesDirty}>
                {t("Enregistrer", "Save")}
              </Button>
            </>
          }
          className="xl:col-span-3"
        >
          <div className="flex flex-wrap gap-2">
            {CATEGORY_KEYS.map((key) => {
              const Icon = CATEGORY_ICONS[key];
              const off = catSet.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCat(key)}
                  aria-pressed={off}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition-colors",
                    off
                      ? "border-red-400/40 bg-red-500/15 text-red-100"
                      : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  <span className={cn(off && "line-through decoration-red-300/70")}>{categoryLabel(key, locale)}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">
                    {off ? t("retirée", "removed") : t("proposée", "offered")}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={Music}
                disabled={catSet.has("clubs")}
                onClick={() => setCats((prev) => new Set([...(prev ?? []), "clubs"]))}
              >
                {t("Famille : retirer les clubs", "Family: remove clubs")}
              </Button>
              {catSet.size > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setCats(new Set())}>
                  {t("Tout proposer", "Offer all")}
                </Button>
              )}
            </div>
            <label className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              {t(<>Jusqu&apos;au</>, <>Until</>)}
              <input
                type="date"
                value={until ?? ""}
                min={today}
                onChange={(e) => setUntil(e.target.value || null)}
                className={cn(inputClass, "h-9 w-auto py-0 text-[13px]")}
              />
              {until ? (
                <button type="button" onClick={() => setUntil(null)} className="text-[11px] font-bold text-sky-300 hover:text-sky-200">
                  {t("sans limite", "no limit")}
                </button>
              ) : (
                <span className="text-[11px] text-white/35">{t("sans limite", "no limit")}</span>
              )}
            </label>
          </div>
          {qr.hidden_categories.length > 0 && (
            <p className="mt-3 text-xs text-white/45">
              {rulesExpired
                ? t(
                    "L'échéance est passée : le menu de ce QR est de nouveau complet.",
                    "The end date has passed: this QR's menu is complete again."
                  )
                : t(
                    `Actuellement retiré : ${qr.hidden_categories.map((k) => catName(k, "fr")).join(", ")}${qr.hidden_until ? ` · jusqu'au ${formatDate(qr.hidden_until, "long")}` : " · sans limite"}.`,
                    `Currently removed: ${qr.hidden_categories.map((k) => catName(k, "en")).join(", ")}${qr.hidden_until ? ` · until ${formatDate(qr.hidden_until, "long", "en")}` : " · no limit"}.`
                  )}
            </p>
          )}
        </Panel>

        {/* Menu */}
        <Panel
          title={t("Menu proposé sur ce QR", "Menu offered on this QR")}
          description={
            hotelCity
              ? t(
                  <>Catalogue twocards de {hotelCity} et vos <Link href="/hotel/adresses" className="font-bold text-sky-300">adresses maison</Link> · {shownOffers}/{totalOffers} proposées. Retirez ce que vous ne souhaitez pas suggérer à ce client.</>,
                  <>The twocards catalogue for {hotelCity} and your <Link href="/hotel/adresses" className="font-bold text-sky-300">own places</Link> · {shownOffers}/{totalOffers} offered. Remove anything you don&apos;t want to suggest to this guest.</>
                )
              : t(
                  <>Indiquez la ville de l&apos;hôtel dans les <Link href="/hotel/settings" className="font-bold text-sky-300">paramètres</Link> pour limiter le catalogue à votre ville, en attendant, tout est proposé.</>,
                  <>Add the hotel&apos;s city in <Link href="/hotel/settings" className="font-bold text-sky-300">settings</Link> to limit the catalogue to your city; until then, everything is offered.</>
                )
          }
          actions={
            <>
              {menuDirty && (
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setHidden(new Set(qr.hidden_offers))}>
                  {t("Annuler", "Cancel")}
                </Button>
              )}
              <Button size="sm" variant={menuDirty ? "primary" : "secondary"} icon={Check} onClick={saveMenu} loading={savingMenu} disabled={!menuDirty}>
                {t("Enregistrer le menu", "Save menu")}
              </Button>
            </>
          }
          className="xl:col-span-3"
        >
          <div className="relative mb-4">
            <Search size={14} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder={t("Rechercher une adresse…", "Search for a place…")}
              className={cn(inputClass, "h-9 py-0 pl-9 text-[13px]")}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {menuCatalog.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key];
              const ids = cat.offers.map((o) => o.id).filter((oid) => !globalHidden.has(oid));
              const shown = ids.filter((oid) => !hiddenSet.has(oid)).length;
              const offers = q ? cat.offers.filter((o) => o.name.toLowerCase().includes(q) || o.tag.toLowerCase().includes(q)) : cat.offers;
              if (q && offers.length === 0) return null;
              return (
                <div key={cat.key} className="rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                        <Icon size={15} strokeWidth={1.75} className="text-white/85" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">{cat.label}</p>
                        <p className="num text-[11px] text-white/45">
                          {shown}/{ids.length} {t(`proposée${shown > 1 ? "s" : ""}`, "offered")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategory(ids, shown !== ids.length)}
                      className="text-[11px] font-bold text-sky-300 hover:text-sky-200"
                    >
                      {shown === ids.length ? t("Tout retirer", "Remove all") : t("Tout proposer", "Offer all")}
                    </button>
                  </div>
                  <ul className="divide-y divide-white/[0.05] px-1.5 py-1">
                    {offers.map((o) => {
                      const global = globalHidden.has(o.id);
                      const on = !global && !hiddenSet.has(o.id);
                      return (
                        <li key={o.id} className={cn("flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-opacity", !on && "opacity-50")}>
                          <button type="button" onClick={() => toggleOffer(o.id)} className="min-w-0 flex-1 text-left">
                            <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-white">
                              <span className="truncate">{o.name}</span>
                              {o.source === "hotel" && (
                                <span className="shrink-0 rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-200">{t("Maison", "Own")}</span>
                              )}
                              {global && (
                                <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/60" title={t("Retirée pour tout l'hôtel dans Mes adresses", "Removed for the whole hotel in My places")}>{t(<>Tout l&apos;hôtel</>, <>Whole hotel</>)}</span>
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-white/45">
                              {o.city && (
                                <>
                                  <MapPin size={10} strokeWidth={1.75} /> {o.city} ·
                                </>
                              )}
                              {o.tag}
                              {o.price ? ` · ${o.price}` : ""}
                            </span>
                          </button>
                          <Switch size="sm" checked={on} disabled={global} onChange={() => toggleOffer(o.id)} label={t(`Proposer ${o.name}`, `Offer ${o.name}`)} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Réservations */}
      <Panel
        title={t("Réservations de cet emplacement", "Reservations for this location")}
        description={
          mine.length > 0
            ? t(
                `${mine.length} ${plural(mine.length, "demande")} depuis la création`,
                `${mine.length} ${plural(mine.length, "request", undefined, "en")} since it was created`
              )
            : undefined
        }
        padded={false}
      >
        {mine.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t("Aucune réservation via ce QR", "No reservations via this QR")}
            description={t(
              `Dès qu'un client scanne « ${qr.label} » et demande une réservation, elle apparaît ici avec sa commission.`,
              `As soon as a guest scans “${qr.label}” and requests a reservation, it appears here with its commission.`
            )}
            compact
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("Client", "Guest")}</Th>
                <Th>{t("Sortie", "Outing")}</Th>
                <Th>{t("Date", "Date")}</Th>
                <Th align="center">{t("Pers.", "Guests")}</Th>
                <Th>{t("Statut", "Status")}</Th>
                <Th>{t("Avis", "Review")}</Th>
                <Th align="right">{t("Montant", "Amount")}</Th>
                <Th align="right">{t("Commission", "Commission")}</Th>
              </tr>
            </thead>
            <tbody>
              {mine.map((r) => (
                <Tr key={r.id} onClick={() => router.push(`/hotel/reservations?id=${r.id}`)}>
                  <Td>
                    <p className="font-bold">{r.guest_name}</p>
                    <a href={whatsappLink(r.guest_phone)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="num text-xs text-white/45 hover:text-emerald-300">
                      {r.guest_phone}
                    </a>
                  </Td>
                  <Td>
                    <p className="font-medium">{r.venue_name}</p>
                    <p className="text-xs text-white/45">{reservationCategoryLabel(r.category, locale)}</p>
                  </Td>
                  <Td muted className="whitespace-nowrap">
                    {formatDate(r.reservation_date, undefined, locale)}
                    {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                  </Td>
                  <Td align="center" muted>
                    <span className="num inline-flex items-center gap-1">
                      <Users size={12} strokeWidth={1.75} /> {r.party_size}
                    </span>
                  </Td>
                  <Td><StatusPill status={r.status} /></Td>
                  <Td>
                    {r.rating !== null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <RatingStars value={r.rating} size={11} />
                      </span>
                    ) : (
                      <Star size={12} strokeWidth={1.5} className="text-white/20" />
                    )}
                  </Td>
                  <Td align="right" muted className="num whitespace-nowrap">{r.amount_spent !== null ? formatMad(r.amount_spent, false, locale) : "—"}</Td>
                  <Td align="right" className="num whitespace-nowrap font-bold text-amber-300">{r.commission > 0 ? formatMad(r.commission, false, locale) : "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={busy}
        danger
        confirmLabel={t("Supprimer définitivement", "Delete permanently")}
        title={t(`Supprimer « ${qr.label} » ?`, `Delete “${qr.label}”?`)}
        description={t(
          "Le QR imprimé ne fonctionnera plus et ses réservations seront supprimées de votre historique. Pour une pause temporaire, désactivez-le plutôt.",
          "The printed QR will stop working and its reservations will be removed from your history. For a temporary pause, deactivate it instead."
        )}
      />

      <Toast message={toast} />
    </>
  );
}
