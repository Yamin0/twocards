import Link from "next/link";

const footerLinks = {
  Produit: [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "/signup" },
    { label: "Le Registre", href: "/signup" },
    { label: "Sécurité", href: "#" },
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
    <footer className="border-t border-white/[0.08]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="font-[family-name:var(--font-nunito)] text-xl font-bold text-white"
            >
              twocards<span className="text-blue-400">.</span>
            </Link>
            <p className="mt-4 max-w-xs font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/40">
              La plateforme CRM B2B pour les établissements de nuit. Gérez vos
              listes, vos événements et votre réseau depuis un tableau de bord
              unique.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="font-[family-name:var(--font-manrope)] text-xs font-semibold uppercase tracking-widest text-white/40">
                {title}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {links.map((link, i) => (
                  <li key={`${title}-${i}`}>
                    <Link
                      href={link.href}
                      className="font-[family-name:var(--font-inter)] text-sm text-white/40 transition-colors hover:text-white"
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
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-[family-name:var(--font-inter)] text-xs text-white/30">
            &copy; {new Date().getFullYear()} twocards. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <Link href="#features" className="hover:text-white/60 transition-colors">Solutions</Link>
            <Link href="/signup" className="hover:text-white/60 transition-colors">Tarifs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
