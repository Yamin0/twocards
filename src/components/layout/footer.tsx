"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { CurrencySwitcher } from "@/components/shared/currency-switcher";

/* Composant client : le pied de page est aussi rendu depuis des pages
   clientes (influenceurs, pages audience courtes). */
const getFooterLinks = (t: Translate) => ({
  [t("Produit", "Product")]: [
    { label: t("Établissements", "Venues"), href: "/restaurants" },
    { label: t("Concierges / PR", "Concierges / PR"), href: "/concierges" },
    { label: t("Hôtels", "Hotels"), href: "/hotels" },
    { label: t("Influenceurs", "Influencers"), href: "/influenceurs" },
  ],
  [t("Entreprise", "Company")]: [
    { label: "Founding Circle", href: "/signup" },
    { label: t("Connexion", "Log in"), href: "/login" },
    { label: t("Demander un accès", "Request access"), href: "/signup" },
  ],
  [t("Juridique", "Legal")]: [
    { label: t("Mentions légales", "Legal notice"), href: "/legal/mentions-legales" },
    { label: t("Politique de confidentialité", "Privacy policy"), href: "/legal/confidentialite" },
    { label: t("CGU", "Terms of use"), href: "/legal/cgu" },
  ],
});

export function Footer() {
  const t = useT();
  const footerLinks = getFooterLinks(t);
  return (
    <footer className="border-t border-black/[0.06] bg-[var(--landing-ivory)] text-[var(--landing-ink)] font-body">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-16 md:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="font-title text-2xl font-medium tracking-tight"
            >
              twocards<span className="text-[var(--landing-mute)]">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] font-normal leading-relaxed text-[var(--landing-ink)]/60">
              {t(
                "Le channel manager B2B des concierges et RP. TwoCards distribue l'inventaire des établissements, attribue chaque client et automatise les commissions.",
                "The B2B channel manager for concierges and PRs. TwoCards distributes venue inventory, attributes every guest and automates commissions."
              )}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
                {title}
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {links.map((link, i) => (
                  <li key={`${title}-${i}`}>
                    <Link
                      href={link.href}
                      className="text-[13px] font-normal text-[var(--landing-ink)]/60 transition-colors hover:text-[var(--landing-ink)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-black/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row md:px-16">
          <p className="text-xs font-normal text-[var(--landing-mute)]">
            &copy; {new Date().getFullYear()} twocards.{" "}
            {t("Tous droits réservés.", "All rights reserved.")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-normal text-[var(--landing-mute)]">
            <CurrencySwitcher />
            <LanguageSwitcher />
            <Link
              href="/legal/mentions-legales"
              className="transition-colors hover:text-[var(--landing-ink)]"
            >
              {t("Mentions légales", "Legal notice")}
            </Link>
            <a
              href="mailto:contact@twocardspro.com"
              className="transition-colors hover:text-[var(--landing-ink)]"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
