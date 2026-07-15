'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthAwareCtaButton } from './AuthAwareCtaButton';
import { LANDING_PLATFORM_DOC_URL } from './landingLinks';
import { publicPath } from './publicPath';

/**
 * Top nav (2026 landing redesign).
 *
 *  - 64px tall, full-bleed, translucent cream with backdrop blur
 *  - Logo block (icon + wordmark + 迷境智塔旗下 tagline) anchored left
 *  - Nav links centred against the viewport (true geometric centre,
 *    independent of the logo / right-slot widths)
 *  - Right slot: ghost "看 60 秒演示" + brand-amber "创建我的 Live Agent"
 *    (CTA hands off to the webapp via AuthAwareCtaButton)
 */
export function LandingNav() {
  const t = useTranslations('landing.nav');

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-line bg-[rgba(255,255,255,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_10px_34px_rgba(34,28,19,0.08)] backdrop-blur-2xl backdrop-saturate-150 max-sm:h-14"
    >
      <div className="relative flex h-full items-center px-[calc(clamp(1rem,3vw,3rem)+30px)] max-sm:px-4">
        {/* Logo: icon + wordmark + 迷境智塔旗下 tagline */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="OpenHex">
          <Image
            src={publicPath('/landing/logo-icon.svg')}
            alt=""
            width={52}
            height={52}
            priority
            className="h-[35px] w-[35px] shrink-0"
          />
          <div className="inline-grid grid-cols-[max-content] grid-rows-[max-content] place-items-start leading-[0]">
            <Image
              src={publicPath('/landing/logo-wordmark.svg')}
              alt="OpenHex"
              width={114}
              height={24}
              priority
              className="col-start-1 row-start-1 block h-[18px] w-[88px]"
            />
            <p className="col-start-1 row-start-1 ml-[2px] mt-[17px] whitespace-nowrap text-[7.5px] font-medium leading-[1.5] tracking-[8.2px] text-ink/55">
              迷境智塔旗下
            </p>
          </div>
        </Link>

        {/* Right slot: docs link + brand CTA. */}
        <div className="ml-auto flex items-center gap-2">
          <a
            href={LANDING_PLATFORM_DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 items-center rounded-[10px] px-3 text-[14px] font-medium text-ink transition-colors hover:bg-white/35 sm:inline-flex"
          >
            {t('docsLink')}
          </a>
          <AuthAwareCtaButton
            path="/login"
            className="inline-flex h-8 min-w-[74px] items-center justify-center rounded-full bg-honey px-5 text-[13px] font-semibold text-ink shadow-none transition-colors hover:bg-honey-soft max-sm:min-w-[68px] max-sm:px-4"
          >
            {t('primaryCta')}
          </AuthAwareCtaButton>
        </div>
      </div>
    </nav>
  );
}
