"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadSvg } from "@/lib/qr";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Save,
} from "lucide-react";

/* Le portail de réservation directe de l'établissement : une page publique
   /r/[slug] hébergée par twocards (réseaux sociaux, bio Instagram, Google
   Business) et intégrable au site de l'établissement en iframe. Les
   réservations arrivent dans l'onglet Réservations, canal « direct »,
   sans commission — le canal direct est gratuit. */

type Portal = {
  slug: string;
  display_name: string;
  tagline: string;
  accent_color: string;
  party_max: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  active: boolean;
};

const ACCENTS = ["#13305c", "#0d0d0d", "#7c2d3a", "#1f6a4f", "#8a6d1d", "#4c3a8f"];
const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 ? "30" : "00"}`;
});

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export default function PortalAdminPage() {
  const { isLoading, venueName } = useAuthUser();
  const { toast, showToast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<"url" | "embed" | null>(null);
  const [form, setForm] = useState<Portal>({
    slug: "",
    display_name: "",
    tagline: "",
    accent_color: "#13305c",
    party_max: 8,
    start_time: "19:00",
    end_time: "01:00",
    interval_minutes: 30,
    active: true,
  });

  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("venue_portals")
      .select(
        "slug, display_name, tagline, accent_color, party_max, start_time, end_time, interval_minutes, active"
      )
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setForm(data as Portal);
          setExists(true);
        }
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Pré-remplissage au premier passage — ajustement d'état pendant le rendu
     plutôt qu'un effet, comme sur la page Paramètres. */
  const [prefilled, setPrefilled] = useState(false);
  if (loaded && !exists && !prefilled && venueName) {
    setPrefilled(true);
    if (!form.display_name) {
      setForm((f) => ({
        ...f,
        display_name: venueName,
        slug: slugify(venueName),
      }));
    }
  }

  const portalUrl = useMemo(
    () =>
      typeof window === "undefined" || !form.slug
        ? ""
        : `${window.location.origin}/r/${form.slug}`,
    [form.slug]
  );
  const embedCode = `<iframe src="${portalUrl}?embed=1" width="100%" height="760" style="border:0;border-radius:16px" title="Réserver — ${form.display_name}"></iframe>`;

  if (isLoading || !loaded) return <DashboardSkeleton />;

  const set = <K extends keyof Portal>(k: K, v: Portal[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const copy = async (text: string, which: "url" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      showToast("Impossible de copier");
    }
  };

  const save = async () => {
    if (!form.slug || form.slug.length < 3) {
      showToast("Adresse invalide : 3 caractères minimum");
      return;
    }
    if (!form.display_name.trim()) {
      showToast("Le nom affiché est requis");
      return;
    }
    setSaving(true);
    const { error } = await createClient()
      .from("venue_portals")
      .upsert(
        { ...form, display_name: form.display_name.trim() },
        { onConflict: "owner_id" }
      );
    setSaving(false);
    if (error) {
      showToast(
        error.code === "23505"
          ? "Cette adresse est déjà prise par un autre établissement"
          : "Impossible d'enregistrer"
      );
      return;
    }
    setExists(true);
    showToast("Portail enregistré — la page publique est à jour");
  };

  const input =
    "font-ui w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40";
  const label =
    "font-ui block text-[10px] font-bold uppercase tracking-[0.15em] text-white/45 mb-1.5";

  return (
    <div className="bg-transparent min-h-screen">
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="font-display text-3xl font-light text-white">
          Portail de réservation
        </h1>
        <p className="font-ui text-sm text-white/60 mt-1.5 max-w-2xl">
          Votre page de réservation directe, hébergée par twocards — à mettre
          en bio Instagram, sur Google et sur votre site (intégration iframe).
          Réservations sans commission : le canal direct est gratuit.
        </p>
      </div>

      <div className="px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Configuration ── */}
        <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-lg font-normal text-white">
            Configuration
          </h2>

          <div>
            <label className={label}>Nom affiché</label>
            <input
              className={input}
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              maxLength={80}
              placeholder="Jimmy'z Marrakech"
            />
          </div>

          <div>
            <label className={label}>Adresse de la page</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/40">/r/</span>
              <input
                className={input}
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                maxLength={40}
                placeholder="jimmyz-marrakech"
              />
            </div>
          </div>

          <div>
            <label className={label}>Phrase d&apos;accueil (facultatif)</label>
            <input
              className={input}
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              maxLength={160}
              placeholder="La nuit légendaire de l'Hivernage"
            />
          </div>

          <div>
            <label className={label}>Couleur d&apos;accent</label>
            <div className="flex items-center gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("accent_color", c)}
                  aria-label={`Couleur ${c}`}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.accent_color === c ? "border-white" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => set("accent_color", e.target.value)}
                aria-label="Couleur personnalisée"
                className="h-8 w-8 cursor-pointer rounded-full border border-white/20 bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Couverts max.</label>
              <select
                className={input}
                value={form.party_max}
                onChange={(e) => set("party_max", Number(e.target.value))}
              >
                {[4, 6, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n} className="bg-[#10131f]">
                    {n} personnes
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Créneaux toutes les</label>
              <select
                className={input}
                value={form.interval_minutes}
                onChange={(e) => set("interval_minutes", Number(e.target.value))}
              >
                {[15, 30, 60].map((n) => (
                  <option key={n} value={n} className="bg-[#10131f]">
                    {n} minutes
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Premier créneau</label>
              <select
                className={input}
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h} className="bg-[#10131f]">
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Dernier créneau</label>
              <select
                className={input}
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h} className="bg-[#10131f]">
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
            <button
              onClick={() => set("active", !form.active)}
              role="switch"
              aria-checked={form.active}
              className="flex items-center gap-2.5"
            >
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  form.active ? "bg-emerald-500/80" : "bg-white/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    form.active ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
              <span className="font-ui text-xs text-white/60">
                {form.active ? "Portail en ligne" : "Portail désactivé"}
              </span>
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="font-ui flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Save size={15} strokeWidth={1.5} />
              )}
              Enregistrer
            </button>
          </div>
        </div>

        {/* ── Partage ── */}
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6">
            <h2 className="font-display text-lg font-normal text-white mb-4">
              Partager
            </h2>
            {!exists ? (
              <p className="font-ui text-xs text-white/40 leading-relaxed">
                Enregistrez votre portail : son adresse publique, le code
                d&apos;intégration et le QR code apparaîtront ici.
              </p>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className={label}>
                    Page publique — réseaux sociaux, bio, Google
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono flex-1 truncate rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-xs text-white/70">
                      {portalUrl}
                    </p>
                    <button
                      onClick={() => copy(portalUrl, "url")}
                      aria-label="Copier l'adresse"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/15"
                    >
                      {copied === "url" ? (
                        <Check size={14} strokeWidth={2} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} strokeWidth={1.5} />
                      )}
                    </button>
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Ouvrir la page"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/15"
                    >
                      <ExternalLink size={14} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>

                <div>
                  <label className={label}>
                    Intégration sur votre site (iframe)
                  </label>
                  <div className="flex items-start gap-2">
                    <p className="font-mono flex-1 break-all rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-[10px] leading-relaxed text-white/50">
                      {embedCode}
                    </p>
                    <button
                      onClick={() => copy(embedCode, "embed")}
                      aria-label="Copier le code d'intégration"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/15"
                    >
                      {copied === "embed" ? (
                        <Check size={14} strokeWidth={2} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div
                    id="portal-qr"
                    className="rounded-xl bg-white p-3"
                  >
                    <QRCode value={portalUrl} size={96} />
                  </div>
                  <div>
                    <p className="font-ui text-xs text-white/60 leading-relaxed mb-2">
                      QR code de votre portail — cartes, vitrine, flyers.
                    </p>
                    <button
                      onClick={() => {
                        if (downloadSvg("portal-qr", `portail-${form.slug}`))
                          showToast("QR code téléchargé");
                      }}
                      className="font-ui flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Download size={13} strokeWidth={1.5} />
                      Télécharger (SVG)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="backdrop-blur-xl bg-black/35 border border-white/[0.12] rounded-2xl p-6">
            <h2 className="font-display text-lg font-normal text-white mb-2">
              Comment ça marche
            </h2>
            <ul className="font-ui space-y-2 text-xs text-white/50 leading-relaxed">
              <li className="flex gap-2">
                <Globe size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                Les réservations du portail arrivent dans votre onglet
                Réservations, marquées « direct » — sans commission, ce canal
                vous appartient.
              </li>
              <li className="flex gap-2">
                <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
                Assignez-les à une table : elles occupent votre plan de salle
                comme les réservations twocards.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-black/70 backdrop-blur-xl border border-white/15 text-white px-4 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="font-ui text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
