"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  Info,
  MapPin,
  Music,
  Palmtree,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCatalog, useHotelOffers, useHotelSpace, type HotelOffer } from "@/lib/hotel/store";
import {
  CATEGORY_KEYS,
  categoryLabel,
  cityCatalog,
  fallbackImage,
  type GuestCategoryKey,
} from "@/lib/guest-catalog";
import { plural } from "@/lib/hotel/format";
import { useLocale, useT } from "@/lib/i18n/client";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  InfoNote,
  KpiGrid,
  PageHeader,
  PageSkeleton,
  SearchInput,
  Segmented,
  useNotify,
} from "@/components/app/ui";
import { EMPTY_DRAFT, OfferEditor, type OfferDraft } from "@/components/hotel/offer-editor";
import { OfferTile, TileBadge } from "@/components/hotel/offer-tile";

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
  images: o.images ?? [],
  active: o.active,
  city: "",
  slug: o.slug,
});

export default function HotelAddressesPage() {
  const { isLoading: authLoading, userId, city: authCity } = useAuthUser();
  const { catalog, profile, saveProfile, isLoading, reload } = useHotelSpace();
  const { offers, create, update, remove, failed: offersFailed } = useHotelOffers();
  const { failed: catalogFailed } = useCatalog();
  const notify = useNotify();
  const [filter, setFilter] = useState<Filter>("toutes");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ offer: HotelOffer | null } | null>(null);
  const [toDelete, setToDelete] = useState<HotelOffer | null>(null);
  const [saving, setSaving] = useState(false);
  const t = useT();
  const locale = useLocale();
  const catLabel = (k: GuestCategoryKey) => categoryLabel(k, locale);

  const hotelCity = profile.city || authCity || null;
  /* Catalogue réseau seul : les adresses maison ont leur propre section et
     leur propre interrupteur (active). */
  const network = useMemo(() => cityCatalog(hotelCity, catalog, [], locale), [hotelCity, catalog, locale]);

  if (authLoading || isLoading) return <PageSkeleton kpis={3} rows={6} />;

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
    if (ok) notify(message);
    else notify(t("Impossible d'enregistrer. Réessayez dans un instant.", "Couldn't save. Please try again in a moment."), "error");
  };

  const toggleNetwork = (id: string, name: string) => {
    const next = new Set(hidden);
    const wasHidden = next.has(id);
    if (wasHidden) next.delete(id);
    else next.add(id);
    void setHidden(
      next,
      wasHidden
        ? t(`« ${name} » proposée à vos clients`, `“${name}” now offered to your guests`)
        : t(`« ${name} » retirée de votre menu`, `“${name}” removed from your menu`)
    );
  };

  const setCategory = (ids: string[], propose: boolean, label: string) => {
    const next = new Set(hidden);
    for (const id of ids) {
      if (propose) next.delete(id);
      else next.add(id);
    }
    void setHidden(next, propose ? t(`${label} : tout proposé`, `${label}: all offered`) : t(`${label} : tout retiré`, `${label}: all removed`));
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
      images: draft.images,
      active: draft.active,
    };
    const ok = editing?.offer ? await update(editing.offer.id, input) : (await create(input)) !== null;
    setSaving(false);
    if (!ok) return t("Impossible d'enregistrer. Réessayez dans un instant.", "Couldn't save. Please try again in a moment.");
    setEditing(null);
    notify(
      editing?.offer
        ? t("Adresse mise à jour", "Place updated")
        : t("Adresse ajoutée, proposée dès le prochain scan", "Place added, offered from the next scan")
    );
    return null;
  };

  const toggleMine = async (o: HotelOffer) => {
    const ok = await update(o.id, { active: !o.active });
    if (!ok) return notify(t("Échec de la mise à jour", "Update failed"), "error");
    notify(o.active ? t(`« ${o.name} » masquée`, `“${o.name}” hidden`) : t(`« ${o.name} » proposée`, `“${o.name}” offered`));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const ok = await remove(toDelete.id);
    setToDelete(null);
    if (ok) notify(t("Adresse supprimée", "Place deleted"));
    else notify(t("Échec de la suppression", "Delete failed"), "error");
  };

  return (
    <>
      <PageHeader
        title={t("Mes adresses", "My places")}
        description={t(
          "Choisissez ce que vos clients voient après un scan : les adresses du réseau twocards de votre ville, que vous proposez ou retirez d'un geste, et vos adresses maison, que vous créez vous-même. Les deux se cumulent.",
          "Choose what your guests see after a scan: places from the twocards network in your city, which you offer or remove in one tap, and your own in-house places, which you create yourself. The two add up."
        )}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
            {t("Ajouter une adresse maison", "Add an in-house place")}
          </Button>
        }
      />

      <KpiGrid
        columns={3}
        items={[
          { label: t("Catalogue réseau", "Network catalogue"), value: `${networkShown}/${networkTotal}`, hint: hotelCity ? t(`adresses proposées à ${hotelCity}`, `places offered in ${hotelCity}`) : t("renseignez votre ville", "add your city"), icon: BookOpen, tone: "violet" },
          { label: t("Adresses maison", "In-house places"), value: offers.length, hint: t(`${active} ${plural(active, "proposée")}`, `${active} offered`), icon: MapPin, tone: "sky" },
          { label: t("Menu client", "Guest menu"), value: networkShown + active, hint: t("adresses visibles au scan", "places visible on scan"), icon: Eye, tone: "emerald" },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          label={t("Catégorie", "Category")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "toutes", label: t("Toutes", "All") },
            ...CATEGORY_KEYS.map((k) => ({ value: k, label: catLabel(k) })),
          ]}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("Rechercher une adresse…", "Search for a place…")}
          className="w-full lg:w-64"
        />
      </div>

      {/* ─── Catalogue réseau ──────────────────────────────────────────────── */}
      <Card
        title={t("Catalogue twocards", "twocards catalogue")}
        description={
          hotelCity ? (
            t(
              <>Les adresses du réseau à {hotelCity}. Retirez celles que vous ne souhaitez pas proposer : le retrait vaut pour tous vos QR codes. Pour une exception chambre par chambre, passez par la fiche du QR.</>,
              <>Network places in {hotelCity}. Remove any you&apos;d rather not offer: removal applies to all your QR codes. For a room-by-room exception, use the QR code&apos;s page.</>
            )
          ) : (
            t(
              <>Indiquez la ville de l&apos;hôtel dans les <Link href="/hotel/settings" className="font-bold text-link underline">paramètres</Link> pour limiter le catalogue à votre ville. En attendant, tout le réseau est proposé.</>,
              <>Add the hotel&apos;s city in <Link href="/hotel/settings" className="font-bold text-link underline">settings</Link> to limit the catalogue to your city. Until then, the whole network is offered.</>
            )
          )
        }
      >
        {catalogFailed && networkTotal === 0 ? (
          <ErrorState compact onRetry={reload} />
        ) : networkVisible.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">
            {networkTotal === 0
              ? t("Aucune adresse du réseau pour votre ville pour le moment.", "No network places in your city yet.")
              : t("Aucune adresse ne correspond.", "No places match.")}
          </p>
        ) : (
          <div className="space-y-6">
            {networkVisible.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key];
              const ids = cat.offers.map((o) => o.id);
              const shown = ids.filter((id) => !hidden.has(id)).length;
              return (
                <section key={cat.key}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fill-2">
                        <Icon size={15} strokeWidth={1.75} className="text-ink-2" aria-hidden />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-ink">{catLabel(cat.key)}</h3>
                        <p className="num text-xs text-ink-3">{shown}/{ids.length} {t(`proposée${shown > 1 ? "s" : ""}`, "offered")}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setCategory(ids, shown !== ids.length, catLabel(cat.key))}>
                      {shown === ids.length ? t("Tout retirer", "Remove all") : t("Tout proposer", "Offer all")}
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {cat.offers.map((o) => (
                      <OfferTile
                        key={o.id}
                        image={o.image}
                        name={o.name}
                        price={o.price}
                        active={!hidden.has(o.id)}
                        onToggle={() => toggleNetwork(o.id, o.name)}
                        toggleLabel={t(`Proposer ${o.name}`, `Offer ${o.name}`)}
                        badges={<TileBadge tone="muted">{t("Réseau twocards", "twocards network")}</TileBadge>}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Card>

      {/* ─── Adresses maison ───────────────────────────────────────────────── */}
      <Card
        title={t("Vos adresses maison", "Your in-house places")}
        description={t(
          "Votre restaurant, votre spa, votre chauffeur, un partenaire de confiance : en tête de leur catégorie sur vos QR codes, et nulle part ailleurs. Les demandes vous arrivent directement, sans commission.",
          "Your restaurant, your spa, your driver, a trusted partner: top of their category on your QR codes, and nowhere else. Requests come straight to you, commission-free."
        )}
        actions={
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
            {t("Ajouter", "Add")}
          </Button>
        }
        padded={offers.length > 0}
      >
        {offersFailed && offers.length === 0 ? (
          <ErrorState compact onRetry={reload} />
        ) : offers.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t("Aucune adresse maison pour le moment", "No in-house places yet")}
            description={t(
              "Ajoutez ce qui vous est propre : votre restaurant, votre spa, un chauffeur, un guide que vous recommandez. Photo, description, prix indicatif, et c'est en ligne.",
              "Add what's yours: your restaurant, your spa, a driver, a guide you recommend. Photo, description, indicative price, and it's live."
            )}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
                {t("Ajouter ma première adresse", "Add my first place")}
              </Button>
            }
            compact
          />
        ) : mine.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">{t("Aucune adresse maison ne correspond.", "No in-house places match.")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {mine.map((o) => (
              <OfferTile
                key={o.id}
                image={o.image_url || fallbackImage(o.slug)}
                name={o.name}
                price={o.price}
                active={o.active}
                onToggle={() => toggleMine(o)}
                toggleLabel={t(`Proposer ${o.name}`, `Offer ${o.name}`)}
                badges={
                  <>
                    <TileBadge tone="accent">{t("Maison", "In-house")}</TileBadge>
                    <TileBadge>{catLabel(o.category)}</TileBadge>
                  </>
                }
                actions={
                  <>
                    <IconButton icon={Pencil} label={t(`Modifier ${o.name}`, `Edit ${o.name}`)} size={16} onClick={() => setEditing({ offer: o })} />
                    <IconButton icon={Trash2} label={t(`Supprimer ${o.name}`, `Delete ${o.name}`)} size={16} tone="danger" onClick={() => setToDelete(o)} />
                  </>
                }
              />
            ))}
          </div>
        )}
      </Card>

      <InfoNote icon={Info} tone="sky">
        {t(
          <>
            Les réglages de cette page valent pour tous vos QR codes. Pour proposer une adresse à certaines chambres seulement, ouvrez la chambre dans{" "}
            <Link href="/hotel/chambres" className="font-bold text-link underline">
              Chambres &amp; QR
            </Link>{" "}
            et réglez son menu.
          </>,
          <>
            Settings on this page apply to all your QR codes. To offer a place to certain rooms only, open the room in{" "}
            <Link href="/hotel/chambres" className="font-bold text-link underline">
              Rooms &amp; QR
            </Link>{" "}
            and adjust its menu.
          </>
        )}
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
          title={editing.offer ? t(`Modifier « ${editing.offer.name} »`, `Edit “${editing.offer.name}”`) : t("Nouvelle adresse maison", "New in-house place")}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        danger
        confirmLabel={t("Supprimer", "Delete")}
        title={toDelete ? t(`Supprimer « ${toDelete.name} » ?`, `Delete “${toDelete.name}”?`) : ""}
        description={t(
          "L'adresse disparaît de vos QR codes. Les réservations déjà passées dessus restent dans votre historique. Pour une pause, préférez « Masquer ».",
          "The place disappears from your QR codes. Reservations already made through it stay in your history. For a break, use “Hide” instead."
        )}
      />

    </>
  );
}
