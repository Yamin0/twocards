"use client";

import { useMemo, useState } from "react";
import { Download, Link2, Repeat, Star, UserPlus, Users } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  KpiGrid,
  LinkButton,
  PageHeader,
  PageSkeleton,
  SearchInput,
  Segmented,
  Select,
} from "@/components/app/ui";
import { ConciergeLoadError } from "@/components/concierge/states";
import { GuestCard, GuestDrawer } from "@/components/hotel/guest-drawer";
import { loadFailed } from "@/components/hotel/states";
import { useConciergeSpace } from "@/lib/concierge/space";
import { guestsFromReservations } from "@/lib/hotel/analytics";
import { exportGuestsCsv } from "@/lib/hotel/exports";
import { formatNumber, plural } from "@/lib/hotel/format";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";

type Filter = "tous" | "fideles" | "avenir" | "notes";
type Sort = "recent" | "visites" | "depense" | "nom";

/* Clients du concierge : un profil par numéro de téléphone, reconstitué à
   partir des réservations passées par ses liens. Aucune fiche saisie à la
   main, aucun client d'exemple. */
export default function ConciergeClientsPage() {
  const { reservations, qrCodes, isLoading, failed, reload } = useConciergeSpace();
  const [filter, setFilter] = useState<Filter>("tous");
  const [sort, setSort] = useState<Sort>("recent");
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();

  const guests = useMemo(() => guestsFromReservations(reservations), [reservations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\s/g, "");
    return guests
      .filter((g) => {
        if (filter === "fideles" && g.liveVisits < 2) return false;
        if (filter === "avenir" && !g.nextVisit) return false;
        if (filter === "notes" && g.rating === null) return false;
        if (
          q &&
          !g.name.toLowerCase().includes(q) &&
          !g.phone.replace(/\s/g, "").includes(digits) &&
          !(g.favoriteVenue ?? "").toLowerCase().includes(q)
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case "visites":
            return b.liveVisits - a.liveVisits;
          case "depense":
            return b.totalSpent - a.totalSpent;
          case "nom":
            return a.name.localeCompare(b.name, locale);
          default:
            return b.lastVisit.localeCompare(a.lastVisit);
        }
      });
  }, [guests, filter, sort, search, locale]);

  if (isLoading) return <PageSkeleton kpis={4} rows={6} />;

  const header = (
    <PageHeader
      title={t("Clients", "Guests")}
      description={t(
        "Un profil par client, reconstitué à partir des réservations passées par vos liens : sorties passées et à venir, adresses préférées, montant dépensé, avis. Rien à saisir.",
        "One profile per guest, built from the reservations made through your links: past and upcoming outings, favourite places, amount spent, reviews. Nothing to type in."
      )}
      actions={
        <Button icon={Download} onClick={() => exportGuestsCsv(filtered, t, t("Liens", "Links"))} disabled={filtered.length === 0}>
          {t("Exporter", "Export")} ({filtered.length})
        </Button>
      }
    />
  );

  if (loadFailed(failed, reservations, qrCodes))
    return (
      <>
        {header}
        <ConciergeLoadError onRetry={reload} />
      </>
    );

  const loyal = guests.filter((g) => g.liveVisits >= 2).length;
  const upcoming = guests.filter((g) => g.nextVisit).length;
  const rated = guests.filter((g) => g.rating !== null);
  const avg = rated.length > 0 ? rated.reduce((s, g) => s + (g.rating ?? 0), 0) / rated.length : null;
  const open = openKey ? (guests.find((g) => g.key === openKey) ?? null) : null;

  return (
    <>
      {header}

      <KpiGrid
        items={[
          {
            label: t("Clients", "Guests"),
            value: formatNumber(guests.length, locale),
            hint: t("ayant réservé au moins une fois", "who have booked at least once"),
            icon: Users,
            tone: "sky",
          },
          {
            label: t("Fidèles", "Regulars"),
            value: formatNumber(loyal, locale),
            hint: t("2 sorties ou plus", "2 or more outings"),
            icon: Repeat,
            tone: "violet",
          },
          {
            label: t("Sortie à venir", "Upcoming outing"),
            value: formatNumber(upcoming, locale),
            hint: t("clients avec une réservation future", "guests with a future reservation"),
            icon: UserPlus,
            tone: "emerald",
          },
          {
            label: t("Satisfaction", "Satisfaction"),
            value:
              avg !== null
                ? `${avg.toLocaleString(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5`
                : "—",
            hint: t(
              `${rated.length} ${plural(rated.length, "client noté", "clients notés")}`,
              `${rated.length} ${plural(rated.length, "guest rated", "guests rated", "en")}`
            ),
            icon: Star,
            tone: "amber",
          },
        ]}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          label={t("Filtrer les clients", "Filter guests")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "tous", label: t("Tous", "All"), count: guests.length },
            { value: "fideles", label: t("Fidèles", "Regulars"), count: loyal },
            { value: "avenir", label: t("Sortie à venir", "Upcoming outing"), count: upcoming },
            { value: "notes", label: t("Ont laissé un avis", "Left a review"), count: rated.length },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("Nom, téléphone, adresse…", "Name, phone, place…")}
            className="w-full sm:w-60"
          />
          <Select<Sort>
            label={t("Trier", "Sort")}
            value={sort}
            onChange={setSort}
            className="w-full sm:w-48"
            options={[
              { value: "recent", label: t("Dernière sortie", "Latest outing") },
              { value: "visites", label: t("Plus de sorties", "Most outings") },
              { value: "depense", label: t("Plus dépensé", "Highest spend") },
              { value: "nom", label: t("Nom (A → Z)", "Name (A → Z)") },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card padded={false}>
          {guests.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("Aucun client pour le moment", "No guests yet")}
              description={t(
                "Les profils se créent tout seuls à la première réservation passée depuis l'un de vos liens.",
                "Profiles are created automatically with the first reservation made through one of your links."
              )}
              action={
                <LinkButton href={qrCodes.length > 0 ? "/concierge/liens" : "/concierge"} variant="primary" icon={Link2}>
                  {qrCodes.length > 0 ? t("Mes liens", "My links") : t("Créer mon lien", "Create my link")}
                </LinkButton>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title={t("Aucun client ne correspond", "No guests match")}
              description={t("Essayez un autre filtre ou une autre recherche.", "Try another filter or search.")}
              action={
                <Button
                  onClick={() => {
                    setFilter("tous");
                    setSearch("");
                  }}
                >
                  {t("Réinitialiser", "Reset")}
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g) => (
            <GuestCard key={g.key} g={g} onOpen={() => setOpenKey(g.key)} />
          ))}
        </div>
      )}

      <GuestDrawer guest={open} onClose={() => setOpenKey(null)} />
    </>
  );
}
