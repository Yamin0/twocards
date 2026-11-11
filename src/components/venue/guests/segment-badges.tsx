"use client";

import { Badge, type BadgeTone } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";
import { segmentLabel } from "@/lib/venue/guests";

/* Les clés de segment sont celles du calcul (français). */
const SEGMENT_TONE: Record<string, BadgeTone> = {
  VIP: "warn",
  Habitué: "ok",
  Nouveau: "info",
  "À risque": "danger",
};

export function SegmentBadges({ segments }: { segments: string[] }) {
  const t = useT();
  if (segments.length === 0) return <span className="text-ink-3">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {segments.map((s) => (
        <Badge key={s} tone={SEGMENT_TONE[s] ?? "neutral"}>
          {segmentLabel(s, t)}
        </Badge>
      ))}
    </span>
  );
}
