import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { Footer } from "@/components/layout/footer";
import { pageMetadata } from "@/components/landing/seo";
import { OptoutForm } from "./optout-form";
import { getT } from "@/lib/i18n/server";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: ["Désinscription", "Unsubscribe"],
    path: "/desinscription",
    index: false,
  });
}

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
  const t = await getT();

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)]">
      <LandingNavbar />
      <main className="mx-auto max-w-xl px-6 py-16 md:py-24">
        <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[48px]">
          {t("Ne plus recevoir de messages", "Stop receiving messages")}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/70">
          {t(
            <>
              Confirmez votre adresse et nous la retirons de nos envois. Aucune
              justification n&apos;est nécessaire, et vous n&apos;aurez pas à le
              redemander.
            </>,
            <>
              Confirm your address and we&apos;ll remove it from our mailings. No
              reason needed, and you won&apos;t have to ask again.
            </>,
          )}
        </p>

        <div className="mt-10">
          <OptoutForm initialEmail={decodeEmail(e)} />
        </div>

        <p className="mt-8 text-[13px] leading-relaxed text-[var(--landing-mute)]">
          {t(
            <>
              Une question sur l&apos;origine de vos coordonnées ou une demande
              d&apos;effacement&nbsp;?
            </>,
            <>A question about where we got your details, or a request to erase them?</>,
          )}{" "}
          <a
            href="mailto:contact@twocardspro.com"
            className="text-[var(--landing-ink)] underline underline-offset-2"
          >
            contact@twocardspro.com
          </a>
        </p>
      </main>
      <Footer />
    </div>
  );
}
