"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  ChevronDown,
  Coins,
  LifeBuoy,
  Mail,
  MessageCircle,
  Printer,
  QrCode,
  Settings,
  Smartphone,
  Star,
} from "lucide-react";
import { LinkButton, PageHeader, Panel } from "@/components/hotel/ui";
import { cn } from "@/lib/utils";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

const getSteps = (t: Translate) => [
  {
    icon: QrCode,
    title: t("Créez vos QR codes", "Create your QR codes"),
    text: t(
      "Un par chambre, suite ou espace commun (lobby, spa, piscine, rooftop). La série numérotée crée vingt chambres en une fois.",
      "One per room, suite or common area (lobby, spa, pool, rooftop). The numbered series creates twenty rooms in one go."
    ),
    href: "/hotel/chambres?nouveau=1",
    cta: t("Créer un QR", "Create a QR"),
  },
  {
    icon: Settings,
    title: t("Réglez le menu", "Set up the menu"),
    text: t(
      "Nom, couleur, message d'accueil dans les paramètres ; adresses proposées, emplacement par emplacement, depuis la fiche du QR.",
      "Name, colour and welcome message in settings; places offered, location by location, from each QR code's page."
    ),
    href: "/hotel/settings?onglet=menu",
    cta: t("Personnaliser", "Customise"),
  },
  {
    icon: Printer,
    title: t("Imprimez et posez", "Print and place"),
    text: t(
      "La planche d'impression sort une carte par emplacement, prête pour la table de nuit ou le comptoir. SVG et PNG pour votre imprimeur.",
      "The print sheet produces one card per location, ready for the bedside table or the front desk. SVG and PNG for your printer."
    ),
    href: "/hotel/chambres/imprimer",
    cta: t("Imprimer", "Print"),
  },
  {
    icon: Coins,
    title: t("Suivez et encaissez", "Track and get paid"),
    text: t(
      "Chaque scan, chaque réservation et chaque commission remontent en temps réel. Les commissions d'un mois clôturé sont versées le mois suivant.",
      "Every scan, reservation and commission shows up in real time. Commissions for a closed month are paid out the following month."
    ),
    href: "/hotel/commissions",
    cta: t("Mes commissions", "My commissions"),
  },
];

const getFaq = (t: Translate) => [
  {
    q: t("Que voit le client quand il scanne ?", "What does the guest see when they scan?"),
    a: t(
      "Un menu au nom de votre hôtel : restaurants, activités, clubs et services de votre ville, avec les adresses que vous avez choisi de proposer. Il choisit une sortie, une date, une heure, un nombre de personnes, laisse son nom et son WhatsApp, c'est tout. Aucun compte, aucun paiement.",
      "A menu in your hotel's name: restaurants, activities, clubs and services in your city, with the places you've chosen to offer. They pick an outing, a date, a time and party size, leave their name and WhatsApp, and that's it. No account, no payment."
    ),
  },
  {
    q: t("Qui confirme la réservation ?", "Who confirms the reservation?"),
    a: t(
      "L'établissement, directement avec le client (téléphone ou WhatsApp). Vous suivez le statut dans Réservations : en attente, confirmée, annulée ou no-show. Vous n'avez rien à faire, mais vous pouvez contacter le client depuis sa fiche.",
      "The venue, directly with the guest (phone or WhatsApp). You track the status in Reservations: pending, confirmed, cancelled or no-show. There's nothing for you to do, but you can contact the guest from their profile."
    ),
  },
  {
    q: t("Comment ma commission est-elle calculée ?", "How is my commission calculated?"),
    a: t(
      "Un pourcentage du montant réellement dépensé par le client : 10 % par défaut, le taux peut varier selon l'établissement. Elle est calculée automatiquement dès que l'établissement (ou sa caisse) renseigne le montant, après la sortie.",
      "A percentage of what the guest actually spends: 10% by default, and the rate may vary by venue. It's calculated automatically as soon as the venue (or its till) enters the amount, after the outing."
    ),
  },
  {
    q: t("Puis-je changer le nom de l'hôtel sans réimprimer les QR ?", "Can I change the hotel's name without reprinting the QR codes?"),
    a: t(
      "Oui. Le menu lit votre profil en base à chaque scan : nom, ville, couleur et message d'accueil se mettent à jour instantanément sur tous les QR, même déjà imprimés.",
      "Yes. The menu reads your profile on every scan: name, city, colour and welcome message update instantly on every QR code, even ones already printed."
    ),
  },
  {
    q: t("Puis-je ajouter mes propres adresses au menu ?", "Can I add my own places to the menu?"),
    a: t(
      "Oui, dans Mes adresses : votre restaurant, votre spa, votre chauffeur, un partenaire de confiance. Photo, description, prix indicatif, catégorie. Elles apparaissent en tête de leur catégorie sur vos QR codes, et nulle part ailleurs. Les demandes vous arrivent directement, sans commission twocards. Le catalogue du réseau, lui, est tenu par twocards : écrivez-nous pour y proposer une adresse.",
      "Yes, in My places: your restaurant, your spa, your driver, a trusted partner. Photo, description, indicative price, category. They appear at the top of their category on your QR codes, and nowhere else. Requests come straight to you, with no twocards commission. The network catalogue is curated by twocards: write to us to suggest a place."
    ),
  },
  {
    q: t("Un QR désactivé, ça donne quoi ?", "What happens when a QR code is deactivated?"),
    a: t(
      "Le lien reste valable mais affiche un message d'indisponibilité, sans compter de scan. Réactivez-le quand vous voulez. La suppression, elle, est définitive et efface l'historique de l'emplacement.",
      "The link still works but shows an unavailable message, and no scan is counted. Reactivate it whenever you like. Deleting, however, is permanent and erases the location's history."
    ),
  },
  {
    q: t("Comment inviter un client sans QR ?", "How do I invite a guest without a QR code?"),
    a: t(
      "Chaque emplacement a un lien unique : copiez-le, ou partagez-le par WhatsApp ou e-mail depuis la fiche du QR. Les réservations passées par ce lien restent rattachées à l'emplacement.",
      "Every location has a unique link: copy it, or share it by WhatsApp or email from the QR code's page. Reservations made through that link stay attached to the location."
    ),
  },
  {
    q: t("Les avis clients, d'où viennent-ils ?", "Where do guest reviews come from?"),
    a: t(
      "Après sa sortie, le client reçoit un lien pour noter l'établissement de 1 à 5 et laisser un mot. La note apparaît sur la réservation, dans la fiche client et dans vos analyses.",
      "After the outing, the guest receives a link to rate the venue from 1 to 5 and leave a comment. The rating appears on the reservation, in the guest profile and in your analytics."
    ),
  },
  {
    q: t("Puis-je exporter mes données ?", "Can I export my data?"),
    a: t(
      "Oui : réservations, clients et commissions s'exportent en CSV (compatible Excel), avec les filtres en cours. Le relevé mensuel des commissions est votre justificatif comptable.",
      "Yes: reservations, guests and commissions export to CSV (Excel-compatible), with your current filters. The monthly commission statement is your accounting record."
    ),
  },
];

