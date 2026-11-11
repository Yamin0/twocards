"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { AuthField, authInputClass, fieldProps } from "@/components/landing/auth-shell";
import { getAudienceSizes, getConciergeTypes, getVenueTypes } from "../_lib/signup-content";
import type { SignupForm } from "../_hooks/use-signup-form";
import { Choices } from "./choices";

/* Champs du formulaire de demande d'accès, par groupe : ceux du métier,
   ceux du compte, puis les facultatifs. Chaque champ garde son identifiant,
   son `autoComplete` et le clavier adapté sur téléphone. */

type Props = { f: SignupForm };

function InstagramField({ f, required }: Props & { required: boolean }) {
  const t = useT();
  return (
    <AuthField
      id="instagram"
      label="Instagram"
      hint={required ? undefined : t("facultatif", "optional")}
      error={f.errors.instagram}
    >
      <input
        {...fieldProps("instagram", f.errors.instagram)}
        required={required}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t("@nom_du_compte", "@account_name")}
        value={f.form.instagram}
        onChange={f.setField("instagram")}
        className={authInputClass}
      />
    </AuthField>
  );
}

function PhoneField({ f }: Props) {
  const t = useT();
  return (
    <AuthField id="phone" label={t("Téléphone", "Phone")} hint={t("facultatif", "optional")} error={f.errors.phone}>
      <input
        {...fieldProps("phone", f.errors.phone)}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+212 6 12 34 56 78"
        value={f.form.phone}
        onChange={f.setField("phone")}
        className={authInputClass}
      />
    </AuthField>
  );
}

/* Champs obligatoires propres au métier. Un concierge n'en a aucun. */
export function KindFields({ f }: Props) {
  const t = useT();
  const { kind, errors, form } = f;

  if (kind === "influenceur") return <InstagramField f={f} required />;
  if (kind !== "hotel" && kind !== "etablissement") return null;

  return (
    <>
      <AuthField
        id="venue-name"
        label={kind === "hotel" ? t("Nom de l'hôtel", "Hotel name") : t("Nom de l'établissement", "Venue name")}
        error={errors.venueName}
      >
        <input
          {...fieldProps("venue-name", errors.venueName)}
          required
          autoComplete="organization"
          placeholder={kind === "hotel" ? "Riad Palais Bleu" : "Le Grand Rooftop"}
          value={form.venueName}
          onChange={f.setField("venueName")}
          className={authInputClass}
        />
      </AuthField>
      <AuthField id="city" label={t("Ville", "City")} error={errors.city}>
        <input
          {...fieldProps("city", errors.city)}
          required
          autoComplete="address-level2"
          placeholder="Marrakech"
          value={form.city}
          onChange={f.setField("city")}
          className={authInputClass}
        />
      </AuthField>
      {kind === "etablissement" && (
        <Choices
          label={t("Type de lieu", "Type of venue")}
          name="venueType"
          options={getVenueTypes(t)}
          value={f.choices.venueType}
          onChange={f.setVenueType}
        />
      )}
    </>
  );
}

/* Coordonnées du compte : nom, e-mail, mot de passe. */
export function AccountFields({ f }: Props) {
  const t = useT();
  const { errors, form } = f;
  const [showPassword, setShowPassword] = useState(false);
  /* La consigne du mot de passe reste lue avec le champ, erreur ou non. */
  const passwordProps = fieldProps("password", errors.password);

  return (
    <>
      <AuthField id="fullname" label={t("Nom complet", "Full name")} error={errors.fullname}>
        <input
          {...fieldProps("fullname", errors.fullname)}
          required
          autoComplete="name"
          placeholder="Karim Bennani"
          value={form.fullname}
          onChange={f.setField("fullname")}
          className={authInputClass}
        />
      </AuthField>
      <AuthField id="email" label={t("E-mail professionnel", "Work email")} error={errors.email}>
        <input
          {...fieldProps("email", errors.email)}
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t("nom@entreprise.com", "name@company.com")}
          value={form.email}
          onChange={f.setField("email")}
          className={authInputClass}
        />
      </AuthField>
      <AuthField
        id="password"
        label={t("Mot de passe", "Password")}
        hint={<span id="password-hint">{t("8 caractères minimum", "At least 8 characters")}</span>}
        error={errors.password}
      >
        <div className="relative">
          <input
            {...passwordProps}
            aria-describedby={["password-hint", passwordProps["aria-describedby"]].filter(Boolean).join(" ")}
            required
            minLength={8}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={form.password}
            onChange={f.setField("password")}
            className={`${authInputClass} pr-24`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls="password"
            className="absolute right-0.5 top-1/2 flex h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg px-3 text-[13px] font-medium text-[var(--landing-ink)]/70 transition-colors hover:text-[var(--landing-ink)]"
          >
            {showPassword ? t("Masquer", "Hide") : t("Afficher", "Show")}
          </button>
        </div>
      </AuthField>
    </>
  );
}

/* Champs facultatifs du métier, montrés une fois le bloc déplié. */
export function OptionalFields({ f }: Props) {
  const t = useT();
  const { kind, errors, form } = f;
  const optional = t("facultatif", "optional");

  return (
    <>
      {kind === "hotel" && (
        <AuthField id="rooms" label={t("Nombre de chambres", "Number of rooms")} hint={optional} error={errors.rooms}>
          <input
            {...fieldProps("rooms", errors.rooms)}
            type="number"
            min={1}
            inputMode="numeric"
            autoComplete="off"
            placeholder="45"
            value={form.rooms}
            onChange={f.setField("rooms")}
            className={authInputClass}
          />
        </AuthField>
      )}

      {kind === "concierge" && (
        <>
          <Choices
            label={t("Vous travaillez comme", "You work as")}
            name="conciergeType"
            hint={optional}
            options={getConciergeTypes(t)}
            value={f.choices.conciergeType}
            onChange={f.setConciergeType}
          />
          <AuthField
            id="organization"
            label={t("Hôtel, conciergerie ou agence", "Hotel, concierge company or agency")}
            hint={optional}
          >
            <input
              id="organization"
              autoComplete="organization"
              placeholder="Royal Mansour"
              value={form.organization}
              onChange={f.setField("organization")}
              className={authInputClass}
            />
          </AuthField>
        </>
      )}

      {kind === "influenceur" && (
        <Choices
          label={t("Abonnés", "Followers")}
          name="audienceSize"
          hint={optional}
          options={getAudienceSizes(t)}
          value={f.choices.audienceSize}
          onChange={f.setAudienceSize}
        />
      )}

      {kind !== "influenceur" && <InstagramField f={f} required={false} />}
      <PhoneField f={f} />
    </>
  );
}
