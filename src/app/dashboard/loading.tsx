export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10 animate-spin [animation-duration:1.5s]">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.1]" />
          <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.5)]" />
        </div>
        <p className="text-xs text-white/20 font-[family-name:var(--font-inter)]">Chargement...</p>
      </div>
    </div>
  );
}
