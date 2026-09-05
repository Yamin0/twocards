"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BedDouble,
  Check,
  ExternalLink,
  Eye,
  Hotel,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { useHotelSpace } from "@/lib/hotel/store";
import { isDarkHex } from "@/lib/hotel/format";
import { guestUrl } from "@/lib/qr";
import {
  Button,
  Field,
  InfoNote,
  LinkButton,
  PageHeader,
  Panel,
  Segmented,
  Switch,
  Toast,
  inputClass,
} from "@/components/hotel/ui";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { cn } from "@/lib/utils";

type Tab = "hotel" | "menu" | "compte";

const ACCENTS = ["#13305c", "#0d0d0d", "#7c2d3a", "#1f6a4f", "#8a6d1d", "#4c3a8f", "#b45309", "#0f766e"];
const CITIES = ["Marrakech", "Casablanca", "Tanger", "Rabat", "Agadir", "Fès", "Essaouira"];

export default function HotelSettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={0} />}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { fullName, email, venueName, city, phone, roomsCount, isLoading: authLoading } = useAuthUser();
  const { profile, saveProfile, qrCodes, isLoading } = useHotelSpace();
  const { toast, showToast } = useToast(3000);
  const [tab, setTab] = useState<Tab>("hotel");

  /* ?onglet=… (barre latérale, accueil) : ajustement d'état pendant le
     rendu, puis nettoyage de l'URL. */
  const wantedTab = params.get("onglet") as Tab | null;
  const [seenTab, setSeenTab] = useState<Tab | null>(null);
  if (wantedTab !== seenTab) {
    setSeenTab(wantedTab);
    if (wantedTab) setTab(wantedTab);
  }
  useEffect(() => {
    if (wantedTab) router.replace("/hotel/settings");
  }, [wantedTab, router]);

  /* Formulaire hôtel : nom et ville alimentent à la fois les métadonnées du
     compte (barre latérale, e-mails) et le profil public lu par le menu. */
  const [hotel, setHotel] = useState({ name: "", city: "", rooms: "", phone: "" });
  const [menu, setMenu] = useState({
    accent: profile.accent_color,
    welcome: "",
    reception: "",
    prices: true,
  });
  const [account, setAccount] = useState({ fullName: "" });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState<Tab | null>(null);

  if (!authLoading && !isLoading && !ready) {
    setReady(true);
    setHotel({
      name: profile.hotel_name || venueName || "",
      city: profile.city || city || "",
      rooms: roomsCount ? String(roomsCount) : "",
      phone: phone || "",
    });
    setMenu({
      accent: profile.accent_color,
      welcome: profile.welcome_message ?? "",
      reception: profile.reception_phone ?? "",
      prices: profile.show_prices,
    });
    setAccount({ fullName: fullName || "" });
  }

  if (authLoading || isLoading || !ready) return <PageSkeleton kpis={0} />;

  const saveHotel = async () => {
    setSaving("hotel");
    const [{ error }, ok] = await Promise.all([
      createClient().auth.updateUser({
        data: {
          venue_name: hotel.name.trim(),
          city: hotel.city.trim(),
          phone: hotel.phone.trim(),
          rooms_count: hotel.rooms ? Number(hotel.rooms) : null,
        },
      }),
      saveProfile({ hotel_name: hotel.name.trim() || null, city: hotel.city.trim() || null }),
    ]);
    setSaving(null);
    showToast(error || !ok ? "Impossible d'enregistrer. Réessayez dans un instant." : "Profil de l'hôtel enregistré");
  };

  const saveMenu = async () => {
    setSaving("menu");
    const ok = await saveProfile({
      accent_color: menu.accent,
      welcome_message: menu.welcome.trim() || null,
      reception_phone: menu.reception.trim() || null,
      show_prices: menu.prices,
    });
    setSaving(null);
    showToast(ok ? "Menu client mis à jour — visible dès le prochain scan" : "Impossible d'enregistrer.");
  };

  const saveAccount = async () => {
    setSaving("compte");
    const { error } = await createClient().auth.updateUser({ data: { full_name: account.fullName.trim() } });
    setSaving(null);
    showToast(error ? "Impossible d'enregistrer." : "Compte mis à jour");
  };

  const previewCode = qrCodes.find((q) => q.active)?.code ?? null;
  const dark = isDarkHex(menu.accent);

  return (
    <>
      <PageHeader
        eyebrow="Paramètres"
        title="Votre hôtel, votre menu, votre compte"
        description="Ce que voient vos clients quand ils scannent, et ce que voit twocards de votre établissement."
      />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "hotel", label: "Hôtel" },
          { value: "menu", label: "Menu client" },
          { value: "compte", label: "Compte" },
        ]}
      />

      {tab === "hotel" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Profil de l'hôtel" description="Le nom et la ville s'affichent sur le menu client et sur les cartes imprimées." className="xl:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom de l'hôtel" htmlFor="h-name">
                <div className="relative">
                  <Hotel size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="h-name" value={hotel.name} onChange={(e) => setHotel({ ...hotel, name: e.target.value })} maxLength={120} className={cn(inputClass, "pl-10")} placeholder="Riad des Orangers" />
                </div>
              </Field>
              <Field label="Ville" htmlFor="h-city" hint="Détermine le catalogue de sorties proposé à vos clients.">
                <div className="relative">
                  <MapPin size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="h-city" list="h-cities" value={hotel.city} onChange={(e) => setHotel({ ...hotel, city: e.target.value })} maxLength={80} className={cn(inputClass, "pl-10")} placeholder="Marrakech" />
                  <datalist id="h-cities">
                    {CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </Field>
              <Field label="Nombre de chambres" htmlFor="h-rooms">
                <div className="relative">
                  <BedDouble size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="h-rooms" type="number" min={1} value={hotel.rooms} onChange={(e) => setHotel({ ...hotel, rooms: e.target.value })} className={cn(inputClass, "num pl-10")} />
                </div>
              </Field>
              <Field label="Téléphone de l'hôtel" htmlFor="h-phone" hint="Pour twocards et les établissements partenaires.">
                <div className="relative">
                  <Phone size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="h-phone" type="tel" value={hotel.phone} onChange={(e) => setHotel({ ...hotel, phone: e.target.value })} maxLength={40} className={cn(inputClass, "num pl-10")} placeholder="+212 6 …" />
                </div>
              </Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="primary" icon={Save} onClick={saveHotel} loading={saving === "hotel"}>
                Enregistrer
              </Button>
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel title="Ce que ça change">
              <ul className="space-y-3 text-xs leading-relaxed text-white/60">
                <li className="flex gap-2.5"><Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-300" /> Le nom apparaît en tête du menu client et sur les cartes QR imprimées.</li>
                <li className="flex gap-2.5"><Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-300" /> La ville filtre le catalogue : un client de Marrakech ne voit pas les adresses de Casablanca.</li>
                <li className="flex gap-2.5"><Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-300" /> Les QR déjà imprimés suivent automatiquement, sans réimpression.</li>
              </ul>
            </Panel>
            <InfoNote icon={ShieldCheck} tone="sky">
              Vos données restent les vôtres : seules les informations nécessaires à la réservation (nom, téléphone du client, sortie choisie) sont transmises à l&apos;établissement.
            </InfoNote>
          </div>
        </div>
      )}

      {tab === "menu" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Apparence du menu client" description="La page qui s'ouvre après un scan. Elle porte votre nom, votre couleur et votre message d'accueil." className="xl:col-span-2">
            <div className="space-y-5">
              <Field label="Couleur d'accent" hint="Boutons, onglet actif et bandeau. Choisissez une teinte de votre identité.">
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Couleur ${c}`}
                      onClick={() => setMenu({ ...menu, accent: c })}
                      className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-105", menu.accent.toLowerCase() === c ? "border-white" : "border-transparent")}
                      style={{ background: c }}
                    />
                  ))}
                  <label className="ml-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/70">
                    <Palette size={13} strokeWidth={1.75} />
                    <input
                      type="color"
                      value={menu.accent}
                      onChange={(e) => setMenu({ ...menu, accent: e.target.value })}
                      className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                      aria-label="Couleur personnalisée"
                    />
                    <span className="num uppercase">{menu.accent}</span>
                  </label>
                </div>
              </Field>
              <Field label="Message d'accueil" htmlFor="m-welcome" hint="Affiché sous le nom de l'hôtel. 240 caractères maximum.">
                <textarea
                  id="m-welcome"
                  value={menu.welcome}
                  onChange={(e) => setMenu({ ...menu, welcome: e.target.value.slice(0, 240) })}
                  rows={3}
                  placeholder="Réservez vos plus belles sorties en quelques secondes — notre conciergerie s'occupe du reste."
                  className={cn(inputClass, "resize-none")}
                />
                <p className="num text-right text-[11px] text-white/35">{menu.welcome.length}/240</p>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="WhatsApp de la réception" htmlFor="m-reception" hint="Affiché en pied du menu : le client peut vous écrire directement.">
                  <div className="relative">
                    <MessageCircle size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input id="m-reception" type="tel" value={menu.reception} onChange={(e) => setMenu({ ...menu, reception: e.target.value })} maxLength={40} className={cn(inputClass, "num pl-10")} placeholder="+212 6 …" />
                  </div>
                </Field>
                <Field label="Prix indicatifs" hint="Afficher « dès 450 MAD » sur les activités et services qui en ont un.">
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4">
                    <Switch checked={menu.prices} onChange={(v) => setMenu({ ...menu, prices: v })} label="Afficher les prix indicatifs" />
                    <span className="text-sm text-white/70">{menu.prices ? "Affichés" : "Masqués"}</span>
                  </div>
                </Field>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-white/45">Le menu de chaque QR (adresses proposées) se règle depuis la fiche de l&apos;emplacement.</p>
              <div className="flex gap-2">
                {previewCode && (
                  <LinkButton href={guestUrl(previewCode, hotel.name, hotel.city)} external icon={ExternalLink}>
                    Ouvrir le menu
                  </LinkButton>
                )}
                <Button variant="primary" icon={Save} onClick={saveMenu} loading={saving === "menu"}>
                  Enregistrer
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="Aperçu" description="Rendu indicatif, mis à jour en direct">
            <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[1.75rem] border-[5px] border-black bg-[#f7f6f3] shadow-2xl">
              <div className="px-4 pb-3 pt-5 text-white" style={{ background: menu.accent }}>
                <p className={cn("text-[9px] font-bold uppercase tracking-[0.22em]", dark ? "text-white/70" : "text-black/60")}>Conciergerie</p>
                <p className={cn("font-display mt-1 text-lg font-black leading-tight", dark ? "text-white" : "text-black")}>{hotel.name || "Votre hôtel"}</p>
                <p className={cn("mt-1 line-clamp-2 text-[10px] leading-snug", dark ? "text-white/75" : "text-black/65")}>
                  {menu.welcome || "Réservez vos plus belles sorties en quelques secondes — notre conciergerie s'occupe du reste."}
                </p>
              </div>
              <div className="flex gap-1.5 overflow-hidden px-3 py-2.5">
                {["Restaurants", "Activités", "Clubs", "Services"].map((c, i) => (
                  <span
                    key={c}
                    className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold"
                    style={i === 0 ? { background: menu.accent, color: dark ? "#fff" : "#000" } : { background: "#e9e7e2", color: "#333" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="space-y-2 px-3 pb-4">
                {[
                  { n: "Jimmy'z Marrakech", t: "Club · Hivernage" },
                  { n: "Twiga Marrakech", t: "Lounge · Hivernage" },
                ].map((o) => (
                  <div key={o.n} className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white p-2">
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-neutral-300 to-neutral-200" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-black">{o.n}</p>
                      <p className="truncate text-[9px] text-black/50">{o.t}{menu.prices ? " · dès 1 500 MAD" : ""}</p>
                    </div>
                    <span className="rounded-full px-2 py-1 text-[9px] font-bold" style={{ background: menu.accent, color: dark ? "#fff" : "#000" }}>Réserver</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1 border-t border-black/[0.06] py-2 text-[8px] text-black/40">
                <Smartphone size={9} strokeWidth={1.75} /> Propulsé par twocards.
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <Eye size={12} strokeWidth={1.75} /> Aperçu simplifié — ouvrez le menu pour le rendu réel
            </p>
          </Panel>
        </div>
      )}

      {tab === "compte" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Photo" description="Visible dans la barre latérale et par twocards.">
            <AvatarUploader onMessage={showToast} label="Photo de l'hôtel" />
          </Panel>
          <Panel title="Contact" description="La personne qui gère l'espace hôtel." className="xl:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du contact" htmlFor="a-name">
                <div className="relative">
                  <User size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="a-name" value={account.fullName} onChange={(e) => setAccount({ fullName: e.target.value })} maxLength={120} className={cn(inputClass, "pl-10")} />
                </div>
              </Field>
              <Field label="E-mail de connexion" htmlFor="a-email" hint="Ne se change pas ici : contactez votre référent twocards.">
                <div className="relative">
                  <Mail size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="a-email" value={email ?? ""} disabled className={cn(inputClass, "pl-10")} />
                </div>
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-xs font-bold text-white/45 transition-colors hover:text-red-300">
                  Se déconnecter de cet appareil
                </button>
              </form>
              <Button variant="primary" icon={Save} onClick={saveAccount} loading={saving === "compte"}>
                Enregistrer
              </Button>
            </div>
          </Panel>
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
