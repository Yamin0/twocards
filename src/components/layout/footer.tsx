import Link from "next/link";

const footerLinks = {
  Produit: [
    { label: "Solutions", href: "#solutions" },
    { label: "Établissements", href: "#etablissements" },
    { label: "Concierges & RP", href: "#concierges" },
    { label: "Tarifs", href: "/signup" },
  ],
  Entreprise: [
    { label: "À propos", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carrière", href: "#" },
    { label: "Contact", href: "#contact" },
  ],
  Juridique: [
    { label: "Mentions légales", href: "#" },
    { label: "Politique de confidentialité", href: "#" },
    { label: "CGU", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function Footer() {
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
              Le channel manager B2B des concierges et RP. TwoCards distribue
              l&apos;inventaire des établissements, attribue chaque client et
              automatise les commissions.
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
            &copy; {new Date().getFullYear()} twocards. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-xs font-normal text-[var(--landing-mute)]">
            <Link
              href="#solutions"
              className="transition-colors hover:text-[var(--landing-ink)]"
            >
              Solutions
            </Link>
            <Link
              href="/signup"
              className="transition-colors hover:text-[var(--landing-ink)]"
            >
              Tarifs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
