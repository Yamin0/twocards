"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CONTAINER,
  SECTION,
  SectionHeader,
} from "@/components/landing/section-header";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* Le même QR, lu différemment selon le métier — en accordéon d'images,
   sur le modèle « Interactive Image Accordion » de 21st.dev (reconstruit
   ici : la source du modèle demande un compte).

   Sur grand écran, les quatre panneaux sont côte à côte ; celui qu'on
   survole (ou qu'on atteint au clavier) s'ouvre et montre son texte, les
   autres se resserrent sur leur seul titre, écrit à la verticale. Sur
   mobile, pas de survol : les panneaux s'empilent, tous ouverts.

   Photos Unsplash (licence Unsplash : usage commercial libre, sans
   attribution obligatoire), servies par images.unsplash.com, déjà autorisé
   dans next.config. Même ambiance pour les quatre : intérieur chaud, soir. */
const getAudiences = (t: Translate) => [
  {
    href: "/hotels",
    label: t("Hôtels & riads", "Hotels & riads"),
    description: t(
      "Le client réserve seul, à toute heure. Chaque réservation est attribuée à votre établissement, conforme à votre politique interne.",
      "Guests book on their own, at any hour. Every reservation is attributed to your property and in line with your internal policy."
    ),
    image: "https://images.unsplash.com/photo-1759472659432-3232e42d04d2?auto=format&fit=crop&w=1400&q=80",
  },
  {
    href: "/restaurants",
    label: t("Établissements", "Venues"),
    description: t(
      "Le scan à l'arrivée prouve la visite. La commission se calcule sur la facture vérifiée, aux conditions fixées dès l'origine.",
      "A scan on arrival proves the visit. Commission is calculated on the verified bill, on terms agreed from the start."
    ),
    image: "https://images.unsplash.com/photo-1672832593966-fe1795b8d287?auto=format&fit=crop&w=1400&q=80",
  },
  {
    href: "/concierges",
    label: t("Concierges / RP", "Concierges / PR"),
    description: t(
      "Votre QR suit votre client. Vous savez quand il est arrivé, et la commission apparaît validée sans relancer personne.",
      "Your QR follows your guest. You know the moment they arrive, and your commission shows up validated without chasing anyone."
    ),
    image: "https://images.unsplash.com/photo-1660557989695-14fac79c086d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    href: "/influenceurs",
    label: t("Influenceurs", "Influencers"),
    description: t(
      "Un lien unique couvre toute votre sélection. Chaque réservation issue de vos recommandations vous est attribuée et rémunérée.",
      "One link covers your entire selection. Every reservation that comes from your recommendations is credited and paid to you."
    ),
    image: "https://images.unsplash.com/photo-1672831744471-fb82fd8fa2e0?auto=format&fit=crop&w=1400&q=80",
  },
];

export function QrAudiences() {
  const t = useT();
  const AUDIENCES = getAudiences(t);
  const [active, setActive] = useState(0);

  return (
    <section className={SECTION}>
      <div className={CONTAINER}>
        <SectionHeader
          title={t(
            "Le même QR, pour chaque métier.",
            "One QR, for every trade."
          )}
          intro={t(
            "Où qu'il soit posé, le QR sait d'où vient le client. Le réseau, lui, est commun : établissements vérifiés, disponibilités réelles, commissions calculées sur du revenu vérifié.",
            "Wherever it's placed, the QR knows where the guest came from. The network is shared by all: verified venues, real availability, commissions calculated on verified revenue."
          )}
        />

        <div className="flex flex-col gap-3 lg:h-[560px] lg:flex-row">
          {AUDIENCES.map((a, i) => {
            const open = i === active;
            return (
              <Link
                key={a.href}
                href={a.href}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`group relative h-[380px] overflow-hidden rounded-2xl bg-[#1a1612] outline-none transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--landing-ivory)] lg:h-auto lg:min-w-0 lg:basis-0 ${
                  open ? "lg:grow-[4]" : "lg:grow"
                }`}
              >
                <Image
                  src={a.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 760px, (min-width: 640px) 90vw, 100vw"
                  className={`object-cover transition-transform duration-700 ${
                    open ? "lg:scale-100" : "lg:scale-110"
                  }`}
                />
                {/* Voile : léger en haut, dense en bas où se pose le texte. */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5 transition-opacity duration-700 ${
                    open ? "" : "lg:bg-black/40"
                  }`}
                />

                {/* Panneau fermé (grand écran) : le titre seul, à la
                    verticale, lu de bas en haut. */}
                <span
                  aria-hidden
                  className={`absolute bottom-8 left-1/2 hidden origin-center -translate-x-1/2 whitespace-nowrap text-[17px] font-semibold text-white transition-opacity duration-500 [writing-mode:vertical-rl] rotate-180 lg:block ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                >
                  {a.label}
                </span>

                {/* Panneau ouvert : toujours visible sur mobile. La largeur
                    minimale empêche le texte de se replier pendant que le
                    panneau s'élargit. */}
                <div
                  className={`absolute inset-x-0 bottom-0 p-7 text-white transition-opacity duration-500 md:p-9 lg:w-[30rem] ${
                    open ? "lg:opacity-100 lg:delay-200" : "lg:pointer-events-none lg:opacity-0"
                  }`}
                >
                  <h3 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] md:text-[30px]">
                    {a.label}
                  </h3>
                  <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/85">
                    {a.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium">
                    {t("En savoir plus", "Learn more")}
                    <ArrowRight
                      size={15}
                      strokeWidth={1.5}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
