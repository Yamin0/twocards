"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  Hotel,
  Loader2,
  MessageSquare,
  RefreshCw,
  Shield,
  UserCheck,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatTimestamp } from "@/hooks/use-messaging";

/* Console d'administration : tous les comptes de la plateforme, leur
   activité réelle et leurs échanges. La garde est en base — policies et
   fonctions exigent le drapeau admin du JWT (app_metadata, hors de portée
   du client) ; la page ne fait que refléter ce droit. */

type Account = {
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

type ThreadMessage = {
  id: number;
  body: string;
  created_at: string;
  sender_id: string;
  conversation_id: string;
};

const SECTIONS = [
  { role: "etablissement", title: "Établissements", icon: Building2, home: "/dashboard" },
  { role: "hotel", title: "Hôtels", icon: Hotel, home: "/hotel" },
  { role: "concierge", title: "Concierges", icon: UserCheck, home: "/concierge" },
  { role: "admin", title: "Administration", icon: Shield, home: "/admin" },
];

const ROLE_OPTIONS = [
  { value: "etablissement", label: "Établissement" },
  { value: "hotel", label: "Hôtel" },
  { value: "concierge", label: "Concierge" },
];

const panel =
  "backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl";
const inputCls =
  "w-full rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-blue-400/40 focus:outline-none";
const labelCls = "mb-1 block text-[10px] uppercase tracking-wider text-white/30";

const initialsOfAccount = (a: Account) =>
  (a.venue_name || a.full_name || a.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

function AccountRow({
  account,
  onSaved,
  onError,
}: {
  account: Account;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[] | null>(null);
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
      onError(roleError ?? "La modification a été refusée.");
      return;
    }
    onSaved("Compte mis à jour");
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/5">
      {/* En-tête cliquable */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
          {initialsOfAccount(account)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {account.venue_name || account.full_name || "Sans nom"}
          </p>
          <p className="truncate text-[11px] text-white/40">{account.email}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[11px] text-white/50">
            {account.conversation_count} conv. · {account.message_count} msg
          </p>
          <p className="text-[10px] text-white/30">
            {account.last_sign_in_at
              ? `Vu le ${new Date(account.last_sign_in_at).toLocaleDateString("fr-FR")}`
              : "Jamais connecté"}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/[0.08] p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Nom du responsable</span>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Enseigne</span>
              <input
                value={form.venue_name}
                onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Ville</span>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Type de dashboard</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={account.role === "admin"}
                className={`${inputCls} disabled:opacity-40`}
              >
                {(account.role === "admin"
                  ? [{ value: "admin", label: "Administrateur" }]
                  : ROLE_OPTIONS
                ).map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#1a1a2e]">
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {dirty && (
            <button
              onClick={() => void save()}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} strokeWidth={2} />
              )}
              Enregistrer
            </button>
          )}

          {/* Échanges du compte */}
          <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              <MessageSquare size={12} />
              Échanges
              {account.unread_count > 0 && (
                <span className="rounded-full bg-blue-500 px-1.5 text-[10px] text-white">
                  {account.unread_count} non lu
                  {account.unread_count > 1 ? "s" : ""}
                </span>
              )}
            </p>
            {account.conversation_count === 0 ? (
              <p className="py-2 text-xs text-white/30">Aucune conversation.</p>
            ) : thread === null ? (
              <p className="py-2 text-xs text-white/30">Chargement…</p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto scrollbar-thin">
                {thread.map((m) => (
                  <div key={m.id} className="flex items-start gap-2 text-xs">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                        m.sender_id === account.id
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {m.sender_id === account.id ? "envoyé" : "reçu"}
                    </span>
                    <p className="min-w-0 flex-1 break-words text-white/70">
                      {m.body}
                    </p>
                    <span className="shrink-0 text-[10px] text-white/25">
                      {formatTimestamp(m.created_at)}
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

export default function AdminPage() {
  const { isAdmin, isLoading, email } = useAuthUser();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "error"; msg: string } | null>(
    null
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    let cancelled = false;
    createClient()
      .rpc("admin_account_overview")
      .then(({ data }) => {
        if (!cancelled) setAccounts((data ?? []) as Account[]);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAdmin, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const notifyOk = useCallback(
    (msg: string) => {
      setToast({ kind: "ok", msg });
      reload();
    },
    [reload]
  );
  const notifyError = useCallback(
    (msg: string) => setToast({ kind: "error", msg }),
    []
  );

  /* Les messages sont comptés par expéditeur : les additionner donne le
     total réel des échanges, sans double comptage. */
  const totals = accounts
    ? {
        comptes: accounts.length,
        messages: accounts.reduce((s, a) => s + a.message_count, 0),
      }
    : null;

  return (
    <div className="min-h-screen bg-[#141210]">
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/dashboard-bg.jpg)" }}
      />
      <div className="fixed inset-0 bg-black/55" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        {/* ── En-tête ── */}
        <div className={`${panel} flex flex-wrap items-center justify-between gap-4 p-6`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
              <Shield size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
                Administration
              </h1>
              <p className="text-sm text-white/40">
                {totals
                  ? `${totals.comptes} comptes · ${totals.messages} messages échangés`
                  : "Tous les comptes de la plateforme"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={reload}
              className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
            >
              <RefreshCw size={14} />
              Actualiser
            </button>
          )}
        </div>

        {/* ── Gardes ── */}
        {isLoading && (
          <div className={`${panel} p-10 text-center text-sm text-white/40`}>
            Chargement…
          </div>
        )}
        {!isLoading && !isAdmin && (
          <div className={`${panel} p-10 text-center`}>
            <p className="text-sm font-semibold text-white/70">
              Accès réservé à l&apos;administrateur.
            </p>
            <p className="mt-2 text-xs text-white/40">
              {email
                ? `Le compte ${email} n'a pas le drapeau administrateur.`
                : "Connectez-vous avec l'identifiant administrateur."}
            </p>
            <a
              href={email ? "/" : "/login"}
              className="mt-5 inline-block rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
            >
              {email ? "Retour à l'accueil" : "Se connecter"}
            </a>
          </div>
        )}

        {/* ── Sections par type de dashboard ── */}
        {!isLoading &&
          isAdmin &&
          SECTIONS.map((section) => {
            const Icon = section.icon;
            const rows = (accounts ?? []).filter((a) => a.role === section.role);
            if (section.role === "admin" && rows.length === 0) return null;
            return (
              <div key={section.role} className={`${panel} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                      <Icon size={17} className="text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white font-[family-name:var(--font-manrope)]">
                        {section.title}
                      </h2>
                      <p className="text-xs text-white/35">
                        {accounts === null
                          ? "Chargement…"
                          : `${rows.length} compte${rows.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  {section.role !== "admin" && (
                    /* Balise <a> : /hotel peut ne pas exister dans l'arbre
                       déployé, les routes typées feraient échouer le build. */
                    <a
                      href={section.home}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/60 transition-colors hover:bg-white/[0.12] hover:text-white"
                    >
                      Ouvrir cet espace
                      <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>

                {accounts !== null && rows.length === 0 && (
                  <p className="py-6 text-center text-sm text-white/35">
                    Aucun compte de ce type.
                  </p>
                )}
                <div className="space-y-2">
                  {rows.map((a) => (
                    <AccountRow
                      key={`${a.id}-${a.role}-${a.venue_name}-${a.full_name}-${a.city}`}
                      account={a}
                      onSaved={notifyOk}
                      onError={notifyError}
                    />
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium backdrop-blur-xl ${
            toast.kind === "ok"
              ? "border-white/20 bg-white/15 text-white"
              : "border-red-400/30 bg-red-500/15 text-red-200"
          }`}
        >
          {toast.kind === "ok" ? (
            <Check size={16} className="text-blue-400" />
          ) : (
            <X size={16} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
