import { getT } from "@/lib/i18n/server";

export default async function DashboardLoading() {
  const t = await getT();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10 animate-spin [animation-duration:1.5s]">
          <div className="absolute inset-0 rounded-full border-2 border-line" />
          <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-link shadow-[0_0_12px_rgba(96,165,250,0.5)]" />
        </div>
        <p className="text-xs text-ink-4 font-ui">{t("Chargement...", "Loading...")}</p>
      </div>
    </div>
  );
}
