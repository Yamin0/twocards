"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventDate } from "@/hooks/use-venue-events";
import { IconButton } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { monthCells, monthLabel, sameDate, weekdayLabels } from "./event-lib";

/* Petit calendrier du formulaire : un mois, un jour à choisir. */
export function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: EventDate | null;
  onSelect: (d: EventDate) => void;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const today = new Date();
  const [cursor, setCursor] = useState(() => ({
    month: selected?.month ?? today.getMonth(),
    year: selected?.year ?? today.getFullYear(),
  }));

  const shift = (delta: number) =>
    setCursor(({ month, year }) => {
      const d = new Date(year, month + delta, 1);
      return { month: d.getMonth(), year: d.getFullYear() };
    });

  return (
    <div className="rounded-xl border border-line bg-fill p-3">
      <div className="mb-1 flex items-center justify-between">
        <IconButton
          icon={ChevronLeft}
          size={16}
          label={t("Mois précédent", "Previous month")}
          onClick={() => shift(-1)}
        />
        <span className="text-[13px] font-bold text-ink" aria-live="polite">
          {monthLabel(cursor.year, cursor.month, intl)}
        </span>
        <IconButton
          icon={ChevronRight}
          size={16}
          label={t("Mois suivant", "Next month")}
          onClick={() => shift(1)}
        />
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5" aria-hidden>
        {weekdayLabels(intl).map((d) => (
          <div key={d} className="py-0.5 text-center text-xs font-bold text-ink-3">
            {d.charAt(0)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {monthCells(cursor.year, cursor.month).map((day, idx) => {
          if (!day) return <div key={idx} />;
          const date = { day, month: cursor.month, year: cursor.year };
          const isSelected = sameDate(selected, date);
          const isToday =
            day === today.getDate() &&
            cursor.month === today.getMonth() &&
            cursor.year === today.getFullYear();
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={new Date(cursor.year, cursor.month, day).toLocaleDateString(intl, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              className={cn(
                "num h-9 w-full rounded-lg text-[13px] font-bold transition-colors",
                isSelected
                  ? "bg-brand text-on-brand"
                  : isToday
                    ? "bg-link-soft text-link"
                    : "text-ink-2 hover:bg-fill-3 hover:text-ink"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
