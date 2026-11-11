"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, Field, InfoNote, Modal, Segmented, inputClass } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

type CreateMode = "un" | "plusieurs" | "serie";

const getSuggested = (t: Translate) => [
  "Lobby",
  t("Réception", "Reception"),
  "Spa",
  t("Piscine", "Pool"),
  "Rooftop",
  "Restaurant",
  "Bar",
  t("Conciergerie", "Concierge"),
];

/* Série « Chambre 101 → 120 » : le préfixe est conservé, le numéro
   incrémenté, le zéro initial respecté (« 01 » → « 02 »). */
function expandSeries(prefix: string, from: string, to: string) {
  const a = Number(from);
  const b = Number(to);
  if (!from || !to || !Number.isInteger(a) || !Number.isInteger(b) || b < a || b - a > 200) return [];
  const width = from.startsWith("0") ? from.length : 0;
  const out: string[] = [];
  for (let n = a; n <= b; n++) {
    out.push(`${prefix.trim()} ${String(n).padStart(width, "0")}`.trim());
  }
  return out;
}

/* Création d'un ou plusieurs QR codes : un seul, une liste, ou une série
   numérotée. Les libellés déjà pris sont écartés. */
export function CreateQrDialog({
  open,
  onClose,
  existing,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  existing: string[];
  onCreate: (labels: string[]) => Promise<boolean>;
}) {
  const t = useT();
  const [mode, setMode] = useState<CreateMode>("un");
  const [label, setLabel] = useState("");
  const [bulk, setBulk] = useState("");
  const [prefix, setPrefix] = useState(() => t("Chambre", "Room"));
  const [from, setFrom] = useState("101");
  const [to, setTo] = useState("110");
  const [saving, setSaving] = useState(false);

  const existingSet = useMemo(() => new Set(existing.map((l) => l.trim().toLowerCase())), [existing]);

  const labels = useMemo(() => {
    const raw =
      mode === "un" ? [label] : mode === "plusieurs" ? bulk.split(/\n|,|;/) : expandSeries(prefix, from, to);
    return [...new Set(raw.map((l) => l.trim()).filter(Boolean))];
  }, [mode, label, bulk, prefix, from, to]);
  const duplicates = labels.filter((l) => existingSet.has(l.toLowerCase()));
  const fresh = labels.filter((l) => !existingSet.has(l.toLowerCase()));

  const submit = async () => {
    if (fresh.length === 0 || saving) return;
    setSaving(true);
    const ok = await onCreate(fresh);
    setSaving(false);
    if (ok) {
      setLabel("");
      setBulk("");
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Nouveau QR code", "New QR code")}
      description={t(
        "Un QR par chambre ou par espace. Le menu proposé se règle ensuite, emplacement par emplacement.",
        "One QR per room or area. You can then set the menu offered, location by location."
      )}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Annuler", "Cancel")}
          </Button>
          <Button variant="primary" icon={Plus} onClick={submit} loading={saving} disabled={fresh.length === 0}>
            {fresh.length > 1
              ? t(`Créer ${fresh.length} QR codes`, `Create ${fresh.length} QR codes`)
              : t("Créer le QR code", "Create QR code")}
          </Button>
        </>
      }
    >
      <Segmented<CreateMode>
        label={t("Mode de création", "Creation mode")}
        value={mode}
        onChange={setMode}
        className="mb-5"
        options={[
          { value: "un", label: t("Un seul", "Single") },
          { value: "plusieurs", label: t("Plusieurs", "Several") },
          { value: "serie", label: t("Série numérotée", "Numbered series") },
        ]}
      />

      {mode === "un" && (
        <div className="space-y-4">
          <Field label={t("Nom de l'emplacement", "Location name")} htmlFor="qr-label">
            <input
              id="qr-label"
              data-autofocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("Chambre 204, Suite Atlas, Lobby…", "Room 204, Atlas Suite, Lobby…")}
              maxLength={60}
              className={inputClass}
            />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-bold text-ink-2">{t("Suggestions", "Suggestions")}</p>
            <div className="flex flex-wrap gap-2">
              {getSuggested(t)
                .filter((s) => !existingSet.has(s.toLowerCase()))
                .map((s) => (
                  <Button key={s} size="sm" onClick={() => setLabel(s)}>
                    {s}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      )}

      {mode === "plusieurs" && (
        <Field
          label={t("Un emplacement par ligne", "One location per line")}
          hint={t(
            "Vous pouvez aussi séparer par des virgules. Les doublons sont ignorés.",
            "You can also separate them with commas. Duplicates are ignored."
          )}
          htmlFor="qr-bulk"
        >
          <textarea
            id="qr-bulk"
            data-autofocus
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={t("Lobby\nSpa\nPiscine\nChambre 101", "Lobby\nSpa\nPool\nRoom 101")}
            rows={6}
            className={cn(inputClass, "resize-none")}
          />
        </Field>
      )}

      {mode === "serie" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t("Préfixe", "Prefix")} className="col-span-2" htmlFor="qr-prefix">
            <input
              id="qr-prefix"
              data-autofocus
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className={inputClass}
              maxLength={40}
            />
          </Field>
          <Field label={t("De", "From")} htmlFor="qr-from">
            <input
              id="qr-from"
              value={from}
              onChange={(e) => setFrom(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className={cn(inputClass, "num")}
            />
          </Field>
          <Field label={t("À", "To")} htmlFor="qr-to">
            <input
              id="qr-to"
              value={to}
              onChange={(e) => setTo(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className={cn(inputClass, "num")}
            />
          </Field>
          <p className="col-span-full text-[13px] text-ink-2">
            {labels.length > 0
              ? t(
                  `${labels.length} emplacement${labels.length > 1 ? "s" : ""} : ${labels[0]}${labels.length > 1 ? ` → ${labels[labels.length - 1]}` : ""}`,
                  `${labels.length} ${labels.length === 1 ? "location" : "locations"}: ${labels[0]}${labels.length > 1 ? ` → ${labels[labels.length - 1]}` : ""}`
                )
              : t(
                  "Indiquez un intervalle valide (200 chambres maximum par série).",
                  "Enter a valid range (200 rooms maximum per series)."
                )}
          </p>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="mt-4">
          <InfoNote tone="amber">
            {t(
              `Déjà existant${duplicates.length > 1 ? "s" : ""}, ignoré${duplicates.length > 1 ? "s" : ""} : `,
              "Already exist, skipped: "
            )}
            {duplicates.slice(0, 5).join(", ")}
            {duplicates.length > 5 ? "…" : ""}
          </InfoNote>
        </div>
      )}
    </Modal>
  );
}
