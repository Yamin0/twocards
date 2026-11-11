import { getT } from "@/lib/i18n/server";

export async function LegalArticle({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}) {
  const t = await getT();
  return (
    <article>
      <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[48px]">
        {title}
      </h1>
      <p className="mt-4 text-[14px] text-[var(--landing-mute)]">
        {t("Dernière mise à jour :", "Last updated:")} {updated}
      </p>

      <div className="mt-12 flex flex-col gap-10">
        {sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="mb-3 border-t border-black/[0.08] pt-6 text-[18px] font-semibold">
              {i + 1}. {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p
                key={j}
                className="mb-3 text-[16px] font-normal leading-relaxed text-[var(--landing-ink)]/80"
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
