"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Coins,
  Hotel,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatTimestamp } from "@/hooks/use-messaging";
import { startImpersonation } from "@/lib/impersonation";
import { CatalogAdmin } from "@/components/admin/catalog-admin";
import {
  CommissionsAdmin,
  currentPeriod,
  isDue,
  mad,
  type LedgerRow,
  type Settlement,
} from "@/components/admin/commissions-admin";

/* Console d'administration : le réseau vu d'en haut. Quatre onglets —
   la vue d'ensemble, les comptes (avec « se connecter en tant que »), le
   catalogue des adresses proposées aux clients des hôtels, et les
   commissions : qui doit combien à qui, et ce qui est réglé.

   La garde est en base — policies et fonctions exigent le drapeau admin du
   JWT (app_metadata, hors de portée du client) ; la page ne fait que
   refléter ce droit. */

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

type Tab = "overview" | "accounts" | "catalog" | "commissions";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: "accounts", label: "Comptes", icon: Users },
  { key: "catalog", label: "Catalogue", icon: BookOpen },
  { key: "commissions", label: "Commissions", icon: Coins },
];

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
  selfId,
  onSaved,
  onError,
}: {
  account: Account;
  selfId: string | null;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[] | null>(null);
  const [entering, setEntering] = useState(false);

  const canImpersonate = selfId !== null && account.id !== selfId;

  const impersonate = async () => {
    setEntering(true);
    const message = await startImpersonation({
      id: account.id,
      email: account.email,
      role: account.role,
    });
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
      onError(roleError ?? "La modification a été refusée.");
      return;
    }
    onSaved("Compte mis à jour");
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/5">
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

          <div className="flex flex-wrap items-center gap-2">
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
            {canImpersonate && (
              <button
                onClick={() => void impersonate()}
                disabled={entering}
                className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 disabled:opacity-50"
              >
                {entering ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LogIn size={13} strokeWidth={2} />
                )}
                Se connecter en tant que ce compte
              </button>
            )}
          </div>

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

const STATUS_TONE: Record<string, string> = {
  "en attente": "bg-amber-500/15 text-amber-300",
  confirmée: "bg-emerald-500/15 text-emerald-300",
  annulée: "bg-red-500/15 text-red-300",
  "no-show": "bg-white/10 text-white/50",
};

