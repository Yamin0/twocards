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
import { cityCatalog } from "@/lib/guest-catalog";
import { averageRating, conversionRate, isLive } from "@/lib/hotel/analytics";
import { formatDate, formatMad, formatNumber, formatPercent, plural, timeAgo, whatsappLink } from "@/lib/hotel/format";
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

const CATEGORY_ICONS = {
  restaurants: UtensilsCrossed,
  activites: Palmtree,
  clubs: Music,
  services: Sparkles,
} as const;

export default function HotelQrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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

  /* Ajustement d'état pendant le rendu plutôt qu'un effet : l'édition part
     des offres masquées enregistrées dès que le QR est connu. */
  if (qr && hidden === null) setHidden(new Set(qr.hidden_offers));

  const hotelName = profile.hotel_name || venueName;
  const hotelCity = profile.city || city;
  const menuCatalog = useMemo(
    () => cityCatalog(hotelCity ?? null, catalog, hotelOffers),
    [hotelCity, catalog, hotelOffers]
  );

  if (authLoading || isLoading || (qr && hidden === null)) return <PageSkeleton kpis={4} table />;

  if (!qr) {
    return (
      <Panel solid>
        <EmptyState
          icon={QrCode}
          title="QR code introuvable"
          description="Ce QR code n'existe pas ou ne vous appartient pas."
          action={
            <LinkButton href="/hotel/chambres" icon={ArrowLeft}>
              Retour aux chambres
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
  const menuDirty =
    JSON.stringify([...hiddenSet].sort()) !== JSON.stringify([...qr.hidden_offers].sort());
  const totalOffers = menuCatalog.reduce((s, c) => s + c.offers.length, 0);
  const shownOffers = menuCatalog.reduce((s, c) => s + c.offers.filter((o) => !hiddenSet.has(o.id)).length, 0);
  const q = menuSearch.trim().toLowerCase();

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
    showToast(ok ? "Menu enregistré, visible dès le prochain scan" : "Impossible d'enregistrer le menu");
  };

  const rename = async () => {
    const trimmed = label.trim();
    if (!trimmed || trimmed === qr.label) {
      setRenaming(false);
      return;
    }
    const ok = await update(qr.id, { label: trimmed });
    setRenaming(false);
    showToast(ok ? "Emplacement renommé" : "Échec du renommage");
  };

  const toggleActive = async () => {
    const ok = await update(qr.id, { active: !qr.active });
    showToast(ok ? (qr.active ? "QR désactivé, le lien affiche un message d'indisponibilité" : "QR réactivé") : "Échec de la mise à jour");
  };

  const confirmDelete = async () => {
    setBusy(true);
    const ok = await remove([qr.id]);
    setBusy(false);
    if (ok) router.push("/hotel/chambres");
    else {
      setDeleteOpen(false);
      showToast("Échec de la suppression");
    }
  };

  return (
    <>
      <PageHeader
        back={{ href: "/hotel/chambres", label: "Chambres & QR codes" }}
        eyebrow={`Code ${qr.code}`}
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
                Annuler
              </Button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-3">
              {qr.label}
              <StatusPill status={qr.active ? "actif" : "inactif"} />
              <IconButton
                icon={Pencil}
                label="Renommer"
                size={15}
                onClick={() => {
                  setLabel(qr.label);
                  setRenaming(true);
                }}
              />
            </span>
          )
        }
        description={`Créé ${timeAgo(qr.created_at)} · ${formatNumber(qr.scans)} ${plural(qr.scans, "scan")} · ${live.length} ${plural(live.length, "réservation")} · ${formatMad(commission)} de commissions.`}
        actions={
          <>
            <Button icon={Power} onClick={toggleActive}>
              {qr.active ? "Désactiver" : "Activer"}
            </Button>
            <LinkButton href={`/hotel/chambres/imprimer?ids=${qr.id}`} icon={Printer}>
              Imprimer
            </LinkButton>
            <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>
              Supprimer
            </Button>
          </>
        }
      />

      <KpiGrid
        items={[
          { label: "Scans", value: formatNumber(qr.scans), icon: ScanLine, tone: "emerald", hint: "temps réel" },
          { label: "Réservations", value: formatNumber(live.length), icon: CalendarDays, tone: "sky", hint: `${mine.length - live.length} annulée${mine.length - live.length > 1 ? "s" : ""} ou no-show` },
          { label: "Conversion", value: qr.scans > 0 ? formatPercent(conversion, 1) : "—", icon: TrendingUp, tone: "violet", hint: "réservations / scans" },
          { label: "Commissions", value: formatMad(commission, true), icon: Coins, tone: "amber", hint: rating.average !== null ? `${rating.average.toFixed(1).replace(".", ",")}/5 · ${rating.count} ${plural(rating.count, "avis")}` : "aucun avis" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {/* QR et lien */}
        <Panel title="QR code & lien unique" description="Tout scan et toute réservation via ce lien sont rattachés à cet emplacement." className="xl:col-span-2">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div id={`qr-${qr.id}`} className="shrink-0 rounded-2xl bg-white p-4">
              <QRCode value={link} size={148} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="font-mono-satoshi truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white/70">
                {link}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={copied ? Check : Copy} onClick={() => copy(link).then((ok) => !ok && showToast("Impossible de copier"))}>
                  {copied ? "Copié" : "Copier"}
                </Button>
                <LinkButton size="sm" href={link} external icon={ExternalLink}>
                  Ouvrir
                </LinkButton>
                <Button size="sm" icon={Download} onClick={() => downloadSvg(`qr-${qr.id}`, qr.label) && showToast("SVG téléchargé")}>
                  SVG
                </Button>
                <Button size="sm" icon={ImageIcon} onClick={() => downloadPng(`qr-${qr.id}`, qr.label).then((ok) => showToast(ok ? "PNG téléchargé" : "Échec de l'export"))}>
                  PNG
                </Button>
              </div>
              <div className="border-t border-white/[0.08] pt-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Partager sans QR</p>
                <div className="flex flex-wrap gap-2">
                  <LinkButton size="sm" variant="ghost" href={shareByWhatsapp(link, hotelName)} external icon={MessageCircle}>
                    WhatsApp
                  </LinkButton>
                  <LinkButton size="sm" variant="ghost" href={shareByEmail(link, hotelName)} external icon={Mail}>
                    E-mail
                  </LinkButton>
                  <Button size="sm" variant="ghost" icon={preview ? EyeOff : Eye} onClick={() => setPreview((p) => !p)}>
                    {preview ? "Masquer l'aperçu" : "Aperçu client"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {preview && (
            <div className="mt-5 flex justify-center border-t border-white/[0.08] pt-5">
              <div className="w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-black bg-black shadow-2xl">
                <iframe
                  title="Aperçu du menu client"
                  src={`${link}${link.includes("?") ? "&" : "?"}apercu=1`}
                  className="h-[560px] w-full bg-white"
                />
              </div>
            </div>
          )}
        </Panel>

        {/* Menu */}
        <Panel
          title="Menu proposé sur ce QR"
          description={
            hotelCity ? (
              <>Catalogue twocards de {hotelCity} et vos <Link href="/hotel/adresses" className="font-bold text-sky-300">adresses maison</Link> · {shownOffers}/{totalOffers} proposées. Retirez ce que vous ne souhaitez pas suggérer à ce client.</>
            ) : (
              <>Indiquez la ville de l&apos;hôtel dans les <Link href="/hotel/settings" className="font-bold text-sky-300">paramètres</Link> pour limiter le catalogue à votre ville, en attendant, tout est proposé.</>
            )
          }
          actions={
            <>
              {menuDirty && (
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setHidden(new Set(qr.hidden_offers))}>
                  Annuler
                </Button>
              )}
              <Button size="sm" variant={menuDirty ? "primary" : "secondary"} icon={Check} onClick={saveMenu} loading={savingMenu} disabled={!menuDirty}>
                Enregistrer le menu
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
              placeholder="Rechercher une adresse…"
              className={cn(inputClass, "h-9 py-0 pl-9 text-[13px]")}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {menuCatalog.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key];
              const ids = cat.offers.map((o) => o.id);
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
                          {shown}/{ids.length} proposée{shown > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategory(ids, shown !== ids.length)}
                      className="text-[11px] font-bold text-sky-300 hover:text-sky-200"
                    >
                      {shown === ids.length ? "Tout retirer" : "Tout proposer"}
                    </button>
                  </div>
                  <ul className="divide-y divide-white/[0.05] px-1.5 py-1">
                    {offers.map((o) => {
                      const on = !hiddenSet.has(o.id);
                      return (
                        <li key={o.id} className={cn("flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-opacity", !on && "opacity-50")}>
                          <button type="button" onClick={() => toggleOffer(o.id)} className="min-w-0 flex-1 text-left">
                            <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-white">
                              <span className="truncate">{o.name}</span>
                              {o.source === "hotel" && (
                                <span className="shrink-0 rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-200">Maison</span>
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
                          <Switch size="sm" checked={on} onChange={() => toggleOffer(o.id)} label={`Proposer ${o.name}`} />
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
        title="Réservations de cet emplacement"
        description={mine.length > 0 ? `${mine.length} ${plural(mine.length, "demande")} depuis la création` : undefined}
        padded={false}
      >
        {mine.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucune réservation via ce QR"
            description={`Dès qu'un client scanne « ${qr.label} » et demande une réservation, elle apparaît ici avec sa commission.`}
            compact
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Sortie</Th>
                <Th>Date</Th>
                <Th align="center">Pers.</Th>
                <Th>Statut</Th>
                <Th>Avis</Th>
                <Th align="right">Montant</Th>
                <Th align="right">Commission</Th>
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
                    <p className="text-xs text-white/45">{r.category}</p>
                  </Td>
                  <Td muted className="whitespace-nowrap">
                    {formatDate(r.reservation_date)}
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
                  <Td align="right" muted className="num whitespace-nowrap">{r.amount_spent !== null ? formatMad(r.amount_spent) : "—"}</Td>
                  <Td align="right" className="num whitespace-nowrap font-bold text-amber-300">{r.commission > 0 ? formatMad(r.commission) : "—"}</Td>
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
        confirmLabel="Supprimer définitivement"
        title={`Supprimer « ${qr.label} » ?`}
        description="Le QR imprimé ne fonctionnera plus et ses réservations seront supprimées de votre historique. Pour une pause temporaire, désactivez-le plutôt."
      />

      <Toast message={toast} />
    </>
  );
}
