"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  EyeOff,
  Info,
  MapPin,
  Music,
  Palmtree,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { useHotelOffers, useHotelSpace, type HotelOffer } from "@/lib/hotel/store";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  cityCatalog,
  fallbackImage,
  type GuestCategoryKey,
} from "@/lib/guest-catalog";
import { plural } from "@/lib/hotel/format";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  InfoNote,
  KpiGrid,
  PageHeader,
  Panel,
  Segmented,
  Switch,
  Tag,
  Toast,
  inputClass,
} from "@/components/hotel/ui";
import { EMPTY_DRAFT, OfferEditor, type OfferDraft } from "@/components/hotel/offer-editor";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { cn } from "@/lib/utils";

/* Le menu de l'hôtel, en deux temps. D'abord le catalogue du réseau twocards
   pour sa ville : chaque adresse se propose ou se retire pour tout l'hôtel
   (les réglages chambre par chambre restent possibles depuis la fiche du
   QR). Puis les adresses maison, que l'hôtel crée lui-même. */

const CATEGORY_ICONS = {
  restaurants: UtensilsCrossed,
  activites: Palmtree,
  clubs: Music,
  services: Sparkles,
} as const;

type Filter = "toutes" | GuestCategoryKey;

const toDraft = (o: HotelOffer): OfferDraft => ({
  category: o.category,
  name: o.name,
  tag: o.tag,
  description: o.description,
  price: o.price ?? "",
  image_url: o.image_url,
  active: o.active,
  city: "",
  slug: o.slug,
});

