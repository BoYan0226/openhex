import { useTranslations } from 'next-intl';
import { Users, Bot } from 'lucide-react';
import { HONEYCOMB_STYLE } from '@/components/ui/textures';

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
    <section className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-night py-20 text-white md:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={HONEYCOMB_STYLE} />
      <div className="relative z-10 mx-auto w-full max-w-[1240px] 2xl:max-w-[1440px] px-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/25 bg-honey/10 px-4 py-1.5 text-[12px] font-semibold tracking-wider text-honey">
            <span className="hex-clip h-2.5 w-2.5 bg-honey" />
            {t('eyebrow')}
          </span>
          <h2 className="mt-5 text-[30px] font-semibold text-white md:text-[44px] 2xl:text-[54px]">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-[680px] text-white/55 2xl:text-[17px]">{t('subtitle')}</p>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-12 max-w-[920px] overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] 2xl:mt-16 2xl:max-w-[1040px]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="w-[76px] px-4 py-4 md:w-[110px] md:px-6 md:py-5" />
                <th className="border-l border-white/10 px-4 py-4 align-bottom md:px-7 md:py-5">
                  <span className="flex items-center gap-2 text-honey">
                    <Users className="size-4 shrink-0 md:size-[18px]" />
                    <span className="text-[15px] font-semibold text-white md:text-[18px]">
                      {t('colHuman')}
                    </span>
                    <span className="rounded-full bg-honey/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-honey">
                      {t('colHumanTag')}
                    </span>
                  </span>
                </th>
                <th className="border-l border-white/10 px-4 py-4 align-bottom md:px-7 md:py-5">
                  <span className="flex items-center gap-2 text-honey">
                    <Bot className="size-4 shrink-0 md:size-[18px]" />
                    <span className="text-[15px] font-semibold text-white md:text-[18px]">
                      {t('colAi')}
                    </span>
                    <span className="rounded-full bg-honey/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-honey">
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
                  className={i < rows.length - 1 ? 'border-b border-white/[0.07]' : undefined}
                >
                  <th
                    scope="row"
                    className="bg-white/[0.02] px-4 py-4 align-top text-[12px] font-semibold tracking-widest text-white/40 md:px-6 md:py-5 md:text-[13px]"
                  >
                    {row.label}
                  </th>
                  <td className="border-l border-white/10 px-4 py-4 text-[13px] leading-relaxed text-white/80 md:px-7 md:py-5 md:text-[15px]">
                    {row.human}
                  </td>
                  <td className="border-l border-white/10 px-4 py-4 text-[13px] leading-relaxed text-white/80 md:px-7 md:py-5 md:text-[15px]">
                    {row.ai}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conclusion callout */}
        <div className="mx-auto mt-8 max-w-[920px] px-6 py-2 md:py-4 2xl:max-w-[1040px]">
          <p className="text-center text-[15px] font-medium leading-relaxed text-white/85 md:text-[18px] 2xl:text-[20px]">
            {t.rich('conclusion', {
              hl: chunks => <span className="font-semibold text-honey">{chunks}</span>,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
