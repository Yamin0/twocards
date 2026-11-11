"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import {
  BedDouble,
  Check,
  CheckSquare,
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  Power,
  Printer,
  QrCode,
  ScanLine,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { useHotelSpace, type HotelQrCode } from "@/lib/hotel/store";
import { qrPerformance, type QrPerformance } from "@/lib/hotel/analytics";
import { formatMad, formatNumber, formatPercent, isRoomLabel, plural, timeAgo } from "@/lib/hotel/format";
import { downloadSvg, guestUrl } from "@/lib/qr";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  KpiGrid,
  LinkButton,
  Modal,
  PageHeader,
  Panel,
  SearchInput,
  Segmented,
  Select,
  StatusPill,
  Table,
  Td,
  Th,
  Toast,
  Tr,
  inputClass,
} from "@/components/hotel/ui";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { cn } from "@/lib/utils";
import type { Locale, Translate } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

type Filter = "tous" | "chambres" | "espaces" | "actifs" | "inactifs";
type Sort = "recent" | "label" | "scans" | "resas" | "conversion";
type View = "grille" | "liste";
type CreateMode = "un" | "plusieurs" | "serie";

const getSuggested = (t: Translate) => [
  "Lobby",
  t("Réception", "Reception"),
  "Spa",
  t("Piscine", "Pool"),
  "Rooftop",
  "Restaurant",
  "Bar",
  t("Conciergerie", "Concierge"),
];

const sortRows = (rows: QrPerformance[], sort: Sort, locale: Locale = "fr") =>
  [...rows].sort((a, b) => {
    switch (sort) {
      case "label":
        return a.label.localeCompare(b.label, locale, { numeric: true });
      case "scans":
        return b.scans - a.scans;
      case "resas":
        return b.liveReservations - a.liveReservations;
      case "conversion":
        return b.conversion - a.conversion;
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });

/* Série « Chambre 101 → 120 » : le préfixe est conservé, le numéro
   incrémenté, le zéro initial respecté (« 01 » → « 02 »). */
function expandSeries(prefix: string, from: string, to: string) {
  const a = Number(from);
  const b = Number(to);
  if (!Number.isInteger(a) || !Number.isInteger(b) || b < a || b - a > 200) return [];
  const width = from.startsWith("0") ? from.length : 0;
  const out: string[] = [];
  for (let n = a; n <= b; n++) {
    out.push(`${prefix.trim()} ${String(n).padStart(width, "0")}`.trim());
  }
  return out;
}

export default function HotelChambresPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={4} table />}>
      <ChambresContent />
    </Suspense>
  );
}

