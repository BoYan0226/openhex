import { useTranslations } from 'next-intl';
import { Users, Bot } from 'lucide-react';

/**
 * 一句话总结 — dark closing section that recaps the two dispatch
 * directions from WhichSideSection as a side-by-side comparison table
 * (OPS · 派到人 vs A2A · 派到 AI), then lands the single-sentence
 * takeaway in a honey-tinted callout. Bridges the cream WhichSide screen
 * into the dark footer.
 */
export function SummarySection() {
  const t = useTranslations('landing.summary');
  const rows = t.raw('rows') as Array<{ label: string; human: string; ai: string }>;

  return (
    <section
      data-stack-motion
      data-motion-style="burst"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-transparent py-20 text-ink md:py-24"
    >
      <div className="relative z-10 mx-auto w-full max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center" data-motion="header">
          <span className="section-kicker">
            <span className="section-kicker-dot" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-[26px] font-semibold leading-[1.18] text-ink sm:text-[40px] sm:leading-[1.14] md:text-[50px] 2xl:text-[58px]">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-[680px] text-ink/55 2xl:text-[17px]">{t('subtitle')}</p>
        </div>

        {/* Comparison table */}
        <div data-motion="group">
          <div className="glass-surface mx-auto mt-12 max-w-[920px] overflow-hidden rounded-[20px] border border-line bg-white/55 shadow-[0_24px_80px_rgba(34,28,19,0.08)] backdrop-blur-[2px] 2xl:mt-16 2xl:max-w-[1040px]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-white/20">
                  <th className="w-[76px] px-4 py-4 md:w-[110px] md:px-6 md:py-5" />
                  <th className="border-l border-line px-4 py-4 align-bottom md:px-7 md:py-5">
                    <span className="flex items-center gap-2 text-honey-deep">
                      <Users className="size-4 shrink-0 md:size-[18px]" />
                      <span className="text-[15px] font-semibold text-ink md:text-[18px]">
                        {t('colHuman')}
                      </span>
                      <span className="rounded-full bg-honey/18 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-honey-deep">
                        {t('colHumanTag')}
                      </span>
                    </span>
                  </th>
                  <th className="border-l border-line px-4 py-4 align-bottom md:px-7 md:py-5">
                    <span className="flex items-center gap-2 text-honey-deep">
                      <Bot className="size-4 shrink-0 md:size-[18px]" />
                      <span className="text-[15px] font-semibold text-ink md:text-[18px]">
                        {t('colAi')}
                      </span>
                      <span className="rounded-full bg-honey/18 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-honey-deep">
                        {t('colAiTag')}
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i < rows.length - 1 ? 'border-b border-line' : undefined}
                  >
                    <th
                      scope="row"
                      className="bg-white/20 px-4 py-4 align-top text-[12px] font-semibold tracking-widest text-ink/45 md:px-6 md:py-5 md:text-[13px]"
                    >
                      {row.label}
                    </th>
                    <td className="border-l border-line px-4 py-4 text-[13px] leading-relaxed text-ink/72 md:px-7 md:py-5 md:text-[15px]">
                      {row.human}
                    </td>
                    <td className="border-l border-line px-4 py-4 text-[13px] leading-relaxed text-ink/72 md:px-7 md:py-5 md:text-[15px]">
                      {row.ai}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Conclusion callout */}
          <div className="mx-auto mt-8 max-w-[920px] px-6 py-2 md:py-4 2xl:max-w-[1040px]">
            <p className="text-center text-[15px] font-medium leading-relaxed text-ink/82 md:text-[18px] 2xl:text-[20px]">
              {t.rich('conclusion', {
                hl: chunks => <span className="font-semibold text-honey-deep">{chunks}</span>,
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
