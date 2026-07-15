import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AuthAwareCtaButton } from '@/components/AuthAwareCtaButton';
import { FlipWord } from '@/components/FlipWord';
import { BookDemoButton } from '@/components/BookDemoButton';
import { publicPath } from '@/components/publicPath';

/**
 * 派你的 Agent 出去 [社交] — final dark CTA.
 *
 * Dark section with a faint honeycomb texture and a soft brand glow
 * behind the heading. A single large heading with the first highlight
 * word boxed in honey, followed by a honey primary CTA (hands off to the
 * webapp) and an outlined secondary CTA.
 */
export function FinalCtaSection() {
  const t = useTranslations('landing.cta');
  const highlights = t.raw('highlights') as string[];
  const titlePrefix = t('titlePrefix');
  const agentIndex = titlePrefix.indexOf('Agent');
  const titleBeforeAgent = agentIndex >= 0 ? titlePrefix.slice(0, agentIndex) : titlePrefix;
  const titleAfterAgent =
    agentIndex >= 0 ? titlePrefix.slice(agentIndex + 'Agent'.length).trimStart() : '';

  return (
    <section className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-transparent py-20 text-center text-ink">
      <div className="final-cta-content relative z-10 mx-auto max-w-[1240px] 2xl:max-w-[1440px] px-6">
        <h2 className="text-[42px] font-semibold md:text-[58px] 2xl:text-[72px]">
          <span>{titleBeforeAgent}</span>
          <span className="relative inline-block whitespace-nowrap">
            Agent
            <span className="pointer-events-none absolute left-1/2 top-[-0.94em] -translate-x-1/2 md:hidden">
              <Image
                src={publicPath('/landing/bee-running.gif')}
                width={200}
                height={200}
                unoptimized
                priority
                alt=""
                aria-hidden
                className="animate-run-x block h-[1.6em] w-auto max-w-none select-none object-contain"
              />
            </span>
          </span>{' '}
          <span className="inline-block whitespace-nowrap">
            {titleAfterAgent}
            <span className="relative inline-block">
              <FlipWord words={highlights} />
              <span className="pointer-events-none absolute left-1/2 top-[-1.65em] hidden -translate-x-1/2 md:block">
                <Image
                  src={publicPath('/landing/bee-running.gif')}
                  width={200}
                  height={200}
                  unoptimized
                  priority
                  alt=""
                  aria-hidden
                  className="animate-run-x block h-[1.75em] w-auto max-w-none select-none object-contain"
                />
              </span>
            </span>
          </span>
        </h2>

        <div className="mt-8 flex justify-center gap-3 2xl:mt-10">
          <AuthAwareCtaButton
            path="/login"
            className="inline-flex h-12 items-center rounded-full bg-honey px-6 text-[15px] font-semibold text-ink shadow-[0_4px_20px_rgba(241,212,34,.4)] transition-colors hover:bg-honey-soft"
          >
            {t('primaryCta')}
          </AuthAwareCtaButton>
          <BookDemoButton className="inline-flex h-12 items-center rounded-full border border-line bg-white/55 px-6 text-[15px] font-medium text-ink transition-colors hover:bg-white/80">
            {t('secondaryCta')}
          </BookDemoButton>
        </div>
      </div>
    </section>
  );
}
