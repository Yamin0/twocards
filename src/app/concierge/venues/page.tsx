"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, MessageSquare, SearchX } from "lucide-react";
import {
  Card,
  EmptyState,
  ErrorState,
  LinkButton,
  NameAvatar,
  PageHeader,
  PageSkeleton,
  SearchInput,
} from "@/components/app/ui";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

/* Annuaire des établissements du réseau (table profiles, tenu à jour en
   direct) : c'était l'accueil de l'espace avant que le concierge ait son
   lien et son QR. Chaque ligne ouvre la messagerie avec l'établissement. */

type Venue = {
  id: string;
  full_name: string | null;
  role: string;
  venue_name: string | null;
  city: string | null;
};

const nameOf = (v: Venue) => v.venue_name || v.full_name || "—";

export default function ConciergeVenuesPage() {
  const t = useT();
  const intl = useIntlLocale();
  const { isLoading: authLoading } = useAuthUser();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, full_name, role, venue_name, city")
      .eq("role", "etablissement")
      .order("venue_name", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setFailed(Boolean(error));
        if (!error) setVenues((data ?? []) as Venue[]);
      });
    /* Un établissement qui s'inscrit apparaît sans recharger. */
    const channel = supabase
      .channel(`annuaire-etablissements-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, (payload) => {
        const p = payload.new as Venue;
        if (p.role !== "etablissement") return;
        setVenues((prev) => (!prev || prev.some((v) => v.id === p.id) ? prev : [...prev, p]));
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tick]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (venues ?? [])
      .filter((v) => !q || nameOf(v).toLowerCase().includes(q) || (v.city ?? "").toLowerCase().includes(q))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b), intl));
  }, [venues, query, intl]);

  if (authLoading || (venues === null && !failed)) return <PageSkeleton kpis={0} rows={6} />;

  return (
    <>
      <PageHeader
        title={t("Établissements", "Venues")}
        description={t(
          "Les établissements du réseau, à un message de vous.",
          "The venues in the network, one message away."
        )}
        actions={
          <LinkButton href="/concierge/messages" variant="primary" icon={MessageSquare}>
            {t("Messages", "Messages")}
          </LinkButton>
        }
      />

      <Card
        padded={false}
        title={t("Annuaire", "Directory")}
        description={
          venues
            ? t(
                `${venues.length} établissement${venues.length > 1 ? "s" : ""} dans le réseau`,
                `${venues.length} venue${venues.length === 1 ? "" : "s"} in the network`
              )
            : undefined
        }
        actions={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t("Nom ou ville", "Name or city")}
            className="w-full sm:w-64"
          />
        }
      >
        {failed ? (
          <ErrorState compact onRetry={() => setTick((n) => n + 1)} />
        ) : list.length === 0 ? (
          query ? (
            <EmptyState
              compact
              icon={SearchX}
              title={t("Aucun résultat", "No results")}
              description={t(`Aucun établissement ne correspond à « ${query} ».`, `No venue matches “${query}”.`)}
            />
          ) : (
            <EmptyState
              compact
              icon={Building2}
              title={t("Aucun établissement pour le moment", "No venues yet")}
              description={t(
                "Les établissements apparaissent ici dès leur inscription.",
                "Venues appear here as soon as they sign up."
              )}
            />
          )
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {list.map((v) => (
              <li key={v.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                <NameAvatar name={nameOf(v)} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{nameOf(v)}</p>
                  <p className="truncate text-[13px] text-ink-3">{v.city || t("Ville non renseignée", "City not set")}</p>
                </div>
                <LinkButton href={`/concierge/messages?to=${v.id}`} size="sm" icon={MessageSquare}>
                  {t("Écrire", "Message")}
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