function Overview({
  accounts,
  ledger,
  settlements,
  onOpenTab,
}: {
  accounts: Account[] | null;
  ledger: LedgerRow[];
  settlements: Settlement[];
  onOpenTab: (t: Tab) => void;
}) {
  const now = currentPeriod();
  const byRole = (role: string) => (accounts ?? []).filter((a) => a.role === role).length;
  const thisMonth = ledger.filter((r) => r.period === now);
  const due = ledger.filter(isDue);
  const dueMonth = due.filter((r) => r.period === now);
  const settledKeys = new Set(settlements.map((s) => `${s.period}|${s.venue_owner_id}|${s.hotel_id}`));
  const remaining = due
    .filter((r) => !(r.venue_owner_id && r.hotel_id && settledKeys.has(`${r.period}|${r.venue_owner_id}|${r.hotel_id}`)))
    .reduce((s, r) => s + r.commission, 0);
  const pending = ledger.filter((r) => r.status === "en attente").length;
  const recent = [...ledger]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  const kpis = [
    { label: "Comptes", value: String(accounts?.length ?? "…"), hint: `${byRole("etablissement")} établ. · ${byRole("hotel")} hôtels · ${byRole("concierge")} concierges`, icon: Users, tab: "accounts" as Tab },
    { label: "Réservations ce mois", value: String(thisMonth.length), hint: `${ledger.length} au total · ${pending} en attente`, icon: CalendarDays, tab: "commissions" as Tab },
    { label: "Commissions ce mois", value: mad(dueMonth.reduce((s, r) => s + r.commission, 0)), hint: `${mad(dueMonth.reduce((s, r) => s + (r.amount_spent ?? 0), 0))} dépensés`, icon: Coins, tab: "commissions" as Tab },
    { label: "Restant à régler", value: mad(remaining), hint: "tous mois confondus", icon: Check, tab: "commissions" as Tab },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.label}
              type="button"
              onClick={() => onOpenTab(k.tab)}
              className={`${panel} p-4 text-left transition-colors hover:bg-white/[0.06] sm:p-5`}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Icon size={16} className="text-blue-300" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">{k.label}</p>
              <p className="mt-1 text-2xl font-light text-white tabular-nums">{k.value}</p>
              <p className="mt-0.5 text-[11px] text-white/40">{k.hint}</p>
            </button>
          );
        })}
      </div>

      <div className={`${panel} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Dernières réservations</h2>
            <p className="text-xs text-white/35">Toutes les demandes du réseau, les plus récentes en premier.</p>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/35">Aucune réservation pour le moment.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">
                    {r.guest_name}
                    <span className="text-white/45"> · {r.venue_name}</span>
                    {r.service_name && <span className="text-blue-300/80"> · {r.service_name}</span>}
                  </p>
                  <p className="text-xs text-white/40">
                    {new Date(`${r.reservation_date}T00:00:00`).toLocaleDateString("fr-FR")}
                    {r.hotel_name ? ` · via ${r.hotel_name}` : r.source === "portal" ? " · portail" : " · maison"}
                    {r.amount_spent !== null ? ` · ${mad(r.amount_spent)}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_TONE[r.status] ?? "bg-white/10 text-white/60"}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin, isLoading, email, userId } = useAuthUser();
  const [tab, setTab] = useState<Tab>("overview");
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);
  const [settlements, setSettlements] = useState<Settlement[] | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  /* Incrémenté par le flux temps réel : un montant saisi par un
     établissement ou un règlement noté relance la lecture, sans toast. */
  const [liveKey, setLiveKey] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    let cancelled = false;
    const supabase = createClient();
    Promise.all([
      supabase.rpc("admin_account_overview"),
      supabase.rpc("admin_commission_ledger"),
      supabase.from("commission_settlements").select("id, period, venue_owner_id, hotel_id, amount, note, settled_at"),
    ]).then(([acc, led, set]) => {
      if (cancelled) return;
      setAccounts((acc.data ?? []) as Account[]);
      setLedger((led.data ?? []) as LedgerRow[]);
      setSettlements((set.data ?? []) as Settlement[]);
      const failed = acc.error || led.error || set.error;
      setRefreshing((was) => {
        if (was) setToast(failed ? { kind: "error", msg: "Impossible d'actualiser" } : { kind: "ok", msg: "Données actualisées" });
        return false;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAdmin, reloadKey, liveKey]);

  /* Temps réel : réservations (montants, statuts) et règlements. Les
     événements arrivent en rafale à la saisie d'un montant ; on regroupe. */
  useEffect(() => {
    if (isLoading || !isAdmin) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setLiveKey((k) => k + 1), 400);
    };
    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "qr_reservations" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "commission_settlements" }, bump)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [isLoading, isAdmin]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const refresh = useCallback(() => {
    setRefreshing(true);
    reload();
  }, [reload]);
  const notifyOk = useCallback(
    (msg: string) => {
      setToast({ kind: "ok", msg });
      reload();
    },
    [reload]
  );
  const notifyError = useCallback((msg: string) => setToast({ kind: "error", msg }), []);

  const q = search.trim().toLowerCase();
  const filteredAccounts = useMemo(
    () =>
      (accounts ?? []).filter(
        (a) =>
          !q ||
          a.email.toLowerCase().includes(q) ||
          (a.venue_name ?? "").toLowerCase().includes(q) ||
          (a.full_name ?? "").toLowerCase().includes(q) ||
          (a.city ?? "").toLowerCase().includes(q)
      ),
    [accounts, q]
  );

  const ready = !isLoading && isAdmin;

  return (
    <div className="tc-shell min-h-screen bg-[#141210]">
      <div
        className="tc-app-bg fixed inset-0 scale-105 bg-cover bg-center blur-sm"
        style={{ backgroundImage: "url(/dashboard-bg-ocean.jpg)" }}
      />
      <div className="tc-app-bg fixed inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-4 p-4 lg:p-8">
        {/* En-tête */}
        <div className={`${panel} flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
              <Shield size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Administration</h1>
              <p className="text-sm text-white/40">
                {accounts
                  ? `${accounts.length} comptes · ${ledger?.length ?? 0} réservations sur le réseau`
                  : "Le réseau twocards, vu d'en haut"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                onClick={refresh}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Actualisation…" : "Actualiser"}
              </button>
            )}
            {email && (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:border-red-400/30 hover:bg-red-500/15 hover:text-red-200"
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Gardes */}
        {isLoading && (
          <div className={`${panel} p-10 text-center text-sm text-white/40`}>Chargement…</div>
        )}
        {!isLoading && !isAdmin && (
          <div className={`${panel} p-10 text-center`}>
            <p className="text-sm font-semibold text-white/70">Accès réservé à l&apos;administrateur.</p>
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

        {/* Onglets */}
        {ready && (
          <div className={`${panel} no-scrollbar flex gap-1 overflow-x-auto p-1.5`}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active ? "bg-white text-black" : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {ready && tab === "overview" && (
          <Overview accounts={accounts} ledger={ledger ?? []} settlements={settlements ?? []} onOpenTab={setTab} />
        )}

        {ready && tab === "catalog" && (
          <CatalogAdmin userId={userId} panel={panel} onSaved={notifyOk} onError={notifyError} reloadKey={reloadKey} />
        )}

        {ready && tab === "commissions" && (
          ledger === null || settlements === null ? (
            <div className={`${panel} p-10 text-center text-sm text-white/40`}>Chargement…</div>
          ) : (
            <CommissionsAdmin ledger={ledger} settlements={settlements} panel={panel} onChanged={notifyOk} onError={notifyError} />
          )
        )}

        {ready && tab === "accounts" && (
          <>
            <div className={`${panel} p-3`}>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un compte : enseigne, e-mail, ville…"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const rows = filteredAccounts.filter((a) => a.role === section.role);
              if (section.role === "admin" && rows.length === 0) return null;
              if (q && rows.length === 0) return null;
              return (
                <div key={section.role} className={`${panel} p-5 sm:p-6`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                        <Icon size={17} className="text-blue-300" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                        <p className="text-xs text-white/35">
                          {accounts === null ? "Chargement…" : `${rows.length} compte${rows.length > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                    {section.role !== "admin" && (
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
                    <p className="py-6 text-center text-sm text-white/35">Aucun compte de ce type.</p>
                  )}
                  <div className="space-y-2">
                    {rows.map((a) => (
                      <AccountRow
                        key={`${a.id}-${a.role}-${a.venue_name}-${a.full_name}-${a.city}`}
                        account={a}
                        selfId={userId}
                        onSaved={notifyOk}
                        onError={notifyError}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium backdrop-blur-xl ${
            toast.kind === "ok"
              ? "border-white/20 bg-white/15 text-white"
              : "border-red-400/30 bg-red-500/15 text-red-200"
          }`}
        >
          {toast.kind === "ok" ? <Check size={16} className="text-blue-400" /> : <X size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