export default function HotelAddressesPage() {
  const { isLoading: authLoading, userId, city: authCity } = useAuthUser();
  const { catalog, profile, saveProfile, isLoading } = useHotelSpace();
  const { offers, create, update, remove } = useHotelOffers();
  const { toast, showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("toutes");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ offer: HotelOffer | null } | null>(null);
  const [toDelete, setToDelete] = useState<HotelOffer | null>(null);
  const [saving, setSaving] = useState(false);

  const hotelCity = profile.city || authCity || null;
  /* Catalogue réseau seul : les adresses maison ont leur propre section et
     leur propre interrupteur (active). */
  const network = useMemo(() => cityCatalog(hotelCity, catalog, []), [hotelCity, catalog]);

  if (authLoading || isLoading) return <PageSkeleton kpis={3} table />;

  const hidden = new Set(profile.hidden_offers);
  const networkTotal = network.reduce((s, c) => s + c.offers.length, 0);
  const networkShown = network.reduce((s, c) => s + c.offers.filter((o) => !hidden.has(o.id)).length, 0);
  const active = offers.filter((o) => o.active).length;
  const q = search.trim().toLowerCase();
  const networkVisible = network
    .filter((c) => filter === "toutes" || c.key === filter)
    .map((c) => ({
      ...c,
      offers: q ? c.offers.filter((o) => o.name.toLowerCase().includes(q) || o.tag.toLowerCase().includes(q)) : c.offers,
    }))
    .filter((c) => c.offers.length > 0);
  const mine = offers.filter((o) => (filter === "toutes" || o.category === filter) && (!q || o.name.toLowerCase().includes(q)));

  const setHidden = async (next: Set<string>, message: string) => {
    const ok = await saveProfile({ hidden_offers: [...next] });
    showToast(ok ? message : "Impossible d'enregistrer. Réessayez dans un instant.");
  };

  const toggleNetwork = (id: string, name: string) => {
    const next = new Set(hidden);
    const wasHidden = next.has(id);
    if (wasHidden) next.delete(id);
    else next.add(id);
    void setHidden(next, wasHidden ? `« ${name} » proposée à vos clients` : `« ${name} » retirée de votre menu`);
  };

  const setCategory = (ids: string[], propose: boolean, label: string) => {
    const next = new Set(hidden);
    for (const id of ids) {
      if (propose) next.delete(id);
      else next.add(id);
    }
    void setHidden(next, propose ? `${label} : tout proposé` : `${label} : tout retiré`);
  };

  const save = async (draft: OfferDraft) => {
    setSaving(true);
    const input = {
      category: draft.category,
      name: draft.name,
      tag: draft.tag,
      description: draft.description,
      price: draft.price || null,
      image_url: draft.image_url,
      active: draft.active,
    };
    const ok = editing?.offer ? await update(editing.offer.id, input) : (await create(input)) !== null;
    setSaving(false);
    if (!ok) return "Impossible d'enregistrer. Réessayez dans un instant.";
    setEditing(null);
    showToast(editing?.offer ? "Adresse mise à jour" : "Adresse ajoutée, proposée dès le prochain scan");
    return null;
  };

  const toggleMine = async (o: HotelOffer) => {
    const ok = await update(o.id, { active: !o.active });
    showToast(ok ? (o.active ? `« ${o.name} » masquée` : `« ${o.name} » proposée`) : "Échec de la mise à jour");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const ok = await remove(toDelete.id);
    setToDelete(null);
    showToast(ok ? "Adresse supprimée" : "Échec de la suppression");
  };

  return (
    <>
      <PageHeader
        eyebrow="Mes adresses"
        title="Le menu de votre hôtel"
        description="Choisissez ce que vos clients voient après un scan : les adresses du réseau twocards de votre ville, que vous proposez ou retirez d'un geste, et vos adresses maison, que vous créez vous-même. Les deux se cumulent."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
            Ajouter une adresse maison
          </Button>
        }
      />

      <KpiGrid
        columns={3}
        items={[
          { label: "Catalogue réseau", value: `${networkShown}/${networkTotal}`, hint: hotelCity ? `adresses proposées à ${hotelCity}` : "renseignez votre ville", icon: BookOpen, tone: "violet" },
          { label: "Adresses maison", value: offers.length, hint: `${active} ${plural(active, "proposée")}`, icon: MapPin, tone: "sky" },
          { label: "Menu client", value: networkShown + active, hint: "adresses visibles au scan", icon: Eye, tone: "emerald" },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "toutes", label: "Toutes" },
            ...CATEGORY_KEYS.map((k) => ({ value: k, label: CATEGORY_LABELS[k] })),
          ]}
        />
        <div className="relative w-full lg:w-64">
          <Search size={14} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une adresse…" className={cn(inputClass, "h-10 py-0 pl-9")} />
        </div>
      </div>

      {/* ─── Catalogue réseau ──────────────────────────────────────────────── */}
      <Panel
        title="Catalogue twocards"
        description={
          hotelCity ? (
            <>Les adresses du réseau à {hotelCity}. Retirez celles que vous ne souhaitez pas proposer : le retrait vaut pour tous vos QR codes. Pour une exception chambre par chambre, passez par la fiche du QR.</>
          ) : (
            <>Indiquez la ville de l&apos;hôtel dans les <Link href="/hotel/settings" className="font-bold text-sky-300">paramètres</Link> pour limiter le catalogue à votre ville. En attendant, tout le réseau est proposé.</>
          )
        }
      >
        {networkVisible.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            {networkTotal === 0 ? "Aucune adresse du réseau pour votre ville pour le moment." : "Aucune adresse ne correspond."}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {networkVisible.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key];
              const ids = cat.offers.map((o) => o.id);
              const shown = ids.filter((id) => !hidden.has(id)).length;
              return (
                <div key={cat.key} className="rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                        <Icon size={15} strokeWidth={1.75} className="text-white/85" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">{cat.label}</p>
                        <p className="num text-[11px] text-white/45">{shown}/{ids.length} proposée{shown > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setCategory(ids, shown !== ids.length, cat.label)} className="text-[11px] font-bold text-sky-300 hover:text-sky-200">
                      {shown === ids.length ? "Tout retirer" : "Tout proposer"}
                    </button>
                  </div>
                  <ul className="divide-y divide-white/[0.05] px-1.5 py-1">
                    {cat.offers.map((o) => {
                      const on = !hidden.has(o.id);
                      return (
                        <li key={o.id} className={cn("flex items-center gap-3 rounded-lg px-2 py-2 transition-opacity", !on && "opacity-50")}>
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-white/5">
                            <Image src={o.image} alt="" fill unoptimized={o.image.startsWith("http")} sizes="56px" className="object-cover" />
                          </div>
                          <button type="button" onClick={() => toggleNetwork(o.id, o.name)} className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-[13px] font-medium text-white">{o.name}</span>
                            <span className="block truncate text-[11px] text-white/45">
                              {o.tag}
                              {o.price ? ` · ${o.price}` : ""}
                            </span>
                          </button>
                          <Switch size="sm" checked={on} onChange={() => toggleNetwork(o.id, o.name)} label={`Proposer ${o.name}`} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ─── Adresses maison ───────────────────────────────────────────────── */}
      <Panel
        title="Vos adresses maison"
        description="Votre restaurant, votre spa, votre chauffeur, un partenaire de confiance : en tête de leur catégorie sur vos QR codes, et nulle part ailleurs. Les demandes vous arrivent directement, sans commission."
        actions={
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
            Ajouter
          </Button>
        }
        padded={offers.length > 0}
      >
        {offers.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Aucune adresse maison pour le moment"
            description="Ajoutez ce qui vous est propre : votre restaurant, votre spa, un chauffeur, un guide que vous recommandez. Photo, description, prix indicatif, et c'est en ligne."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
                Ajouter ma première adresse
              </Button>
            }
            compact
          />
        ) : mine.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">Aucune adresse maison ne correspond.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {mine.map((o) => {
              const img = o.image_url || fallbackImage(o.slug);
              return (
                <div key={o.id} className={cn("flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]", !o.active && "opacity-60")}>
                  <div className="relative h-32">
                    <Image src={img} alt="" fill unoptimized={img.startsWith("http")} sizes="400px" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <Tag className="bg-black/50 text-white backdrop-blur">{CATEGORY_LABELS[o.category]}</Tag>
                      {!o.active && <Tag className="bg-black/50 text-white/70 backdrop-blur">Masquée</Tag>}
                    </div>
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="font-display truncate text-base font-bold text-white">{o.name}</p>
                      <p className="truncate text-xs text-white/70">
                        {o.tag}
                        {o.price ? ` · ${o.price}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="line-clamp-2 px-4 pt-3 text-xs leading-relaxed text-white/55">{o.description || "Sans description."}</p>
                  <div className="mt-auto flex items-center gap-1 px-3 pb-3 pt-3">
                    <Switch size="sm" checked={o.active} onChange={() => toggleMine(o)} label={`Proposer ${o.name}`} />
                    <span className="mr-auto text-xs text-white/50">{o.active ? "Proposée" : "Masquée"}</span>
                    <IconButton icon={Pencil} label="Modifier" size={14} className="h-8 w-8" onClick={() => setEditing({ offer: o })} />
                    <IconButton icon={o.active ? EyeOff : Eye} label={o.active ? "Masquer" : "Proposer"} size={14} className="h-8 w-8" onClick={() => toggleMine(o)} />
                    <IconButton icon={Trash2} label="Supprimer" size={14} tone="danger" className="h-8 w-8" onClick={() => setToDelete(o)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <InfoNote icon={Info} tone="sky">
        Les réglages de cette page valent pour tous vos QR codes. Pour proposer une adresse à certaines chambres seulement, ouvrez la chambre dans{" "}
        <Link href="/hotel/chambres" className="font-bold text-sky-300">
          Chambres &amp; QR
        </Link>{" "}
        et réglez son menu.
      </InfoNote>

      {editing && (
        <OfferEditor
          open
          onClose={() => setEditing(null)}
          initial={editing.offer ? toDraft(editing.offer) : EMPTY_DRAFT}
          onSave={save}
          saving={saving}
          userId={userId}
          uploadPrefix="offer"
          title={editing.offer ? `Modifier « ${editing.offer.name} »` : "Nouvelle adresse maison"}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        confirmLabel="Supprimer"
        title={toDelete ? `Supprimer « ${toDelete.name} » ?` : ""}
        description="L'adresse disparaît de vos QR codes. Les réservations déjà passées dessus restent dans votre historique. Pour une pause, préférez « Masquer »."
      />

      <Toast message={toast} />
    </>
  );
}
