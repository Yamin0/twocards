export function LegalArticle({
  label,
  title,
  updated,
  sections,
}: {
  label: string;
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}) {
  return (
    <article>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
        {label}
      </p>
      <h1 className="font-title text-3xl font-normal leading-tight md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-[12px] text-[var(--landing-mute)]">
        Dernière mise à jour : {updated}
      </p>

      <div className="mt-12 flex flex-col gap-10">
        {sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="mb-3 border-t border-black/[0.08] pt-6 text-[15px] font-semibold">
              {i + 1}. {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p
                key={j}
                className="mb-3 text-[14px] font-normal leading-relaxed text-[var(--landing-ink)]/70"
              >
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
