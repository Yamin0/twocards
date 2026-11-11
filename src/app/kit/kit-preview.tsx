"use client";

import { Suspense, useState } from "react";
import { CalendarDays, Coins, Inbox, Plus, QrCode, Users } from "lucide-react";
import { AppShell, type ShellRole } from "@/components/app/shell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  InfoNote,
  KpiGrid,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  SkeletonRows,
  StatusPill,
  Switch,
  Table,
  Td,
  Th,
  Tr,
  inputClass,
  useNotify,
} from "@/components/app/ui";
import { CalendarCard, DonutCard, Script, SectionTitle, ServiceCard, TrendCard } from "@/components/app/glass";
import { ReservationRow, type RowActions } from "@/components/venue/reservations/reservation-row";
import type { Reservation } from "@/lib/venue/reservations";
import { useT } from "@/lib/i18n/client";

const KIT_MONTHS = ["déc", "janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov"].map(
  (label, i) => ({
    key: String(i),
    label,
    a: [12000, 15000, 14000, 19000, 22000, 21000, 26000, 31000, 28000, 33000, 35000, 33400][i],
    b: [1200, 1500, 1400, 1900, 2200, 2100, 2600, 3100, 2800, 3300, 3500, 3340][i],
  })
);
const KIT_BUSY = new Set(
  [0, 1, 3, 5].map((n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })
);
const kitDay = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const KIT_ROW = {
  id: "kit-1",
  category: "restaurant",
  guest_name: "Exemple A",
  guest_phone: "+212 600 000 000",
  reservation_date: kitDay(0),
  reservation_time: "20:30",
  party_size: 4,
  notes: "Table en terrasse si possible.",
  service_name: null,
  referrer_id: null,
  referrer_name: "Hôtel Démo",
  status: "en attente",
  commission: 0,
  commission_rate: 0.1,
  amount_spent: null,
  amount_source: "manuel",
  source: "qr",
  table_id: null,
  arrived_at: null,
  rating: null,
  rating_comment: null,
  created_at: new Date().toISOString(),
} as Reservation;
const KIT_PENDING: Reservation[] = [
  KIT_ROW,
  { ...KIT_ROW, id: "kit-2", guest_name: "Exemple B", reservation_time: "21:15", party_size: 2, notes: null, referrer_name: null, source: "portal", reservation_date: kitDay(1) },
];
const KIT_ACTIONS: RowActions = {
  setStatus: () => {},
  checkIn: () => {},
  saveBill: async () => true,
  assignTable: () => {},
  copyReviewLink: () => {},
  openReview: () => {},
};
const ROLES: ShellRole[] = ["etablissement", "hotel", "concierge", "admin"];
const ROWS = [
  { name: "Exemple A", when: "20:30", party: 4, status: "en attente" },
  { name: "Exemple B", when: "21:00", party: 2, status: "confirmée" },
  { name: "Exemple C", when: "21:30", party: 6, status: "annulée" },
  { name: "Exemple D", when: "22:00", party: 3, status: "no-show" },
];

