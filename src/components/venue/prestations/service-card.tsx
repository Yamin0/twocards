"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Tags, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Badge, Button, IconButton, cardClass } from "@/components/app/ui";
import type { VenueService } from "@/hooks/use-venue-services";

/* Une prestation dans la liste : photo, nom, durée et prix, puis ses
   actions (modifier, afficher ou masquer, monter, descendre, supprimer). */
export function ServiceCard({
  service: s,
  isFirst,
  isLast,
  onEdit,
  onToggle,
  onMove,
  onDelete,
}: {
  service: VenueService;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <li className={cn(cardClass, "flex gap-4 p-4")}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-fill-2">
        {s.image_url ? (
          <Image
            src={s.image_url}
            alt=""
            fill
            unoptimized
            sizes="80px"
            className={cn("object-cover", !s.active && "opacity-50")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-3">
            <Tags size={22} strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className={cn("truncate text-[15px] font-bold", s.active ? "text-ink" : "text-ink-3")}>
              {s.name}
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-3">
              {[s.duration, s.price].filter(Boolean).join(" · ") ||
                t("Durée et prix à préciser", "Duration and price to be added")}
            </p>
          </div>
          {!s.active && <Badge className="shrink-0">{t("Masquée", "Hidden")}</Badge>}
        </div>
        {s.description && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{s.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Button size="sm" icon={Pencil} onClick={onEdit}>
            {t("Modifier", "Edit")}
          </Button>
          <Button size="sm" icon={s.active ? EyeOff : Eye} onClick={onToggle}>
            {s.active ? t("Masquer", "Hide") : t("Afficher", "Show")}
          </Button>
          <span className="ml-auto flex items-center">
            <IconButton
              icon={ArrowUp}
              label={t(`Monter « ${s.name} »`, `Move “${s.name}” up`)}
              disabled={isFirst}
              onClick={() => onMove(-1)}
            />
            <IconButton
              icon={ArrowDown}
              label={t(`Descendre « ${s.name} »`, `Move “${s.name}” down`)}
              disabled={isLast}
              onClick={() => onMove(1)}
            />
            <IconButton
              icon={Trash2}
              tone="danger"
              label={t(`Supprimer « ${s.name} »`, `Delete “${s.name}”`)}
              onClick={onDelete}
            />
          </span>
        </div>
      </div>
    </li>
  );
}
