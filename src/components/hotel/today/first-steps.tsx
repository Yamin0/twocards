"use client";

import { QrCode } from "lucide-react";
import { Card, LinkButton } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";

/* Premier pas, affiché tant qu'aucun QR code n'existe. */
export function FirstSteps() {
  const t = useT();
  const steps = [
    {
      title: t("Créez vos QR codes", "Create your QR codes"),
      text: t(
        "Un par chambre, suite ou espace commun (lobby, spa, piscine).",
        "One per room, suite or common area (lobby, spa, pool)."
      ),
    },
    {
      title: t("Choisissez le menu", "Choose the menu"),
      text: t(
        "Les restaurants, activités, clubs et services proposés au client.",
        "The restaurants, activities, clubs and services offered to guests."
      ),
    },
    {
      title: t("Imprimez et posez", "Print and place"),
      text: t(
        "Chaque sortie réservée vous rapporte une commission sur le montant dépensé.",
        "Every outing booked earns you a commission on the amount spent."
      ),
    },
  ];
  return (
    <Card
      title={t("Trois étapes pour vos premières commissions", "Three steps to your first commissions")}
      actions={
        <LinkButton href="/hotel/chambres?nouveau=1" icon={QrCode} variant="primary">
          {t("Créer mon premier QR", "Create my first QR")}
        </LinkButton>
      }
    >
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-line bg-fill p-4">
            <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand">
              {i + 1}
            </span>
            <p className="mt-2 text-sm font-bold text-ink">{s.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
