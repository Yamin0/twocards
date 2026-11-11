"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, ExternalLink, ImagePlus, MessageCircle, RotateCcw, Save } from "lucide-react";
import { Button, Card, Field, LinkButton, Switch, inputClass } from "@/components/app/ui";
import { IconInput } from "@/components/hotel/settings/hotel-tab";
import { MenuPreview } from "@/components/hotel/settings/menu-preview";
import { CATEGORY_KEYS, CATEGORY_META, categoryLabel, type GuestCategoryKey } from "@/lib/guest-catalog";
import { isDarkHex } from "@/lib/hotel/format";
import type { SettingsForm } from "@/lib/hotel/use-settings-form";
import { guestUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

const ACCENTS = ["#13305c", "#0d0d0d", "#7c2d3a", "#1f6a4f", "#8a6d1d", "#4c3a8f", "#b45309", "#0f766e"];
const BACKGROUNDS = ["#fffdf9", "#ffffff", "#ece4d8", "#e8eef2", "#101726", "#0d0d0d", "#0e2a22", "#2a1a1a"];

/* Choix d'une couleur du menu client : pastilles proposées, puis une
   couleur libre. La pastille choisie porte une coche et un anneau. */
function ColorField({
  label,
  customLabel,
  value,
  choices,
  onChange,
}: {
  label: string;
  customLabel: string;
  value: string;
  choices: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
        {choices.map((c) => {
          const on = value.toLowerCase() === c;
          return (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={on}
              onClick={() => onChange(c)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border border-line-2 transition-transform hover:scale-105",
                on && "ring-2 ring-link ring-offset-2 ring-offset-panel"
              )}
              style={{ background: c, color: isDarkHex(c) ? "#ffffff" : "#0a0a0a" }}
            >
              {on && <Check size={16} strokeWidth={2.5} aria-hidden />}
            </button>
          );
        })}
        <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-2 bg-panel px-3 text-[13px] text-ink-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            aria-label={customLabel}
          />
          <span className="num">{value}</span>
        </label>
      </div>
    </Field>
  );
}

export function MenuTab({ form }: { form: SettingsForm }) {
  const t = useT();
  const locale = useLocale();
  const { menu, setMenu, hotel } = form;
  /* Un seul champ fichier, visé par la catégorie en cours. */
  const fileInput = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<GuestCategoryKey | null>(null);
  const welcomeDefault = t(
    "Réservez vos plus belles sorties en quelques secondes — notre conciergerie s'occupe du reste.",
    "Book the best outings in seconds — our concierge desk takes care of the rest."
  );

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        <Card
          title={t("Photos des catégories", "Category photos")}
          description={t(
            "Les quatre bandeaux du menu : une photo par catégorie. Sans photo, celle de twocards est utilisée. Format panoramique conseillé.",
            "The menu's four banners: one photo per category. Without one, the twocards photo is used. Landscape format recommended."
          )}
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && target) void form.uploadCategory(target, f);
              e.target.value = "";
            }}
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {CATEGORY_KEYS.map((k) => {
              const custom = menu.categoryImages[k];
              const img = custom || CATEGORY_META[k].image;
              return (
                <li key={k} className="overflow-hidden rounded-xl border border-line">
                  <div className="relative h-24 bg-fill-2">
                    <Image src={img} alt="" fill unoptimized={img.startsWith("http")} sizes="400px" className="object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{categoryLabel(k, locale)}</p>
                      <p className="text-xs text-ink-3">
                        {custom ? t("Votre photo", "Your photo") : t("Photo twocards", "twocards photo")}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {custom && (
                        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => form.clearCategory(k)}>
                          {t("Par défaut", "Default")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        icon={ImagePlus}
                        loading={form.uploading === k}
                        disabled={form.uploading !== null}
                        onClick={() => {
                          setTarget(k);
                          fileInput.current?.click();
                        }}
                      >
                        {custom ? t("Changer", "Change") : t("Choisir", "Choose")}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card
          title={t("Couleurs", "Colours")}
          description={t(
            "L'accent signe les boutons, l'onglet actif et le bandeau sans photo. Le fond habille la page autour des cartes.",
            "The accent colours the buttons, the active tab and banners without a photo. The background frames the page around the cards."
          )}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField
              label={t("Couleur d'accent", "Accent colour")}
              customLabel={t("Accent personnalisé", "Custom accent")}
              value={menu.accent}
              choices={ACCENTS}
              onChange={(v) => setMenu({ ...menu, accent: v })}
            />
            <ColorField
              label={t("Fond de page", "Page background")}
              customLabel={t("Fond personnalisé", "Custom background")}
              value={menu.background}
              choices={BACKGROUNDS}
              onChange={(v) => setMenu({ ...menu, background: v })}
            />
          </div>
        </Card>

        <Card title={t("Textes et contact", "Text and contact")}>
          <div className="space-y-5">
            <Field
              label={t("Message d'accueil", "Welcome message")}
              htmlFor="m-welcome"
              hint={t(
                `Affiché sous le nom de l'hôtel. ${menu.welcome.length}/240 caractères.`,
                `Shown below the hotel's name. ${menu.welcome.length}/240 characters.`
              )}
            >
              <textarea
                id="m-welcome"
                value={menu.welcome}
                onChange={(e) => setMenu({ ...menu, welcome: e.target.value.slice(0, 240) })}
                rows={3}
                placeholder={welcomeDefault}
                className={cn(inputClass, "resize-none")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("WhatsApp de la réception", "Front desk WhatsApp")}
                htmlFor="m-reception"
                hint={t(
                  "Le client peut vous écrire directement depuis le menu.",
                  "Guests can message you directly from the menu."
                )}
              >
                <IconInput icon={MessageCircle}>
                  <input
                    id="m-reception"
                    type="tel"
                    value={menu.reception}
                    onChange={(e) => setMenu({ ...menu, reception: e.target.value })}
                    maxLength={40}
                    className={cn(inputClass, "num pl-10")}
                    placeholder="+212 6 …"
                  />
                </IconInput>
              </Field>
              <Field
                label={t("Prix indicatifs", "Indicative prices")}
                hint={t(
                  "Affiche le prix indicatif des activités et services qui en ont un.",
                  "Shows the indicative price of activities and services that have one."
                )}
              >
                <div className="flex h-11 items-center gap-3 rounded-xl border border-line-2 bg-panel px-3.5">
                  <Switch
                    checked={menu.prices}
                    onChange={(v) => setMenu({ ...menu, prices: v })}
                    label={t("Afficher les prix indicatifs", "Show indicative prices")}
                  />
                  <span className="text-sm text-ink-2">{menu.prices ? t("Affichés", "Shown") : t("Masqués", "Hidden")}</span>
                </div>
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-ink-3">
              {t(
                "Les adresses proposées se règlent QR par QR, depuis la fiche de l'emplacement.",
                "Places offered are set QR by QR, from each location's page."
              )}
            </p>
            <div className="flex shrink-0 gap-2">
              {form.previewCode && (
                <LinkButton href={guestUrl(form.previewCode, hotel.name, hotel.city)} external icon={ExternalLink}>
                  {t("Ouvrir le menu", "Open the menu")}
                </LinkButton>
              )}
              <Button
                variant="primary"
                icon={Save}
                onClick={form.saveMenu}
                loading={form.saving === "menu"}
                disabled={!form.menuDirty || form.uploading !== null}
              >
                {t("Enregistrer", "Save")}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="xl:col-span-2">
        <MenuPreview menu={menu} hotelName={hotel.name} city={hotel.city} samples={form.samples} />
      </div>
    </div>
  );
}
