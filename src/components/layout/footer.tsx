import Link from "next/link";

const footerLinks = {
  Produit: [
    { label: "Fonctionnalités", href: "#solutions" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "Le Registre", href: "#registre" },
    { label: "Sécurité", href: "#securite" },
  ],
  Entreprise: [
    { label: "À propos", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Carrière", href: "#carriere" },
    { label: "Contact", href: "#contact" },
  ],
  Juridique: [
    { label: "Mentions légales", href: "#mentions" },
    { label: "Politique de confidentialité", href: "#privacy" },
    { label: "CGU", href: "#cgu" },
    { label: "Cookies", href: "#cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface-low">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-nunito)] text-xl font-bold text-primary-dark"
            >
              twocards.
            </Link>
            <p className="mt-4 max-w-xs font-[family-name:var(--font-inter)] text-sm leading-relaxed text-on-surface-variant">
              La plateforme CRM B2B pour les établissements de nuit. Gérez vos
              listes, vos événements et votre réseau depuis un tableau de bord
              unique.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="font-[family-name:var(--font-manrope)] text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">
                {title}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-[family-name:var(--font-inter)] text-sm text-on-surface-variant transition-colors hover:text-on-background"
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

      {/* Copyright bar — tonal shift instead of border */}
      <div className="bg-surface-mid">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-12">
          <p className="font-[family-name:var(--font-inter)] text-xs text-on-surface-variant">
            &copy; 2026 twocards. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
