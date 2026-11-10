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
import { uploadImage } from "@/lib/hotel/upload-image";
import { CATEGORY_KEYS, CATEGORY_META, categoryLabel, type GuestCategoryKey } from "@/lib/guest-catalog";
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
import { useLocale, useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

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
  const t = useT();
  const locale = useLocale();

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
    categoryImages: profile.category_images as Partial<Record<GuestCategoryKey, string>>,
    welcome: "",
    reception: "",
    prices: true,
  });
  const [account, setAccount] = useState({ fullName: "" });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState<Tab | null>(null);
  const [uploading, setUploading] = useState(false);
  /* Photo de catégorie en cours de remplacement (un seul champ fichier). */
  const [catTarget, setCatTarget] = useState<GuestCategoryKey | null>(null);
  const catInput = useRef<HTMLInputElement>(null);

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
      categoryImages: profile.category_images,
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
    showToast(
      error || !ok
        ? t("Impossible d'enregistrer. Réessayez dans un instant.", "Couldn't save. Please try again in a moment.")
        : t("Profil de l'hôtel enregistré", "Hotel profile saved")
    );
  };

  const saveMenu = async () => {
    setSaving("menu");
    const ok = await saveProfile({
      accent_color: menu.accent,
      background_color: menu.background,
      category_images: menu.categoryImages,
      welcome_message: menu.welcome.trim() || null,
      reception_phone: menu.reception.trim() || null,
      show_prices: menu.prices,
    });
    setSaving(null);
    showToast(ok ? t("Menu client mis à jour, visible dès le prochain scan", "Guest menu updated, live from the next scan") : t("Impossible d'enregistrer.", "Couldn't save."));
  };

  const uploadCategory = async (file: File) => {
    if (!userId || !catTarget) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, userId, `cat-${catTarget}`, 1600, locale);
      setMenu((m) => ({ ...m, categoryImages: { ...m.categoryImages, [catTarget]: url } }));
      showToast(t("Photo importée, pensez à enregistrer", "Photo uploaded, remember to save"));
    } catch {
      showToast(t("L'envoi de l'image a échoué", "Image upload failed"));
    }
    setUploading(false);
    setCatTarget(null);
  };

  const saveAccount = async () => {
    setSaving("compte");
    const { error } = await createClient().auth.updateUser({ data: { full_name: account.fullName.trim() } });
    setSaving(null);
    showToast(error ? t("Impossible d'enregistrer.", "Couldn't save.") : t("Compte mis à jour", "Account updated"));
  };

  const previewCode = qrCodes.find((q) => q.active)?.code ?? null;
  const darkAccent = isDarkHex(menu.accent);
  const darkPage = isDarkHex(menu.background);
  const onAccent = darkAccent ? "#fff" : "#0a0a0a";
  const menuDirty =
    menu.accent !== profile.accent_color ||
    menu.background !== profile.background_color ||
    JSON.stringify(menu.categoryImages) !== JSON.stringify(profile.category_images) ||
    menu.welcome !== (profile.welcome_message ?? "") ||
    menu.reception !== (profile.reception_phone ?? "") ||
    menu.prices !== profile.show_prices;

  return (
    <>
      <PageHeader
        eyebrow={t("Paramètres", "Settings")}
        title={t("Votre hôtel, votre menu, votre compte", "Your hotel, your menu, your account")}
        description={t(
          "Ce que voient vos clients quand ils scannent, et ce que voit twocards de votre établissement.",
          "What your guests see when they scan, and what twocards sees of your property."
        )}
      />

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "hotel", label: t("Hôtel", "Hotel") },
          { value: "menu", label: t("Menu client", "Guest menu") },
          { value: "compte", label: t("Compte", "Account") },
        ]}
      />

      {tab === "hotel" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel
            title={t("Profil de l'hôtel", "Hotel profile")}
            description={t("Le nom et la ville s'affichent sur le menu client et sur les cartes imprimées.", "The name and city appear on the guest menu and on printed cards.")}
            className="xl:col-span-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Nom de l'hôtel", "Hotel name")} htmlFor="h-name">
                <div className="relative">
                  <Hotel size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="h-name" value={hotel.name} onChange={(e) => setHotel({ ...hotel, name: e.target.value })} maxLength={120} className={cn(inputClass, "pl-10")} placeholder="Riad des Orangers" />
                </div>
              </Field>
              <Field label={t("Ville", "City")} htmlFor="h-city" hint={t("Détermine le catalogue de sorties proposé à vos clients.", "Determines the catalogue of outings offered to your guests.")}>
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
              <Field label={t("Nombre de chambres", "Number of rooms")} htmlFor="h-rooms">
                <div className="relative">
                  <BedDouble size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="h-rooms" type="number" min={1} value={hotel.rooms} onChange={(e) => setHotel({ ...hotel, rooms: e.target.value })} className={cn(inputClass, "num pl-10")} />
                </div>
              </Field>
              <Field label={t("Téléphone de l'hôtel", "Hotel phone")} htmlFor="h-phone" hint={t("Pour twocards et les établissements partenaires.", "For twocards and partner venues.")}>
                <div className="relative">
                  <Phone size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="h-phone" type="tel" value={hotel.phone} onChange={(e) => setHotel({ ...hotel, phone: e.target.value })} maxLength={40} className={cn(inputClass, "num pl-10")} placeholder="+212 6 …" />
                </div>
              </Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="primary" icon={Save} onClick={saveHotel} loading={saving === "hotel"}>
                {t("Enregistrer", "Save")}
              </Button>
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel title={t("Ce que ça change", "What this changes")}>
              <ul className="space-y-3 text-xs leading-relaxed text-white/60">
                <li className="flex gap-2.5"><Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-300" /> {t("Le nom apparaît en tête du menu client et sur les cartes QR imprimées.", "The name appears at the top of the guest menu and on printed QR cards.")}</li>
                <li className="flex gap-2.5"><Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-300" /> {t("La ville filtre le catalogue : un client de Marrakech ne voit pas les adresses de Casablanca.", "The city filters the catalogue: a guest in Marrakech won't see places in Casablanca.")}</li>
                <li className="flex gap-2.5"><Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-300" /> {t("Les QR déjà imprimés suivent automatiquement, sans réimpression.", "QR codes already printed update automatically, no reprint needed.")}</li>
              </ul>
            </Panel>
            <InfoNote icon={ShieldCheck} tone="sky">
              {t(
                "Vos données restent les vôtres : seules les informations nécessaires à la réservation (nom, téléphone du client, sortie choisie) sont transmises à l'établissement.",
                "Your data stays yours: only what the reservation needs (guest's name and phone, chosen outing) is shared with the venue."
              )}
            </InfoNote>
          </div>
        </div>
      )}

      {tab === "menu" && (
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-3">
            <Panel
              title={t("Photos des catégories", "Category photos")}
              description={t(
                "Les quatre bandeaux du menu : une photo par catégorie. Sans photo, celle de twocards est utilisée. Format panoramique conseillé.",
                "The menu's four banners: one photo per category. Without one, the twocards photo is used. Landscape format recommended."
              )}
            >
              <input
                ref={catInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCategory(f);
                  e.target.value = "";
                }}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {CATEGORY_KEYS.map((k) => {
                  const custom = menu.categoryImages[k];
                  const img = custom || CATEGORY_META[k].image;
                  return (
                    <div key={k} className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                      <Image src={img} alt="" fill unoptimized={img.startsWith("http")} sizes="400px" className="object-cover" />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <span className="font-display text-sm font-bold uppercase tracking-[0.3em]">{categoryLabel(k, locale)}</span>
                        <span className="mt-0.5 text-[10px] text-white/70">{custom ? t("Votre photo", "Your photo") : t("Photo twocards", "twocards photo")}</span>
                      </div>
                      <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          icon={ImagePlus}
                          loading={uploading && catTarget === k}
                          onClick={() => {
                            setCatTarget(k);
                            catInput.current?.click();
                          }}
                        >
                          {custom ? t("Changer", "Change") : t("Choisir", "Choose")}
                        </Button>
                        {custom && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Trash2}
                            onClick={() =>
                              setMenu((m) => {
                                const next = { ...m.categoryImages };
                                delete next[k];
                                return { ...m, categoryImages: next };
                              })
                            }
                          >
                            {t("Par défaut", "Default")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title={t("Couleurs", "Colours")}
              description={t(
                "L'accent signe les boutons, l'onglet actif et le bandeau sans photo. Le fond habille la page autour des cartes.",
                "The accent colours the buttons, the active tab and banners without a photo. The background frames the page around the cards."
              )}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("Couleur d'accent", "Accent colour")}>
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
                    <ColorInput value={menu.accent} onChange={(v) => setMenu({ ...menu, accent: v })} label={t("Accent personnalisé", "Custom accent")} />
                  </div>
                </Field>
                <Field label={t("Fond de page", "Page background")}>
                  <div className="flex flex-wrap items-center gap-2">
                    {BACKGROUNDS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={t(`Fond ${c}`, `Background ${c}`)}
                        onClick={() => setMenu({ ...menu, background: c })}
                        className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-105", menu.background.toLowerCase() === c ? "border-white" : "border-white/20")}
                        style={{ background: c }}
                      />
                    ))}
                    <ColorInput value={menu.background} onChange={(v) => setMenu({ ...menu, background: v })} label={t("Fond personnalisé", "Custom background")} />
                  </div>
                </Field>
              </div>
            </Panel>

            <Panel title={t("Textes et contact", "Text and contact")}>
              <div className="space-y-5">
                <Field label={t("Message d'accueil", "Welcome message")} htmlFor="m-welcome" hint={t("Affiché sous le nom de l'hôtel. 240 caractères maximum.", "Shown below the hotel's name. 240 characters max.")}>
                  <textarea
                    id="m-welcome"
                    value={menu.welcome}
                    onChange={(e) => setMenu({ ...menu, welcome: e.target.value.slice(0, 240) })}
                    rows={3}
                    placeholder={t(
                      "Réservez vos plus belles sorties en quelques secondes — notre conciergerie s'occupe du reste.",
                      "Book the best outings in seconds — our concierge desk takes care of the rest."
                    )}
                    className={cn(inputClass, "resize-none")}
                  />
                  <p className="num text-right text-[11px] text-white/35">{menu.welcome.length}/240</p>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t("WhatsApp de la réception", "Front desk WhatsApp")} htmlFor="m-reception" hint={t("Le client peut vous écrire directement depuis le menu.", "Guests can message you directly from the menu.")}>
                    <div className="relative">
                      <MessageCircle size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input id="m-reception" type="tel" value={menu.reception} onChange={(e) => setMenu({ ...menu, reception: e.target.value })} maxLength={40} className={cn(inputClass, "num pl-10")} placeholder="+212 6 …" />
                    </div>
                  </Field>
                  <Field label={t("Prix indicatifs", "Indicative prices")} hint={t("Afficher « dès 450 MAD » sur les activités et services qui en ont un.", "Show “from 450 MAD” on activities and services that have one.")}>
                    <div className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4">
                      <Switch checked={menu.prices} onChange={(v) => setMenu({ ...menu, prices: v })} label={t("Afficher les prix indicatifs", "Show indicative prices")} />
                      <span className="text-sm text-white/70">{menu.prices ? t("Affichés", "Shown") : t("Masqués", "Hidden")}</span>
                    </div>
                  </Field>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                <p className="text-xs text-white/45">{t("Les adresses proposées se règlent QR par QR, depuis la fiche de l'emplacement.", "Places offered are set QR by QR, from each location's page.")}</p>
                <div className="flex gap-2">
                  {previewCode && (
                    <LinkButton href={guestUrl(previewCode, hotel.name, hotel.city)} external icon={ExternalLink}>
                      {t("Ouvrir le menu", "Open the menu")}
                    </LinkButton>
                  )}
                  <Button variant="primary" icon={Save} onClick={saveMenu} loading={saving === "menu"} disabled={!menuDirty && !uploading}>
                    {t("Enregistrer", "Save")}
                  </Button>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title={t("Aperçu", "Preview")} description={t("Rendu indicatif, mis à jour en direct", "Indicative rendering, updated live")} className="xl:col-span-2">
            <div
              className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[1.75rem] border-[5px] border-black shadow-2xl"
              style={{ background: menu.background }}
            >
              {/* Page de titre, comme le menu client : plus de bandeau photo,
                  ce sont les catégories qui portent les images. */}
              <div className="px-4 pb-3 pt-5" style={{ color: darkPage ? "#fff" : "#171717" }}>
                <p
                  className="text-[10px] font-bold"
                  style={{ color: darkAccent !== darkPage ? menu.accent : "inherit" }}
                >
                  {t("Chambre 129", "Room 129")}
                </p>
                <p className="font-display mt-1 text-xl font-black leading-[0.9] tracking-[-0.03em]">{hotel.name || t("Votre hôtel", "Your hotel")}</p>
                <p className="mt-1.5 line-clamp-3 text-[10px] font-light leading-snug opacity-75">
                  {menu.welcome ||
                    t(
                      "Réservez vos plus belles sorties en quelques secondes — notre conciergerie s'occupe du reste.",
                      "Book the best outings in seconds — our concierge desk takes care of the rest."
                    )}
                </p>
                <p
                  className="mt-2.5 border-t pt-1.5 text-[8px] font-bold uppercase tracking-[0.18em] opacity-55"
                  style={{ borderColor: darkPage ? "rgba(255,255,255,0.16)" : "rgba(23,23,23,0.16)" }}
                >
                  {hotel.city ? `${hotel.city} — ` : ""}{t("Sélection de l'hôtel", "Hotel's selection")}
                </p>
              </div>
              <div className="bg-white">
                <div className="flex gap-1.5 overflow-hidden px-3 py-2.5">
                  {[t("Tout", "All"), categoryLabel("restaurants", locale), categoryLabel("activites", locale), categoryLabel("clubs", locale)].map((c, i) => (
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
                    { n: t("Montgolfière au lever du soleil", "Sunrise hot-air balloon"), t: t("Aventure · Marrakech", "Adventure · Marrakech"), p: t("dès 1 100 MAD", "from 1,100 MAD") },
                  ].map((o) => (
                    <div key={o.n} className="flex items-stretch gap-2.5 rounded-xl border border-black/[0.06] bg-white p-2">
                      <div className="w-12 shrink-0 rounded-lg bg-gradient-to-br from-neutral-300 to-neutral-200" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-black">{o.n}</p>
                        <p className="truncate text-[9px] text-black/50">{o.t}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-black/70">{menu.prices && o.p ? o.p : ""}</span>
                          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: menu.accent, color: onAccent }}>{t("Réserver", "Book")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={cn("flex items-center justify-center gap-1 py-2 text-[8px]", darkPage ? "text-white/50" : "text-black/40")}>
                <Smartphone size={9} strokeWidth={1.75} /> {t("Propulsé par twocards.", "Powered by twocards.")}
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <Eye size={12} strokeWidth={1.75} />{" "}
              {t(
                "Aperçu mobile simplifié — sur ordinateur, le menu s'affiche en pleine page avec une colonne de navigation",
                "Simplified mobile preview — on desktop, the menu shows full-page with a navigation column"
              )}
            </p>
          </Panel>
        </div>
      )}

      {tab === "compte" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title={t("Photo", "Photo")} description={t("Visible dans la barre latérale et par twocards.", "Visible in the sidebar and to twocards.")}>
            <AvatarUploader onMessage={showToast} label={t("Photo de l'hôtel", "Hotel photo")} />
          </Panel>
          <Panel title={t("Contact", "Contact")} description={t("La personne qui gère l'espace hôtel.", "The person who manages the hotel workspace.")} className="xl:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Nom du contact", "Contact name")} htmlFor="a-name">
                <div className="relative">
                  <User size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="a-name" value={account.fullName} onChange={(e) => setAccount({ fullName: e.target.value })} maxLength={120} className={cn(inputClass, "pl-10")} />
                </div>
              </Field>
              <Field label={t("E-mail de connexion", "Login email")} htmlFor="a-email" hint={t("Ne se change pas ici : contactez votre référent twocards.", "Can't be changed here: contact your twocards representative.")}>
                <div className="relative">
                  <Mail size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input id="a-email" value={email ?? ""} disabled className={cn(inputClass, "pl-10")} />
                </div>
              </Field>
              <Field label="Langue / Language" hint={t("Langue de l'espace hôtel sur cet appareil.", "Language of the hotel workspace on this device.")}>
                <div className="flex h-11 items-center">
                  <LanguageSwitcher tone="dark" />
                </div>
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-xs font-bold text-white/45 transition-colors hover:text-red-300">
                  {t("Se déconnecter de cet appareil", "Log out of this device")}
                </button>
              </form>
              <Button variant="primary" icon={Save} onClick={saveAccount} loading={saving === "compte"}>
                {t("Enregistrer", "Save")}
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
