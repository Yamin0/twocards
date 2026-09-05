"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BedDouble,
  Check,
  ExternalLink,
  Eye,
  Hotel,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
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
const BACKGROUNDS = ["#f4f3ef", "#ffffff", "#ece4d8", "#e8eef2", "#101726", "#0d0d0d", "#0e2a22", "#2a1a1a"];
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
  const { userId, fullName, email, venueName, city, phone, roomsCount, isLoading: authLoading } = useAuthUser();
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
    background: profile.background_color,
    cover: profile.cover_url,
    welcome: "",
    reception: "",
    prices: true,
  });
  const [account, setAccount] = useState({ fullName: "" });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState<Tab | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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
      background: profile.background_color,
      cover: profile.cover_url,
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
      background_color: menu.background,
      cover_url: menu.cover,
      welcome_message: menu.welcome.trim() || null,
      reception_phone: menu.reception.trim() || null,
      show_prices: menu.prices,
    });
    setSaving(null);
    showToast(ok ? "Menu client mis à jour, visible dès le prochain scan" : "Impossible d'enregistrer.");
  };

  /* Couverture : image redimensionnée en webp côté navigateur (1600 px de
     large maximum), envoyée dans le bucket avatars sous le dossier de
     l'hôtel — mêmes règles que la photo de profil. */
  const uploadCover = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choisissez une image (JPG, PNG, WebP)");
      return;
    }
    setUploading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/webp", 0.85)
      );
      const supabase = createClient();
      const path = `${userId}/hotel-cover-${crypto.randomUUID()}.webp`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/webp" });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      setMenu((m) => ({ ...m, cover: publicUrl }));
      showToast("Couverture importée, pensez à enregistrer");
    } catch {
      showToast("L'envoi de l'image a échoué");
    }
    setUploading(false);
  };

  const saveAccount = async () => {
    setSaving("compte");
    const { error } = await createClient().auth.updateUser({ data: { full_name: account.fullName.trim() } });
    setSaving(null);
    showToast(error ? "Impossible d'enregistrer." : "Compte mis à jour");
  };

  const previewCode = qrCodes.find((q) => q.active)?.code ?? null;
  const darkAccent = isDarkHex(menu.accent);
  const darkPage = isDarkHex(menu.background);
  const onAccent = darkAccent ? "#fff" : "#0a0a0a";
  const menuDirty =
    menu.accent !== profile.accent_color ||
    menu.background !== profile.background_color ||
    menu.cover !== profile.cover_url ||
    menu.welcome !== (profile.welcome_message ?? "") ||
    menu.reception !== (profile.reception_phone ?? "") ||
    menu.prices !== profile.show_prices;

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
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-3">
            <Panel
              title="Couverture"
              description="La photo en haut du menu : votre façade, votre piscine, votre patio. Format paysage conseillé (au moins 1600 × 800 px)."
            >
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCover(f);
                  e.target.value = "";
                }}
              />
              <div
                className="relative overflow-hidden rounded-2xl border border-white/10"
                style={{ background: menu.accent }}
              >
                {menu.cover ? (
                  <Image src={menu.cover} alt="" width={1200} height={480} unoptimized className="h-44 w-full object-cover sm:h-56" />
                ) : (
                  <div className="flex h-44 flex-col items-center justify-center gap-2 sm:h-56">
                    <ImagePlus size={26} strokeWidth={1.5} className="text-white/70" />
                    <p className="text-sm font-bold text-white/85">Aucune photo : le bandeau prend la couleur d&apos;accent</p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <Button size="sm" variant="primary" icon={uploading ? Loader2 : ImagePlus} loading={uploading} onClick={() => fileInput.current?.click()}>
                    {menu.cover ? "Changer la photo" : "Ajouter une photo"}
                  </Button>
                  {menu.cover && (
                    <Button size="sm" variant="secondary" icon={Trash2} onClick={() => setMenu({ ...menu, cover: null })}>
                      Retirer
                    </Button>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Couleurs" description="L'accent signe les boutons, l'onglet actif et le bandeau sans photo. Le fond habille la page autour des cartes.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Couleur d'accent">
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Accent ${c}`}
                        onClick={() => setMenu({ ...menu, accent: c })}
                        className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-105", menu.accent.toLowerCase() === c ? "border-white" : "border-transparent")}
                        style={{ background: c }}
                      />
                    ))}
                    <ColorInput value={menu.accent} onChange={(v) => setMenu({ ...menu, accent: v })} label="Accent personnalisé" />
                  </div>
                </Field>
                <Field label="Fond de page">
                  <div className="flex flex-wrap items-center gap-2">
                    {BACKGROUNDS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Fond ${c}`}
                        onClick={() => setMenu({ ...menu, background: c })}
                        className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-105", menu.background.toLowerCase() === c ? "border-white" : "border-white/20")}
                        style={{ background: c }}
                      />
                    ))}
                    <ColorInput value={menu.background} onChange={(v) => setMenu({ ...menu, background: v })} label="Fond personnalisé" />
                  </div>
                </Field>
              </div>
            </Panel>

            <Panel title="Textes et contact">
              <div className="space-y-5">
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
                  <Field label="WhatsApp de la réception" htmlFor="m-reception" hint="Le client peut vous écrire directement depuis le menu.">
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
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                <p className="text-xs text-white/45">Les adresses proposées se règlent QR par QR, depuis la fiche de l&apos;emplacement.</p>
                <div className="flex gap-2">
                  {previewCode && (
                    <LinkButton href={guestUrl(previewCode, hotel.name, hotel.city)} external icon={ExternalLink}>
                      Ouvrir le menu
                    </LinkButton>
                  )}
                  <Button variant="primary" icon={Save} onClick={saveMenu} loading={saving === "menu"} disabled={!menuDirty && !uploading}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Aperçu" description="Rendu indicatif, mis à jour en direct" className="xl:col-span-2">
            <div
              className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[1.75rem] border-[5px] border-black shadow-2xl"
              style={{ background: menu.background }}
            >
              <div className="relative overflow-hidden" style={{ background: menu.accent }}>
                {menu.cover && <Image src={menu.cover} alt="" width={600} height={300} unoptimized className="h-36 w-full object-cover" />}
                <div className={cn("absolute inset-0", menu.cover ? "bg-gradient-to-t from-black/75 via-black/25 to-black/5" : "")} />
                <div className={cn("relative px-4 pb-3", menu.cover ? "-mt-16 pt-0" : "pt-6")}>
                  <p className={cn("text-[9px] font-bold uppercase tracking-[0.22em]", menu.cover || darkAccent ? "text-white/70" : "text-black/60")}>Conciergerie · Chambre 101</p>
                  <p className={cn("font-display mt-1 text-lg font-black leading-tight", menu.cover || darkAccent ? "text-white" : "text-black")}>{hotel.name || "Votre hôtel"}</p>
                  <p className={cn("mt-1 line-clamp-2 text-[10px] leading-snug", menu.cover || darkAccent ? "text-white/80" : "text-black/65")}>
                    {menu.welcome || "Réservez vos plus belles sorties en quelques secondes — notre conciergerie s'occupe du reste."}
                  </p>
                </div>
              </div>
              <div className="bg-white">
                <div className="flex gap-1.5 overflow-hidden px-3 py-2.5">
                  {["Tout", "Restaurants", "Activités", "Clubs"].map((c, i) => (
                    <span
                      key={c}
                      className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold"
                      style={i === 0 ? { background: menu.accent, color: onAccent } : { background: "#f1f0ec", color: "#333" }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="space-y-2 px-3 pb-3">
                  {[
                    { n: "Jimmy'z Marrakech", t: "Club · Marrakech" },
                    { n: "Montgolfière au lever du soleil", t: "Aventure · Marrakech", p: "dès 1 100 MAD" },
                  ].map((o) => (
                    <div key={o.n} className="flex items-stretch gap-2.5 rounded-xl border border-black/[0.06] bg-white p-2">
                      <div className="w-12 shrink-0 rounded-lg bg-gradient-to-br from-neutral-300 to-neutral-200" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-black">{o.n}</p>
                        <p className="truncate text-[9px] text-black/50">{o.t}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-black/70">{menu.prices && o.p ? o.p : ""}</span>
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: menu.accent, color: onAccent }}>Réserver</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={cn("flex items-center justify-center gap-1 py-2 text-[8px]", darkPage ? "text-white/50" : "text-black/40")}>
                <Smartphone size={9} strokeWidth={1.75} /> Propulsé par twocards.
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <Eye size={12} strokeWidth={1.75} /> Aperçu mobile simplifié — sur ordinateur, le menu s&apos;affiche en pleine page avec une colonne de navigation
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

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="ml-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/70">
      <Palette size={13} strokeWidth={1.75} />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={label}
      />
      <span className="num uppercase">{value}</span>
    </label>
  );
}
