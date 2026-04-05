type Stat = {
  label: string;
  value: string;
};

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <section className="w-full bg-primary-container py-6 px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, i) => (
        <div key={i} className={`flex flex-col ${i > 0 ? "md:border-l md:border-white/10 md:pl-8" : ""}`}>
          <span className="text-on-primary-container font-[family-name:var(--font-inter)] text-[10px] uppercase tracking-[0.1em] mb-1 font-bold">
            {stat.label}
          </span>
          <span className="text-white font-[family-name:var(--font-manrope)] font-extrabold text-3xl">
            {stat.value}
          </span>
        </div>
      ))}
    </section>
  );
}
