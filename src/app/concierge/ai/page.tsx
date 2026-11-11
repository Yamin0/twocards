"use client";

import { Sparkles } from "lucide-react";
import { NotConnected } from "@/components/concierge/not-connected";
import { useT } from "@/lib/i18n/client";

export default function ConciergeAssistantPage() {
  const t = useT();
  return (
    <NotConnected
      icon={Sparkles}
      title={t("Assistant", "Assistant")}
      description={t(
        "L'assistant n'est pas encore relié à vos données. Il reviendra quand il pourra répondre avec de vrais chiffres.",
        "The assistant isn't connected to your data yet. It will be back once it can answer with real numbers."
      )}
    />
  );
}
