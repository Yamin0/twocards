"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Eye,
  Loader2,
  LogIn,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatTimestamp } from "@/hooks/use-messaging";
import { startImpersonation } from "@/lib/impersonation";
import { cardClass, inputClass } from "@/components/app/ui";
import type { Translate } from "@/lib/i18n";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

/* Ligne d'un compte dans la console d'administration : fiche dépliable,
   modification du profil et du rôle, « se connecter en tant que ». */

export type Account = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  venue_name: string | null;
  city: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  conversation_count: number;
  message_count: number;
  unread_count: number;
};

export type ThreadMessage = {
  id: number;
  body: string;
  created_at: string;
  sender_id: string;
  conversation_id: string;
};

export const getRoleOptions = (t: Translate) => [
  { value: "etablissement", label: t("Établissement", "Venue") },
  { value: "hotel", label: t("Hôtel", "Hotel") },
  { value: "concierge", label: t("Concierge", "Concierge") },
];

export const panel = cardClass;
export const inputCls = inputClass;
export const labelCls = "mb-1 block text-xs text-ink-3";

export const initialsOfAccount = (a: Account) =>
  (a.venue_name || a.full_name || a.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function AccountRow({
  account,
  selfId,
  onSaved,
  onError,
}: {
  account: Account;
  selfId: string | null;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[] | null>(null);
  const [entering, setEntering] = useState(false);

  /* Pas soi-même, ni un autre administrateur : la visite est faite pour
     voir l'espace d'un établissement, d'un hôtel ou d'un concierge. */
  const canImpersonate = selfId !== null && account.id !== selfId && account.role !== "admin";

  const impersonate = async () => {
    setEntering(true);
    const message = await startImpersonation({ id: account.id });
    /* Succès : la page est déjà en train de basculer, on ne réactive pas
       le bouton. Échec : on affiche l'erreur et on rend la main. */
    if (message) {
      onError(message);
      setEntering(false);
    }
  };
  const [form, setForm] = useState({
    full_name: account.full_name ?? "",
    venue_name: account.venue_name ?? "",
    city: account.city ?? "",
    role: account.role,
  });

  const dirty =
    form.full_name !== (account.full_name ?? "") ||
    form.venue_name !== (account.venue_name ?? "") ||
    form.city !== (account.city ?? "") ||
    form.role !== account.role;

  /* Les échanges du compte, chargés à l'ouverture du panneau : l'admin lit
     tout (policy dédiée), mais n'écrit jamais à la place de quelqu'un. */
  useEffect(() => {
    if (!open || thread !== null || account.conversation_count === 0) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("conversations")
      .select("id")
      .or(`venue_id.eq.${account.id},concierge_id.eq.${account.id}`)
      .then(async ({ data: convs }) => {
        const ids = (convs ?? []).map((c) => c.id as string);
        if (ids.length === 0) {
          if (!cancelled) setThread([]);
          return;
        }
        const { data } = await supabase
          .from("messages")
          .select("id, body, created_at, sender_id, conversation_id")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
          .limit(30);
        if (!cancelled) setThread((data ?? []) as ThreadMessage[]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, thread, account.id, account.conversation_count]);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim() || null,
        venue_name: form.venue_name.trim() || null,
        city: form.city.trim() || null,
      })
      .eq("id", account.id);

    /* Le rôle passe par la fonction dédiée : elle met aussi à jour le JWT
       du compte visé, donc son routage vers le bon espace. */
    let roleError: string | null = null;
    if (form.role !== account.role) {
      const { error } = await supabase.rpc("admin_set_role", {
        target_id: account.id,
        new_role: form.role,
      });
      roleError = error?.message ?? null;
    }

    setSaving(false);
    if (updateError || roleError) {
      onError(roleError ?? t("La modification a été refusée.", "The change was rejected."));
      return;
    }
    onSaved(t("Compte mis à jour", "Account updated"));
  };

  return (
    <div className="rounded-2xl border border-line bg-fill">
      <div className="flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fill-2 text-xs font-bold text-ink">
          {initialsOfAccount(account)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {account.venue_name || account.full_name || t("Sans nom", "Unnamed")}
          </p>
          <p className="truncate text-xs text-ink-3">{account.email}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs text-ink-3">
            {account.conversation_count} conv. · {account.message_count} msg
          </p>
          <p className="text-xs text-ink-3">
            {account.last_sign_in_at
              ? t(
                  `Vu le ${new Date(account.last_sign_in_at).toLocaleDateString(intl)}`,
                  `Last seen ${new Date(account.last_sign_in_at).toLocaleDateString(intl)}`
                )
              : t("Jamais connecté", "Never logged in")}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {canImpersonate && (
        <button
          onClick={() => void impersonate()}
          disabled={entering}
          title={t("Ouvrir son dashboard, en lecture seule", "Open their dashboard, read-only")}
          className="mr-4 flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 text-xs font-semibold text-ink-2 transition-colors hover:bg-fill-2 hover:text-ink disabled:opacity-50"
        >
          {entering ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} strokeWidth={2} />}
          <span className="hidden sm:inline">{t("Voir son espace", "View workspace")}</span>
        </button>
      )}
      </div>

      {open && (
        <div className="space-y-4 border-t border-line p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>{t("Nom du responsable", "Manager name")}</span>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>{t("Enseigne", "Business name")}</span>
              <input
                value={form.venue_name}
                onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>{t("Ville", "City")}</span>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>{t("Type de dashboard", "Dashboard type")}</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={account.role === "admin"}
                className={`${inputCls} disabled:opacity-40`}
              >
                {(account.role === "admin"
                  ? [{ value: "admin", label: t("Administrateur", "Administrator") }]
                  : getRoleOptions(t)
                ).map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#1a1a2e]">
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <button
                onClick={() => void save()}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-link px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-link-strong disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} strokeWidth={2} />
                )}
                {t("Enregistrer", "Save")}
              </button>
            )}
            {canImpersonate && (
              <button
                onClick={() => void impersonate()}
                disabled={entering}
                className="flex items-center gap-2 rounded-lg border border-warn/25 bg-warn-soft px-4 py-2 text-xs font-semibold text-warn transition-colors hover:bg-warn-soft disabled:opacity-50"
              >
                {entering ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LogIn size={13} strokeWidth={2} />
                )}
                {t("Voir son espace (lecture seule)", "View workspace (read-only)")}
              </button>
            )}
          </div>

          <div className="rounded-xl border border-line bg-panel p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-3">
              <MessageSquare size={12} />
              {t("Échanges", "Messages")}
              {account.unread_count > 0 && (
                <span className="rounded-full bg-link px-1.5 text-xs text-white">
                  {t(
                    `${account.unread_count} non lu${account.unread_count > 1 ? "s" : ""}`,
                    `${account.unread_count} unread`
                  )}
                </span>
              )}
            </p>
            {account.conversation_count === 0 ? (
              <p className="py-2 text-xs text-ink-3">{t("Aucune conversation.", "No conversations.")}</p>
            ) : thread === null ? (
              <p className="py-2 text-xs text-ink-3">{t("Chargement…", "Loading…")}</p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto scrollbar-thin">
                {thread.map((m) => (
                  <div key={m.id} className="flex items-start gap-2 text-xs">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                        m.sender_id === account.id
                          ? "bg-info-soft text-info"
                          : "bg-fill-2 text-ink-3"
                      }`}
                    >
                      {m.sender_id === account.id ? t("envoyé", "sent") : t("reçu", "received")}
                    </span>
                    <p className="min-w-0 flex-1 break-words text-ink-2">
                      {m.body}
                    </p>
                    <span className="shrink-0 text-xs text-ink-3">
                      {formatTimestamp(m.created_at, locale)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
