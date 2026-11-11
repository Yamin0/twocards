"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotify } from "@/components/app/ui";
import { useAuthUser } from "@/hooks/use-auth-user";
import { cityCatalog, type GuestCategoryKey } from "@/lib/guest-catalog";
import { oneOfOrNull } from "@/lib/hotel/params";
import { useHotelSpace } from "@/lib/hotel/store";
import { uploadImage } from "@/lib/hotel/upload-image";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useT } from "@/lib/i18n/client";

export type SettingsTab = "hotel" | "menu" | "compte";
/* Valeurs acceptées par ?onglet= ; toute autre est ignorée. */
export const SETTINGS_TABS: readonly SettingsTab[] = ["hotel", "menu", "compte"];

export type HotelForm = { name: string; city: string; rooms: string; phone: string };
export type MenuForm = {
  accent: string;
  background: string;
  categoryImages: Partial<Record<GuestCategoryKey, string>>;
  welcome: string;
  reception: string;
  prices: boolean;
};

/* Formulaires des paramètres de l'hôtel. Nom et ville alimentent à la fois
   les métadonnées du compte (barre latérale, e-mails) et le profil public
   lu par le menu client. Les écritures sont celles d'avant la refonte. */
export function useSettingsForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useT();
  const locale = useLocale();
  const notify = useNotify();
  const auth = useAuthUser();
  const { profile, saveProfile, qrCodes, catalog, hotelOffers, isLoading: spaceLoading } = useHotelSpace();

  const [tab, setTab] = useState<SettingsTab>("hotel");

  /* ?onglet=… (barre latérale, accueil) : ajustement d'état pendant le
     rendu, puis nettoyage de l'URL. Une valeur inconnue laisse l'onglet
     par défaut. */
  const rawTab = params.get("onglet");
  const [seenTab, setSeenTab] = useState<string | null>(null);
  if (rawTab !== seenTab) {
    setSeenTab(rawTab);
    const wanted = oneOfOrNull(rawTab, SETTINGS_TABS);
    if (wanted) setTab(wanted);
  }
  useEffect(() => {
    if (rawTab !== null) router.replace("/hotel/settings");
  }, [rawTab, router]);

  const [hotel, setHotel] = useState<HotelForm>({ name: "", city: "", rooms: "", phone: "" });
  const [menu, setMenu] = useState<MenuForm>({
    accent: profile.accent_color,
    background: profile.background_color,
    categoryImages: profile.category_images,
    welcome: "",
    reception: "",
    prices: true,
  });
  const [fullName, setFullName] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState<SettingsTab | null>(null);
  /* Catégorie dont la photo est en cours d'envoi. */
  const [uploading, setUploading] = useState<GuestCategoryKey | null>(null);

  const loading = auth.isLoading || spaceLoading;
  if (!loading && !ready) {
    setReady(true);
    setHotel({
      name: profile.hotel_name || auth.venueName || "",
      city: profile.city || auth.city || "",
      rooms: auth.roomsCount ? String(auth.roomsCount) : "",
      phone: auth.phone || "",
    });
    setMenu({
      accent: profile.accent_color,
      background: profile.background_color,
      categoryImages: profile.category_images,
      welcome: profile.welcome_message ?? "",
      reception: profile.reception_phone ?? "",
      prices: profile.show_prices,
    });
    setFullName(auth.fullName || "");
  }

  const failure = (fr: string, en: string) => notify(t(fr, en), "error");

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
    if (error || !ok)
      return failure("Impossible d'enregistrer. Réessayez dans un instant.", "Couldn't save. Please try again in a moment.");
    notify(t("Profil de l'hôtel enregistré", "Hotel profile saved"));
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
    if (!ok) return failure("Impossible d'enregistrer.", "Couldn't save.");
    notify(t("Menu client mis à jour, visible dès le prochain scan", "Guest menu updated, live from the next scan"));
  };

  const uploadCategory = async (key: GuestCategoryKey, file: File) => {
    if (!auth.userId) return;
    setUploading(key);
    try {
      const url = await uploadImage(file, auth.userId, `cat-${key}`, 1600, locale);
      setMenu((m) => ({ ...m, categoryImages: { ...m.categoryImages, [key]: url } }));
      notify(t("Photo importée, pensez à enregistrer", "Photo uploaded, remember to save"));
    } catch {
      failure("L'envoi de l'image a échoué", "Image upload failed");
    }
    setUploading(null);
  };

  const clearCategory = (key: GuestCategoryKey) =>
    setMenu((m) => {
      const next = { ...m.categoryImages };
      delete next[key];
      return { ...m, categoryImages: next };
    });

  const saveAccount = async () => {
    setSaving("compte");
    const { error } = await createClient().auth.updateUser({ data: { full_name: fullName.trim() } });
    setSaving(null);
    if (error) return failure("Impossible d'enregistrer.", "Couldn't save.");
    notify(t("Compte mis à jour", "Account updated"));
  };

  const menuDirty =
    menu.accent !== profile.accent_color ||
    menu.background !== profile.background_color ||
    JSON.stringify(menu.categoryImages) !== JSON.stringify(profile.category_images) ||
    menu.welcome !== (profile.welcome_message ?? "") ||
    menu.reception !== (profile.reception_phone ?? "") ||
    menu.prices !== profile.show_prices;

  /* Deux vraies adresses du menu de l'hôtel pour l'aperçu (aucune si le
     catalogue est vide : l'aperçu montre alors des lignes neutres). */
  const samples = useMemo(
    () =>
      cityCatalog(hotel.city || null, catalog, hotelOffers, locale)
        .flatMap((c) => c.offers)
        .slice(0, 2)
        .map((o) => ({ name: o.name, meta: [o.tag, o.city].filter(Boolean).join(" · "), price: o.price ?? null })),
    [hotel.city, catalog, hotelOffers, locale]
  );

  return {
    isLoading: loading || !ready,
    tab,
    setTab,
    email: auth.email,
    hotel,
    setHotel,
    menu,
    setMenu,
    fullName,
    setFullName,
    saving,
    uploading,
    saveHotel,
    saveMenu,
    saveAccount,
    uploadCategory,
    clearCategory,
    menuDirty,
    samples,
    /* Premier QR actif : sert au bouton « Ouvrir le menu ». */
    previewCode: qrCodes.find((q) => q.active)?.code ?? null,
    notify,
  };
}

export type SettingsForm = ReturnType<typeof useSettingsForm>;
