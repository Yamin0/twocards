"use client";

import { useState } from "react";
import { Button, Card, Field, PageHeader, PageSkeleton, inputClass, useNotify } from "@/components/app/ui";
import { AvatarUploader } from "@/components/shared/avatar-uploader";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

/* Paramètres du concierge. L'enregistrement écrit réellement dans le
   compte (métadonnées de l'utilisateur), comme dans les autres espaces. */

function ProfileForm({
  initial,
  email,
}: {
  initial: { fullName: string; phone: string; city: string };
  email: string;
}) {
  const t = useT();
  const notify = useNotify();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setNameError(true);
      return;
    }
    setSaving(true);
    const { error } = await createClient().auth.updateUser({
      data: { full_name: form.fullName.trim(), phone: form.phone.trim(), city: form.city.trim() },
    });
    setSaving(false);
    if (error) notify(t("Vos informations n'ont pas pu être enregistrées.", "Your details couldn't be saved."), "error");
    else notify(t("Informations enregistrées", "Details saved"));
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field
        label={t("Nom complet", "Full name")}
        htmlFor="c-nom"
        error={nameError ? t("Indiquez votre nom.", "Enter your name.") : undefined}
        className="sm:col-span-2"
      >
        <input
          id="c-nom"
          autoComplete="name"
          value={form.fullName}
          onChange={(e) => {
            set("fullName", e.target.value);
            setNameError(false);
          }}
          className={inputClass}
        />
      </Field>
      <Field
        label={t("E-mail", "Email")}
        htmlFor="c-mail"
        hint={t("Sert à vous connecter. Il ne se modifie pas ici.", "Used to log in. It can't be changed here.")}
        className="sm:col-span-2"
      >
        <input id="c-mail" type="email" value={email} disabled readOnly className={inputClass} />
      </Field>
      <Field label={t("Téléphone", "Phone")} htmlFor="c-tel">
        <input
          id="c-tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label={t("Ville", "City")} htmlFor="c-ville">
        <input
          id="c-ville"
          autoComplete="address-level2"
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="primary" loading={saving}>
          {t("Enregistrer", "Save")}
        </Button>
      </div>
    </form>
  );
}

export default function ConciergeSettingsPage() {
  const t = useT();
  const notify = useNotify();
  const { isLoading, fullName, email, phone, city } = useAuthUser();

  if (isLoading) return <PageSkeleton kpis={0} rows={4} />;

  return (
    <>
      <PageHeader
        title={t("Paramètres", "Settings")}
        description={t("Votre profil et la langue de l'espace.", "Your profile and the workspace language.")}
      />
      <div className="grid max-w-3xl gap-6">
        <Card title={t("Photo de profil", "Profile photo")}>
          <AvatarUploader onMessage={(m) => notify(m)} />
        </Card>
        <Card title={t("Vos informations", "Your details")}>
          <ProfileForm
            initial={{ fullName: fullName ?? "", phone: phone ?? "", city: city ?? "" }}
            email={email ?? ""}
          />
        </Card>
        <Card title={t("Langue", "Language")} description={t("S'applique à tout l'espace.", "Applies to the whole workspace.")}>
          <LanguageSwitcher tone="light" />
        </Card>
        <Card title={t("Session", "Session")}>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="danger">
              {t("Déconnexion", "Log out")}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
