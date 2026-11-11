"use client";

import type { ReactNode } from "react";
import { BedDouble, Check, Hotel, MapPin, Phone, Save, ShieldCheck, type LucideIcon } from "lucide-react";
import { Button, Card, Field, InfoNote, inputClass } from "@/components/app/ui";
import { CITIES } from "@/components/hotel/offer-editor";
import type { SettingsForm } from "@/lib/hotel/use-settings-form";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/* Champ précédé d'une icône : le champ garde le dessin du kit. */
export function IconInput({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="relative">
      <Icon
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function HotelTab({ form }: { form: SettingsForm }) {
  const t = useT();
  const { hotel, setHotel } = form;
  const effects = [
    t(
      "Le nom apparaît en tête du menu client et sur les cartes QR imprimées.",
      "The name appears at the top of the guest menu and on printed QR cards."
    ),
    t(
      "La ville filtre le catalogue : un client de Marrakech ne voit pas les adresses de Casablanca.",
      "The city filters the catalogue: a guest in Marrakech won't see places in Casablanca."
    ),
    t(
      "Les QR déjà imprimés suivent automatiquement, sans réimpression.",
      "QR codes already printed update automatically, no reprint needed."
    ),
  ];
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card
        title={t("Profil de l'hôtel", "Hotel profile")}
        description={t(
          "Le nom et la ville s'affichent sur le menu client et sur les cartes imprimées.",
          "The name and city appear on the guest menu and on printed cards."
        )}
        className="xl:col-span-2"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Nom de l'hôtel", "Hotel name")} htmlFor="h-name">
            <IconInput icon={Hotel}>
              <input
                id="h-name"
                value={hotel.name}
                onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                maxLength={120}
                autoComplete="organization"
                className={cn(inputClass, "pl-10")}
              />
            </IconInput>
          </Field>
          <Field
            label={t("Ville", "City")}
            htmlFor="h-city"
            hint={t(
              "Détermine le catalogue de sorties proposé à vos clients.",
              "Determines the catalogue of outings offered to your guests."
            )}
          >
            <IconInput icon={MapPin}>
              <input
                id="h-city"
                list="h-cities"
                value={hotel.city}
                onChange={(e) => setHotel({ ...hotel, city: e.target.value })}
                maxLength={80}
                className={cn(inputClass, "pl-10")}
              />
              <datalist id="h-cities">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </IconInput>
          </Field>
          <Field label={t("Nombre de chambres", "Number of rooms")} htmlFor="h-rooms">
            <IconInput icon={BedDouble}>
              <input
                id="h-rooms"
                type="number"
                inputMode="numeric"
                min={1}
                value={hotel.rooms}
                onChange={(e) => setHotel({ ...hotel, rooms: e.target.value })}
                className={cn(inputClass, "num pl-10")}
              />
            </IconInput>
          </Field>
          <Field
            label={t("Téléphone de l'hôtel", "Hotel phone")}
            htmlFor="h-phone"
            hint={t("Pour twocards et les établissements partenaires.", "For twocards and partner venues.")}
          >
            <IconInput icon={Phone}>
              <input
                id="h-phone"
                type="tel"
                autoComplete="tel"
                value={hotel.phone}
                onChange={(e) => setHotel({ ...hotel, phone: e.target.value })}
                maxLength={40}
                className={cn(inputClass, "num pl-10")}
                placeholder="+212 6 …"
              />
            </IconInput>
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" icon={Save} onClick={form.saveHotel} loading={form.saving === "hotel"}>
            {t("Enregistrer", "Save")}
          </Button>
        </div>
      </Card>
      <div className="space-y-4">
        <Card title={t("Ce que ça change", "What this changes")}>
          <ul className="space-y-3 text-[13px] leading-relaxed text-ink-2">
            {effects.map((e) => (
              <li key={e} className="flex gap-2.5">
                <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-ok" aria-hidden />
                {e}
              </li>
            ))}
          </ul>
        </Card>
        <InfoNote icon={ShieldCheck} tone="sky">
          {t(
            "Vos données restent les vôtres : seules les informations nécessaires à la réservation (nom, téléphone du client, sortie choisie) sont transmises à l'établissement.",
            "Your data stays yours: only what the reservation needs (guest's name and phone, chosen outing) is shared with the venue."
          )}
        </InfoNote>
      </div>
    </div>
  );
}
