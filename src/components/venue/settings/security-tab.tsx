"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import {
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  Switch,
  inputClass,
  useNotify,
} from "@/components/app/ui";
import { deleteMailto } from "./settings-lib";
import type { VenueSettings } from "./use-venue-settings";

export function SecurityTab({ settings }: { settings: VenueSettings }) {
  const t = useT();
  const notify = useNotify();
  const { saving, savePassword } = settings;
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  /* Changement de mot de passe réel, via Supabase Auth. */
  const handlePasswordSave = async () => {
    if (newPw.length < 8) {
      notify(
        t(
          "Le mot de passe doit contenir au moins 8 caractères",
          "Your password must be at least 8 characters"
        ),
        "error"
      );
      return;
    }
    if (newPw !== confirmPw) {
      notify(t("Les mots de passe ne correspondent pas", "Passwords do not match"), "error");
      return;
    }
    const failure = await savePassword(newPw);
    if (failure) {
      notify(
        t(
          `Échec du changement de mot de passe : ${failure}`,
          `Could not change password: ${failure}`
        ),
        "error"
      );
      return;
    }
    setNewPw("");
    setConfirmPw("");
    notify(t("Mot de passe modifié", "Password updated"));
  };

  return (
    <div className="space-y-4">
      <Card title={t("Changer le mot de passe", "Change password")} bodyClassName="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("Nouveau mot de passe", "New password")} htmlFor="set-new-pw">
            <div className="relative">
              <input
                id="set-new-pw"
                type={showNewPw ? "text" : "password"}
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pr-12`}
              />
              <IconButton
                icon={showNewPw ? EyeOff : Eye}
                label={
                  showNewPw
                    ? t("Masquer le mot de passe", "Hide password")
                    : t("Afficher le mot de passe", "Show password")
                }
                aria-pressed={showNewPw}
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-0.5 top-1/2 -translate-y-1/2"
              />
            </div>
          </Field>
          <Field label={t("Confirmer", "Confirm")} htmlFor="set-confirm-pw">
            <input
              id="set-confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </Field>
        </div>
        <p className="text-[13px] text-ink-3">
          {t(
            "8 caractères minimum. Le changement s'applique immédiatement à votre compte.",
            "At least 8 characters. The change applies to your account immediately."
          )}
        </p>
        <div className="flex justify-end">
          <Button variant="primary" onClick={handlePasswordSave} loading={saving}>
            {saving ? t("Enregistrement…", "Saving…") : t("Changer le mot de passe", "Change password")}
          </Button>
        </div>
      </Card>

      {/* Sécurité avancée : pas encore de service derrière, on le dit. */}
      <Card
        title={t("Sécurité avancée", "Advanced security")}
        description={t(
          "L'authentification à deux facteurs et la gestion des sessions actives arrivent prochainement.",
          "Two-factor authentication and active session management are coming soon."
        )}
        actions={<Badge tone="info">{t("Bientôt disponible", "Coming soon")}</Badge>}
      >
        <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink-2">
              {t("Authentification à deux facteurs", "Two-factor authentication")}
            </p>
            <p className="mt-0.5 text-[13px] text-ink-3">
              {t("Une couche de sécurité supplémentaire.", "An extra layer of security.")}
            </p>
          </div>
          <Switch
            checked={false}
            disabled
            onChange={() => {}}
            label={t(
              "Authentification à deux facteurs (bientôt disponible)",
              "Two-factor authentication (coming soon)"
            )}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">{t("Supprimer le compte", "Delete account")}</h2>
            <p className="mt-0.5 max-w-md text-[13px] text-ink-3">
              {t(
                "Envoyez votre demande à notre support, la suppression est traitée sous 30 jours.",
                "Send your request to our support team. Deletion is handled within 30 days."
              )}
            </p>
          </div>
          <a
            href={deleteMailto(t)}
            className="inline-flex h-11 shrink-0 items-center rounded-xl px-1 text-sm font-bold text-danger underline-offset-4 hover:underline"
          >
            {t("Contacter le support", "Contact support")}
          </a>
        </div>
      </Card>
    </div>
  );
}
