"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadSvg } from "@/lib/qr";
import { useT } from "@/lib/i18n/client";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  ImagePlus,
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
  background_color: string;
  cover_url: string | null;
  party_max: number;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  active: boolean;
};

const ACCENTS = ["#13305c", "#0d0d0d", "#7c2d3a", "#1f6a4f", "#8a6d1d", "#4c3a8f"];
const BACKGROUNDS = ["#f5f5f4", "#ffffff", "#ece4d8", "#101726", "#0d0d0d", "#0e2a22"];
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
  const { isLoading, venueName, userId } = useAuthUser();
  const { toast, showToast } = useToast();
  const t = useT();
  const [loaded, setLoaded] = useState(false);
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<"url" | "embed" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Portal>({
    slug: "",
    display_name: "",
    tagline: "",
    accent_color: "#13305c",
    background_color: "#f5f5f4",
    cover_url: null,
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
        "slug, display_name, tagline, accent_color, background_color, cover_url, party_max, start_time, end_time, interval_minutes, active"
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
  const embedCode = `<iframe src="${portalUrl}?embed=1" width="100%" height="760" style="border:0;border-radius:16px" title="${t("Réserver", "Book")} · ${form.display_name}"></iframe>`;

  if (isLoading || !loaded) return <DashboardSkeleton />;

  const set = <K extends keyof Portal>(k: K, v: Portal[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const copy = async (text: string, which: "url" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      showToast(t("Impossible de copier", "Could not copy"));
    }
  };

  /* Couverture : image redimensionnée en webp côté navigateur, envoyée dans
     le bucket avatars sous le dossier de l'utilisateur (mêmes règles que la
     photo de profil). */
  const uploadCover = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("Choisissez une image", "Please choose an image"));
      return;
    }
    setUploading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/webp", 0.85)
      );
      const supabase = createClient();
      const path = `${userId}/portal-cover-${crypto.randomUUID()}.webp`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/webp" });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      set("cover_url", publicUrl);
      showToast(t("Couverture importée, pensez à enregistrer", "Cover uploaded. Remember to save"));
    } catch {
      showToast(t("L'envoi de l'image a échoué", "Image upload failed"));
    }
    setUploading(false);
  };

  const save = async () => {
    if (!form.slug || form.slug.length < 3) {
      showToast(t("Adresse invalide : 3 caractères minimum", "Invalid address: at least 3 characters"));
      return;
    }
    if (!form.display_name.trim()) {
      showToast(t("Le nom affiché est requis", "Display name is required"));
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
          ? t(
              "Cette adresse est déjà prise par un autre établissement",
              "This address is already taken by another venue"
            )
          : t("Impossible d'enregistrer", "Could not save")
      );
      return;
    }
    setExists(true);
    showToast(t("Portail enregistré, la page publique est à jour", "Portal saved. The public page is up to date"));
  };

  const input =
    "font-ui w-full rounded-xl bg-fill border border-line px-4 py-2.5 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-line-2";
  const label =
    "font-ui block text-xs font-bold text-ink-3 mb-1.5";

  return (
    <div className="bg-transparent min-h-screen">
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="font-display text-3xl font-light text-ink">
          {t("Portail de réservation", "Booking portal")}
        </h1>
        <p className="font-ui text-sm text-ink-2 mt-1.5 max-w-2xl">
          {t(
            "Votre page de réservation directe, hébergée par twocards, à mettre en bio Instagram, sur Google et sur votre site (intégration iframe). Réservations sans commission : le canal direct est gratuit.",
            "Your direct booking page, hosted by twocards, for your Instagram bio, Google and your website (iframe embed). Commission-free reservations: the direct channel is free."
          )}
        </p>
      </div>

      <div className="px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Configuration ── */}
        <div className=" bg-panel border border-line rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-lg font-normal text-ink">
            {t("Configuration", "Setup")}
          </h2>

          <div>
            <label className={label}>{t("Nom affiché", "Display name")}</label>
            <input
              className={input}
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              maxLength={80}
              placeholder="Jimmy'z Marrakech"
            />
          </div>

          <div>
            <label className={label}>{t("Adresse de la page", "Page address")}</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-3">/r/</span>
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
            <label className={label}>{t(<>Phrase d&apos;accueil (facultatif)</>, <>Welcome line (optional)</>)}</label>
            <input
              className={input}
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              maxLength={160}
              placeholder={t("La nuit légendaire de l'Hivernage", "Hivernage's legendary nights")}
            />
          </div>

          <div>
            <label className={label}>{t(<>Couleur d&apos;accent</>, <>Accent colour</>)}</label>
            <div className="flex items-center gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("accent_color", c)}
                  aria-label={`${t("Couleur", "Colour")} ${c}`}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.accent_color === c ? "border-line-2" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={form.accent_color}
                onChange={(e) => set("accent_color", e.target.value)}
                aria-label={t("Couleur personnalisée", "Custom colour")}
                className="h-8 w-8 cursor-pointer rounded-full border border-line-2 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className={label}>{t("Fond de la page", "Page background")}</label>
            <div className="flex items-center gap-2">
              {BACKGROUNDS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("background_color", c)}
                  aria-label={`${t("Fond", "Background")} ${c}`}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.background_color === c ? "border-line-2" : "border-line-2"
                  }`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={form.background_color}
                onChange={(e) => set("background_color", e.target.value)}
                aria-label={t("Fond personnalisé", "Custom background")}
                className="h-8 w-8 cursor-pointer rounded-full border border-line-2 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className={label}>{t("Photo de couverture (facultatif)", "Cover photo (optional)")}</label>
            {form.cover_url ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.cover_url}
                  alt={t("Couverture du portail", "Portal cover")}
                  className="h-16 w-28 rounded-lg object-cover border border-line-2"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="font-ui cursor-pointer text-xs font-medium text-info hover:text-info">
                    {t("Remplacer", "Replace")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadCover(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    onClick={() => set("cover_url", null)}
                    className="font-ui text-left text-xs text-ink-3 hover:text-danger"
                  >
                    {t("Retirer", "Remove")}
                  </button>
                </div>
              </div>
            ) : (
              <label className="font-ui flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-2 bg-fill px-4 py-4 text-xs text-ink-3 transition-colors hover:border-line-2 hover:text-ink">
                {uploading ? (
                  <Loader2 size={14} strokeWidth={2} className="animate-spin" />
                ) : (
                  <ImagePlus size={14} strokeWidth={1.5} />
                )}
                {uploading
                  ? t("Envoi en cours…", "Uploading…")
                  : t("Importer une image (bandeau en haut de la page)", "Upload an image (banner at the top of the page)")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCover(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t("Couverts max.", "Max. covers")}</label>
              <select
                className={input}
                value={form.party_max}
                onChange={(e) => set("party_max", Number(e.target.value))}
              >
                {[4, 6, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n} className="bg-panel">
                    {t(`${n} personnes`, `${n} guests`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>{t("Créneaux toutes les", "Time slots every")}</label>
              <select
                className={input}
                value={form.interval_minutes}
                onChange={(e) => set("interval_minutes", Number(e.target.value))}
              >
                {[15, 30, 60].map((n) => (
                  <option key={n} value={n} className="bg-panel">
                    {n} minutes
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>{t("Premier créneau", "First slot")}</label>
              <select
                className={input}
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h} className="bg-panel">
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>{t("Dernier créneau", "Last slot")}</label>
              <select
                className={input}
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h} className="bg-panel">
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <button
              onClick={() => set("active", !form.active)}
              role="switch"
              aria-checked={form.active}
              className="flex items-center gap-2.5"
            >
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  form.active ? "bg-ok-soft" : "bg-fill-3"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    form.active ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
              <span className="font-ui text-xs text-ink-2">
                {form.active ? t("Portail en ligne", "Portal live") : t("Portail désactivé", "Portal disabled")}
              </span>
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="font-ui flex items-center gap-2 bg-link hover:bg-link-strong text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Save size={15} strokeWidth={1.5} />
              )}
              {t("Enregistrer", "Save")}
            </button>
          </div>
        </div>

        {/* ── Partage ── */}
        <div className="space-y-4">
          <div className=" bg-panel border border-line rounded-2xl p-6">
            <h2 className="font-display text-lg font-normal text-ink mb-4">
              {t("Partager", "Share")}
            </h2>
            {!exists ? (
              <p className="font-ui text-xs text-ink-3 leading-relaxed">
                {t(
                  <>
                    Enregistrez votre portail : son adresse publique, le code
                    d&apos;intégration et le QR code apparaîtront ici.
                  </>,
                  <>Save your portal: its public address, embed code and QR code will appear here.</>
                )}
              </p>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className={label}>
                    {t("Page publique, réseaux sociaux, bio, Google", "Public page, social media, bio, Google")}
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono flex-1 truncate rounded-xl bg-panel border border-line px-3 py-2.5 text-xs text-ink-2">
                      {portalUrl}
                    </p>
                    <button
                      onClick={() => copy(portalUrl, "url")}
                      aria-label={t("Copier l'adresse", "Copy address")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3"
                    >
                      {copied === "url" ? (
                        <Check size={14} strokeWidth={2} className="text-ok" />
                      ) : (
                        <Copy size={14} strokeWidth={1.5} />
                      )}
                    </button>
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("Ouvrir la page", "Open page")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3"
                    >
                      <ExternalLink size={14} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>

                <div>
                  <label className={label}>
                    {t("Intégration sur votre site (iframe)", "Embed on your website (iframe)")}
                  </label>
                  <div className="flex items-start gap-2">
                    <p className="font-mono flex-1 break-all rounded-xl bg-panel border border-line px-3 py-2.5 text-xs leading-relaxed text-ink-3">
                      {embedCode}
                    </p>
                    <button
                      onClick={() => copy(embedCode, "embed")}
                      aria-label={t("Copier le code d'intégration", "Copy embed code")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fill-2 text-ink-2 hover:bg-fill-3"
                    >
                      {copied === "embed" ? (
                        <Check size={14} strokeWidth={2} className="text-ok" />
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
                    <p className="font-ui text-xs text-ink-2 leading-relaxed mb-2">
                      {t(
                        "QR code de votre portail, cartes, vitrine, flyers.",
                        "Your portal QR code, for cards, windows and flyers."
                      )}
                    </p>
                    <button
                      onClick={() => {
                        if (downloadSvg("portal-qr", `portail-${form.slug}`))
                          showToast(t("QR code téléchargé", "QR code downloaded"));
                      }}
                      className="font-ui flex items-center gap-2 bg-fill-2 hover:bg-fill-3 text-ink text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Download size={13} strokeWidth={1.5} />
                      {t("Télécharger (SVG)", "Download (SVG)")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className=" bg-panel border border-line rounded-2xl p-6">
            <h2 className="font-display text-lg font-normal text-ink mb-2">
              {t("Comment ça marche", "How it works")}
            </h2>
            <ul className="font-ui space-y-2 text-xs text-ink-3 leading-relaxed">
              <li className="flex gap-2">
                <Globe size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                {t(
                  "Les réservations du portail arrivent dans votre onglet Réservations, marquées « direct », sans commission, ce canal vous appartient.",
                  "Portal reservations land in your Reservations tab, tagged “direct”, commission-free. This channel is yours."
                )}
              </li>
              <li className="flex gap-2">
                <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0" />
                {t(
                  "Assignez-les à une table : elles occupent votre plan de salle comme les réservations twocards.",
                  "Assign them to a table: they fill your floor plan just like twocards reservations."
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-ink border border-line-2 text-white px-4 py-3 rounded-xl shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="font-ui text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
