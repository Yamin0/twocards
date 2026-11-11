"use client";

import { AppShell } from "@/components/app/shell";

/* Console d'administration : la coque commune. Les quatre vues (ensemble,
   comptes, catalogue, commissions) sont des entrées du rail, portées par
   le paramètre d'URL `?vue=`. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="admin">{children}</AppShell>;
}
