import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { Footer } from "@/components/layout/footer";
import { OptoutForm } from "./optout-form";

export const metadata: Metadata = {
  title: "twocards. | Désinscription",
  robots: { index: false, follow: false },
};

/* L'adresse arrive encodée en base64url dans le lien de l'e-mail (?e=…), pour
   qu'elle ne soit pas lisible en clair dans les journaux des serveurs et des
   proxys qui voient passer l'URL. Ce n'est pas un secret : le champ reste
   modifiable, parce qu'un lien recopié à la main ou réécrit par une passerelle
   de messagerie arrive régulièrement tronqué, et qu'une page de désinscription
   qui refuse de fonctionner n'en est pas une. */
function decodeEmail(raw: string | undefined): string {
  if (!raw) return "";
  try {
    const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(decoded) ? decoded : "";
  } catch {
    return "";
  }
}

export default async function DesinscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;

  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)]">
      <LandingNavbar />
      <main className="mx-auto max-w-xl px-6 py-16 md:py-24">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
          Prospection
        </p>
        <h1 className="font-title text-3xl font-normal leading-tight md:text-4xl">
          Ne plus recevoir de messages
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--landing-ink)]/70">
          Confirmez votre adresse et nous la retirons de nos envois. Aucune
          justification n&apos;est nécessaire, et vous n&apos;aurez pas à le
          redemander.
        </p>

        <div className="mt-10">
          <OptoutForm initialEmail={decodeEmail(e)} />
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-[var(--landing-mute)]">
          Une question sur l&apos;origine de vos coordonnées ou une demande
          d&apos;effacement&nbsp;?{" "}
          <a
            href="mailto:yamin@twocardspro.com"
            className="text-[var(--landing-ink)] underline underline-offset-2"
          >
            yamin@twocardspro.com
          </a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
