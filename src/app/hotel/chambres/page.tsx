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

type Filter = "tous" | "chambres" | "espaces" | "actifs" | "inactifs";
type Sort = "recent" | "label" | "scans" | "resas" | "conversion";
type View = "grille" | "liste";
type CreateMode = "un" | "plusieurs" | "serie";

const SUGGESTED = ["Lobby", "Réception", "Spa", "Piscine", "Rooftop", "Restaurant", "Bar", "Conciergerie"];

const sortRows = (rows: QrPerformance[], sort: Sort) =>
  [...rows].sort((a, b) => {
    switch (sort) {
      case "label":
        return a.label.localeCompare(b.label, "fr", { numeric: true });
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
      sort
    );
  }, [rows, search, filter, sort]);

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
    showToast(ok ? `« ${q.label} » ${q.active ? "désactivé" : "activé"}` : "Échec de la mise à jour");
  };

  const bulkActive = async (active: boolean) => {
    setBusy(true);
    const ok = await updateMany([...selected], { active });
    setBusy(false);
    showToast(ok ? `${selected.size} QR ${active ? "activés" : "désactivés"}` : "Échec de la mise à jour");
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
      showToast(toDelete.length > 1 ? `${toDelete.length} QR supprimés` : "QR code supprimé");
    } else {
      showToast("Échec de la suppression");
    }
  };

  const copyLink = async (q: HotelQrCode) => {
    try {
      await navigator.clipboard.writeText(guestUrl(q.code, hotelName, hotelCity));
      showToast("Lien copié");
    } catch {
      showToast("Impossible de copier le lien");
    }
  };

  const printHref =
    selected.size > 0 ? `/hotel/chambres/imprimer?ids=${[...selected].join(",")}` : "/hotel/chambres/imprimer";

  return (
    <>
      <PageHeader
        eyebrow="Chambres & QR codes"
        title="Vos emplacements"
        description="Un QR code par chambre, suite ou espace commun. Chaque scan ouvre le menu de sorties que vous avez choisi, et chaque réservation est rattachée à son emplacement."
        actions={
          <>
            <LinkButton href={printHref} icon={Printer} variant="secondary">
              Imprimer{selected.size > 0 ? ` (${selected.size})` : ""}
            </LinkButton>
            <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
              Nouveau QR code
            </Button>
          </>
        }
      />

      <KpiGrid
        items={[
          { label: "QR codes", value: formatNumber(qrCodes.length), hint: `${activeCount} ${plural(activeCount, "actif")}`, icon: QrCode, tone: "sky" },
          { label: "Chambres", value: formatNumber(rooms), hint: `${qrCodes.length - rooms} ${plural(qrCodes.length - rooms, "espace commun", "espaces communs")}`, icon: BedDouble, tone: "violet" },
          { label: "Scans", value: formatNumber(totalScans), hint: "cumulés, tous emplacements", icon: ScanLine, tone: "emerald" },
          { label: "Réservations", value: formatNumber(totalResas), hint: totalScans > 0 ? `${formatPercent(totalResas / totalScans, 1)} de conversion` : "en attente de scans", icon: Check, tone: "amber" },
        ]}
      />

      {qrCodes.length === 0 ? (
        <Panel solid>
          <EmptyState
            icon={QrCode}
            title="Aucun QR code pour le moment"
            description="Créez un QR code par chambre ou par zone de l'hôtel. Une fois imprimé, chaque scan ouvre le menu de sorties que vous avez choisi, et chaque réservation vous rapporte une commission."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
                Créer mon premier QR code
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
                { value: "tous", label: "Tous", count: counts.tous },
                { value: "chambres", label: "Chambres", count: counts.chambres },
                { value: "espaces", label: "Espaces communs", count: counts.espaces },
                { value: "actifs", label: "Actifs", count: counts.actifs },
                { value: "inactifs", label: "Inactifs", count: counts.inactifs },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Chambre, code…" className="w-full sm:w-56" />
              <Select<Sort>
                label="Trier"
                value={sort}
                onChange={setSort}
                className="w-44"
                options={[
                  { value: "recent", label: "Plus récents" },
                  { value: "label", label: "Nom (A → Z)" },
                  { value: "scans", label: "Plus scannés" },
                  { value: "resas", label: "Plus de réservations" },
                  { value: "conversion", label: "Meilleure conversion" },
                ]}
              />
              <div className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
                <IconButton
                  icon={LayoutGrid}
                  label="Vue grille"
                  onClick={() => setView2("grille")}
                  className={cn("h-8 w-8", view === "grille" && "bg-white text-black hover:bg-white hover:text-black")}
                />
                <IconButton
                  icon={List}
                  label="Vue liste"
                  onClick={() => setView2("liste")}
                  className={cn("h-8 w-8", view === "liste" && "bg-white text-black hover:bg-white hover:text-black")}
                />
              </div>
            </div>
          </div>

          {/* Sélection multiple */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-white/60 hover:text-white"
            >
              {selected.size > 0 && selected.size === filtered.length ? (
                <CheckSquare size={15} strokeWidth={1.75} />
              ) : (
                <Square size={15} strokeWidth={1.75} />
              )}
              {selected.size > 0 ? `${selected.size} sélectionné${selected.size > 1 ? "s" : ""}` : "Tout sélectionner"}
            </button>
            {selected.size > 0 && (
              <>
                <Button size="sm" icon={Power} onClick={() => bulkActive(true)} loading={busy}>
                  Activer
                </Button>
                <Button size="sm" icon={Power} onClick={() => bulkActive(false)} loading={busy}>
                  Désactiver
                </Button>
                <LinkButton size="sm" icon={Printer} href={printHref}>
                  Imprimer
                </LinkButton>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setToDelete([...selected])}>
                  Supprimer
                </Button>
                <Button size="sm" variant="ghost" icon={X} onClick={() => setSelected(new Set())}>
                  Annuler
                </Button>
              </>
            )}
          </div>

          {filtered.length === 0 ? (
            <Panel>
              <EmptyState
                icon={QrCode}
                title="Aucun emplacement ne correspond"
                description="Essayez un autre filtre ou une autre recherche."
                compact
                action={
                  <Button variant="ghost" onClick={() => { setSearch(""); setFilter("tous"); }}>
                    Réinitialiser
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
                    if (downloadSvg(`qr-${q.id}`, q.label)) showToast("QR code téléchargé");
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
                    <Th>Emplacement</Th>
                    <Th>Statut</Th>
                    <Th align="right">Scans</Th>
                    <Th align="right">Réservations</Th>
                    <Th align="right">Conversion</Th>
                    <Th align="right">Commissions</Th>
                    <Th>Dernière</Th>
                    <Th align="right" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <Tr key={q.id}>
                      <Td>
                        <button type="button" onClick={() => toggleSelect(q.id)} aria-label="Sélectionner" className="text-white/50 hover:text-white">
                          {selected.has(q.id) ? <CheckSquare size={16} strokeWidth={1.75} /> : <Square size={16} strokeWidth={1.75} />}
                        </button>
                      </Td>
                      <Td>
                        <Link href={`/hotel/chambres/${q.id}`} className="font-bold text-white hover:underline">
                          {q.label}
                        </Link>
                        <p className="font-mono-satoshi text-[11px] text-white/40">{q.code}</p>
                      </Td>
                      <Td><StatusPill status={q.active ? "actif" : "inactif"} /></Td>
                      <Td align="right" className="num">{formatNumber(q.scans)}</Td>
                      <Td align="right" className="num">{formatNumber(q.liveReservations)}</Td>
                      <Td align="right" className="num" muted>{q.scans > 0 ? formatPercent(q.conversion, 1) : "—"}</Td>
                      <Td align="right" className="num font-bold text-amber-300">{q.commission > 0 ? formatMad(q.commission) : "—"}</Td>
                      <Td muted className="whitespace-nowrap text-xs">{q.lastReservation ? timeAgo(q.lastReservation) : "—"}</Td>
                      <Td align="right">
                        <div className="inline-flex items-center gap-0.5">
                          <IconButton icon={Copy} label="Copier le lien" onClick={() => copyLink(q)} className="h-8 w-8" size={14} />
                          <IconButton icon={Power} label={q.active ? "Désactiver" : "Activer"} onClick={() => toggleActive(q)} className="h-8 w-8" size={14} />
                          <Link href={`/hotel/chambres/${q.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white" aria-label="Ouvrir">
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
            showToast("Échec de la création");
            return false;
          }
          showToast(created.length === 1 ? `« ${created[0].label} » créé` : `${created.length} QR codes créés`);
          return true;
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={busy}
        danger
        confirmLabel="Supprimer définitivement"
        title={toDelete && toDelete.length > 1 ? `Supprimer ${toDelete.length} QR codes ?` : "Supprimer ce QR code ?"}
        description="Le QR imprimé ne fonctionnera plus et l'historique de ses réservations sera supprimé. Pour une pause temporaire, préférez la désactivation."
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
  const room = isRoomLabel(q.label);
  return (
    <div
      className={cn(
        "hotel-panel group relative flex flex-col p-4 transition-all",
        selected && "ring-2 ring-sky-400/70",
        !q.active && "opacity-60"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-label={selected ? "Désélectionner" : "Sélectionner"}
          className={cn(
            "mt-0.5 shrink-0 text-white/40 transition-opacity hover:text-white",
            selected ? "opacity-100 text-sky-300" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        >
          {selected ? <CheckSquare size={16} strokeWidth={1.75} /> : <Square size={16} strokeWidth={1.75} />}
        </button>
        <div className="min-w-0 flex-1">
          <Link href={`/hotel/chambres/${q.id}`} className="flex items-center gap-1.5">
            {room ? (
              <BedDouble size={14} strokeWidth={1.75} className="shrink-0 text-white/45" />
            ) : (
              <MapPin size={14} strokeWidth={1.75} className="shrink-0 text-white/45" />
            )}
            <span className="truncate text-sm font-bold text-white group-hover:underline">{q.label}</span>
          </Link>
          <p className="font-mono-satoshi mt-0.5 text-[11px] text-white/40">Code {q.code}</p>
        </div>
        <StatusPill status={q.active ? "actif" : "inactif"} />
      </div>

      <Link
        href={`/hotel/chambres/${q.id}`}
        id={`qr-${q.id}`}
        className="flex items-center justify-center rounded-xl bg-white p-4"
        aria-label={`Ouvrir ${q.label}`}
      >
        <QRCode value={link} size={132} />
      </Link>

      <dl className="num mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { l: "Scans", v: formatNumber(q.scans) },
          { l: "Résas", v: formatNumber(q.liveReservations) },
          { l: "Conv.", v: q.scans > 0 ? formatPercent(q.conversion, 0) : "—" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg bg-white/[0.05] py-1.5">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-white/40">{s.l}</dt>
            <dd className="text-sm font-black text-white">{s.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center gap-1">
        <LinkButton href={`/hotel/chambres/${q.id}`} size="sm" variant="secondary" className="flex-1">
          Menu &amp; suivi
        </LinkButton>
        <IconButton icon={Copy} label="Copier le lien" onClick={onCopy} className="h-8 w-8" size={14} />
        <IconButton icon={Download} label="Télécharger le SVG" onClick={onDownload} className="h-8 w-8" size={14} />
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ouvrir le menu client"
          title="Ouvrir le menu client"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={14} strokeWidth={1.75} />
        </a>
        <IconButton icon={Power} label={q.active ? "Désactiver" : "Activer"} onClick={onToggle} className="h-8 w-8" size={14} />
        <IconButton icon={Trash2} label="Supprimer" onClick={onDelete} tone="danger" className="h-8 w-8" size={14} />
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
  const [mode, setMode] = useState<CreateMode>("un");
  const [label, setLabel] = useState("");
  const [bulk, setBulk] = useState("");
  const [prefix, setPrefix] = useState("Chambre");
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
      title="Nouveau QR code"
      description="Un QR par chambre ou par espace. Le menu proposé se règle ensuite, emplacement par emplacement."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" icon={Plus} onClick={submit} loading={saving} disabled={fresh.length === 0}>
            {fresh.length > 1 ? `Créer ${fresh.length} QR codes` : "Créer le QR code"}
          </Button>
        </>
      }
    >
      <Segmented<CreateMode>
        value={mode}
        onChange={setMode}
        className="mb-5"
        options={[
          { value: "un", label: "Un seul" },
          { value: "plusieurs", label: "Plusieurs" },
          { value: "serie", label: "Série numérotée" },
        ]}
      />

      {mode === "un" && (
        <div className="space-y-4">
          <Field label="Nom de l'emplacement" htmlFor="qr-label">
            <input
              id="qr-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Chambre 204, Suite Atlas, Lobby…"
              autoFocus
              maxLength={60}
              className={inputClass}
            />
          </Field>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.filter((s) => !existingSet.has(s.toLowerCase())).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLabel(s)}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "plusieurs" && (
        <Field label="Un emplacement par ligne" hint="Vous pouvez aussi séparer par des virgules. Les doublons sont ignorés." htmlFor="qr-bulk">
          <textarea
            id="qr-bulk"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={"Lobby\nSpa\nPiscine\nChambre 101"}
            rows={6}
            autoFocus
            className={cn(inputClass, "resize-none font-medium")}
          />
        </Field>
      )}

      {mode === "serie" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Préfixe" className="col-span-2" htmlFor="qr-prefix">
            <input id="qr-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} className={inputClass} maxLength={40} />
          </Field>
          <Field label="De" htmlFor="qr-from">
            <input id="qr-from" value={from} onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(inputClass, "num")} />
          </Field>
          <Field label="À" htmlFor="qr-to">
            <input id="qr-to" value={to} onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={cn(inputClass, "num")} />
          </Field>
          <p className="col-span-full text-xs text-white/50">
            {labels.length > 0
              ? `${labels.length} emplacements : ${labels[0]}${labels.length > 1 ? ` → ${labels[labels.length - 1]}` : ""}`
              : "Indiquez un intervalle valide (200 chambres maximum par série)."}
          </p>
        </div>
      )}

      {duplicates.length > 0 && (
        <p className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.07] px-3 py-2 text-xs text-white/65">
          Déjà existant{duplicates.length > 1 ? "s" : ""}, ignoré{duplicates.length > 1 ? "s" : ""} : {duplicates.slice(0, 5).join(", ")}
          {duplicates.length > 5 ? "…" : ""}
        </p>
      )}
    </Modal>
  );
}
