import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-6xl font-extrabold text-primary font-[family-name:var(--font-manrope)] mb-2">
          404
        </p>
        <h1 className="text-xl font-bold text-on-background font-[family-name:var(--font-manrope)] mb-2">
          Page introuvable
        </h1>
        <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mb-8">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Home size={16} strokeWidth={1.5} />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
