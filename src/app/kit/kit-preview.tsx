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
import { useT } from "@/lib/i18n/client";

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
      <KpiGrid
        items={[
          { label: t("À confirmer", "To confirm"), value: 3, icon: Inbox, tone: "amber", hint: t("dont 1 ce soir", "1 tonight") },
          { label: t("Aujourd'hui", "Today"), value: 12, icon: CalendarDays, delta: 0.12 },
          { label: t("Couverts", "Covers"), value: 46, icon: Users, delta: -0.05 },
          { label: t("Commissions du mois", "Commissions this month"), value: "4 280 MAD", icon: Coins, tone: "emerald" },
        ]}
      />
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