function Samples() {
  const t = useT();
  const notify = useNotify();
  const [seg, setSeg] = useState("jour");
  const [q, setQ] = useState("");
  const [on, setOn] = useState(true);
  const [sel, setSel] = useState("a");
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <PageHeader
        title={t("Kit d'interface", "Interface kit")}
        description={t(
          "Planche de contrôle des composants. Données d'exemple, visibles en développement seulement.",
          "Component reference sheet. Sample data, visible in development only."
        )}
        actions={
          <>
            <Button icon={Plus} variant="primary" onClick={() => setModal(true)}>
              {t("Fenêtre", "Modal")}
            </Button>
            <Button onClick={() => setDrawer(true)}>{t("Tiroir", "Drawer")}</Button>
          </>
        }
      />
      <section className="space-y-4">
        <SectionTitle hint="Le client attend votre réponse : confirmez ou refusez d'un geste.">
          2 demandes <Script>à confirmer</Script>.
        </SectionTitle>
        <ul className="space-y-3">
          {KIT_PENDING.map((r) => (
            <ReservationRow key={r.id} r={r} busy={false} tables={[]} actions={KIT_ACTIONS} />
          ))}
        </ul>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ServiceCard
          title={
            <>
              Aujourd&apos;hui, <Script>22 couverts</Script> attendus.
            </>
          }
          text="Prochaine arrivée à 20:30 : Exemple A, 4 pers. (Hôtel Démo)."
          stats={[
            { value: 6, label: "réservations" },
            { value: 22, label: "couverts" },
            { value: "2/6", label: "arrivés" },
          ]}
          primary={{ href: "/kit", label: "Voir le service" }}
        />
        <CalendarCard
          busyDays={KIT_BUSY}
          countLabel="6 réservations"
          href="/kit"
          emptyLabel="Rien de prévu"
          events={[
            { id: "1", time: "20:30", title: "Exemple A", sub: "4 pers. · Hôtel Démo", tag: "Prochaine" },
            { id: "2", time: "21:00", title: "Exemple B", sub: "2 pers. · Portail", pending: true },
          ]}
        />
      </div>
      <KpiGrid
        items={[
          { label: t("À confirmer", "To confirm"), value: 3, icon: Inbox, tone: "amber", hint: t("dont 1 ce soir", "1 tonight"), trend: [1, 3, 2, 4, 3, 5, 3] },
          { label: t("Aujourd'hui", "Today"), value: 12, icon: CalendarDays, delta: 0.12, hint: "22 pers.", trend: [4, 6, 5, 8, 7, 10, 12] },
          { label: t("Commissions du mois", "Commissions this month"), value: "4 280 MAD", icon: Coins, highlight: true, delta: -0.05, hint: "vs 4 500 MAD", trend: [9, 8, 9, 7, 6, 7, 5] },
          { label: t("Couverts", "Covers"), value: 46, icon: Users, delta: 0.04, hint: "30 derniers jours", trend: [30, 34, 33, 38, 41, 40, 46] },
        ]}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TrendCard
          title="Chiffre apporté"
          description="186 400 MAD d'additions sur les 6 derniers mois"
          months={KIT_MONTHS}
          series={{ a: "Additions", b: "Commissions" }}
          format={(n) => `${Math.round(n).toLocaleString("fr-FR")} MAD`}
        />
        <DonutCard
          title="D'où viennent vos clients"
          description="Toutes les réservations"
          total={130}
          totalLabel="réservations"
          segments={[
            { label: "Hôtels (QR)", value: 74, display: "74" },
            { label: "Portail", value: 38, display: "38" },
            { label: "Sur place", value: 18, display: "18" },
          ]}
        />
      </div>
      <Card title={t("Boutons et badges", "Buttons and badges")}>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">{t("Principal", "Primary")}</Button>
          <Button variant="accent">{t("Accent", "Accent")}</Button>
          <Button variant="success">{t("Confirmer", "Confirm")}</Button>
          <Button>{t("Secondaire", "Secondary")}</Button>
          <Button variant="ghost">{t("Discret", "Ghost")}</Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            {t("Supprimer", "Delete")}
          </Button>
          <Button loading>{t("Envoi", "Sending")}</Button>
          <Button size="sm" onClick={() => notify(t("Enregistré", "Saved"))}>
            {t("Toast", "Toast")}
          </Button>
          <Button size="sm" onClick={() => notify(t("Échec de l'envoi", "Sending failed"), "error")}>
            {t("Toast d'erreur", "Error toast")}
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {["en attente", "confirmée", "annulée", "no-show", "actif", "inactif"].map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          <Badge tone="info">{t("Portail", "Portal")}</Badge>
          <Badge tone="plum">QR</Badge>
          <Badge tone="brand">VIP</Badge>
        </div>
      </Card>
      <Card title={t("Champs", "Fields")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Nom", "Name")} htmlFor="kit-nom" hint={t("Tel qu'il apparaît au client.", "As shown to the guest.")}>
            <input id="kit-nom" className={inputClass} placeholder={t("Votre établissement", "Your venue")} />
          </Field>
          <Field label={t("Téléphone", "Phone")} htmlFor="kit-tel" error={t("Numéro incomplet.", "Incomplete number.")}>
            <input id="kit-tel" type="tel" className={inputClass} defaultValue="+212 6" />
          </Field>
          <SearchInput value={q} onChange={setQ} placeholder={t("Rechercher un client", "Search a guest")} />
          <Select
            label={t("Tri", "Sort")}
            value={sel}
            onChange={setSel}
            options={[
              { value: "a", label: t("Plus récentes", "Most recent") },
              { value: "b", label: t("Par heure", "By time") },
            ]}
          />
          <Segmented
            label={t("Période", "Period")}
            value={seg}
            onChange={setSeg}
            options={[
              { value: "jour", label: t("Aujourd'hui", "Today"), count: 12 },
              { value: "venir", label: t("À venir", "Upcoming"), count: 31 },
              { value: "tout", label: t("Tout", "All") },
            ]}
          />
          <div className="flex items-center gap-3 text-sm text-ink-2">
            <Switch checked={on} onChange={setOn} label={t("Portail actif", "Portal active")} />
            {t("Portail actif", "Portal active")}
          </div>
        </div>
      </Card>
      <Card title={t("Tableau, replié en cartes sous 768 px", "Table, stacked into cards under 768 px")} padded={false}>
        <Table stack>
          <thead>
            <tr>
              <Th>{t("Client", "Guest")}</Th>
              <Th>{t("Heure", "Time")}</Th>
              <Th align="right">{t("Personnes", "Party")}</Th>
              <Th>{t("Statut", "Status")}</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <Tr key={r.name}>
                <Td head className="font-bold">
                  {r.name}
                </Td>
                <Td label={t("Heure", "Time")} className="num">
                  {r.when}
                </Td>
                <Td label={t("Personnes", "Party")} align="right" className="num">
                  {r.party}
                </Td>
                <Td label={t("Statut", "Status")}>
                  <StatusPill status={r.status} />
                </Td>
                <Td actions align="right">
                  <Button size="sm" variant="success">
                    {t("Confirmer", "Confirm")}
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padded={false}>
          <EmptyState
            icon={QrCode}
            title={t("Aucun QR code", "No QR code yet")}
            description={t("Créez le premier pour une chambre.", "Create the first one for a room.")}
            action={
              <Button variant="primary" icon={Plus}>
                {t("Nouveau QR code", "New QR code")}
              </Button>
            }
          />
        </Card>
        <Card padded={false}>
          <ErrorState onRetry={() => notify(t("Nouvel essai", "Retrying"))} />
        </Card>
        <SkeletonRows rows={4} />
      </div>
      <InfoNote tone="amber">
        {t("Saisir l'addition confirme la réservation.", "Entering the bill confirms the reservation.")}
      </InfoNote>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={t("Nouvelle réservation", "New reservation")}
        description={t("Exemple de fenêtre.", "Sample modal.")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              {t("Annuler", "Cancel")}
            </Button>
            <Button variant="primary" onClick={() => setModal(false)}>
              {t("Créer", "Create")}
            </Button>
          </>
        }
      >
        <Field label={t("Nom du client", "Guest name")} htmlFor="kit-m">
          <input id="kit-m" data-autofocus className={inputClass} />
        </Field>
      </Modal>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        eyebrow={t("Réservation", "Reservation")}
        title="Exemple A"
        footer={<Button variant="success">{t("Confirmer", "Confirm")}</Button>}
      >
        <p className="text-sm text-ink-2">{t("Détail d'une réservation.", "Reservation details.")}</p>
      </Drawer>
      <ConfirmDialog
        open={confirm}
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
        title={t("Supprimer ce QR code ?", "Delete this QR code?")}
        description={t("Cette action est définitive.", "This cannot be undone.")}
        confirmLabel={t("Supprimer", "Delete")}
      />
    </>
  );
}

function Inner() {
  const [role, setRole] = useState<ShellRole>("etablissement");
  return (
    <AppShell
      role={role}
      workspace={{ name: "Exemple", meta: "12 QR · 3" }}
      badges={{ "/dashboard/messages": 2, "/hotel/reservations": 3, "/concierge/messages": 1 }}
      cta={role === "hotel" ? { href: "/kit", label: "Nouveau QR code", icon: Plus } : undefined}
    >
      <Segmented label="Rôle" value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r, label: r }))} />
      <Samples />
    </AppShell>
  );
}

export function KitPreview() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
