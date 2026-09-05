"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, MapPin, Pencil, Plus, Sparkles, Trash2, Info } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { useHotelSpace, type HotelOffer } from "@/lib/hotel/store";
import { CATEGORY_KEYS, CATEGORY_LABELS, fallbackImage, type GuestCategoryKey } from "@/lib/guest-catalog";
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
} from "@/components/hotel/ui";
import { EMPTY_DRAFT, OfferEditor, type OfferDraft } from "@/components/hotel/offer-editor";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { useHotelOffers } from "@/lib/hotel/store";
import { cn } from "@/lib/utils";

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
  const { isLoading: authLoading, userId } = useAuthUser();
  const { catalog, isLoading } = useHotelSpace();
  const { offers, create, update, remove } = useHotelOffers();
  const { toast, showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("toutes");
  const [editing, setEditing] = useState<{ offer: HotelOffer | null } | null>(null);
  const [toDelete, setToDelete] = useState<HotelOffer | null>(null);
  const [saving, setSaving] = useState(false);

  if (authLoading || isLoading) return <PageSkeleton kpis={3} table />;

  const active = offers.filter((o) => o.active).length;
  const shown = filter === "toutes" ? offers : offers.filter((o) => o.category === filter);
  const counts = (k: Filter) => (k === "toutes" ? offers.length : offers.filter((o) => o.category === k).length);

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

  const toggle = async (o: HotelOffer) => {
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
        title="Vos adresses maison"
        description="Votre restaurant, votre spa, votre chauffeur, un partenaire de confiance : les adresses que vous ajoutez ici s'affichent en tête de leur catégorie sur vos QR codes, et nulle part ailleurs. Les demandes vous arrivent directement."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
            Ajouter une adresse
          </Button>
        }
      />

      <KpiGrid
        columns={3}
        items={[
          { label: "Adresses maison", value: offers.length, hint: `${active} ${plural(active, "proposée")}`, icon: MapPin, tone: "sky" },
          { label: "Catalogue réseau", value: catalog.length, hint: "adresses twocards, toutes villes", icon: Sparkles, tone: "violet" },
          { label: "Catégories couvertes", value: new Set(offers.map((o) => o.category)).size, hint: "sur 4", icon: Eye, tone: "emerald" },
        ]}
      />

      {offers.length === 0 ? (
        <Panel solid>
          <EmptyState
            icon={MapPin}
            title="Aucune adresse maison pour le moment"
            description="Le catalogue twocards est déjà proposé à vos clients. Ajoutez ici ce qui vous est propre : votre restaurant, votre spa, un chauffeur, un guide que vous recommandez. Photo, description, prix indicatif, et c'est en ligne."
            action={
              <Button variant="primary" icon={Plus} onClick={() => setEditing({ offer: null })}>
                Ajouter ma première adresse
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "toutes", label: "Toutes", count: counts("toutes") },
              ...CATEGORY_KEYS.map((k) => ({ value: k, label: CATEGORY_LABELS[k], count: counts(k) })),
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((o) => {
              const img = o.image_url || fallbackImage(o.slug);
              return (
                <div key={o.id} className={cn("hotel-panel flex flex-col overflow-hidden", !o.active && "opacity-60")}>
                  <div className="relative h-36">
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
                    <Switch size="sm" checked={o.active} onChange={() => toggle(o)} label={`Proposer ${o.name}`} />
                    <span className="mr-auto text-xs text-white/50">{o.active ? "Proposée" : "Masquée"}</span>
                    <IconButton icon={Pencil} label="Modifier" size={14} className="h-8 w-8" onClick={() => setEditing({ offer: o })} />
                    <IconButton icon={o.active ? EyeOff : Eye} label={o.active ? "Masquer" : "Proposer"} size={14} className="h-8 w-8" onClick={() => toggle(o)} />
                    <IconButton icon={Trash2} label="Supprimer" size={14} tone="danger" className="h-8 w-8" onClick={() => setToDelete(o)} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <InfoNote icon={Info} tone="sky">
        Les adresses maison apparaissent sur tous vos QR codes. Pour en retirer une d&apos;une chambre précise, ouvrez la chambre dans{" "}
        <Link href="/hotel/chambres" className="font-bold text-sky-300">
          Chambres &amp; QR
        </Link>{" "}
        et décochez-la dans son menu. Les réservations passées sur une adresse maison vous parviennent dans Réservations, sans commission twocards : c&apos;est votre adresse.
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
