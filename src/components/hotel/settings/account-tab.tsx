"use client";

import { LogOut, Mail, Save, User } from "lucide-react";
import { Button, Card, Field, inputClass } from "@/components/app/ui";
import { IconInput } from "@/components/hotel/settings/hotel-tab";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import type { SettingsForm } from "@/lib/hotel/use-settings-form";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export function AccountTab({ form }: { form: SettingsForm }) {
  const t = useT();
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card
        title={t("Photo", "Photo")}
        description={t("Visible dans la barre latérale et par twocards.", "Visible in the sidebar and to twocards.")}
      >
        <AvatarUploader onMessage={(m) => form.notify(m)} label={t("Photo de l'hôtel", "Hotel photo")} />
      </Card>
      <Card
        title={t("Contact", "Contact")}
        description={t("La personne qui gère l'espace hôtel.", "The person who manages the hotel workspace.")}
        className="xl:col-span-2"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Nom du contact", "Contact name")} htmlFor="a-name">
            <IconInput icon={User}>
              <input
                id="a-name"
                value={form.fullName}
                onChange={(e) => form.setFullName(e.target.value)}
                maxLength={120}
                autoComplete="name"
                className={cn(inputClass, "pl-10")}
              />
            </IconInput>
          </Field>
          <Field
            label={t("E-mail de connexion", "Login email")}
            htmlFor="a-email"
            hint={t(
              "Ne se change pas ici : contactez votre référent twocards.",
              "Can't be changed here: contact your twocards representative."
            )}
          >
            <IconInput icon={Mail}>
              <input id="a-email" value={form.email ?? ""} disabled className={cn(inputClass, "pl-10")} />
            </IconInput>
          </Field>
          <Field
            label={t("Langue", "Language")}
            hint={t("Langue de l'espace hôtel sur cet appareil.", "Language of the hotel workspace on this device.")}
          >
            <div className="flex h-11 items-center">
              <LanguageSwitcher tone="light" />
            </div>
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" icon={LogOut}>
              {t("Se déconnecter", "Log out")}
            </Button>
          </form>
          <Button variant="primary" icon={Save} onClick={form.saveAccount} loading={form.saving === "compte"}>
            {t("Enregistrer", "Save")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
