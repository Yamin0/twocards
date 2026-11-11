"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, IconButton } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { monthCells, monthLabel, weekdayLabels, type DisplayEvent } from "./event-lib";

/* Vue mois. S'ouvre sur le mois courant ; chaque événement daté est un
   bouton à sa couleur, qui ouvre sa fiche. */
export function EventsCalendar({
  events,
  onView,
}: {
  events: DisplayEvent[];
  onView: (id: number) => void;
}) {
  const t = useT();
  const intl = useIntlLocale();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  const today = new Date();

  const shift = (delta: number) =>
    setCursor(({ month, year }) => {
      const d = new Date(year, month + delta, 1);
      return { month: d.getMonth(), year: d.getFullYear() };
    });

  const eventsOnDay = (day: number) =>
    events.filter(
      (ev) =>
        ev.dateObj &&
        ev.dateObj.day === day &&
        ev.dateObj.month === cursor.month &&
        ev.dateObj.year === cursor.year
    );

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between border-b border-line px-3 py-2 sm:px-4">
        <IconButton icon={ChevronLeft} label={t("Mois précédent", "Previous month")} onClick={() => shift(-1)} />
        <h2 className="text-base font-bold text-ink" aria-live="polite">
          {monthLabel(cursor.year, cursor.month, intl)}
        </h2>
        <IconButton icon={ChevronRight} label={t("Mois suivant", "Next month")} onClick={() => shift(1)} />
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-fill">
        {weekdayLabels(intl).map((d) => (
          <div key={d} className="px-1 py-2 text-center text-xs font-bold text-ink-3">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthCells(cursor.year, cursor.month).map((day, idx) => {
          const dayEvents = day ? eventsOnDay(day) : [];
          const isToday =
            day === today.getDate() &&
            cursor.month === today.getMonth() &&
            cursor.year === today.getFullYear();
          return (
            <div
              key={idx}
              className={cn(
                "min-h-[84px] border-b border-r border-line p-1 [&:nth-child(7n)]:border-r-0 md:min-h-[112px] md:p-1.5",
                !day && "bg-fill"
              )}
            >
              {day && (
                <>
                  <p
                    className={cn(
                      "num mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold",
                      isToday
                        ? "bg-brand text-on-brand"
                        : dayEvents.length > 0
                          ? "text-ink"
                          : "text-ink-3"
                    )}
                  >
                    {day}
                  </p>
                  <div className="space-y-1">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onView(ev.id)}
                        title={ev.title}
                        className={cn(
                          "tc-dark block w-full truncate rounded-md bg-gradient-to-r px-1.5 py-1 text-left text-xs font-bold text-ink transition-opacity hover:opacity-85",
                          ev.gradient,
                          ev.closed && "grayscale"
                        )}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
