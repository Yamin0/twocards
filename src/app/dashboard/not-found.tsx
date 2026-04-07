import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <p className="text-5xl font-extrabold text-primary/30 font-[family-name:var(--font-manrope)] mb-4">
          404
        </p>
        <h1 className="text-lg font-bold text-on-background font-[family-name:var(--font-manrope)] mb-2">
          Page introuvable
        </h1>
        <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mb-6">
          Cette section du dashboard n&apos;existe pas.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
