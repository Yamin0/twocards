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

const STEPS = [
  {
    icon: QrCode,
    title: "Créez vos QR codes",
    text: "Un par chambre, suite ou espace commun (lobby, spa, piscine, rooftop). La série numérotée crée vingt chambres en une fois.",
    href: "/hotel/chambres?nouveau=1",
    cta: "Créer un QR",
  },
  {
    icon: Settings,
    title: "Réglez le menu",
    text: "Nom, couleur, message d'accueil dans les paramètres ; adresses proposées, emplacement par emplacement, depuis la fiche du QR.",
    href: "/hotel/settings?onglet=menu",
    cta: "Personnaliser",
  },
  {
    icon: Printer,
    title: "Imprimez et posez",
    text: "La planche d'impression sort une carte par emplacement, prête pour la table de nuit ou le comptoir. SVG et PNG pour votre imprimeur.",
    href: "/hotel/chambres/imprimer",
    cta: "Imprimer",
  },
  {
    icon: Coins,
    title: "Suivez et encaissez",
    text: "Chaque scan, chaque réservation et chaque commission remontent en temps réel. Les commissions d'un mois clôturé sont versées le mois suivant.",
    href: "/hotel/commissions",
    cta: "Mes commissions",
  },
];

const FAQ = [
  {
    q: "Que voit le client quand il scanne ?",
    a: "Un menu au nom de votre hôtel : restaurants, activités, clubs et services de votre ville, avec les adresses que vous avez choisi de proposer. Il choisit une sortie, une date, une heure, un nombre de personnes, laisse son nom et son WhatsApp, c'est tout. Aucun compte, aucun paiement.",
  },
  {
    q: "Qui confirme la réservation ?",
    a: "L'établissement, directement avec le client (téléphone ou WhatsApp). Vous suivez le statut dans Réservations : en attente, confirmée, annulée ou no-show. Vous n'avez rien à faire, mais vous pouvez contacter le client depuis sa fiche.",
  },
  {
    q: "Comment ma commission est-elle calculée ?",
    a: "Un pourcentage du montant réellement dépensé par le client : 10 % par défaut, le taux peut varier selon l'établissement. Elle est calculée automatiquement dès que l'établissement (ou sa caisse) renseigne le montant, après la sortie.",
  },
  {
    q: "Puis-je changer le nom de l'hôtel sans réimprimer les QR ?",
    a: "Oui. Le menu lit votre profil en base à chaque scan : nom, ville, couleur et message d'accueil se mettent à jour instantanément sur tous les QR, même déjà imprimés.",
  },
  {
    q: "Un QR désactivé, ça donne quoi ?",
    a: "Le lien reste valable mais affiche un message d'indisponibilité, sans compter de scan. Réactivez-le quand vous voulez. La suppression, elle, est définitive et efface l'historique de l'emplacement.",
  },
  {
    q: "Comment inviter un client sans QR ?",
    a: "Chaque emplacement a un lien unique : copiez-le, ou partagez-le par WhatsApp ou e-mail depuis la fiche du QR. Les réservations passées par ce lien restent rattachées à l'emplacement.",
  },
  {
    q: "Les avis clients, d'où viennent-ils ?",
    a: "Après sa sortie, le client reçoit un lien pour noter l'établissement de 1 à 5 et laisser un mot. La note apparaît sur la réservation, dans la fiche client et dans vos analyses.",
  },
  {
    q: "Puis-je exporter mes données ?",
    a: "Oui : réservations, clients et commissions s'exportent en CSV (compatible Excel), avec les filtres en cours. Le relevé mensuel des commissions est votre justificatif comptable.",
  },
];

export default function HotelHelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <PageHeader
        eyebrow="Aide"
        title="Comment ça marche"
        description="Tout ce qu'il faut savoir pour transformer vos chambres en apporteur d'affaires, et qui contacter si quelque chose coince."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((s, i) => (
          <Panel key={s.title}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <s.icon size={18} strokeWidth={1.75} className="text-white" />
              </span>
              <span className="num text-xs font-black text-white/30">0{i + 1}</span>
            </div>
            <h2 className="font-display mt-4 text-base font-bold text-white">{s.title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-white/55">{s.text}</p>
            <Link href={s.href} className="mt-4 inline-block text-xs font-bold text-sky-300 hover:text-sky-200">
              {s.cta} →
            </Link>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Questions fréquentes" className="xl:col-span-2" padded={false}>
          <ul className="divide-y divide-white/[0.06]">
            {FAQ.map((f, i) => (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
                >
                  <span className="text-sm font-bold text-white">{f.q}</span>
                  <ChevronDown size={16} strokeWidth={2} className={cn("shrink-0 text-white/40 transition-transform", open === i && "rotate-180")} />
                </button>
                {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-white/65 sm:px-6">{f.a}</p>}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title="Conseils de terrain">
            <ul className="space-y-3 text-xs leading-relaxed text-white/60">
              <li className="flex gap-2.5"><BedDouble size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-sky-300" /> Un chevalet sur la table de nuit convertit mieux qu&apos;un autocollant sur la porte.</li>
              <li className="flex gap-2.5"><Smartphone size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-sky-300" /> Au check-in, montrez le geste : « scannez, choisissez, on s&apos;occupe du reste ».</li>
              <li className="flex gap-2.5"><Star size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-sky-300" /> Un menu court (8 à 12 adresses) convertit mieux qu&apos;un catalogue complet.</li>
              <li className="flex gap-2.5"><Coins size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-sky-300" /> Surveillez la conversion par emplacement : déplacez les QR qui ne scannent pas.</li>
            </ul>
          </Panel>
          <Panel title="Besoin d'aide ?">
            <p className="text-xs leading-relaxed text-white/55">
              Votre référent twocards répond en général sous une heure en journée.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <LinkButton href="mailto:contact@twocardspro.com?subject=Espace%20h%C3%B4tel" external icon={Mail} variant="primary">
                contact@twocardspro.com
              </LinkButton>
              <LinkButton href="/hotel/settings" icon={MessageCircle}>
                Vérifier mes coordonnées
              </LinkButton>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/35">
              <LifeBuoy size={12} strokeWidth={1.75} /> Mentionnez le nom de l&apos;hôtel et, si possible, la chambre concernée.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
