"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Hotel,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { CatalogAdmin } from "@/components/admin/catalog-admin";
import {
  CommissionsAdmin,
  type LedgerRow,
  type Settlement,
} from "@/components/admin/commissions-admin";
import { Button, PageHeader, PageSkeleton, cardClass, inputClass, useNotify } from "@/components/app/ui";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import { AccountRow, type Account } from "@/components/admin/account-row";
import { Overview, type Tab } from "@/components/admin/overview";

/* Console d'administration : le réseau vu d'en haut. Quatre onglets —
   la vue d'ensemble, les comptes (avec « se connecter en tant que »), le
   catalogue des adresses proposées aux clients des hôtels, et les
   commissions : qui doit combien à qui, et ce qui est réglé.

   La garde est en base — policies et fonctions exigent le drapeau admin du
   JWT (app_metadata, hors de portée du client) ; la page ne fait que
   refléter ce droit. */


/* La vue courante vit dans l'URL (`/admin?vue=comptes`) : elle survit au
   rechargement et se partage. */
const VUE_TO_TAB: Record<string, Tab> = { comptes: "accounts", catalogue: "catalog", commissions: "commissions" };
const TAB_TO_VUE: Record<Tab, string> = { overview: "", accounts: "comptes", catalog: "catalogue", commissions: "commissions" };

const getSections = (t: Translate) => [
  { role: "etablissement", title: t("Établissements", "Venues"), icon: Building2 },
  { role: "hotel", title: t("Hôtels", "Hotels"), icon: Hotel },
  { role: "concierge", title: t("Concierges", "Concierges"), icon: UserCheck },
  { role: "admin", title: t("Administration", "Admin"), icon: Shield },
];

const panel = cardClass;
const inputCls = inputClass;

function AdminConsole() {
  const { isAdmin, isLoading, email, userId } = useAuthUser();
  const t = useT();
  const router = useRouter();
  const notify = useNotify();
  const params = useSearchParams();
  const vue = params.get("vue");
  /* `?type=hotel` (menu « Voir un espace ») : n'affiche que ce type. */
  const typeFilter = params.get("type");
  const tab: Tab = (vue && VUE_TO_TAB[vue]) || "overview";
  const setTab = useCallback(
    (next: Tab) => router.push(next === "overview" ? "/admin" : `/admin?vue=${TAB_TO_VUE[next]}`),
    [router]
  );
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);
  const [settlements, setSettlements] = useState<Settlement[] | null>(null);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  /* Incrémenté par le flux temps réel : un montant saisi par un
     établissement ou un règlement noté relance la lecture, sans toast. */
  const [liveKey, setLiveKey] = useState(0);

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
        if (was)
          notify(
            failed ? t("Impossible d'actualiser", "Couldn’t refresh") : t("Données actualisées", "Data refreshed"),
            failed ? "error" : "success"
          );
        return false;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAdmin, reloadKey, liveKey, t, notify]);

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
      notify(msg);
      reload();
    },
    [reload, notify]
  );
  const notifyError = useCallback((msg: string) => notify(msg, "error"), [notify]);

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

  const titles: Record<Tab, string> = {
    overview: t("Vue d'ensemble", "Overview"),
    accounts: t("Comptes", "Accounts"),
    catalog: t("Catalogue", "Catalogue"),
    commissions: t("Commissions", "Commissions"),
  };

  return (
    <>
        <PageHeader
          title={titles[tab]}
          description={
            accounts
              ? t(
                  `${accounts.length} comptes · ${ledger?.length ?? 0} réservations sur le réseau`,
                  `${accounts.length} accounts · ${ledger?.length ?? 0} reservations across the network`
                )
              : t("Le réseau twocards, vu d'en haut", "The twocards network at a glance")
          }
          actions={
            isAdmin && (
              <Button icon={RefreshCw} onClick={refresh} loading={refreshing}>
                {refreshing ? t("Actualisation…", "Refreshing…") : t("Actualiser", "Refresh")}
              </Button>
            )
          }
        />

        {/* Gardes */}
        {isLoading && (
          <div className={`${panel} p-10 text-center text-sm text-ink-3`}>{t("Chargement…", "Loading…")}</div>
        )}
        {!isLoading && !isAdmin && (
          <div className={`${panel} p-10 text-center`}>
            <p className="text-sm font-semibold text-ink-2">{t("Accès réservé à l'administrateur.", "Admin access only.")}</p>
            <p className="mt-2 text-xs text-ink-3">
              {email
                ? t(`Le compte ${email} n'a pas le drapeau administrateur.`, `The account ${email} doesn’t have admin rights.`)
                : t("Connectez-vous avec l'identifiant administrateur.", "Log in with the admin credentials.")}
            </p>
            <a
              href={email ? "/" : "/login"}
              className="mt-5 inline-block rounded-xl bg-link px-5 py-2.5 text-xs font-semibold text-white hover:bg-link-strong"
            >
              {email ? t("Retour à l'accueil", "Back to home") : t("Se connecter", "Log in")}
            </a>
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
            <div className={`${panel} p-10 text-center text-sm text-ink-3`}>{t("Chargement…", "Loading…")}</div>
          ) : (
            <CommissionsAdmin ledger={ledger} settlements={settlements} panel={panel} onChanged={notifyOk} onError={notifyError} />
          )
        )}

        {ready && tab === "accounts" && (
          <>
            <div className={`${panel} p-3`}>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Rechercher un compte : enseigne, e-mail, ville…", "Search accounts: business name, email, city…")}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <p className="px-1 text-xs text-ink-3">
              {t(
                "« Voir son espace » ouvre le dashboard réel d'un compte, en lecture seule. Un bandeau permet de revenir ici.",
                "“View workspace” opens an account’s real dashboard, read-only. A banner brings you back here."
              )}
            </p>
            {getSections(t)
              .filter((section) => !typeFilter || section.role === typeFilter)
              .map((section) => {
              const Icon = section.icon;
              const rows = filteredAccounts.filter((a) => a.role === section.role);
              if (section.role === "admin" && rows.length === 0) return null;
              if (q && rows.length === 0) return null;
              return (
                <div key={section.role} className={`${panel} p-5 sm:p-6`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fill-2">
                        <Icon size={17} className="text-info" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                        <p className="text-xs text-ink-3">
                          {accounts === null
                            ? t("Chargement…", "Loading…")
                            : t(`${rows.length} compte${rows.length > 1 ? "s" : ""}`, `${rows.length} account${rows.length === 1 ? "" : "s"}`)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {accounts !== null && rows.length === 0 && (
                    <p className="py-6 text-center text-sm text-ink-3">{t("Aucun compte de ce type.", "No accounts of this type.")}</p>
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
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<PageSkeleton kpis={4} rows={5} />}>
      <AdminConsole />
    </Suspense>
  );
}
