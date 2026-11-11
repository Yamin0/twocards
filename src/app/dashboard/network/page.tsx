"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, SearchX } from "lucide-react";
import {
  Card,
  EmptyState,
  ErrorState,
  InfoNote,
  KpiGrid,
  LinkButton,
  NameAvatar,
  PageHeader,
  PageSkeleton,
  SearchInput,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import { RatingStars } from "@/components/shared/mini-charts";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

/* Réseau d'apporteurs de l'établissement : quels hôtels partenaires lui
   envoient des clients, ce que cela rapporte (chiffre apporté) et ce que
   cela coûte (commissions). Les agrégats viennent de la RPC
   venue_referrers() (canal QR seulement, annulées et no-show exclues) :
   la page ne fait qu'afficher, classé par chiffre apporté. */

type Referrer = {
  referrer_id: string;
  referrer_name: string;
  reservations: number;
  covers: number;
  revenue: number;
  commissions: number;
  last_reservation: string;
  avg_rating: number | null;
};

export default function VenueNetworkPage() {
  const t = useT();
  const intl = useIntlLocale();
  const { isLoading } = useAuthUser();
  const [referrers, setReferrers] = useState<Referrer[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    createClient()
      .rpc("venue_referrers")
      .then(({ data, error }: { data: Referrer[] | null; error: unknown }) => {
        if (cancelled) return;
        setFailed(Boolean(error));
        if (!error) setReferrers(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (referrers ?? [])
      .filter((r) => !q || r.referrer_name.toLowerCase().includes(q))
      .sort((a, b) => Number(b.revenue) - Number(a.revenue));
  }, [referrers, query]);

  if (failed && referrers === null)
    return (
      <Card padded={false}>
        <ErrorState onRetry={() => setTick((n) => n + 1)} />
      </Card>
    );
  if (isLoading || referrers === null) return <PageSkeleton kpis={4} rows={4} />;

  const sum = (key: "reservations" | "revenue" | "commissions") =>
    referrers.reduce((n, r) => n + Number(r[key]), 0);
  const money = (n: number) => `${Math.round(n).toLocaleString(intl)} MAD`;

  return (
    <>
      <PageHeader
        title={t("Réseau d'apporteurs", "Referral network")}
        description={t(
          "Les hôtels qui vous envoient des clients, ce que chacun apporte et ce que vous lui reversez.",
          "The hotels sending you guests, what each one brings in and what you pay them."
        )}
      />

      <KpiGrid
        items={[
          { label: t("Hôtels apporteurs", "Referring hotels"), value: referrers.length, icon: Building2 },
          { label: t("Sorties apportées", "Outings referred"), value: sum("reservations").toLocaleString(intl) },
          { label: t("Chiffre apporté", "Revenue brought in"), value: money(sum("revenue")) },
          { label: t("Commissions", "Commissions"), value: money(sum("commissions")), href: "/dashboard/commissions" },
        ]}
      />

      <Card
        padded={false}
        title={t("Classement", "Ranking")}
        description={t("Du plus gros chiffre apporté au plus petit.", "From the highest revenue brought in to the lowest.")}
        actions={
          referrers.length > 5 && (
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={t("Rechercher un hôtel", "Search a hotel")}
              className="w-full sm:w-64"
            />
          )
        }
      >
        {referrers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t("Aucun hôtel ne vous a encore envoyé de client", "No hotel has sent you a guest yet")}
            description={t(
              "Dès qu'un client réserve chez vous depuis le QR code d'un hôtel, l'hôtel apparaît ici.",
              "As soon as a guest books with you from a hotel's QR code, the hotel appears here."
            )}
            action={<LinkButton href="/dashboard/reservations">{t("Voir les réservations", "See reservations")}</LinkButton>}
          />
        ) : list.length === 0 ? (
          <EmptyState
            compact
            icon={SearchX}
            title={t("Aucun résultat", "No results")}
            description={t(`Aucun hôtel ne correspond à « ${query} ».`, `No hotel matches “${query}”.`)}
          />
        ) : (
          <Table stack className="border-t border-line">
            <thead>
              <tr>
                <Th>{t("Hôtel", "Hotel")}</Th>
                <Th align="right">{t("Sorties", "Outings")}</Th>
                <Th align="right">{t("Personnes", "Guests")}</Th>
                <Th align="right">{t("Chiffre apporté", "Revenue")}</Th>
                <Th align="right">{t("Commission", "Commission")}</Th>
                <Th>{t("Avis", "Rating")}</Th>
                <Th>{t("Dernière sortie", "Last outing")}</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <Tr key={r.referrer_id}>
                  <Td head>
                    <span className="flex items-center gap-3">
                      <NameAvatar name={r.referrer_name} size={32} />
                      <span className="font-bold">{r.referrer_name}</span>
                    </span>
                  </Td>
                  <Td label={t("Sorties", "Outings")} align="right" className="num">
                    {Number(r.reservations).toLocaleString(intl)}
                  </Td>
                  <Td label={t("Personnes", "Guests")} align="right" className="num">
                    {Number(r.covers).toLocaleString(intl)}
                  </Td>
                  <Td label={t("Chiffre apporté", "Revenue")} align="right" className="num font-bold">
                    {money(Number(r.revenue))}
                  </Td>
                  <Td label={t("Commission", "Commission")} align="right" className="num">
                    {money(Number(r.commissions))}
                  </Td>
                  <Td label={t("Avis", "Rating")}>
                    {r.avg_rating !== null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <RatingStars value={Number(r.avg_rating)} size={13} />
                        <span className="num text-[13px] text-ink-3">
                          {Number(r.avg_rating).toLocaleString(intl, { maximumFractionDigits: 1 })}
                        </span>
                      </span>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </Td>
                  <Td label={t("Dernière sortie", "Last outing")} muted className="num">
                    {new Date(`${r.last_reservation}T00:00:00`).toLocaleDateString(intl)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <InfoNote>
        {t(
          "Seules les sorties venues d'un QR d'hôtel figurent ici, annulations et no-show exclus. Le portail direct et vos propres réservations, sans commission, n'y apparaissent pas.",
          "Only outings from a hotel QR code are shown here, excluding cancellations and no-shows. The direct portal and your own bookings, which carry no commission, are not included."
        )}
      </InfoNote>
    </>
  );
}
