"use client";

import { AppShell } from "@/components/app/shell";
import { useUnreadMessages } from "@/hooks/use-unread-messages";

/* Espace concierge : la coque commune et la pastille des messages. */
export default function ConciergeLayout({ children }: { children: React.ReactNode }) {
  const unreadMessages = useUnreadMessages();
  return (
    <AppShell role="concierge" badges={{ "/concierge/messages": unreadMessages }}>
      {children}
    </AppShell>
  );
}
