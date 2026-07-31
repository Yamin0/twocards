import { LandingNavbar } from "@/components/landing/navbar";
import { Footer } from "@/components/layout/footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--landing-ivory)] text-[var(--landing-ink)] font-body">
      <LandingNavbar />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">{children}</main>
      <Footer />
    </div>
  );
}
