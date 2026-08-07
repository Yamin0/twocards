"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Check,
  Hotel,
  Loader2,
  RefreshCw,
  Shield,
  UserCheck,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { initialsOf, type Profile } from "@/hooks/use-messaging";

/* Panneau d'administration : tous les comptes de la plateforme, groupés par
   type de dashboard, consultables et modifiables. La garde réelle est en
   base — policy de mise à jour et fonction de changement de rôle exigent le
   drapeau admin du JWT (app_metadata, non modifiable côté client) ; la
   page ne fait que refléter ce droit. */

type EditableProfile = Profile & { created_at?: string };

const SECTIONS: {
  role: string;
  title: string;
  icon: typeof Building2;
  home: string;
}[] = [
  { role: "etablissement", title: "Établissements", icon: Building2, home: "/dashboard" },
  { role: "hotel", title: "Hôtels", icon: Hotel, home: "/hotel" },
  { role: "concierge", title: "Concierges", icon: UserCheck, home: "/concierge" },
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

function AccountCard({
  profile,
  onSaved,
  onError,
}: {
  profile: EditableProfile;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    venue_name: profile.venue_name ?? "",
    city: profile.city ?? "",
    role: profile.role,
  });
  const [saving, setSaving] = useState(false);

  const dirty =
    form.full_name !== (profile.full_name ?? "") ||
    form.venue_name !== (profile.venue_name ?? "") ||
    form.city !== (profile.city ?? "") ||
    form.role !== profile.role;

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
      .eq("id", profile.id);

    /* Le rôle passe par la fonction dédiée : elle synchronise aussi le JWT
       du compte (routage du middleware), pas seulement l'annuaire. */
    let roleError: string | null = null;
    if (form.role !== profile.role) {
      const { error: rpcError } = await supabase.rpc("admin_set_role", {
        target_id: profile.id,
        new_role: form.role,
      });
      roleError = rpcError?.message ?? null;
    }

    setSaving(false);
    if (updateError || roleError) {
      onError(roleError ?? "La modification a été refusée.");
      return;
    }
    onSaved("Compte mis à jour");
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
          {initialsOf(profile)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {profile.venue_name || profile.full_name || "Sans nom"}
          </p>
          {profile.created_at && (
            <p className="text-[11px] text-white/35">
              Inscrit le{" "}
              {new Date(profile.created_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/30">
            Nom du responsable
          </span>
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/30">
            Enseigne
          </span>
          <input
            value={form.venue_name}
            onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/30">
            Ville
          </span>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/30">
            Type de dashboard
          </span>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputCls}
          >
            {ROLE_OPTIONS.map((r) => (
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
          className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} strokeWidth={2} />
          )}
          Enregistrer
        </button>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin, isLoading, email } = useAuthUser();
  const [profiles, setProfiles] = useState<EditableProfile[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<"ok" | "error">("ok");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("profiles")
      .select("id, full_name, role, venue_name, city, created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setProfiles((data ?? []) as EditableProfile[]);
      });

    /* Les inscriptions apparaissent en direct, comme sur l'annuaire. */
    const channel = supabase
      .channel("admin-profiles")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const p = payload.new as EditableProfile;
          setProfiles((prev) =>
            !prev || prev.some((x) => x.id === p.id) ? prev : [...prev, p]
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isLoading, isAdmin, reloadKey]);

  const notifyOk = (msg: string) => {
    setToastKind("ok");
    setToast(msg);
    setReloadKey((k) => k + 1);
  };
  const notifyError = (msg: string) => {
    setToastKind("error");
    setToast(msg);
  };

  return (
    <div className="min-h-screen bg-[#141210]">
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/dashboard-bg.jpg)" }}
      />
      <div className="fixed inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
        {/* ── En-tête ── */}
        <div className={`${panel} flex items-center justify-between p-6`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
              <Shield size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white font-[family-name:var(--font-manrope)]">
                Administration
              </h1>
              <p className="text-sm text-white/40">
                {profiles
                  ? `${profiles.length} comptes sur la plateforme`
                  : "Tous les comptes de la plateforme"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setReloadKey((k) => k + 1)}
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
                : "Connectez-vous avec le compte administrateur."}
            </p>
            <Link
              href={email ? "/" : "/login"}
              className="mt-5 inline-block rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-600"
            >
              {email ? "Retour à l'accueil" : "Se connecter"}
            </Link>
          </div>
        )}

        {/* ── Sections par type de dashboard ── */}
        {!isLoading &&
          isAdmin &&
          SECTIONS.map((section) => {
            const Icon = section.icon;
            const accounts = (profiles ?? []).filter(
              (p) => p.role === section.role
            );
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
                        {profiles === null
                          ? "Chargement…"
                          : `${accounts.length} compte${accounts.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={section.home}
                    className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40 transition-colors hover:text-white"
                  >
                    Ouvrir cet espace
                    <ArrowUpRight size={12} />
                  </Link>
                </div>

                {profiles !== null && accounts.length === 0 && (
                  <p className="py-6 text-center text-sm text-white/35">
                    Aucun compte de ce type.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {accounts.map((p) => (
                    <AccountCard
                      key={`${p.id}-${p.role}-${p.full_name}-${p.venue_name}-${p.city}`}
                      profile={p}
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
            toastKind === "ok"
              ? "border-white/20 bg-white/15 text-white"
              : "border-red-400/30 bg-red-500/15 text-red-200"
          }`}
        >
          {toastKind === "ok" ? (
            <Check size={16} className="text-blue-400" />
          ) : (
            <X size={16} />
          )}
          {toast}
        </div>
      )}
    </div>
  );
}