function ChambresContent() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const locale = useLocale();
  const { isLoading: authLoading, venueName, city } = useAuthUser();
  const { qrCodes, reservations, profile, isLoading, create, createMany, update, updateMany, remove } =
    useHotelSpace();
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("tous");
  const [sort, setSort] = useState<Sort>((params.get("tri") as Sort) || "recent");
  /* Préférence d'affichage, lue au premier rendu client : la page n'est
     rendue qu'une fois les données chargées, donc jamais côté serveur. */
  const [view, setView] = useState<View>(() => {
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem("hotel-qr-view") : null;
      return v === "liste" ? "liste" : "grille";
    } catch {
      return "grille";
    }
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  /* Le paramètre ?nouveau=1 vient de la barre latérale : on le consomme —
     ajustement d'état pendant le rendu, puis nettoyage de l'URL. */
  const wantsNew = params.get("nouveau") === "1";
  const [seenNew, setSeenNew] = useState(false);
  if (wantsNew !== seenNew) {
    setSeenNew(wantsNew);
    if (wantsNew) setCreateOpen(true);
  }
  useEffect(() => {
    if (wantsNew) router.replace("/hotel/chambres");
  }, [wantsNew, router]);

  const hotelName = profile.hotel_name || venueName;
  const hotelCity = profile.city || city;

  const rows = useMemo(() => qrPerformance(qrCodes, reservations), [qrCodes, reservations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortRows(
      rows.filter((r) => {
        if (q && !r.label.toLowerCase().includes(q) && !r.code.includes(q)) return false;
        switch (filter) {
          case "chambres":
            return isRoomLabel(r.label);
          case "espaces":
            return !isRoomLabel(r.label);
          case "actifs":
            return r.active;
          case "inactifs":
            return !r.active;
          default:
            return true;
        }
      }),
      sort,
      locale
    );
  }, [rows, search, filter, sort, locale]);

  if (authLoading || isLoading) return <PageSkeleton kpis={4} table />;

  const activeCount = qrCodes.filter((q) => q.active).length;
  const totalScans = qrCodes.reduce((s, q) => s + q.scans, 0);
  const totalResas = rows.reduce((s, r) => s + r.liveReservations, 0);
  const rooms = qrCodes.filter((q) => isRoomLabel(q.label)).length;
  const counts = {
    tous: rows.length,
    chambres: rooms,
    espaces: rows.length - rooms,
    actifs: activeCount,
    inactifs: rows.length - activeCount,
  };

  const setView2 = (v: View) => {
    setView(v);
    try {
      localStorage.setItem("hotel-qr-view", v);
    } catch {
      /* ignore */
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id)));

  const toggleActive = async (q: HotelQrCode) => {
    const ok = await update(q.id, { active: !q.active });
    showToast(
      ok
        ? t(`« ${q.label} » ${q.active ? "désactivé" : "activé"}`, `“${q.label}” ${q.active ? "deactivated" : "activated"}`)
        : t("Échec de la mise à jour", "Update failed")
    );
  };

  const bulkActive = async (active: boolean) => {
    setBusy(true);
    const ok = await updateMany([...selected], { active });
    setBusy(false);
    showToast(
      ok
        ? t(`${selected.size} QR ${active ? "activés" : "désactivés"}`, `${selected.size} QR ${active ? "activated" : "deactivated"}`)
        : t("Échec de la mise à jour", "Update failed")
    );
    if (ok) setSelected(new Set());
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    const ok = await remove(toDelete);
    setBusy(false);
    setToDelete(null);
    if (ok) {
      setSelected(new Set());
      showToast(
        toDelete.length > 1
          ? t(`${toDelete.length} QR supprimés`, `${toDelete.length} QR codes deleted`)
          : t("QR code supprimé", "QR code deleted")
      );
    } else {
      showToast(t("Échec de la suppression", "Delete failed"));
    }
  };

  const copyLink = async (q: HotelQrCode) => {
    try {
      await navigator.clipboard.writeText(guestUrl(q.code, hotelName, hotelCity));
      showToast(t("Lien copié", "Link copied"));
    } catch {
      showToast(t("Impossible de copier le lien", "Couldn't copy the link"));
    }
  };

  const printHref =
    selected.size > 0 ? `/hotel/chambres/imprimer?ids=${[...selected].join(",")}` : "/hotel/chambres/imprimer";

  return (
    <>
      <PageHeader
        eyebrow={t("Chambres & QR codes", "Rooms & QR codes")}
        title={t("Vos emplacements", "Your locations")}
        description={t(
          "Un QR code par chambre, suite ou espace commun. Chaque scan ouvre le menu de sorties que vous avez choisi, et chaque réservation est rattachée à son emplacement.",
          "One QR code per room, suite or common area. Each scan opens the outings menu you've chosen, and every reservation is linked to its location."
        )}
        actions={
          <>
            <LinkButton href={printHref} icon={Printer} variant="secondary">
              {t("Imprimer", "Print")}
              {selected.size > 0 ? ` (${selected.size})` : ""}
            </LinkButton>
            <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
              {t("Nouveau QR code", "New QR code")}
            </Button>
          </>
        }
      />

      <KpiGrid
        items={[
          {
            label: t("QR codes", "QR codes"),
            value: formatNumber(qrCodes.length, locale),
            hint: t(`${activeCount} ${plural(activeCount, "actif")}`, `${activeCount} active`),
            icon: QrCode,
            tone: "sky",
          },
          {
            label: t("Chambres", "Rooms"),
            value: formatNumber(rooms, locale),
            hint: t(
              `${qrCodes.length - rooms} ${plural(qrCodes.length - rooms, "espace commun", "espaces communs")}`,
              `${qrCodes.length - rooms} common ${plural(qrCodes.length - rooms, "area", undefined, "en")}`
            ),
            icon: BedDouble,
            tone: "violet",
          },
          {
            label: t("Scans", "Scans"),
            value: formatNumber(totalScans, locale),
            hint: t("cumulés, tous emplacements", "total, all locations"),
            icon: ScanLine,
            tone: "emerald",
          },
          {
            label: t("Réservations", "Reservations"),
            value: formatNumber(totalResas, locale),
            hint:
              totalScans > 0
                ? t(
                    `${formatPercent(totalResas / totalScans, 1, locale)} de conversion`,
                    `${formatPercent(totalResas / totalScans, 1, locale)} conversion`
                  )
                : t("en attente de scans", "awaiting scans"),
            icon: Check,
            tone: "amber",
          },
        ]}
      />

      {qrCodes.length === 0 ? (
        <Panel solid>
          <EmptyState
            icon={QrCode}
            title={t("Aucun QR code pour le moment", "No QR codes yet")}
            description={t(
              "Créez un QR code par chambre ou par zone de l'hôtel. Une fois imprimé, chaque scan ouvre le menu de sorties que vous avez choisi, et chaque réservation vous rapporte une commission.",
              "Create one QR code per room or area of the hotel. Once printed, each scan opens the outings menu you've chosen, and every reservation earns you a commission."
            )}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
                {t("Créer mon premier QR code", "Create my first QR code")}
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          {/* Barre d'outils */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "tous", label: t("Tous", "All"), count: counts.tous },
                { value: "chambres", label: t("Chambres", "Rooms"), count: counts.chambres },
                { value: "espaces", label: t("Espaces communs", "Common areas"), count: counts.espaces },
                { value: "actifs", label: t("Actifs", "Active"), count: counts.actifs },
                { value: "inactifs", label: t("Inactifs", "Inactive"), count: counts.inactifs },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder={t("Chambre, code…", "Room, code…")} className="w-full sm:w-56" />
              <Select<Sort>
                label={t("Trier", "Sort")}
                value={sort}
                onChange={setSort}
                className="w-44"
                options={[
                  { value: "recent", label: t("Plus récents", "Newest") },
                  { value: "label", label: t("Nom (A → Z)", "Name (A → Z)") },
                  { value: "scans", label: t("Plus scannés", "Most scanned") },
                  { value: "resas", label: t("Plus de réservations", "Most reservations") },
                  { value: "conversion", label: t("Meilleure conversion", "Best conversion") },
                ]}
              />
              <div className="inline-flex rounded-xl border border-line bg-panel p-1">
                <IconButton
                  icon={LayoutGrid}
                  label={t("Vue grille", "Grid view")}
                  onClick={() => setView2("grille")}
                  className={cn("h-8 w-8", view === "grille" && "bg-brand text-on-brand hover:bg-white hover:text-on-brand")}
                />
                <IconButton
                  icon={List}
                  label={t("Vue liste", "List view")}
                  onClick={() => setView2("liste")}
                  className={cn("h-8 w-8", view === "liste" && "bg-brand text-on-brand hover:bg-white hover:text-on-brand")}
                />
              </div>
            </div>
          </div>

          {/* Sélection multiple */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-ink-2 hover:text-ink"
            >
              {selected.size > 0 && selected.size === filtered.length ? (
                <CheckSquare size={15} strokeWidth={1.75} />
              ) : (
                <Square size={15} strokeWidth={1.75} />
              )}
              {selected.size > 0
                ? t(`${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`, `${selected.size} selected`)
                : t("Tout sélectionner", "Select all")}
            </button>
            {selected.size > 0 && (
              <>
                <Button size="sm" icon={Power} onClick={() => bulkActive(true)} loading={busy}>
                  {t("Activer", "Activate")}
                </Button>
                <Button size="sm" icon={Power} onClick={() => bulkActive(false)} loading={busy}>
                  {t("Désactiver", "Deactivate")}
                </Button>
                <LinkButton size="sm" icon={Printer} href={printHref}>
                  {t("Imprimer", "Print")}
                </LinkButton>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setToDelete([...selected])}>
                  {t("Supprimer", "Delete")}
                </Button>
                <Button size="sm" variant="ghost" icon={X} onClick={() => setSelected(new Set())}>
                  {t("Annuler", "Cancel")}
                </Button>
              </>
            )}
          </div>

          {filtered.length === 0 ? (
            <Panel>
              <EmptyState
                icon={QrCode}
                title={t("Aucun emplacement ne correspond", "No matching locations")}
                description={t("Essayez un autre filtre ou une autre recherche.", "Try another filter or search.")}
                compact
                action={
                  <Button variant="ghost" onClick={() => { setSearch(""); setFilter("tous"); }}>
                    {t("Réinitialiser", "Reset")}
                  </Button>
                }
              />
            </Panel>
          ) : view === "grille" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((q) => (
                <QrCard
                  key={q.id}
                  q={q}
                  link={guestUrl(q.code, hotelName, hotelCity)}
                  selected={selected.has(q.id)}
                  onSelect={() => toggleSelect(q.id)}
                  onToggle={() => toggleActive(q)}
                  onDelete={() => setToDelete([q.id])}
                  onCopy={() => copyLink(q)}
                  onDownload={() => {
                    if (downloadSvg(`qr-${q.id}`, q.label)) showToast(t("QR code téléchargé", "QR code downloaded"));
                  }}
                />
              ))}
            </div>
          ) : (
            <Panel padded={false}>
              <Table>
                <thead>
                  <tr>
                    <Th className="w-10" />
                    <Th>{t("Emplacement", "Location")}</Th>
                    <Th>{t("Statut", "Status")}</Th>
                    <Th align="right">{t("Scans", "Scans")}</Th>
                    <Th align="right">{t("Réservations", "Reservations")}</Th>
                    <Th align="right">{t("Conversion", "Conversion")}</Th>
                    <Th align="right">{t("Commissions", "Commissions")}</Th>
                    <Th>{t("Dernière", "Latest")}</Th>
                    <Th align="right" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <Tr key={q.id}>
                      <Td>
                        <button type="button" onClick={() => toggleSelect(q.id)} aria-label={t("Sélectionner", "Select")} className="text-ink-3 hover:text-ink">
                          {selected.has(q.id) ? <CheckSquare size={16} strokeWidth={1.75} /> : <Square size={16} strokeWidth={1.75} />}
                        </button>
                      </Td>
                      <Td>
                        <Link href={`/hotel/chambres/${q.id}`} className="font-bold text-ink hover:underline">
                          {q.label}
                        </Link>
                        <p className="font-mono-satoshi text-xs text-ink-3">{q.code}</p>
                      </Td>
                      <Td><StatusPill status={q.active ? "actif" : "inactif"} /></Td>
                      <Td align="right" className="num">{formatNumber(q.scans, locale)}</Td>
                      <Td align="right" className="num">{formatNumber(q.liveReservations, locale)}</Td>
                      <Td align="right" className="num" muted>{q.scans > 0 ? formatPercent(q.conversion, 1, locale) : "—"}</Td>
                      <Td align="right" className="num font-bold text-warn">{q.commission > 0 ? formatMad(q.commission, false, locale) : "—"}</Td>
                      <Td muted className="whitespace-nowrap text-xs">{q.lastReservation ? timeAgo(q.lastReservation, undefined, locale) : "—"}</Td>
                      <Td align="right">
                        <div className="inline-flex items-center gap-0.5">
                          <IconButton icon={Copy} label={t("Copier le lien", "Copy link")} onClick={() => copyLink(q)} className="h-8 w-8" size={14} />
                          <IconButton icon={Power} label={q.active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")} onClick={() => toggleActive(q)} className="h-8 w-8" size={14} />
                          <Link href={`/hotel/chambres/${q.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-fill-2 hover:text-ink" aria-label={t("Ouvrir", "Open")}>
                            <MoreHorizontal size={14} strokeWidth={1.75} />
                          </Link>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              {/* Les QR de la vue liste doivent exister dans le DOM pour l'export. */}
              <div className="hidden">
                {filtered.map((q) => (
                  <div key={q.id} id={`qr-${q.id}`}>
                    <QRCode value={guestUrl(q.code, hotelName, hotelCity)} size={128} />
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}

      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        existing={qrCodes.map((q) => q.label)}
        onCreate={async (labels) => {
          const created = labels.length === 1 ? await create(labels[0]).then((r) => (r ? [r] : null)) : await createMany(labels);
          if (!created) {
            showToast(t("Échec de la création", "Creation failed"));
            return false;
          }
          showToast(
            created.length === 1
              ? t(`« ${created[0].label} » créé`, `“${created[0].label}” created`)
              : t(`${created.length} QR codes créés`, `${created.length} QR codes created`)
          );
          return true;
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={busy}
        danger
        confirmLabel={t("Supprimer définitivement", "Delete permanently")}
        title={
          toDelete && toDelete.length > 1
            ? t(`Supprimer ${toDelete.length} QR codes ?`, `Delete ${toDelete.length} QR codes?`)
            : t("Supprimer ce QR code ?", "Delete this QR code?")
        }
        description={t(
          "Le QR imprimé ne fonctionnera plus et l'historique de ses réservations sera supprimé. Pour une pause temporaire, préférez la désactivation.",
          "The printed QR will stop working and its reservation history will be deleted. For a temporary pause, deactivate it instead."
        )}
      />

      <Toast message={toast} />
    </>
  );
}

/* ─── Carte d'un QR ─────────────────────────────────────────────────────────── */

function QrCard({
  q,
  link,
  selected,
  onSelect,
  onToggle,
  onDelete,
  onCopy,
  onDownload,
}: {
  q: QrPerformance;
  link: string;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const room = isRoomLabel(q.label);
  return (
    <div
      className={cn(
        "hotel-panel group relative flex flex-col p-4 transition-all",
        selected && "ring-2 ring-info/25",
        !q.active && "opacity-60"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-label={selected ? t("Désélectionner", "Deselect") : t("Sélectionner", "Select")}
          className={cn(
            "mt-0.5 shrink-0 text-ink-3 transition-opacity hover:text-ink",
            selected ? "opacity-100 text-info" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        >
          {selected ? <CheckSquare size={16} strokeWidth={1.75} /> : <Square size={16} strokeWidth={1.75} />}
        </button>
        <div className="min-w-0 flex-1">
          <Link href={`/hotel/chambres/${q.id}`} className="flex items-center gap-1.5">
            {room ? (
              <BedDouble size={14} strokeWidth={1.75} className="shrink-0 text-ink-3" />
            ) : (
              <MapPin size={14} strokeWidth={1.75} className="shrink-0 text-ink-3" />
            )}
            <span className="truncate text-sm font-bold text-ink group-hover:underline">{q.label}</span>
          </Link>
          <p className="font-mono-satoshi mt-0.5 text-xs text-ink-3">{t("Code", "Code")} {q.code}</p>
        </div>
        <StatusPill status={q.active ? "actif" : "inactif"} />
      </div>

      <Link
        href={`/hotel/chambres/${q.id}`}
        id={`qr-${q.id}`}
        className="flex items-center justify-center rounded-xl bg-white p-4"
        aria-label={t(`Ouvrir ${q.label}`, `Open ${q.label}`)}
      >
        <QRCode value={link} size={132} />
      </Link>

      <dl className="num mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { l: t("Scans", "Scans"), v: formatNumber(q.scans, locale) },
          { l: t("Résas", "Bookings"), v: formatNumber(q.liveReservations, locale) },
          { l: t("Conv.", "Conv."), v: q.scans > 0 ? formatPercent(q.conversion, 0, locale) : "—" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg bg-fill py-1.5">
            <dt className="text-xs font-medium text-ink-3">{s.l}</dt>
            <dd className="text-sm font-black text-ink">{s.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center gap-1">
        <LinkButton href={`/hotel/chambres/${q.id}`} size="sm" variant="secondary" className="flex-1">
          {t(<>Menu &amp; suivi</>, <>Menu &amp; tracking</>)}
        </LinkButton>
        <IconButton icon={Copy} label={t("Copier le lien", "Copy link")} onClick={onCopy} className="h-8 w-8" size={14} />
        <IconButton icon={Download} label={t("Télécharger le SVG", "Download SVG")} onClick={onDownload} className="h-8 w-8" size={14} />
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("Ouvrir le menu client", "Open the guest menu")}
          title={t("Ouvrir le menu client", "Open the guest menu")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-fill-2 hover:text-ink"
        >
          <ExternalLink size={14} strokeWidth={1.75} />
        </a>
        <IconButton icon={Power} label={q.active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")} onClick={onToggle} className="h-8 w-8" size={14} />
        <IconButton icon={Trash2} label={t("Supprimer", "Delete")} onClick={onDelete} tone="danger" className="h-8 w-8" size={14} />
      </div>
    </div>
  );
}

/* ─── Création ──────────────────────────────────────────────────────────────── */

function CreateDialog({
  open,
  onClose,
  existing,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  existing: string[];
  onCreate: (labels: string[]) => Promise<boolean>;
}) {
  const t = useT();
  const [mode, setMode] = useState<CreateMode>("un");
  const [label, setLabel] = useState("");
  const [bulk, setBulk] = useState("");
  const [prefix, setPrefix] = useState(() => t("Chambre", "Room"));
  const [from, setFrom] = useState("101");
  const [to, setTo] = useState("110");
  const [saving, setSaving] = useState(false);

  const existingSet = useMemo(() => new Set(existing.map((l) => l.trim().toLowerCase())), [existing]);

  const labels = useMemo(() => {
    const raw =
      mode === "un"
        ? [label]
        : mode === "plusieurs"
          ? bulk.split(/\n|,|;/)
          : expandSeries(prefix, from, to);
    return [...new Set(raw.map((l) => l.trim()).filter(Boolean))];
  }, [mode, label, bulk, prefix, from, to]);
  const duplicates = labels.filter((l) => existingSet.has(l.toLowerCase()));
  const fresh = labels.filter((l) => !existingSet.has(l.toLowerCase()));

  const submit = async () => {
    if (fresh.length === 0) return;
    setSaving(true);
    const ok = await onCreate(fresh);
    setSaving(false);
    if (ok) {
      setLabel("");
      setBulk("");
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Nouveau QR code", "New QR code")}
      description={t(
        "Un QR par chambre ou par espace. Le menu proposé se règle ensuite, emplacement par emplacement.",
        "One QR per room or area. You can then set the menu offered, location by location."
      )}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button variant="primary" icon={Plus} onClick={submit} loading={saving} disabled={fresh.length === 0}>
            {fresh.length > 1
              ? t(`Créer ${fresh.length} QR codes`, `Create ${fresh.length} QR codes`)
              : t("Créer le QR code", "Create QR code")}
          </Button>
        </>
      }
    >
      <Segmented<CreateMode>
        value={mode}
        onChange={setMode}
        className="mb-5"
        options={[
          { value: "un", label: t("Un seul", "Single") },
          { value: "plusieurs", label: t("Plusieurs", "Several") },
          { value: "serie", label: t("Série numérotée", "Numbered series") },
        ]}
      />

      {mode === "un" && (
        <div className="space-y-4">
          <Field label={t("Nom de l'emplacement", "Location name")} htmlFor="qr-label">
            <input
              id="qr-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("Chambre 204, Suite Atlas, Lobby…", "Room 204, Atlas Suite, Lobby…")}
              autoFocus
              maxLength={60}
              className={inputClass}
            />
          </Field>
          <div>
            <p className="mb-2 text-xs font-bold text-ink-3">{t("Suggestions", "Suggestions")}</p>
            <div className="flex flex-wrap gap-2">
              {getSuggested(t).filter((s) => !existingSet.has(s.toLowerCase())).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLabel(s)}
                  className="rounded-full border border-line bg-fill px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-fill-2 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "plusieurs" && (
        <Field
          label={t("Un emplacement par ligne", "One location per line")}
          hint={t(
            "Vous pouvez aussi séparer par des virgules. Les doublons sont ignorés.",
            "You can also separate them with commas. Duplicates are ignored."
          )}
          htmlFor="qr-bulk"
        >
          <textarea
            id="qr-bulk"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={t("Lobby\nSpa\nPiscine\nChambre 101", "Lobby\nSpa\nPool\nRoom 101")}
            rows={6}
            autoFocus
            className={cn(inputClass, "resize-none font-medium")}
          />
        </Field>
      )}

      {mode === "serie" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t("Préfixe", "Prefix")} className="col-span-2" htmlFor="qr-prefix">
            <input id="qr-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={inputClass} maxLength={40} />
          </Field>
          <Field label={t("De", "From")} htmlFor="qr-from">
            <input id="qr-from" value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(inputClass, "num")} />
          </Field>
          <Field label={t("À", "To")} htmlFor="qr-to">
            <input id="qr-to" value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(inputClass, "num")} />
          </Field>
          <p className="col-span-full text-xs text-ink-3">
            {labels.length > 0
              ? t(
                  `${labels.length} emplacements : ${labels[0]}${labels.length > 1 ? ` → ${labels[labels.length - 1]}` : ""}`,
                  `${labels.length} ${labels.length === 1 ? "location" : "locations"}: ${labels[0]}${labels.length > 1 ? ` → ${labels[labels.length - 1]}` : ""}`
                )
              : t(
                  "Indiquez un intervalle valide (200 chambres maximum par série).",
                  "Enter a valid range (200 rooms maximum per series)."
                )}
          </p>
        </div>
      )}

      {duplicates.length > 0 && (
        <p className="mt-4 rounded-xl border border-warn/25 bg-warn-soft px-3 py-2 text-xs text-ink-2">
          {t(
            `Déjà existant${duplicates.length > 1 ? "s" : ""}, ignoré${duplicates.length > 1 ? "s" : ""} : `,
            "Already exist, skipped: "
          )}
          {duplicates.slice(0, 5).join(", ")}
          {duplicates.length > 5 ? "…" : ""}
        </p>
      )}
    </Modal>
  );
}