export default function HotelHelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  const t = useT();
  const STEPS = getSteps(t);
  const FAQ = getFaq(t);
  return (
    <>
      <PageHeader
        eyebrow={t("Aide", "Help")}
        title={t("Comment ça marche", "How it works")}
        description={t(
          "Tout ce qu'il faut savoir pour transformer vos chambres en apporteur d'affaires, et qui contacter si quelque chose coince.",
          "Everything you need to turn your rooms into a source of referral revenue, and who to contact if something goes wrong."
        )}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((s, i) => (
          <Panel key={s.title}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fill-2">
                <s.icon size={18} strokeWidth={1.75} className="text-ink" />
              </span>
              <span className="num text-xs font-black text-ink-3">0{i + 1}</span>
            </div>
            <h2 className="font-display mt-4 text-base font-bold text-ink">{s.title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{s.text}</p>
            <Link href={s.href} className="mt-4 inline-block text-xs font-bold text-info hover:text-info">
              {s.cta} →
            </Link>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("Questions fréquentes", "Frequently asked questions")} className="xl:col-span-2" padded={false}>
          <ul className="divide-y divide-line">
            {FAQ.map((f, i) => (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-fill sm:px-6"
                >
                  <span className="text-sm font-bold text-ink">{f.q}</span>
                  <ChevronDown size={16} strokeWidth={2} className={cn("shrink-0 text-ink-3 transition-transform", open === i && "rotate-180")} />
                </button>
                {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-ink-2 sm:px-6">{f.a}</p>}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title={t("Conseils de terrain", "Tips from the field")}>
            <ul className="space-y-3 text-xs leading-relaxed text-ink-2">
              <li className="flex gap-2.5"><BedDouble size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-info" /> {t("Un chevalet sur la table de nuit convertit mieux qu'un autocollant sur la porte.", "A tent card on the bedside table converts better than a sticker on the door.")}</li>
              <li className="flex gap-2.5"><Smartphone size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-info" /> {t("Au check-in, montrez le geste : « scannez, choisissez, on s'occupe du reste ».", "At check-in, show them how: “scan, choose, we take care of the rest”.")}</li>
              <li className="flex gap-2.5"><Star size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-info" /> {t("Un menu court (8 à 12 adresses) convertit mieux qu'un catalogue complet.", "A short menu (8 to 12 places) converts better than a full catalogue.")}</li>
              <li className="flex gap-2.5"><Coins size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-info" /> {t("Surveillez la conversion par emplacement : déplacez les QR qui ne scannent pas.", "Watch conversion by location: move QR codes that don't get scanned.")}</li>
            </ul>
          </Panel>
          <Panel title={t("Besoin d'aide ?", "Need help?")}>
            <p className="text-xs leading-relaxed text-ink-3">
              {t("Votre référent twocards répond en général sous une heure en journée.", "Your twocards contact usually replies within an hour during the day.")}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <LinkButton href={t("mailto:contact@twocardspro.com?subject=Espace%20h%C3%B4tel", "mailto:contact@twocardspro.com?subject=Hotel%20workspace")} external icon={Mail} variant="primary">
                contact@twocardspro.com
              </LinkButton>
              <LinkButton href="/hotel/settings" icon={MessageCircle}>
                {t("Vérifier mes coordonnées", "Check my contact details")}
              </LinkButton>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-3">
              <LifeBuoy size={12} strokeWidth={1.75} />{" "}
              {t("Mentionnez le nom de l'hôtel et, si possible, la chambre concernée.", "Mention the hotel's name and, if possible, the room concerned.")}
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
