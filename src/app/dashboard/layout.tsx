"use client";

import { AppShell } from "@/components/app/shell";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { useVenueNotifications } from "@/hooks/use-venue-notifications";

/* Espace établissement : la coque commune, avec ses deux pastilles de
   non-lus (messages, notifications). */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { venueName } = useAuthUser();
  const unreadMessages = useUnreadMessages();
  /* unreadCount retombe à 0 si la requête échoue : la coque ne casse pas. */
  const { unreadCount } = useVenueNotifications();
  return (
    <AppShell
      role="etablissement"
      workspace={{ name: venueName }}
      badges={{
        "/dashboard/messages": unreadMessages,
        "/dashboard/notifications": unreadCount,
      }}
    >
      {children}
    </AppShell>
  );
}
